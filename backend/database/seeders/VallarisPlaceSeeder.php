<?php

namespace Database\Seeders;

use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class VallarisPlaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $apiKey = env('VALLARIS_API_KEY');
        $itemsUrl = env('VALLARIS_ITEMS_URL');
        $collectionId = env('VALLARIS_COLLECTION_ID', '68db604f6d325faa74ba5bbd');
        $baseUrl = rtrim(env('VALLARIS_BASE_URL', 'https://va-cdn-02.vallarismaps.com'), '/');

        if (! $apiKey) {
            throw new RuntimeException('VALLARIS_API_KEY is missing. Add it to backend/.env before running VallarisPlaceSeeder.');
        }

        if (! $itemsUrl && ! $collectionId) {
            throw new RuntimeException('VALLARIS_ITEMS_URL or VALLARIS_COLLECTION_ID is missing. Add your Vallaris items URL or collection id to backend/.env.');
        }

        $urls = $this->itemsUrls($itemsUrl, $baseUrl, $collectionId);

        $response = null;
        $usedUrl = null;

        foreach ($urls as $url) {
            $this->command->info("Fetching Vallaris dataset from: {$url}");

            $response = Http::timeout(60)
                ->retry(2, 1000, throw: false)
                ->get($url, [
                    'api_key' => $apiKey,
                ]);

            if ($response->successful()) {
                $usedUrl = $url;
                break;
            }
        }

        if (! $response || $response->failed()) {
            $body = str($response->body())->limit(300);
            $triedUrls = implode(', ', $urls);

            throw new RuntimeException(
                "Failed to fetch Vallaris dataset. Status: {$response->status()}. "
                ."Tried URLs: {$triedUrls}. Response: {$body}. "
                .'Check VALLARIS_ITEMS_URL or VALLARIS_COLLECTION_ID and API key application access/scope in Vallaris Maps.'
            );
        }

        $data = $response->json();

        $features = $data['features'] ?? [];

        if (empty($features)) {
            $this->command->warn('No features found in Vallaris dataset.');

            return;
        }

        Place::query()->delete();

        $imported = 0;

        foreach ($features as $feature) {
            $geometry = $feature['geometry'] ?? null;
            $properties = $feature['properties'] ?? [];

            if (! $geometry) {
                continue;
            }

            $name =
                $properties['name']
                ?? $properties['Name']
                ?? $properties['NAME']
                ?? $properties['title']
                ?? $properties['Title']
                ?? 'Unnamed Place';

            Place::create([
                'name' => $name,
                'geometry' => $geometry,
                'properties' => array_merge($properties, [
                    'source' => 'Vallaris Maps',
                    'vallaris_collection_id' => $collectionId,
                    'vallaris_items_url' => $usedUrl,
                ]),
            ]);

            $imported++;
        }

        $this->command->info("{$imported} Vallaris features imported successfully.");
    }

    /**
     * @return array<int, string>
     */
    private function itemsUrls(?string $itemsUrl, string $baseUrl, string $collectionId): array
    {
        if ($itemsUrl) {
            return [$itemsUrl];
        }

        return array_values(array_unique([
            "{$baseUrl}/core/api/features/1.1/collections/{$collectionId}/items",
            "https://va-cdn-02.vallarismaps.com/core/api/features/1.1/collections/{$collectionId}/items",
            "https://app.vallarismaps.com/core/api/features/1.1/collections/{$collectionId}/items",
        ]));
    }
}
