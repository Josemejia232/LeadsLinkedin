<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel');

echo 'Token: ' . (App\Models\AppConfig::get('LINKEDIN_ACCESS_TOKEN') ?: 'NULL') . PHP_EOL;
echo 'Client ID: ' . (App\Models\AppConfig::get('LINKEDIN_CLIENT_ID') ?: 'NULL') . PHP_EOL;
echo 'Client Secret: ' . (App\Models\AppConfig::get('LINKEDIN_CLIENT_SECRET') ?: 'NULL') . PHP_EOL;
echo 'Expires: ' . (App\Models\AppConfig::get('LINKEDIN_TOKEN_EXPIRES_AT') ?: 'NULL') . PHP_EOL;
echo 'Refresh: ' . (App\Models\AppConfig::get('LINKEDIN_REFRESH_TOKEN') ?: 'NULL') . PHP_EOL;
echo 'Person: ' . (App\Models\AppConfig::get('LINKEDIN_PERSON_NAME') ?: 'NULL') . PHP_EOL;
