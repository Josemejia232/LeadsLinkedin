<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AppConfig extends Model
{
    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    public static function get(string $key, string $default = ''): ?string
    {
        $config = static::where('key', $key)->first();

        if ($config?->value) {
            return $config->value;
        }

        $fromInsforge = static::getFromInsforge($key);

        if ($fromInsforge !== null) {
            return $fromInsforge;
        }

        $fromEnv = getenv($key);

        if ($fromEnv !== false && $fromEnv !== '') {
            return $fromEnv;
        }

        return $default;
    }

    public static function set(string $key, string $value): self
    {
        $model = static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );

        static::writeToInsforge($key, $value);

        return $model;
    }

    public static function isGeminiConfigured(): bool
    {
        $key = static::get('GEMINI_API_KEY');

        return !empty($key) && !str_starts_with($key, 'tu-key');
    }

    public static function isLinkedinConfigured(): bool
    {
        $key = static::get('LINKEDIN_CLIENT_ID');

        return !empty($key) && !str_starts_with($key, 'tu-key');
    }

    public static function isLinkedinConnected(): bool
    {
        return !empty(static::get('LINKEDIN_ACCESS_TOKEN'));
    }

    public static function getLinkedinPersonName(): string
    {
        return static::get('LINKEDIN_PERSON_NAME', '');
    }

    private static function getFromInsforge(string $key): ?string
    {
        try {
            $baseUrl = getenv('VITE_INSFORGE_URL') ?: 'https://w66d8gas.us-east.insforge.app';
            $anonKey = getenv('VITE_INSFORGE_ANON_KEY');

            if (!$anonKey) {
                return null;
            }

            $response = Http::withHeaders([
                'apikey' => $anonKey,
                'Authorization' => 'Bearer ' . $anonKey,
            ])->timeout(5)->get($baseUrl . '/api/database/records/app_configs', [
                'key' => 'eq.' . $key,
                'select' => 'value',
            ]);

            if ($response->successful()) {
                $rows = $response->json();
                return $rows[0]['value'] ?? null;
            }
        } catch (\Exception $e) {
            Log::warning("AppConfig: failed to read {$key} from InsForge: " . $e->getMessage());
        }

        return null;
    }

    private static function writeToInsforge(string $key, string $value): void
    {
        try {
            $baseUrl = getenv('VITE_INSFORGE_URL') ?: 'https://w66d8gas.us-east.insforge.app';
            $anonKey = getenv('VITE_INSFORGE_ANON_KEY');

            if (!$anonKey) {
                return;
            }

            // Find existing record
            $response = Http::withHeaders([
                'apikey' => $anonKey,
                'Authorization' => 'Bearer ' . $anonKey,
            ])->timeout(5)->get($baseUrl . '/api/database/records/app_configs', [
                'key' => 'eq.' . $key,
                'select' => 'id',
            ]);

            $existing = $response->successful() ? $response->json() : [];

            if (!empty($existing[0]['id'])) {
                Http::withHeaders([
                    'apikey' => $anonKey,
                    'Authorization' => 'Bearer ' . $anonKey,
                ])->timeout(5)->patch($baseUrl . '/api/database/records/app_configs?id=eq.' . $existing[0]['id'], [
                    'value' => $value,
                ]);
            } else {
                Http::withHeaders([
                    'apikey' => $anonKey,
                    'Authorization' => 'Bearer ' . $anonKey,
                    'Prefer' => 'return=minimal',
                ])->timeout(5)->post($baseUrl . '/api/database/records/app_configs', [
                    ['key' => $key, 'value' => $value],
                ]);
            }
        } catch (\Exception $e) {
            Log::warning("AppConfig: failed to write {$key} to InsForge: " . $e->getMessage());
        }
    }
}
