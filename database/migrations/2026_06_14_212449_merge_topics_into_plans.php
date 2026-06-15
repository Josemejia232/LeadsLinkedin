<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('monthly_plans', function (Blueprint $table) {
            $table->string('topic_name', 200)->nullable()->after('topic_id');
            $table->string('industry', 100)->nullable()->after('topic_name');
            $table->text('keywords')->nullable()->after('industry');
            $table->text('objectives')->nullable()->after('keywords');
            $table->string('target_audience', 200)->nullable()->after('objectives');
            $table->dropForeign(['topic_id']);
            $table->dropUnique(['user_id', 'topic_id', 'month', 'year']);
            $table->foreignId('topic_id')->nullable()->change();
        });

        Schema::dropIfExists('topics');
    }

    public function down(): void
    {
        Schema::table('monthly_plans', function (Blueprint $table) {
            $table->dropColumn(['topic_name', 'industry', 'keywords', 'objectives', 'target_audience']);
            $table->foreignId('topic_id')->constrained()->change();
            $table->unique(['user_id', 'topic_id', 'month', 'year']);
        });
    }
};
