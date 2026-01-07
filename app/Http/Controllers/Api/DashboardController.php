<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrestoItem;
use App\Models\ProductMapping;
use App\Models\Setting;
use App\Models\SyncEvent;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = [
            'total_presto_items' => PrestoItem::count(),
            'total_mappings' => ProductMapping::count(),
            'items_with_vendor_ref' => PrestoItem::whereNotNull('vendor_reference_id')->count(),
            'recent_events_count' => SyncEvent::where('created_at', '>=', now()->subHours(24))->count(),
            'successful_syncs' => SyncEvent::where('status', SyncEvent::STATUS_SUCCESS)
                ->where('created_at', '>=', now()->subHours(24))
                ->count(),
            'failed_syncs' => SyncEvent::where('status', SyncEvent::STATUS_FAILED)
                ->where('created_at', '>=', now()->subHours(24))
                ->count(),
        ];

        $recentEvents = SyncEvent::latest()
            ->limit(10)
            ->get();

        $syncEnabled = Setting::get('sync_enabled', false);
        $pollInterval = Setting::get('poll_interval', 45);

        return response()->json([
            'stats' => $stats,
            'recent_events' => $recentEvents,
            'sync_enabled' => $syncEnabled,
            'poll_interval' => $pollInterval,
        ]);
    }

    public function toggleSync(): JsonResponse
    {
        $currentState = Setting::get('sync_enabled', false);
        $newState = !$currentState;

        Setting::set('sync_enabled', $newState);

        return response()->json([
            'sync_enabled' => $newState,
            'message' => $newState ? 'Sync enabled' : 'Sync disabled',
        ]);
    }
}
