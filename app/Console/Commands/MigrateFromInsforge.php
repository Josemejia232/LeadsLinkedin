<?php

namespace App\Console\Commands;

use App\Models\MonthlyPlan;
use App\Models\DayPost;
use App\Models\ScheduledPost;
use App\Models\AppConfig;
use App\Models\Contact;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class MigrateFromInsforge extends Command
{
    protected $signature = 'app:migrate-from-insforge {--truncate : Truncate tables before importing}';
    protected $description = 'Migrate all data from InsForge PostgreSQL to local Eloquent database (Render PostgreSQL)';

    private function api(): string
    {
        $url = getenv('INSFORGE_URL');
        if ($url === false || $url === '') {
            $url = 'https://w66d8gas.us-east.insforge.app';
        }
        return rtrim($url, '/') . '/rest/v1';
    }

    private function headers(): array
    {
        $key = getenv('INSFORGE_ADMIN_KEY');
        if ($key === false || $key === '') {
            $key = getenv('INSFORGE_ANON_KEY');
        }
        return [
            'apikey' => $key,
            'Authorization' => 'Bearer ' . $key,
            'Content-Type' => 'application/json',
        ];
    }

    private function fetchAll(string $table): array
    {
        $page = 0;
        $perPage = 1000;
        $all = [];

        do {
            $offset = $page * $perPage;
            $r = Http::withHeaders($this->headers())
                ->timeout(30)
                ->get($this->api() . '/' . $table, [
                    'select' => '*',
                    'offset' => $offset,
                    'limit' => $perPage,
                    'order' => 'id.asc',
                ]);

            if ($r->failed()) {
                $this->error("Failed to fetch {$table} (offset {$offset}): HTTP {$r->status()} {$r->body()}");
                return [];
            }

            $rows = $r->json();
            if (!is_array($rows) || count($rows) === 0) {
                break;
            }

            $all = array_merge($all, $rows);
            $page++;
        } while (count($rows) === $perPage);

        $this->info("Fetched " . count($all) . " rows from {$table}");
        return $all;
    }

    public function handle(): void
    {
        $this->info('Starting migration from InsForge to Eloquent...');

        if ($this->option('truncate')) {
            $this->warn('Truncating existing tables...');
            DB::statement('SET session_replication_role = replica');
            ScheduledPost::query()->truncate();
            DayPost::query()->truncate();
            MonthlyPlan::query()->truncate();
            AppConfig::query()->truncate();
            DB::statement('SET session_replication_role = origin');
            $this->info('Tables truncated.');
        }

        // 1. Migrate monthly_plans
        $this->info("\n--- Monthly Plans ---");
        $plans = $this->fetchAll('monthly_plans');
        $planIdMap = [];
        foreach ($plans as $p) {
            $oldId = $p['id'];
            unset($p['id'], $p['created_at'], $p['updated_at']);
            if (isset($p['topic_id']) && is_null($p['topic_id'])) {
                unset($p['topic_id']);
            }
            $plan = MonthlyPlan::create($p);
            $planIdMap[$oldId] = $plan->id;
        }
        $this->info("Imported " . count($plans) . " plans.");

        // 2. Migrate day_posts
        $this->info("\n--- Day Posts ---");
        $posts = $this->fetchAll('day_posts');
        $postIdMap = [];
        $skipped = 0;
        foreach ($posts as $p) {
            $oldId = $p['id'];
            $oldPlanId = $p['plan_id'];
            if (!isset($planIdMap[$oldPlanId])) {
                $this->warn("Skipping day_post {$oldId}: plan {$oldPlanId} not found in imported data.");
                $skipped++;
                continue;
            }
            unset($p['id'], $p['created_at'], $p['updated_at']);
            $p['plan_id'] = $planIdMap[$oldPlanId];
            if (isset($p['date'])) {
                $p['date'] = is_string($p['date']) ? explode('T', $p['date'])[0] : $p['date'];
            }
            $post = DayPost::create($p);
            $postIdMap[$oldId] = $post->id;
        }
        if ($skipped > 0) {
            $this->warn("Skipped {$skipped} day_posts due to missing parent plan.");
        }
        $this->info("Imported " . count($posts) . " day_posts.");

        // 3. Migrate scheduled_posts
        $this->info("\n--- Scheduled Posts ---");
        $scheduled = $this->fetchAll('scheduled_posts');
        $importedScheduled = 0;
        foreach ($scheduled as $s) {
            $oldDayPostId = $s['day_post_id'];
            if (!isset($postIdMap[$oldDayPostId])) {
                $this->warn("Skipping scheduled_post for day_post {$oldDayPostId}: not found in imported data.");
                continue;
            }
            unset($s['id'], $s['created_at'], $s['updated_at']);
            $s['day_post_id'] = $postIdMap[$oldDayPostId];
            ScheduledPost::create($s);
            $importedScheduled++;
        }
        $this->info("Imported {$importedScheduled} scheduled_posts.");

        // 4. Migrate app_configs
        $this->info("\n--- App Configs ---");
        $configs = $this->fetchAll('app_configs');
        foreach ($configs as $c) {
            AppConfig::set($c['key'], $c['value']);
        }
        $this->info("Imported " . count($configs) . " configs.");

        // 5. Migrate contacts
        $this->info("\n--- Contacts ---");
        $contacts = $this->fetchAll('contacts');
        if (class_exists(\App\Models\Contact::class)) {
            foreach ($contacts as $c) {
                unset($c['id'], $c['created_at'], $c['updated_at']);
                Contact::create($c);
            }
        }
        $this->info("Imported " . count($contacts) . " contacts.");

        $this->info("\nMigration complete!");
        $this->table(
            ['Table', 'Count'],
            [
                ['monthly_plans', count($plans)],
                ['day_posts', count($posts)],
                ['scheduled_posts', $importedScheduled],
                ['app_configs', count($configs)],
                ['contacts', count($contacts)],
            ]
        );
    }
}
