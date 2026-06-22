<?php

namespace App\Console\Commands;

use App\Services\LinkedInService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class PublishScheduledPosts extends Command
{
    protected $signature = 'app:publish-scheduled';
    protected $description = 'Publish scheduled posts to LinkedIn';

    private string $baseUrl;
    private string $anonKey;

    public function __construct()
    {
        parent::__construct();
        $this->baseUrl = getenv('VITE_INSFORGE_URL') ?: 'https://w66d8gas.us-east.insforge.app';
        $this->anonKey = getenv('INSFORGE_ANON_KEY') ?: '';
    }

    private function api(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
        ]);
    }

    public function handle(): void
    {
        $response = $this->api()->get($this->baseUrl . '/api/database/records/scheduled_posts', [
            'status' => 'in.(scheduled,failed)',
            'scheduled_date' => 'lte.' . gmdate('Y-m-d\TH:i:s\Z'),
            'select' => '*',
            'order' => 'scheduled_date.asc',
        ]);

        if ($response->failed()) {
            $this->line('[ERROR] Failed to fetch scheduled posts: ' . $response->body());
            return;
        }

        $due = $response->json();

        if (empty($due)) {
            $this->info('No posts due for publishing.');
            return;
        }

        $published = 0;
        $failed = 0;

        foreach ($due as $scheduled) {
            $postId = $scheduled['day_post_id'];
            $now = gmdate('Y-m-d\TH:i:s\Z');

            $postRes = $this->api()->get($this->baseUrl . '/api/database/records/day_posts', [
                'id' => 'eq.' . $postId,
                'select' => '*',
            ]);

            if ($postRes->failed()) {
                $this->line("[ERROR] Failed to fetch day_post {$postId}: " . $postRes->body());
                $failed++;
                continue;
            }

            $posts = $postRes->json();
            $post = $posts[0] ?? null;

            if (!$post || $post['status'] === 'published') {
                if ($post) {
                    $this->api()->patch(
                        $this->baseUrl . '/api/database/records/scheduled_posts?id=eq.' . $scheduled['id'],
                        ['status' => 'failed', 'error_message' => 'Post not available for publishing']
                    );
                }
                $failed++;
                continue;
            }

            try {
                $postObj = (object) $post;
                $result = app(LinkedInService::class)->publish($postObj);

                if (empty($result['postId'])) {
                    $error = $result['responseData']['message'] ?? json_encode($result['responseData'] ?? 'Unknown error');
                    $this->markFailed($postId, $scheduled['id'], $error);
                    $failed++;
                    $this->line("[ERROR] Failed to publish post {$postId}: {$error}");
                    continue;
                }

                $this->api()->patch(
                    $this->baseUrl . '/api/database/records/day_posts?id=eq.' . $postId,
                    ['status' => 'published']
                );
                $this->api()->patch(
                    $this->baseUrl . '/api/database/records/scheduled_posts?id=eq.' . $scheduled['id'],
                    ['status' => 'published', 'published_at' => $now]
                );
                $published++;
                $this->info("Published post {$postId}");
            } catch (\Exception $e) {
                $this->markFailed($postId, $scheduled['id'], $e->getMessage());
                $failed++;
                $this->line("[ERROR] Exception publishing post {$postId}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Published: {$published}, Failed: {$failed}");
    }

    private function markFailed(int $postId, int $scheduledId, string $error): void
    {
        $this->api()->patch(
            $this->baseUrl . '/api/database/records/day_posts?id=eq.' . $postId,
            ['status' => 'failed', 'error_message' => $error]
        );
        $this->api()->patch(
            $this->baseUrl . '/api/database/records/scheduled_posts?id=eq.' . $scheduledId,
            ['status' => 'failed', 'error_message' => $error]
        );
    }
}
