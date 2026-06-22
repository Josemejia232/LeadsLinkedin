<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::get('/insforge-test', function () {
    return inertia('InsForgeTest');
})->name('insforge-test');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        $userId = auth()->id();
        $totalPlans = \App\Models\MonthlyPlan::where('user_id', $userId)->count();
        $posts = \App\Models\DayPost::whereHas('plan', fn($q) => $q->where('user_id', $userId))->get();
        $geminiConfigured = \App\Models\AppConfig::isGeminiConfigured();

        return inertia('Dashboard', [
            'stats' => [
                'total_plans' => $totalPlans,
                'total_posts' => $posts->count(),
                'pending_posts' => $posts->where('status', 'pending')->count(),
                'generated_posts' => $posts->where('status', 'generated')->count(),
                'scheduled_posts' => $posts->where('status', 'scheduled')->count(),
                'total_contacts' => 0,
            ],
            'gemini_configured' => $geminiConfigured,
        ]);
    })->name('dashboard');

    Route::get('/settings', [App\Http\Controllers\SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [App\Http\Controllers\SettingsController::class, 'update'])->name('settings.update');
    Route::get('/plans', [App\Http\Controllers\PlanController::class, 'index'])->name('plans.index');
    Route::get('/plans/create', [App\Http\Controllers\PlanController::class, 'create'])->name('plans.create');
    Route::post('/plans', [App\Http\Controllers\PlanController::class, 'store'])->name('plans.store');
    Route::get('/plans/{plan}', [App\Http\Controllers\PlanController::class, 'show'])->name('plans.show');
    Route::get('/plans/{plan}/edit', [App\Http\Controllers\PlanController::class, 'edit'])->name('plans.edit');
    Route::put('/plans/{plan}', [App\Http\Controllers\PlanController::class, 'update'])->name('plans.update');
    Route::delete('/plans/{plan}', [App\Http\Controllers\PlanController::class, 'destroy'])->name('plans.destroy');
    Route::post('/plans/{plan}/regenerate', [App\Http\Controllers\PlanController::class, 'generatePosts'])->name('plans.regenerate');

    Route::get('/posts/{post}/edit', [App\Http\Controllers\PostController::class, 'edit'])->name('posts.edit');
    Route::put('/posts/{post}', [App\Http\Controllers\PostController::class, 'update'])->name('posts.update');
    Route::post('/posts/{post}/image', [App\Http\Controllers\PostController::class, 'uploadImage'])->name('posts.image');
    Route::post('/posts/{post}/schedule', [App\Http\Controllers\PostController::class, 'updateSchedule'])->name('posts.schedule');
    Route::delete('/posts/{post}', [App\Http\Controllers\PostController::class, 'destroy'])->name('posts.destroy');

    Route::get('/publisher/scheduled', [App\Http\Controllers\PublisherController::class, 'scheduledList'])->name('publisher.scheduled');
    Route::post('/publisher/{post}/schedule', [App\Http\Controllers\PublisherController::class, 'schedule'])->name('publisher.schedule');
    Route::post('/publisher/{post}/publish', [App\Http\Controllers\PublisherController::class, 'publishNow'])->name('publisher.publish');

    Route::get('/contacts', function () { return inertia('Contacts/Index'); })->name('contacts.index');
    Route::get('/contacts/create', function () { return inertia('Contacts/Create'); })->name('contacts.create');
    Route::get('/contacts/{contact}/edit', function ($contact) {
        return inertia('Contacts/Edit', ['contactId' => $contact]);
    })->name('contacts.edit');
});

Route::post('/api/ai/generate-titles', [App\Http\Controllers\Api\AiController::class, 'generateTitles']);
Route::post('/api/ai/generate-plan-content', [App\Http\Controllers\Api\AiController::class, 'generatePlanContent']);
Route::post('/api/ai/generate-missing-fields', [App\Http\Controllers\Api\AiController::class, 'generateMissingFields']);
Route::post('/api/ai/generate-post-content', [App\Http\Controllers\Api\AiController::class, 'generatePostContentSingle']);
Route::get('/api/ai/current-plan', [App\Http\Controllers\Api\AiController::class, 'currentPlan']);
Route::post('/api/upload-post-image', [App\Http\Controllers\Api\AiController::class, 'uploadPostImage']);

Route::get('/publisher/linkedin/login', [App\Http\Controllers\PublisherController::class, 'linkedinLogin'])->name('publisher.linkedin-login');
Route::get('/publisher/linkedin/callback', [App\Http\Controllers\PublisherController::class, 'linkedinCallback'])->name('publisher.linkedin-callback');
Route::get('/publisher/linkedin/disconnect', [App\Http\Controllers\PublisherController::class, 'linkedinDisconnect'])->name('publisher.linkedin-disconnect');

Route::get('/cron/scheduler', function (\Illuminate\Http\Request $req) {
    $cronToken = getenv('CRON_TOKEN');
    if ($cronToken === false || $cronToken === '') {
        $cronToken = 's3cr3t-publish-cron';
    }
    if ($req->query('token') !== $cronToken) {
        abort(401);
    }
    \Illuminate\Support\Facades\Artisan::call('app:publish-scheduled');
    $output = \Illuminate\Support\Facades\Artisan::output();
    $lines = explode("\n", trim($output));
    $summary = end($lines);
    return response($summary);
})->name('cron.scheduler');

