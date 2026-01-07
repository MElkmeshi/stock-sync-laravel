<?php

namespace App\Services;

use App\Models\PrestoItem;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrestoApiService
{
    protected string $baseUrl;

    protected ?string $token = null;

    protected ?\DateTime $tokenExpiry = null;

    public function __construct()
    {
        $this->baseUrl = Setting::get('presto_base_url', 'https://sys.prestoeat.com');
        $this->token = Setting::get('presto_token');

        $expiryString = Setting::get('presto_token_expiry');
        if ($expiryString) {
            $this->tokenExpiry = new \DateTime($expiryString);
        }
    }

    public function authenticate(string $email, string $password): array
    {
        $response = Http::post("{$this->baseUrl}/api/developer/v1/auth/token", [
            'email' => $email,
            'password' => $password,
            'token_name' => 'primary-integration',
            'token_expiration_date' => '2026-12-31',
        ]);

        if (! $response->successful()) {
            throw new \Exception('Authentication failed: '.$response->body());
        }

        $data = $response->json();

        // Parse the nested response structure
        $this->token = $data['data']['token']['value'] ?? null;
        $expirationDate = $data['data']['token']['expiration_date'] ?? null;
        $this->tokenExpiry = $expirationDate ? new \DateTime($expirationDate) : null;

        if ($this->token) {
            Setting::set('presto_token', $this->token);
            Setting::set('presto_token_expiry', $this->tokenExpiry?->format('Y-m-d H:i:s'));

            Log::info('Presto authentication successful', [
                'token_expiry' => $this->tokenExpiry?->format('Y-m-d H:i:s'),
            ]);
        }

        return $data;
    }

    public function isAuthenticated(): bool
    {
        if (! $this->token) {
            return false;
        }

        if ($this->tokenExpiry && $this->tokenExpiry < new \DateTime) {
            return false;
        }

        return true;
    }

    public function getAllCatalogItems(): array
    {
        if (! $this->isAuthenticated()) {
            throw new \Exception('Not authenticated');
        }

        $allItems = [];
        $page = 1;

        do {
            $response = Http::withToken($this->token)
                ->get("{$this->baseUrl}/api/developer/v1/items", [
                    'page' => $page,
                ]);

            if ($response->status() === 401) {
                throw new \Exception('Token expired or invalid');
            }

            if (! $response->successful()) {
                throw new \Exception('Failed to fetch items: '.$response->body());
            }

            $data = $response->json();
            $items = $data['data'] ?? [];
            $allItems = array_merge($allItems, $items);

            $meta = $data['meta'] ?? [];
            $hasMore = isset($meta['current_page'], $meta['last_page'])
                && $meta['current_page'] < $meta['last_page'];

            $page++;
        } while ($hasMore);

        Log::info('Fetched items from Presto catalog', ['count' => count($allItems)]);

        return $allItems;
    }

    public function updateItemAvailability(array $items): bool
    {
        if (! $this->isAuthenticated()) {
            throw new \Exception('Not authenticated');
        }

        $payload = [];
        foreach ($items as $item) {
            $entry = [
                'vendor_reference_id' => (string) $item['vendor_reference_id'],
                'is_available' => $item['is_available'] ?? true,
                'is_active' => $item['is_active'] ?? true,
            ];

            if (isset($item['stock_quantity'])) {
                $entry['stock'] = [
                    'manage' => true,
                    'quantity' => (int) $item['stock_quantity'],
                ];
            }

            $payload[] = $entry;
        }

        $maxRetries = 3;
        $baseDelay = 2;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            $response = Http::withToken($this->token)
                ->timeout(30)
                ->post("{$this->baseUrl}/api/developer/v1/items/availability", $payload);

            if ($response->status() === 204 || $response->status() === 200) {
                Log::info('Updated availability for '.count($items).' items');

                return true;
            }

            if ($response->status() === 401) {
                throw new \Exception('Token expired or invalid');
            }

            if ($attempt < $maxRetries) {
                $delay = $baseDelay * pow(2, $attempt - 1);
                Log::warning("API call failed (attempt {$attempt}/{$maxRetries}), retrying in {$delay}s");
                sleep($delay);
            }
        }

        throw new \Exception('Failed to update availability after '.$maxRetries.' attempts');
    }

    public function syncCatalogToDatabase(): int
    {
        $items = $this->getAllCatalogItems();
        $count = 0;

        foreach ($items as $itemData) {
            PrestoItem::updateOrCreate(
                ['presto_id' => $itemData['id']],
                [
                    'vendor_reference_id' => $itemData['vendor_reference_id'] ?? null,
                    'name_ar' => $itemData['name']['ar'] ?? null,
                    'name_en' => $itemData['name']['en'] ?? null,
                    'description_ar' => $itemData['description']['ar'] ?? null,
                    'description_en' => $itemData['description']['en'] ?? null,
                    'price' => $itemData['price'] ?? 0,
                    'stock' => $itemData['stock'] ?? 0,
                    'sku' => $itemData['sku'] ?? null,
                    'barcode' => $itemData['barcode'] ?? null,
                    'is_active' => $itemData['is_active'] ?? true,
                    'is_available' => $itemData['is_available'] ?? true,
                    'category_ids' => $itemData['category_ids'] ?? [],
                    'image_url' => $itemData['image_url'] ?? null,
                    'brand_id' => $itemData['brand_id'] ?? null,
                    'cached_at' => now(),
                ]
            );
            $count++;
        }

        Log::info("Synced {$count} items to database");

        return $count;
    }

    public function testConnection(): bool
    {
        if (! $this->isAuthenticated()) {
            return false;
        }

        try {
            $response = Http::withToken($this->token)
                ->get("{$this->baseUrl}/api/developer/v1/items", ['page' => 1]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::warning("API connection test failed: {$e->getMessage()}");

            return false;
        }
    }
}
