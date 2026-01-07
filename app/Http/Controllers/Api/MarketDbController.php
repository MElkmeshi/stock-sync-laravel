<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MarketDbService;
use Illuminate\Http\JsonResponse;

class MarketDbController extends Controller
{
    public function __construct(protected MarketDbService $marketDb)
    {
    }

    public function getProducts(): JsonResponse
    {
        try {
            $products = $this->marketDb->getStockLevels();

            return response()->json($products);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getTables(): JsonResponse
    {
        try {
            $tables = $this->marketDb->getTables();

            return response()->json($tables);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tables: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getColumns(string $tableName): JsonResponse
    {
        try {
            $columns = $this->marketDb->getTableColumns($tableName);

            return response()->json($columns);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch columns: ' . $e->getMessage(),
            ], 500);
        }
    }
}
