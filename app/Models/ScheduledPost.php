<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledPost extends Model
{
    protected $fillable = [
        'day_post_id',
        'scheduled_date',
        'status',
        'error_message',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function dayPost(): BelongsTo
    {
        return $this->belongsTo(DayPost::class);
    }
}
