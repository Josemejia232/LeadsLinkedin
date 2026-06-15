<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

        return $config?->value ?? $default;
    }

    public static function set(string $key, string $value): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
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
}
