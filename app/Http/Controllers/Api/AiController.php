<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppConfig;
use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    private string $baseUrl = 'https://w66d8gas.us-east.insforge.app';
    private string $anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzkzMTR9.Cors_ettZF-ufE9Ky1MhKWaYTdD4OP4IzLGx_iMRiiQ';

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
            AppConfig::set('GEMINI_API_KEY', $geminiKey);
            $gemini = app(GeminiService::class);
            try {
                $titles = $gemini->generatePostTitles(
                    $plan['topic_name'],
                    $plan['industry'] ?? '',
                    $plan['keywords'] ?? '',
                    $count
                );
            } catch (\Exception $e) {
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
    }

    public function generatePlanContent(Request $request)
    {
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

        AppConfig::set('GEMINI_API_KEY', $geminiKey);
        $gemini = app(GeminiService::class);
        $updated = 0;

        foreach ($posts as $post) {
            try {
                $content = $gemini->generatePostContent(
                    $plan['topic_name'],
                    $post['title'],
                    $post['post_type'],
                    $plan['keywords'] ?? '',
                    ''
                );

                $this->patchRecord('day_posts', $post['id'], [
                    'text_content' => $content['text'] ?? '',
                    'hashtags' => $content['hashtags'] ?? '',
                    'call_to_action' => $content['cta'] ?? '',
                    'status' => 'generated',
                ]);
                $updated++;
            } catch (\Exception $e) {
                continue;
            }
        }

        return response()->json([
            'success' => true,
            'generated' => $updated,
            'total' => count($posts),
        ]);
    }

    private function getConfig(string $key): ?string
    {
        $data = $this->fetchAll('app_configs', ['key' => 'eq.' . $key]);
        return $data[0]['value'] ?? null;
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
        $response = Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
        ])->get($url);
        return $response->json() ?? [];
    }

    private function createPost(array $data): void
    {
        Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
        ])->post($this->baseUrl . '/api/database/records/day_posts', [$data]);
    }

    private function patchRecord(string $table, int $id, array $data): void
    {
        Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
            'Prefer' => 'return=minimal',
        ])->patch($this->baseUrl . '/api/database/records/' . $table . '?id=eq.' . $id, $data);
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
