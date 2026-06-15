<?php

namespace App\Http\Controllers;

use App\Models\DayPost;
use App\Models\MonthlyPlan;
use App\Services\GeminiService;
use Illuminate\Http\Request;

class AiGeneratorController extends Controller
{
    public function generateContent(Request $request, DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        $plan = $post->plan;

        $content = app(GeminiService::class)->generatePostContent(
            $plan->topic_name,
            $post->title,
            $post->post_type,
            $plan->keywords ?? '',
            $post->call_to_action ?? ''
        );

        $post->update([
            'text_content' => $content['text'] ?? '',
            'hashtags' => $content['hashtags'] ?? '',
            'call_to_action' => $content['cta'] ?? '',
            'status' => 'generated',
        ]);

        return redirect()->back()->with('success', 'Contenido generado exitosamente.');
    }

    public function generatePlanContent(Request $request, MonthlyPlan $plan)
    {
        abort_unless($plan->user_id === auth()->id(), 403);

        $posts = $plan->dayPosts()->where('status', 'pending')->get();

        $gemini = app(GeminiService::class);

        foreach ($posts as $post) {
            $content = $gemini->generatePostContent(
                $plan->topic_name,
                $post->title,
                $post->post_type,
                $plan->keywords ?? '',
                $post->call_to_action ?? ''
            );

            $post->update([
                'text_content' => $content['text'] ?? '',
                'hashtags' => $content['hashtags'] ?? '',
                'call_to_action' => $content['cta'] ?? '',
                'status' => 'generated',
            ]);
        }

        return redirect()->back()->with('success', 'Contenido generado para todos los posts pendientes.');
    }
}
