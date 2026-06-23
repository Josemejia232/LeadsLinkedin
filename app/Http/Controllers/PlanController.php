<?php

namespace App\Http\Controllers;

use App\Helpers\Utf8;
use App\Models\MonthlyPlan;
use App\Models\DayPost;
use App\Models\ScheduledPost;
use App\Models\AppConfig;
use App\Services\GeminiService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanController extends Controller
{
    private const DEFAULT_HOURS = [8, 9, 10, 11, 12, 14, 15, 16, 17, 18];

    private const STRATEGIC_HOURS = [
        Carbon::TUESDAY    => [10],
        Carbon::WEDNESDAY  => [10, 11, 12],
        Carbon::THURSDAY   => [9, 10, 11, 12, 13, 14],
    ];

    private const FALLBACK_HOURS = [7, 8, 9, 10, 11, 12];

    public function index()
    {
        $plans = MonthlyPlan::where('user_id', auth()->id())->get();

        return Inertia::render('Plans/Index', [
            'plans' => $plans,
        ]);
    }

    public function create()
    {
        $months = collect(range(1, 12))->mapWithKeys(fn ($m) => [
            $m => Carbon::create()->month($m)->format('F'),
        ]);

        $currentYear = (int) now()->format('Y');
        $years = collect(range($currentYear, $currentYear + 2));

        return Inertia::render('Plans/Create', [
            'months' => $months,
            'years' => $years,
        ]);
    }

    public function store(Request $request)
    {
        set_time_limit(120);

        $data = $request->validate([
            'topic_name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'keywords' => 'nullable|string',
            'objectives' => 'nullable|string',
            'target_audience' => 'nullable|string',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:' . now()->year,
            'total_posts' => 'nullable|integer|min:1|max:31',
            'schedule_hours' => 'nullable|array',   
            'schedule_hours.*' => 'integer|min:0|max:23',
        ]);

        $data['user_id'] = auth()->id();
        $data['status'] = 'active';

        $plan = MonthlyPlan::create($data);

        $this->generatePostTitles($plan);

        if (AppConfig::isGeminiConfigured()) {
            $this->generatePostContents($plan);
            $this->schedulePosts($plan);
        }

        return redirect()->route('plans.show', $plan)->with('success', 'Plan creado exitosamente.');
    }

    public function show(MonthlyPlan $plan)
    {
        abort_unless($plan->user_id === auth()->id(), 403);

        $plan->load(['dayPosts' => function ($query) {
            $query->with('scheduledPost')->orderBy('date');
        }]);

        return Inertia::render('Plans/Show', [
            'plan' => $plan,
            'posts' => $plan->dayPosts,
        ]);
    }

    public function edit(MonthlyPlan $plan)
    {
        abort_unless($plan->user_id === auth()->id(), 403);

        return Inertia::render('Plans/Edit', [
            'plan' => $plan,
        ]);
    }

    public function update(Request $request, MonthlyPlan $plan)
    {
        abort_unless($plan->user_id === auth()->id(), 403);

        $data = $request->validate([
            'topic_name' => 'sometimes|string|max:255',
            'industry' => 'nullable|string|max:255',
            'keywords' => 'nullable|string',
            'objectives' => 'nullable|string',
            'target_audience' => 'nullable|string',
            'month' => 'sometimes|integer|between:1,12',
            'year' => 'sometimes|integer|min:' . now()->year,
            'total_posts' => 'nullable|integer|min:1|max:31',
            'schedule_hours' => 'nullable|array',
            'schedule_hours.*' => 'integer|min:0|max:23',
            'status' => 'nullable|string|max:50',
        ]);

        $plan->update($data);

        return redirect()->route('plans.index')->with('success', 'Plan actualizado exitosamente.');
    }

    public function destroy(MonthlyPlan $plan)
    {
        abort_unless($plan->user_id === auth()->id(), 403);

        $plan->dayPosts()->delete();
        $plan->delete();

        return redirect()->route('plans.index')->with('success', 'Plan eliminado exitosamente.');
    }

    public function generatePosts(Request $request, MonthlyPlan $plan)
    {
        abort_unless($plan->user_id === auth()->id(), 403);

        $plan->dayPosts()->delete();

        $this->generatePostTitles($plan);

        if (AppConfig::isGeminiConfigured()) {
            $this->generatePostContents($plan);
            $this->schedulePosts($plan);
        }

        return redirect()->route('plans.show', $plan)->with('success', 'Posts regenerados exitosamente.');
    }

    protected function generatePostTitles(MonthlyPlan $plan): void
    {
        $weekdays = $this->getWeekdays($plan->year, $plan->month);
        $count = $plan->total_posts ?: count($weekdays);

        $titles = [];

        if (AppConfig::isGeminiConfigured()) {
            try {
                $titles = app(GeminiService::class)->generatePostTitles(
                    $plan->topic_name,
                    $plan->industry ?? '',
                    $plan->keywords ?? '',
                    $count
                );
            } catch (\Exception $e) {
                $titles = [];
            }
        }

        $selectedDays = $count <= count($weekdays)
            ? array_slice($weekdays, 0, $count)
            : $weekdays;

        for ($i = 0; $i < $count; $i++) {
            $dayIndex = $i % max(count($selectedDays), 1);

            DayPost::create([
                'plan_id' => $plan->id,
                'date' => $selectedDays[$dayIndex]->format('Y-m-d'),
                'title' => $titles[$i] ?? "Post #" . ($i + 1) . " - {$plan->topic_name}",
                'post_type' => $this->getPostType($i),
                'status' => 'pending',
                'order' => $i + 1,
            ]);
        }
    }

    protected function getPostType(int $index): string
    {
        $types = ['educational', 'informative', 'promotional', 'carousel', 'educational'];
        return $types[$index % count($types)];
    }

    protected function generatePostContents(MonthlyPlan $plan): void
    {
        if (!AppConfig::isGeminiConfigured()) {
            return;
        }

        $gemini = app(GeminiService::class);
        $posts = $plan->dayPosts()->where('status', 'pending')->get();

        foreach ($posts as $post) {
            try {
                $content = $gemini->generatePostContent(
                    $plan->topic_name,
                    $post->title,
                    $post->post_type,
                    $plan->keywords ?? '',
                    ''
                );

                $post->update(Utf8::clean([
                    'text_content' => $content['text'] ?? '',
                    'hashtags' => $content['hashtags'] ?? '',
                    'call_to_action' => $content['cta'] ?? '',
                    'status' => 'generated',
                ]));
            } catch (\Exception $e) {
                continue;
            }
        }
    }

    protected function schedulePosts(MonthlyPlan $plan): void
    {
        $posts = $plan->dayPosts()->where('status', 'generated')->get();
        $customHours = $plan->schedule_hours;

        $hourCounters = [];

        foreach ($posts as $post) {
            $postDate = Carbon::parse($post->date);
            $dayOfWeek = $postDate->dayOfWeek;

            if ($customHours && count($customHours) > 0) {
                $hourIndex = ($post->order - 1) % count($customHours);
                $hour = $customHours[$hourIndex];
            } else {
                $availableHours = self::STRATEGIC_HOURS[$dayOfWeek] ?? self::FALLBACK_HOURS;
                $key = $postDate->format('Y-m-d');
                $hourCounters[$key] = ($hourCounters[$key] ?? 0);
                $hourIndex = $hourCounters[$key] % count($availableHours);
                $hour = $availableHours[$hourIndex];
                $hourCounters[$key]++;
            }

            $scheduledDate = Carbon::parse($postDate->format('Y-m-d') . " {$hour}:00:00");

            if ($scheduledDate->isPast()) {
                $scheduledDate = $scheduledDate->addDay();
                if ($scheduledDate->isWeekend()) {
                    $scheduledDate = $scheduledDate->nextWeekday();
                }
            }

            ScheduledPost::updateOrCreate(
                ['day_post_id' => $post->id],
                [
                    'scheduled_date' => $scheduledDate,
                    'status' => 'scheduled',
                ]
            );

            $post->update(['status' => 'scheduled']);
        }
    }

    protected function getWeekdays(int $year, int $month): array
    {
        $allDays = [];
        $strategicDays = [];
        $otherDays = [];

        $date = Carbon::create($year, $month, 1);
        $lastDay = $date->copy()->endOfMonth();

        while ($date->lte($lastDay)) {
            if ($date->isWeekday()) {
                if (in_array($date->dayOfWeek, [Carbon::TUESDAY, Carbon::WEDNESDAY, Carbon::THURSDAY])) {
                    $strategicDays[] = $date->copy();
                } else {
                    $otherDays[] = $date->copy();
                }
            }
            $date->addDay();
        }

        return array_merge($strategicDays, $otherDays);
    }

    protected function buildCalendar(int $year, int $month, MonthlyPlan $plan): array
    {
        $date = Carbon::create($year, $month, 1);
        $lastDay = $date->copy()->endOfMonth();
        $startOfWeek = $date->copy()->startOfWeek(Carbon::MONDAY);

        $postsByDate = $plan->dayPosts->keyBy(fn ($p) => $p->date->format('Y-m-d'));
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
