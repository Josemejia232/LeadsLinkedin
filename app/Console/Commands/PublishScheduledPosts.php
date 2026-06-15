<?php

namespace App\Console\Commands;

use App\Models\ScheduledPost;
use App\Services\LinkedInService;
use Illuminate\Console\Command;

class PublishScheduledPosts extends Command
{
    protected $signature = 'app:publish-scheduled';
    protected $description = 'Publish posts that are due for scheduled publishing';

    public function handle(): void
    {
        $due = ScheduledPost::where('status', 'scheduled')
            ->where('scheduled_date', '<=', now())
            ->with('dayPost.plan')
            ->get();

        if ($due->isEmpty()) {
            $this->info('No posts due for publishing.');
            return;
        }

        $published = 0;
        $failed = 0;

        foreach ($due as $scheduled) {
            $post = $scheduled->dayPost;

            if (!$post || !in_array($post->status, ['generated', 'scheduled'])) {
                $scheduled->update(['status' => 'failed', 'error_message' => 'Post not available for publishing']);
                $failed++;
                continue;
            }

            try {
                $result = app(LinkedInService::class)->publish($post);

                if (empty($result['postId'])) {
                    $error = $result['responseData']['message'] ?? json_encode($result['responseData'] ?? 'Unknown error');
                    $post->update(['status' => 'failed', 'error_message' => $error]);
                    $scheduled->update(['status' => 'failed', 'error_message' => $error]);
                    $failed++;
                    $this->error("Failed to publish post {$post->id}: {$error}");
                    continue;
                }

                $post->update(['status' => 'published']);
                $scheduled->update(['status' => 'published', 'published_at' => now()]);
                $published++;
                $this->info("Published post {$post->id}");
            } catch (\Exception $e) {
                $post->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                $scheduled->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                $failed++;
                $this->error("Exception publishing post {$post->id}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Published: {$published}, Failed: {$failed}");
    }
}
