<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\MarketDbService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = [
            'db_server' => Setting::get('db_server', '127.0.0.1'),
            'db_port' => Setting::get('db_port', 1433),
            'db_name' => Setting::get('db_name', 'Market'),
            'db_user' => Setting::get('db_user', 'sa'),
            'db_password' => Setting::get('db_password', 'MyStr0ngP@ssw0rd!'),
            'presto_base_url' => Setting::get('presto_base_url', 'https://sys.prestoeat.com'),
            'presto_email' => Setting::get('presto_email', ''),
            'google_api_key' => Setting::get('google_api_key', ''),
            'google_search_engine_id' => Setting::get('google_search_engine_id', ''),
            'poll_interval' => Setting::get('poll_interval', 45),
            'stock_query' => Setting::get('stock_query', $this->getDefaultStockQuery()),
        ];

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'db_server' => 'sometimes|string',
            'db_port' => 'sometimes|integer',
            'db_name' => 'sometimes|string',
            'db_user' => 'sometimes|string',
            'db_password' => 'sometimes|string',
            'presto_base_url' => 'sometimes|url',
            'presto_email' => 'sometimes|email',
            'presto_password' => 'sometimes|string',
            'google_api_key' => 'sometimes|string',
            'google_search_engine_id' => 'sometimes|string',
            'poll_interval' => 'sometimes|integer|min:10|max:300',
            'stock_query' => 'sometimes|string',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }

    public function testDatabase(): JsonResponse
    {
        try {
            $marketDb = new MarketDbService;
            $connected = $marketDb->testConnection();

            if ($connected) {
                return response()->json([
                    'success' => true,
                    'message' => 'Database connection successful',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Database connection failed',
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed: '.$e->getMessage(),
            ], 500);
        }
    }

    protected function getDefaultStockQuery(): string
    {
        return <<<'SQL'
            SELECT
                Pno as pos_product_id,
                PName as product_name,
                ISNULL(Qnt, 0) as stock_quantity
            FROM Pieces
        SQL;
    }
}
