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

    public function generatePlanContent(Request $request)
    {
        $planId = $request->input('plan_id');
        if (!$planId) {
            return response()->json(['error' => 'plan_id required'], 400);
        }

        $geminiKey = $this->getConfig('GEMINI_API_KEY');
        if (!$geminiKey) {
            return response()->json(['error' => 'Gemini API key not configured'], 400);
        }

        $plan = $this->fetchPlan($planId);
        if (!$plan) {
            return response()->json(['error' => 'Plan not found'], 404);
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

                $this->updatePostContent($post['id'], $content);
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
        $response = Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
        ])->get($this->baseUrl . '/api/database/records/app_configs', [
            'key' => 'eq.' . $key,
        ]);

        $data = $response->json();
        return $data[0]['value'] ?? null;
    }

    private function fetchPlan(int $id): ?array
    {
        $response = Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
        ])->get($this->baseUrl . '/api/database/records/monthly_plans', [
            'id' => 'eq.' . $id,
        ]);

        $data = $response->json();
        return $data[0] ?? null;
    }

    private function fetchPendingPosts(int $planId): array
    {
        $response = Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
        ])->get($this->baseUrl . '/api/database/records/day_posts', [
            'plan_id' => 'eq.' . $planId,
            'status' => 'in.(pending,generated)',
        ]);

        return $response->json() ?? [];
    }

    private function updatePostContent(int $postId, array $content): void
    {
        Http::withHeaders([
            'apikey' => $this->anonKey,
            'Authorization' => 'Bearer ' . $this->anonKey,
            'Prefer' => 'return=minimal',
        ])->patch($this->baseUrl . '/api/database/records/day_posts?id=eq.' . $postId, [
            'text_content' => $content['text'] ?? '',
            'hashtags' => $content['hashtags'] ?? '',
            'call_to_action' => $content['cta'] ?? '',
            'status' => 'generated',
        ]);
    }
}
