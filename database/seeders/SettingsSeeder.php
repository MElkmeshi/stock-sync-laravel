<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaultSettings = [
            // Market Database Settings
            'db_server' => '127.0.0.1',
            'db_port' => '1433',
            'db_name' => 'Market',
            'db_user' => 'sa',
            'db_password' => 'MyStr0ngP@ssw0rd!',

            // Presto API Settings
            'presto_api_url' => 'https://integration.presto.app/v1',
            'presto_email' => '',
            'presto_password' => '',
            'presto_token' => '',
            'presto_token_expires_at' => null,

            // Stock Query
            'stock_query' => 'SELECT
                id as pos_product_id,
                name as product_name,
                stock as stock_quantity
            FROM products
            WHERE active = 1',

            // Sync Settings
            'sync_enabled' => false,
            'poll_interval' => 45,
            'stock_threshold' => 0,
        ];

        foreach ($defaultSettings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => json_encode($value)]
            );
        }
    }
}
