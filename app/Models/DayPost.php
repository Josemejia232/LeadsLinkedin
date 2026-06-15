<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DayPost extends Model
{
    protected $fillable = [
        'plan_id',
        'date',
        'title',
        'post_type',
        'text_content',
        'hashtags',
        'image_url',
        'image_file',
        'call_to_action',
        'status',
        'error_message',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MonthlyPlan::class, 'plan_id');
    }

    public function scheduledPost(): HasOne
    {
        return $this->hasOne(ScheduledPost::class, 'day_post_id');
    }
}
