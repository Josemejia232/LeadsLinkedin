<?php

namespace App\Http\Controllers;

use App\Models\DayPost;
use App\Models\ScheduledPost;
use App\Models\MonthlyPlan;
use App\Models\AppConfig;
use App\Services\LinkedInService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PublisherController extends Controller
{
    public function schedule(Request $request, DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        $data = $request->validate([
            'scheduled_date' => 'required|date|after:now',
        ]);

        ScheduledPost::updateOrCreate(
            ['day_post_id' => $post->id],
            [
                'scheduled_date' => $data['scheduled_date'],
                'status' => 'scheduled',
            ]
        );

        $post->update(['status' => 'scheduled']);

        return redirect()->back()->with('success', 'Post scheduled successfully.');
    }

    public function scheduledList(Request $request)
    {
        $userId = auth()->id();

        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);

        if ($month < 1) { $month = 12; $year--; }
        if ($month > 12) { $month = 1; $year++; }

        $scheduledPosts = ScheduledPost::whereHas('dayPost.plan', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->with('dayPost.plan')->orderBy('scheduled_date')->get();

        $allPosts = DayPost::whereHas('plan', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->whereMonth('date', $month)
         ->whereYear('date', $year)
         ->get();

        $calendar = $this->buildCalendar($year, $month, $allPosts);

        $months = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
        ];

        return Inertia::render('Publisher/Index', [
            'scheduled_posts' => $scheduledPosts,
            'calendar' => $calendar,
            'monthName' => $months[$month],
            'month' => $month,
            'year' => $year,
            'months' => $months,
        ]);
    }

    public function publishNow(DayPost $post)
    {
        abort_unless($post->plan->user_id === auth()->id(), 403);

        try {
            $result = app(LinkedInService::class)->publish($post);

            if (empty($result['postId'])) {
                $statusCode = $result['statusCode'] ?? '?';
                $detail = $result['responseData']['message'] ?? json_encode($result['responseData'] ?? 'Error desconocido');
                $error = "[HTTP {$statusCode}] {$detail}";
                $post->update(['status' => 'failed', 'error_message' => $error]);
                return redirect()->back()->with('error', "LinkedIn rechazó la publicación: {$error}");
            }

            $post->update([
                'status' => 'published',
            ]);

            return redirect()->back()->with('success', 'Post publicado en LinkedIn exitosamente.');
        } catch (\Exception $e) {
            $post->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            return redirect()->back()->with('error', "Error al publicar: {$e->getMessage()}");
        }
    }

    public function linkedinDisconnect()
    {
        AppConfig::set('LINKEDIN_ACCESS_TOKEN', '');
        AppConfig::set('LINKEDIN_REFRESH_TOKEN', '');
        AppConfig::set('LINKEDIN_TOKEN_EXPIRES_AT', '0');
        AppConfig::set('LINKEDIN_PERSON_ID', '');
        AppConfig::set('LINKEDIN_PERSON_NAME', '');
        AppConfig::set('LINKEDIN_PERSON_EMAIL', '');

        return redirect()->route('settings.index')->with('success', 'LinkedIn desconectado.');
    }

    public function linkedinLogin()
    {
        $url = app(LinkedInService::class)->getOAuthUrl();

        return Inertia::location($url);
    }

    public function linkedinCallback(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        try {
            app(LinkedInService::class)->handleCallback($request->code);
            return redirect()->route('settings.index')->with('success', 'Cuenta de LinkedIn conectada exitosamente.');
        } catch (\Exception $e) {
            return redirect()->route('settings.index')->with('error', 'Error al conectar LinkedIn: ' . $e->getMessage());
        }
    }

    protected function buildCalendar(int $year, int $month, $posts): array
    {
        $date = Carbon::create($year, $month, 1);
        $lastDay = $date->copy()->endOfMonth();
        $startOfWeek = $date->copy()->startOfWeek(Carbon::MONDAY);

        $postsByDate = $posts->keyBy(fn ($p) => $p->date->format('Y-m-d'));
        $weeks = [];
        $currentWeek = [];

        $cursor = $startOfWeek->copy();
        while ($cursor->lte($lastDay) || count($currentWeek) > 0) {
            $currentWeek[] = [
                'date' => $cursor->format('Y-m-d'),
                'day' => $cursor->day,
                'is_current_month' => $cursor->month === $month,
                'is_weekend' => $cursor->isWeekend(),
                'post' => $postsByDate->get($cursor->format('Y-m-d')),
            ];

            if ($cursor->dayOfWeek === Carbon::SUNDAY) {
                $weeks[] = $currentWeek;
                $currentWeek = [];
            }

            $cursor->addDay();

            if ($cursor->month !== $month && $cursor->dayOfWeek === Carbon::MONDAY) {
                break;
            }
        }

        if (!empty($currentWeek)) {
            $weeks[] = $currentWeek;
        }

        return $weeks;
    }
}
