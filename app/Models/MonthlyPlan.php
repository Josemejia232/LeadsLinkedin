<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonthlyPlan extends Model
{
    protected $fillable = [
        'user_id',
        'topic_name',
        'industry',
        'keywords',
        'objectives',
        'target_audience',
        'month',
        'year',
        'status',
        'total_posts',
        'schedule_hours',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'year' => 'integer',
            'schedule_hours' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function dayPosts(): HasMany
    {
        return $this->hasMany(DayPost::class, 'plan_id');
    }
}
