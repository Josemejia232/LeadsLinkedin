<?php

namespace App\Console\Commands;

use App\Services\LinkedInService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class PublishScheduledPosts extends Command
{
    protected $signature = 'app:publish-scheduled';
    protected $description = 'Publish posts that are due for scheduled publishing';

    private string $baseUrl = 'https://w66d8gas.us-east.insforge.app';
    private string $anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzkzMTR9.Cors_ettZF-ufE9Ky1MhKWaYTdD4OP4IzLGx_iMRiiQ';

    public function handle(): void
    {
        $now = gmdate('Y-m-d\TH:i:s\Z');
        $response = Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
        ])->get($this->baseUrl . '/api/database/records/scheduled_posts', [
            'status' => 'eq.scheduled',
            'scheduled_date' => 'lte.' . $now,
            'select' => '*',
        ]);

        if ($response->failed()) {
            $this->error('Failed to fetch scheduled posts: ' . $response->body());
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

            $postRes = Http::withHeaders([
                'apikey' => $this->anonKey,
                'Authorization' => 'Bearer ' . $this->anonKey,
            ])->get($this->baseUrl . '/api/database/records/day_posts', [
                'id' => 'eq.' . $postId,
                'select' => '*',
            ]);

            if ($postRes->failed()) {
                $this->error("Failed to fetch day_post {$postId}: " . $postRes->body());
                $failed++;
                continue;
            }

            $posts = $postRes->json();
            $post = $posts[0] ?? null;

            if (!$post || $post['status'] === 'published') {
                if ($post) {
                    Http::withHeaders([
                        'apikey' => $this->anonKey,
                        'Authorization' => 'Bearer ' . $this->anonKey,
                    ])->patch($this->baseUrl . '/api/database/records/scheduled_posts?id=eq.' . $scheduled['id'], [
                        'status' => 'failed',
                        'error_message' => 'Post not available for publishing',
                    ]);
                }
                $failed++;
                continue;
            }

            try {
                $postObj = (object) $post;
                $result = app(LinkedInService::class)->publish($postObj);

                if (empty($result['postId'])) {
                    $error = $result['responseData']['message'] ?? json_encode($result['responseData'] ?? 'Unknown error');
                    Http::withHeaders([
                        'apikey' => $this->anonKey,
                        'Authorization' => 'Bearer ' . $this->anonKey,
                    ])->patch($this->baseUrl . '/api/database/records/day_posts?id=eq.' . $postId, [
                        'status' => 'failed',
                        'error_message' => $error,
                    ]);
                    Http::withHeaders([
                        'apikey' => $this->anonKey,
                        'Authorization' => 'Bearer ' . $this->anonKey,
                    ])->patch($this->baseUrl . '/api/database/records/scheduled_posts?id=eq.' . $scheduled['id'], [
                        'status' => 'failed',
                        'error_message' => $error,
                    ]);
                    $failed++;
                    $this->error("Failed to publish post {$postId}: {$error}");
                    continue;
                }

                Http::withHeaders([
                    'apikey' => $this->anonKey,
                    'Authorization' => 'Bearer ' . $this->anonKey,
                ])->patch($this->baseUrl . '/api/database/records/day_posts?id=eq.' . $postId, [
                    'status' => 'published',
                ]);
                Http::withHeaders([
                    'apikey' => $this->anonKey,
                    'Authorization' => 'Bearer ' . $this->anonKey,
                ])->patch($this->baseUrl . '/api/database/records/scheduled_posts?id=eq.' . $scheduled['id'], [
                    'status' => 'published',
                    'published_at' => $now,
                ]);
                $published++;
                $this->info("Published post {$postId}");
            } catch (\Exception $e) {
                Http::withHeaders([
                    'apikey' => $this->anonKey,
                    'Authorization' => 'Bearer ' . $this->anonKey,
                ])->patch($this->baseUrl . '/api/database/records/day_posts?id=eq.' . $postId, [
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
                Http::withHeaders([
                    'apikey' => $this->anonKey,
                    'Authorization' => 'Bearer ' . $this->anonKey,
                ])->patch($this->baseUrl . '/api/database/records/scheduled_posts?id=eq.' . $scheduled['id'], [
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
                $failed++;
                $this->error("Exception publishing post {$postId}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Published: {$published}, Failed: {$failed}");
    }
}
