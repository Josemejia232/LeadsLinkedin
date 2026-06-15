<?php

namespace App\Http\Controllers;

use App\Models\AppConfig;
use App\Models\Contact;
use App\Models\DayPost;
use App\Models\MonthlyPlan;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $planIds = MonthlyPlan::where('user_id', $user->id)->pluck('id');

        return Inertia::render('Dashboard', [
            'total_plans' => $planIds->count(),
            'total_posts' => DayPost::whereIn('plan_id', $planIds)->count(),
            'pending_posts' => DayPost::whereIn('plan_id', $planIds)->where('status', 'pending')->count(),
            'generated_posts' => DayPost::whereIn('plan_id', $planIds)->where('status', 'generated')->count(),
            'scheduled_posts' => DayPost::whereIn('plan_id', $planIds)->where('status', 'scheduled')->count(),
            'total_contacts' => Contact::where('user_id', $user->id)->count(),
            'gemini_configured' => AppConfig::isGeminiConfigured(),
        ]);
    }
}
