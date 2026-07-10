<?php

namespace Database\Seeders;

use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class VallarisPlaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $url = 'https://app.vallarismaps.com/core/api/features/1.1/collections/68db604f6d325faa74ba5bbd/items?api_key=7YS8I82KbtLtZZejpWqMzeeIdtKahrUEMPhHW1PuX5DlhY6qjaZaFQOHi15RpH48';

        $response = Http::get($url);

        if ($response->failed()) {
            $this->command->error('Failed to fetch Vallaris dataset.');
            return;
        }

        $data = $response->json();

        $features = $data['features'] ?? [];

        if (empty($features)) {
            $this->command->warn('No features found in Vallaris dataset.');
            return;
        }

        foreach ($features as $feature) {
            $geometry = $feature['geometry'] ?? null;
            $properties = $feature['properties'] ?? [];

            if (!$geometry) {
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
                'properties' => $properties,
            ]);
        }

        $this->command->info('Vallaris dataset imported successfully.');
    }
}