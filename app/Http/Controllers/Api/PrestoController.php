<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrestoItem;
use App\Services\PrestoApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrestoController extends Controller
{
    public function __construct(protected PrestoApiService $prestoApi)
    {
    }

    public function authenticate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            $result = $this->prestoApi->authenticate($validated['email'], $validated['password']);

            return response()->json([
                'success' => true,
                'message' => 'Authentication successful',
                'token' => $result['data']['token']['value'] ?? null,
                'expires_at' => $result['data']['token']['expiration_date'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication failed: ' . $e->getMessage(),
            ], 401);
        }
    }

    public function testConnection(): JsonResponse
    {
        try {
            $connected = $this->prestoApi->testConnection();

            return response()->json([
                'success' => $connected,
                'message' => $connected ? 'Connection successful' : 'Connection failed',
                'authenticated' => $this->prestoApi->isAuthenticated(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function syncCatalog(): JsonResponse
    {
        try {
            $count = $this->prestoApi->syncCatalogToDatabase();

            return response()->json([
                'success' => true,
                'message' => "Synced {$count} items from Presto",
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getItems(): JsonResponse
    {
        $items = PrestoItem::latest('cached_at')
            ->limit(500)
            ->get();

        return response()->json($items);
    }
}
