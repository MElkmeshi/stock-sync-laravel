<?php

namespace App\Console\Commands;

use App\Models\ProductMapping;
use App\Models\Setting;
use App\Models\SyncEvent;
use App\Services\MarketDbService;
use App\Services\PrestoApiService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SyncStockCommand extends Command
{
    protected $signature = 'stock:sync {--once : Run once instead of continuously}';

    protected $description = 'Sync stock levels from Market DB to Presto';

    protected MarketDbService $marketDb;
    protected PrestoApiService $prestoApi;

    public function handle(): int
    {
        $this->marketDb = new MarketDbService();
        $this->prestoApi = new PrestoApiService();

        $this->info('Starting stock sync...');

        if (!$this->prestoApi->isAuthenticated()) {
            $this->error('Not authenticated with Presto API');
            return Command::FAILURE;
        }

        if (!$this->marketDb->testConnection()) {
            $this->error('Cannot connect to Market database');
            return Command::FAILURE;
        }

        if ($this->option('once')) {
            return $this->runOnce();
        }

        // Continuous mode
        $interval = Setting::get('poll_interval', 45);
        $this->info("Polling every {$interval} seconds. Press Ctrl+C to stop.");

        while (true) {
            $this->runOnce();
            sleep($interval);
        }

        return Command::SUCCESS;
    }

    protected function runOnce(): int
    {
        try {
            $this->info('[' . now()->format('Y-m-d H:i:s') . '] Fetching stock levels...');

            $stockLevels = $this->marketDb->getStockLevels();
            $this->info('Found ' . count($stockLevels) . ' products in Market DB');

            $changes = $this->detectChanges($stockLevels);

            if (empty($changes)) {
                $this->info('No changes detected');
                return Command::SUCCESS;
            }

            $this->info('Detected ' . count($changes) . ' changes');

            $this->syncChanges($changes);

            $this->info('Sync completed successfully');
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Sync failed: ' . $e->getMessage());
            Log::error('Sync failed: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    protected function detectChanges(array $stockLevels): array
    {
        $changes = [];
        $mappings = ProductMapping::with('prestoItem')->get()->keyBy('pos_product_id');

        foreach ($stockLevels as $stock) {
            $posId = $stock['pos_product_id'];

            if (!isset($mappings[$posId])) {
                continue; // Not mapped
            }

            $mapping = $mappings[$posId];
            $quantity = $stock['stock_quantity'];
            $isAvailable = $quantity > 0;

            // Get cached state
            $cacheKey = "stock_state_{$posId}";
            $cachedState = Cache::get($cacheKey);

            // Only sync if availability changed
            if ($cachedState === null || $cachedState['is_available'] !== $isAvailable) {
                $changes[] = [
                    'pos_product_id' => $posId,
                    'product_name' => $stock['product_name'],
                    'vendor_reference_id' => $mapping->prestoItem->vendor_reference_id
                        ?? $mapping->prestoItem->presto_id,
                    'stock_quantity' => $quantity,
                    'is_available' => $isAvailable,
                    'action' => $isAvailable ? SyncEvent::ACTION_ENABLE : SyncEvent::ACTION_DISABLE,
                ];

                // Update cache
                Cache::forever($cacheKey, [
                    'is_available' => $isAvailable,
                    'stock_quantity' => $quantity,
                    'last_updated' => now()->toIso8601String(),
                ]);
            }
        }

        return $changes;
    }

    protected function syncChanges(array $changes): void
    {
        // Group by action for batch processing
        $toUpdate = [];

        foreach ($changes as $change) {
            // Create sync event
            $event = SyncEvent::create([
                'pos_product_id' => $change['pos_product_id'],
                'product_name' => $change['product_name'],
                'action' => $change['action'],
                'status' => SyncEvent::STATUS_PENDING,
                'stock_quantity' => $change['stock_quantity'],
            ]);

            $toUpdate[] = [
                'vendor_reference_id' => $change['vendor_reference_id'],
                'is_available' => $change['is_available'],
                'stock_quantity' => $change['stock_quantity'],
                'event_id' => $event->id,
            ];

            $this->info("  → {$change['action']} {$change['product_name']} (stock: {$change['stock_quantity']})");
        }

        // Batch update Presto
        if (!empty($toUpdate)) {
            try {
                $this->prestoApi->updateItemAvailability($toUpdate);

                // Mark all as success
                foreach ($toUpdate as $item) {
                    SyncEvent::find($item['event_id'])->update([
                        'status' => SyncEvent::STATUS_SUCCESS,
                    ]);
                }

                $this->info('Successfully updated ' . count($toUpdate) . ' items in Presto');
            } catch (\Exception $e) {
                // Mark all as failed
                foreach ($toUpdate as $item) {
                    SyncEvent::find($item['event_id'])->update([
                        'status' => SyncEvent::STATUS_FAILED,
                        'error_message' => $e->getMessage(),
                    ]);
                }

                throw $e;
            }
        }
    }
}
