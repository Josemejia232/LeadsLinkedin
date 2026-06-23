<?php

namespace App\Console\Commands;

use App\Models\DayPost;
use App\Models\ScheduledPost;
use App\Services\LinkedInService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PublishScheduledPosts extends Command
{
    protected $signature = 'app:publish-scheduled';
    protected $description = 'Publish scheduled posts to LinkedIn';

    public function handle(): void
    {
        $due = ScheduledPost::where('status', 'scheduled')
            ->where('scheduled_date', '<=', now()->addMinute())
            ->where('scheduled_date', '>=', now()->subMinutes(30))
            ->orderBy('scheduled_date')
            ->get();

        if ($due->isEmpty()) {
            $this->info('No posts due for publishing.');
            return;
        }

        $published = 0;
        $failed = 0;

        foreach ($due as $scheduled) {
            $post = DayPost::find($scheduled->day_post_id);

            if (!$post || $post->status === 'published') {
                if ($post) {
                    Log::warning("Scheduled post {$scheduled->id}: day_post {$scheduled->day_post_id} already published");
                }
                $scheduled->delete();
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
                    $this->line("[ERROR] Failed to publish post {$post->id}: {$error}");
                    continue;
                }

                $post->update(['status' => 'published']);
                $scheduled->update([
                    'status' => 'published',
                    'published_at' => now(),
                ]);
                $published++;
                $this->info("Published post {$post->id}");
            } catch (\Exception $e) {
                $post->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                $scheduled->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                $failed++;
                $this->line("[ERROR] Exception publishing post {$post->id}: {$e->getMessage()}");
            }
        }

        $this->info("Done. Published: {$published}, Failed: {$failed}");
    }
}
