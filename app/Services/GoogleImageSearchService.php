<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleImageSearchService
{
    protected ?string $apiKey = null;

    protected ?string $searchEngineId = null;

    public function __construct()
    {
        $this->apiKey = Setting::get('google_api_key');
        $this->searchEngineId = Setting::get('google_search_engine_id');
    }

    public function searchImages(string $query, int $limit = 10): array
    {
        if (! $this->apiKey || ! $this->searchEngineId) {
            throw new \Exception('Google API credentials not configured');
        }

        $response = Http::get('https://www.googleapis.com/customsearch/v1', [
            'key' => $this->apiKey,
            'cx' => $this->searchEngineId,
            'q' => $query,
            'searchType' => 'image',
            'num' => min($limit, 10), // Google API max is 10
        ]);

        if ($response->status() === 403) {
            Log::error('Google Image Search failed: API key invalid or quota exceeded', [
                'status' => $response->status(),
            ]);
            throw new \Exception('API key invalid or quota exceeded');
        }

        if ($response->status() === 429) {
            Log::error('Google Image Search failed: Rate limit exceeded', [
                'status' => $response->status(),
            ]);
            throw new \Exception('Rate limit exceeded. Please try again later');
        }

        if (! $response->successful()) {
            Log::error('Google Image Search failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \Exception('Image search failed: '.$response->body());
        }

        $data = $response->json();

        return $this->parseSearchResults($data);
    }

    protected function parseSearchResults(array $data): array
    {
        $items = $data['items'] ?? [];
        $results = [];

        foreach ($items as $item) {
            $results[] = [
                'url' => $item['link'] ?? null,
                'thumbnail' => $item['image']['thumbnailLink'] ?? null,
                'title' => $item['title'] ?? null,
                'width' => $item['image']['width'] ?? null,
                'height' => $item['image']['height'] ?? null,
            ];
        }

        return $results;
    }

    public function testConnection(): bool
    {
        if (! $this->apiKey || ! $this->searchEngineId) {
            return false;
        }

        try {
            $this->searchImages('test', 1);

            return true;
        } catch (\Exception $e) {
            Log::warning("Google API connection test failed: {$e->getMessage()}");

            return false;
        }
    }
}
