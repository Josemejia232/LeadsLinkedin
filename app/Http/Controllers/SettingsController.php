<?php

namespace App\Http\Controllers;

use App\Models\AppConfig;
use App\Services\LinkedInService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $linkedinOauthUrl = AppConfig::isLinkedinConfigured()
            ? app(LinkedInService::class)->getOAuthUrl()
            : null;

        return Inertia::render('Settings', [
            'gemini_key' => AppConfig::get('GEMINI_API_KEY'),
            'gemini_configured' => AppConfig::isGeminiConfigured(),
            'linkedin_client_id' => AppConfig::get('LINKEDIN_CLIENT_ID'),
            'linkedin_client_secret' => AppConfig::get('LINKEDIN_CLIENT_SECRET'),
            'linkedin_configured' => AppConfig::isLinkedinConfigured(),
            'linkedin_connected' => AppConfig::isLinkedinConnected(),
            'linkedin_person_name' => AppConfig::getLinkedinPersonName(),
            'linkedin_oauth_url' => $linkedinOauthUrl,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'gemini_key' => 'nullable|string',
            'linkedin_client_id' => 'nullable|string',
            'linkedin_client_secret' => 'nullable|string',
        ]);

        AppConfig::set('GEMINI_API_KEY', $request->gemini_key ?? '');
        AppConfig::set('LINKEDIN_CLIENT_ID', $request->linkedin_client_id ?? '');
        AppConfig::set('LINKEDIN_CLIENT_SECRET', $request->linkedin_client_secret ?? '');

        return redirect()->back()->with('success', 'Settings saved successfully.');
    }
}
