<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\AiGeneratorController;
use App\Http\Controllers\PublisherController;
use App\Http\Controllers\ContactController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');

Route::get('/plans', [PlanController::class, 'index'])->name('plans.index');
Route::get('/plans/create', [PlanController::class, 'create'])->name('plans.create');
Route::post('/plans', [PlanController::class, 'store'])->name('plans.store');
Route::get('/plans/{plan}', [PlanController::class, 'show'])->name('plans.show');
Route::get('/plans/{plan}/edit', [PlanController::class, 'edit'])->name('plans.edit');
Route::put('/plans/{plan}', [PlanController::class, 'update'])->name('plans.update');
Route::delete('/plans/{plan}', [PlanController::class, 'destroy'])->name('plans.destroy');
Route::post('/plans/{plan}/generate-posts', [PlanController::class, 'generatePosts'])->name('plans.generate-posts');

Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
Route::post('/posts/{post}/schedule', [PostController::class, 'updateSchedule'])->name('posts.update-schedule');
Route::post('/posts/{post}/upload-image', [PostController::class, 'uploadImage'])->name('posts.upload-image');
Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');

Route::post('/ai/generate-content/{post}', [AiGeneratorController::class, 'generateContent'])->name('ai.generate-content');
Route::post('/ai/generate-plan/{plan}', [AiGeneratorController::class, 'generatePlanContent'])->name('ai.generate-plan');

Route::post('/publisher/schedule/{post}', [PublisherController::class, 'schedule'])->name('publisher.schedule');
Route::get('/publisher/scheduled', [PublisherController::class, 'scheduledList'])->name('publisher.scheduled');
Route::post('/publisher/publish-now/{post}', [PublisherController::class, 'publishNow'])->name('publisher.publish-now');
Route::get('/publisher/linkedin/login', [PublisherController::class, 'linkedinLogin'])->name('publisher.linkedin-login');
Route::post('/publisher/linkedin/disconnect', [PublisherController::class, 'linkedinDisconnect'])->name('publisher.linkedin-disconnect');
Route::get('/publisher/linkedin/callback', [PublisherController::class, 'linkedinCallback'])->name('publisher.linkedin-callback');

Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
Route::get('/contacts/create', [ContactController::class, 'create'])->name('contacts.create');
Route::post('/contacts', [ContactController::class, 'store'])->name('contacts.store');
Route::get('/contacts/{contact}/edit', [ContactController::class, 'edit'])->name('contacts.edit');
Route::put('/contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->name('contacts.destroy');
