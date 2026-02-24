<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrestoItem;
use App\Models\ProductMapping;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MappingsController extends Controller
{
    public function index(): JsonResponse
    {
        $mappings = ProductMapping::with('prestoItem')->get();

        return response()->json($mappings);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pos_product_id' => 'required|string',
            'presto_item_id' => [
                'required',
                'exists:presto_items,id',
                \Illuminate\Validation\Rule::unique('product_mappings')
                    ->where('pos_product_id', $request->pos_product_id),
            ],
        ]);

        $mapping = ProductMapping::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Mapping created successfully',
            'mapping' => $mapping->load('prestoItem'),
        ], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $mapping = ProductMapping::find($id);

        if (! $mapping) {
            return response()->json([
                'success' => false,
                'message' => 'Mapping not found',
            ], 404);
        }

        $mapping->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mapping deleted successfully',
        ]);
    }

    public function stats(): JsonResponse
    {
        $totalMappings = ProductMapping::count();
        $totalPrestoItems = PrestoItem::count();
        $itemsWithVendorRef = PrestoItem::whereNotNull('vendor_reference_id')->count();

        return response()->json([
            'total_mappings' => $totalMappings,
            'total_presto_items' => $totalPrestoItems,
            'items_with_vendor_ref' => $itemsWithVendorRef,
            'unmapped_items' => $totalPrestoItems - $totalMappings,
        ]);
    }
}
