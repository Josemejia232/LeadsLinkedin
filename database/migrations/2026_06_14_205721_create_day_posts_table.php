<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('day_posts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('plan_id')->constrained('monthly_plans')->cascadeOnDelete();
            $table->date('date');
            $table->string('title', 200);
            $table->string('post_type', 20)->default('text');
            $table->longText('text_content')->nullable();
            $table->string('hashtags', 500)->nullable();
            $table->string('image_url')->nullable();
            $table->string('image_file')->nullable();
            $table->string('call_to_action', 200)->nullable();
            $table->string('status', 20)->default('pending');
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index(['plan_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('day_posts');
    }
};
