<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_posts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('day_post_id')->constrained('day_posts')->unique()->cascadeOnDelete();
            $table->dateTime('scheduled_date');
            $table->string('status', 20)->default('draft');
            $table->text('error_message')->nullable();
            $table->dateTime('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_posts');
    }
};
