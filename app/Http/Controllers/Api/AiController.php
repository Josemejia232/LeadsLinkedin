<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    private string $baseUrl = 'https://w66d8gas.us-east.insforge.app';
    private string $anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzkzMTR9.Cors_ettZF-ufE9Ky1MhKWaYTdD4OP4IzLGx_iMRiiQ';
    private string $adminKey = 'ik_31ff2d2223e646df22d21e93a9c9346f';

    public function currentPlan()
    {
        $plans = $this->fetchAll('monthly_plans', ['order' => 'id.desc', 'limit' => 1]);
        $plan = $plans[0] ?? null;
        if (!$plan) {
            return response()->json(['plan' => null]);
        }

        $posts = $this->fetchAll('day_posts', ['plan_id' => 'eq.' . $plan['id'], 'order' => 'date.asc']);

        return response()->json([
            'plan' => $plan,
            'posts' => $posts,
        ]);
    }

    public function generateTitles(Request $request)
    {
        try {
            $planId = $request->query('plan_id');
            if (!$planId) {
                return response()->json(['error' => 'plan_id required'], 400);
            }

            $plan = $this->fetchPlan($planId);
            if (!$plan) {
                return response()->json(['error' => 'Plan not found'], 404);
            }

            $existing = $this->fetchAll('day_posts', ['plan_id' => 'eq.' . $planId, 'limit' => 1]);
            if (!empty($existing)) {
                return response()->json(['error' => 'Posts already exist for this plan'], 400);
            }

            $weekdays = $this->getWeekdays($plan['year'], $plan['month']);
            $count = min($plan['total_posts'] ?? 10, count($weekdays));

            $geminiKey = $this->getConfig('GEMINI_API_KEY');
            $titles = [];

            if ($geminiKey) {
                $gemini = app(GeminiService::class)->setApiKey($geminiKey);
                try {
                    $titles = $gemini->generatePostTitles(
                        $plan['topic_name'],
                        $plan['industry'] ?? '',
                        $plan['keywords'] ?? '',
                        $count
                    );
                } catch (\Throwable $e) {
                    $titles = [];
                }
            }

            $created = 0;
            $postTypes = ['educational', 'informative', 'promotional', 'carousel', 'educational'];

            for ($i = 0; $i < $count; $i++) {
                $dayIndex = $i % max(count($weekdays), 1);
                $title = $titles[$i] ?? 'Post #' . ($i + 1) . ' - ' . $plan['topic_name'];
                $postType = $postTypes[$i % count($postTypes)];

                $this->createPost([
                    'plan_id' => (int) $planId,
                    'date' => $weekdays[$dayIndex]->format('Y-m-d'),
                    'title' => $title,
                    'post_type' => $postType,
                    'status' => 'pending',
                    'order' => $i + 1,
                ]);
                $created++;
            }

            return response()->json([
                'success' => true,
                'created' => $created,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function generatePlanContent(Request $request)
    {
        try {
            $planId = $request->query('plan_id');
            if (!$planId) {
                return response()->json(['error' => 'plan_id required'], 400);
            }

            $plan = $this->fetchPlan($planId);
            if (!$plan) {
                return response()->json(['error' => 'Plan not found'], 404);
            }

            $geminiKey = $this->getConfig('GEMINI_API_KEY');
            if (!$geminiKey) {
                return response()->json(['success' => true, 'generated' => 0, 'total' => 0]);
            }

            $posts = $this->fetchPendingPosts($planId);

            $gemini = app(GeminiService::class)->setApiKey($geminiKey);
            $updated = 0;

            foreach ($posts as $post) {
                if (!empty($post['text_content'])) {
                    continue;
                }
                try {
                    $content = $gemini->generatePostContent(
                        $plan['topic_name'],
                        $post['title'],
                        $post['post_type'],
                        $plan['keywords'] ?? '',
                        ''
                    );

                    if (!empty($content['text'])) {
                        $this->patchRecord('day_posts', $post['id'], [
                            'text_content' => $content['text'],
                            'hashtags' => $content['hashtags'] ?? '',
                            'call_to_action' => $content['cta'] ?? '',
                            'status' => 'generated',
                        ]);
                        $updated++;
                    } else {
                        $this->patchRecord('day_posts', $post['id'], [
                            'status' => 'pending',
                        ]);
                    }

                    if (count($posts) > 1) {
                        sleep(2);
                    }
                } catch (\Throwable $e) {
                    continue;
                }
            }

            return response()->json([
                'success' => true,
                'generated' => $updated,
                'total' => count($posts),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function generateMissingFields(Request $request)
    {
        try {
            $postId = $request->query('post_id');
            if (!$postId) {
                return response()->json(['error' => 'post_id required'], 400);
            }

            $posts = $this->fetchAll('day_posts', ['id' => 'eq.' . $postId]);
            $post = $posts[0] ?? null;
            if (!$post) {
                return response()->json(['error' => 'Post not found'], 404);
            }

            $plan = $this->fetchPlan($post['plan_id']);
            $topic = $plan['topic_name'] ?? $post['title'] ?? '';
            $update = [];

            if (empty($post['text_content']) && !empty($post['title'])) {
                return response()->json(['error' => 'No content to generate from, generate full content first'], 400);
            }

            $geminiKey = $this->getConfig('GEMINI_API_KEY');

            if (empty($post['call_to_action']) || empty($post['hashtags'])) {
                if ($geminiKey) {
                    $gemini = app(GeminiService::class)->setApiKey($geminiKey);
                    $result = $gemini->generateCtaAndHashtags($topic, $post['title']);

                    if (empty($post['call_to_action'])) {
                        $update['call_to_action'] = $result['cta'] ?? '';
                    }
                    if (empty($post['hashtags'])) {
                        $update['hashtags'] = $result['hashtags'] ?? '';
                    }
                }
            }

            if (!empty($update)) {
                $this->patchRecord('day_posts', $postId, $update);
            }

            return response()->json($update);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function generatePostContentSingle(Request $request)
    {
        try {
            $postId = $request->query('post_id');
            if (!$postId) {
                return response()->json(['error' => 'post_id required'], 400);
            }

            $posts = $this->fetchAll('day_posts', ['id' => 'eq.' . $postId]);
            $post = $posts[0] ?? null;
            if (!$post) {
                return response()->json(['error' => 'Post not found'], 404);
            }

            if (!empty($post['text_content'])) {
                return response()->json(['success' => true, 'message' => 'Already has content']);
            }

            $plan = $this->fetchPlan($post['plan_id']);
            $geminiKey = $this->getConfig('GEMINI_API_KEY');
            if (!$geminiKey) {
                return response()->json(['error' => 'No Gemini key configured'], 400);
            }

            $gemini = app(GeminiService::class)->setApiKey($geminiKey);
            $content = $gemini->generatePostContent(
                $plan['topic_name'] ?? '',
                $post['title'],
                $post['post_type'],
                $plan['keywords'] ?? '',
                ''
            );

            if (!empty($content['text'])) {
                $this->patchRecord('day_posts', $postId, [
                    'text_content' => $content['text'],
                    'hashtags' => $content['hashtags'] ?? '',
                    'call_to_action' => $content['cta'] ?? '',
                    'status' => 'generated',
                ]);
                return response()->json(['success' => true, 'content' => $content]);
            }

            return response()->json(['error' => 'Failed to generate content'], 500);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function uploadPostImage(Request $request)
    {
        try {
            $postId = $request->input('post_id');
            $dataUrl = $request->input('image');

            if (!$postId || !$dataUrl) {
                return response()->json(['error' => 'post_id and image required'], 400);
            }

            preg_match('/^data:image\/(\w+);base64,(.+)$/', $dataUrl, $matches);
            if (!$matches) {
                return response()->json(['error' => 'Invalid image data'], 400);
            }

            $ext = $matches[1];
            $binary = base64_decode($matches[2]);
            $key = $postId . '/' . uniqid() . '.' . $ext;

            $response = Http::withHeaders([
                'apikey' => $this->adminKey,
                'Authorization' => 'Bearer ' . $this->adminKey,
            ])->attach(
                'file', $binary, $key
            )->put($this->baseUrl . '/api/storage/buckets/posts/objects/' . rawurlencode($key));

            if ($response->failed()) {
                return response()->json(['error' => 'Storage upload failed: ' . $response->body()], 500);
            }

            $url = $this->baseUrl . '/api/storage/buckets/posts/objects/' . rawurlencode($key);

            $dbResponse = Http::withHeaders([
                'apikey' => $this->anonKey,
                'Authorization' => 'Bearer ' . $this->anonKey,
            ])->patch($this->baseUrl . '/api/database/records/day_posts?id=eq.' . $postId, [
                'image_url' => $url,
            ]);

            if ($dbResponse->failed()) {
                return response()->json(['error' => 'Database update failed: ' . $dbResponse->body()], 500);
            }

            return response()->json(['url' => $url]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function getConfig(string $key): ?string
    {
        $data = $this->fetchAll('app_configs', ['key' => 'eq.' . $key]);
        $value = $data[0]['value'] ?? null;

        if ($value !== null && $value !== '') {
            return $value;
        }

        $fromEnv = getenv($key);
        if ($fromEnv !== false && $fromEnv !== '') {
            return $fromEnv;
        }

        return null;
    }

    private function fetchPlan(int $id): ?array
    {
        $data = $this->fetchAll('monthly_plans', ['id' => 'eq.' . $id]);
        return $data[0] ?? null;
    }

    private function fetchPendingPosts(int $planId): array
    {
        return $this->fetchAll('day_posts', [
            'plan_id' => 'eq.' . $planId,
            'status' => 'in.(pending,generated)',
        ]);
    }

    private function fetchAll(string $table, array $params = []): array
    {
        $url = $this->baseUrl . '/api/database/records/' . $table;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
        }
        try {
            $response = Http::withHeaders([
                'apikey' => $this->anonKey,
                'Authorization' => 'Bearer ' . $this->anonKey,
            ])->get($url);
            return $response->json() ?? [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function createPost(array $data): void
    {
        try {
            Http::withHeaders([
                'apikey' => $this->anonKey,
                'Authorization' => 'Bearer ' . $this->anonKey,
            ])->post($this->baseUrl . '/api/database/records/day_posts', [$data]);
        } catch (\Throwable $e) {
        }
    }

    private function patchRecord(string $table, int $id, array $data): void
    {
        try {
            Http::withHeaders([
                'apikey' => $this->anonKey,
                'Authorization' => 'Bearer ' . $this->anonKey,
                'Prefer' => 'return=minimal',
            ])->patch($this->baseUrl . '/api/database/records/' . $table . '?id=eq.' . $id, $data);
        } catch (\Throwable $e) {
        }
    }

    private function getWeekdays(int $year, int $month): array
    {
        $days = [];
        $date = new \DateTime("{$year}-{$month}-01");
        $lastDay = (clone $date)->modify('last day of this month');

        while ($date <= $lastDay) {
            $dow = (int) $date->format('N');
            if ($dow <= 5) {
                $days[] = clone $date;
            }
            $date->modify('+1 day');
        }

        usort($days, function ($a, $b) {
            $dowA = (int) $a->format('N');
            $dowB = (int) $b->format('N');
            $strategicA = in_array($dowA, [2, 3, 4]) ? 0 : 1;
            $strategicB = in_array($dowB, [2, 3, 4]) ? 0 : 1;
            if ($strategicA !== $strategicB) return $strategicA - $strategicB;
            return $a <=> $b;
        });

        return $days;
    }
}
