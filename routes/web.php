<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::get('/insforge-test', function () {
    return inertia('InsForgeTest');
})->name('insforge-test');

Route::get('/dashboard', function () {
    return inertia('Dashboard');
})->name('dashboard');

Route::get('/settings', function () {
    return inertia('Settings');
})->name('settings.index');

Route::get('/plans', function () {
    return inertia('Plans/Index');
})->name('plans.index');

Route::get('/plans/create', function () {
    return inertia('Plans/Create');
})->name('plans.create');

Route::get('/plans/{plan}', function ($plan) {
    return inertia('Plans/Show', ['planId' => $plan]);
})->name('plans.show');

Route::get('/plans/{plan}/edit', function ($plan) {
    return inertia('Plans/Edit', ['planId' => $plan]);
})->name('plans.edit');

Route::get('/posts/{post}/edit', function ($post) {
    return inertia('Posts/Edit', ['postId' => $post]);
})->name('posts.edit');

Route::get('/publisher/scheduled', function () {
    return inertia('Publisher/Index');
})->name('publisher.scheduled');

Route::get('/contacts', function () {
    return inertia('Contacts/Index');
})->name('contacts.index');

Route::get('/contacts/create', function () {
    return inertia('Contacts/Create');
})->name('contacts.create');

Route::get('/contacts/{contact}/edit', function ($contact) {
    return inertia('Contacts/Edit', ['contactId' => $contact]);
})->name('contacts.edit');

Route::get('/api/ai/generate-titles', [App\Http\Controllers\Api\AiController::class, 'generateTitles']);
Route::get('/api/ai/generate-plan-content', [App\Http\Controllers\Api\AiController::class, 'generatePlanContent']);
Route::get('/api/ai/generate-missing-fields', [App\Http\Controllers\Api\AiController::class, 'generateMissingFields']);
Route::get('/api/ai/generate-post-content', [App\Http\Controllers\Api\AiController::class, 'generatePostContentSingle']);
Route::get('/api/ai/current-plan', [App\Http\Controllers\Api\AiController::class, 'currentPlan']);
Route::post('/api/upload-post-image', [App\Http\Controllers\Api\AiController::class, 'uploadPostImage']);

Route::get('/publisher/linkedin-login', [App\Http\Controllers\PublisherController::class, 'linkedinLogin'])->name('publisher.linkedin-login');
Route::get('/publisher/linkedin-callback', [App\Http\Controllers\PublisherController::class, 'linkedinCallback'])->name('publisher.linkedin-callback');
Route::get('/publisher/linkedin-disconnect', [App\Http\Controllers\PublisherController::class, 'linkedinDisconnect'])->name('publisher.linkedin-disconnect');

Route::get('/cron/scheduler', function (\Illuminate\Http\Request $req) {
    if ($req->query('token') !== 's3cr3t-publish-cron') {
        abort(401);
    }
    \Illuminate\Support\Facades\Artisan::call('app:publish-scheduled');
    $output = \Illuminate\Support\Facades\Artisan::output();
    $lines = explode("\n", trim($output));
    $summary = end($lines);
    return response($summary);
})->name('cron.scheduler');

Route::get('/debug/linkedin-status', function (\Illuminate\Http\Request $req) {
    if ($req->query('token') !== 's3cr3t-publish-cron') {
        abort(401);
    }
    $token = \App\Models\AppConfig::get('LINKEDIN_ACCESS_TOKEN');
    $expires = \App\Models\AppConfig::get('LINKEDIN_TOKEN_EXPIRES_AT');
    $person = \App\Models\AppConfig::get('LINKEDIN_PERSON_NAME');
    $hasRefresh = \App\Models\AppConfig::get('LINKEDIN_REFRESH_TOKEN');
    $clientId = \App\Models\AppConfig::get('LINKEDIN_CLIENT_ID');
    $clientSecret = \App\Models\AppConfig::get('LINKEDIN_CLIENT_SECRET');

    return response()->json([
        'has_token' => !empty($token),
        'token_prefix' => $token ? substr($token, 0, 10) . '...' : null,
        'expires_at' => $expires ? date('Y-m-d H:i:s', (int)$expires) : null,
        'is_expired' => $expires ? ((int)$expires < time()) : null,
        'person' => $person,
        'has_refresh_token' => !empty($hasRefresh),
        'has_client_id' => !empty($clientId),
        'has_client_secret' => !empty($clientSecret),
    ]);
});