<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketProduct;
use App\Services\GoogleImageSearchService;
use App\Services\MarketDbService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketProductController extends Controller
{
    public function __construct(
        protected MarketDbService $marketDb,
        protected GoogleImageSearchService $googleSearch
    ) {
    }

    public function index(): JsonResponse
    {
        try {
            // Get products from MarketDB
            $marketProducts = $this->marketDb->getStockLevels();

            // Sync to local database
            foreach ($marketProducts as $product) {
                MarketProduct::updateOrCreate(
                    ['pos_product_id' => $product['pos_product_id']],
                    [
                        'product_name' => $product['product_name'],
                        // Keep existing image_url if present
                    ]
                );
            }

            // Return enriched data with image URLs
            $enriched = MarketProduct::all()->map(function ($mp) use ($marketProducts) {
                $market = collect($marketProducts)->firstWhere('pos_product_id', $mp->pos_product_id);

                return [
                    'id' => $mp->id,
                    'pos_product_id' => $mp->pos_product_id,
                    'product_name' => $mp->product_name,
                    'stock_quantity' => $market['stock_quantity'] ?? 0,
                    'image_url' => $mp->image_url,
                ];
            });

            return response()->json($enriched);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products: '.$e->getMessage(),
            ], 500);
        }
    }

    public function searchImages(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|max:500',
        ]);

        try {
            $results = $this->googleSearch->searchImages($validated['query'], 10);

            return response()->json([
                'success' => true,
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateImage(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image_url' => 'required|url|max:2048',
        ]);

        try {
            $product = MarketProduct::findOrFail($id);
            $product->update(['image_url' => $validated['image_url']]);

            return response()->json([
                'success' => true,
                'message' => 'Image updated successfully',
                'product' => $product,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update image: '.$e->getMessage(),
            ], 500);
        }
    }
}
