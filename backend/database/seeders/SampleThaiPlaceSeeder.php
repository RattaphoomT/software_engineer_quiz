<?php

namespace Database\Seeders;

use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;

class SampleThaiPlaceSeeder extends Seeder
{
    private const TARGET_FEATURES = 100;

    private const MIN_USABLE_FEATURES = 20;

    private const OVERPASS_ENDPOINTS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.openstreetmap.ru/api/interpreter',
    ];

    private const SEED_BBOXES = [
        'Khon Kaen City' => [16.38, 102.78, 16.48, 102.88],
    ];

    private const CURATED_KHON_KAEN_POINTS = [
        ['name' => 'Khon Kaen University', 'category' => 'University', 'coordinates' => [102.822281, 16.474635]],
        ['name' => 'Srinagarind Hospital', 'category' => 'Hospital', 'coordinates' => [102.82901, 16.46945]],
        ['name' => 'Central Khon Kaen', 'category' => 'Shopping Mall', 'coordinates' => [102.83185, 16.43219]],
        ['name' => 'Bueng Kaen Nakhon', 'category' => 'Park', 'coordinates' => [102.83775, 16.41845]],
        ['name' => 'Wat Nong Wang', 'category' => 'Temple', 'coordinates' => [102.83574, 16.41356]],
        ['name' => 'Khon Kaen Airport', 'category' => 'Transport Hub', 'coordinates' => [102.78511, 16.46663]],
        ['name' => 'Khon Kaen Railway Station', 'category' => 'Transport Hub', 'coordinates' => [102.82904, 16.42783]],
        ['name' => 'Ton Tann Market', 'category' => 'Market', 'coordinates' => [102.82402, 16.41784]],
        ['name' => 'North Eastern University', 'category' => 'University', 'coordinates' => [102.81355, 16.40689]],
        ['name' => 'Dino Water Park', 'category' => 'Tourist Attraction', 'coordinates' => [102.80734, 16.40344]],
        ['name' => 'Khon Kaen City Hall', 'category' => 'Government Office', 'coordinates' => [102.83523, 16.44192]],
        ['name' => 'Khon Kaen Bus Terminal 3', 'category' => 'Transport Hub', 'coordinates' => [102.84672, 16.38229]],
        ['name' => 'Fairy Plaza Khon Kaen', 'category' => 'Shopping Mall', 'coordinates' => [102.83366, 16.43087]],
        ['name' => 'Hugz Mall Khon Kaen', 'category' => 'Shopping Mall', 'coordinates' => [102.83004, 16.43174]],
        ['name' => 'Kaen Nakhon School', 'category' => 'School', 'coordinates' => [102.83489, 16.42359]],
        ['name' => 'Khon Kaen Hospital', 'category' => 'Hospital', 'coordinates' => [102.83955, 16.43672]],
        ['name' => 'Ratchadanusorn Park', 'category' => 'Park', 'coordinates' => [102.83264, 16.44682]],
        ['name' => 'Wat Klang Khon Kaen', 'category' => 'Temple', 'coordinates' => [102.83586, 16.42914]],
        ['name' => 'Khon Kaen Walking Street', 'category' => 'Market', 'coordinates' => [102.83293, 16.43288]],
        ['name' => 'Pratunam Khon Kaen Market', 'category' => 'Market', 'coordinates' => [102.81461, 16.40531]],
        ['name' => 'Golden Jubilee Convention Hall', 'category' => 'Event Venue', 'coordinates' => [102.81852, 16.46765]],
        ['name' => 'Faculty of Medicine KKU', 'category' => 'University', 'coordinates' => [102.82959, 16.46892]],
        ['name' => 'Bueng Thung Sang', 'category' => 'Park', 'coordinates' => [102.84839, 16.44871]],
        ['name' => 'Khon Kaen Innovation Centre', 'category' => 'Office', 'coordinates' => [102.83388, 16.43438]],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $useLiveOverpass = filter_var(env('SEED_USE_LIVE_OVERPASS', false), FILTER_VALIDATE_BOOLEAN);

        if ($useLiveOverpass) {
            $this->command->info('Fetching real Khon Kaen city place data from OpenStreetMap...');

            $elements = $this->fetchOsmElements();
            $features = $this->buildFeatures($elements);

            if ($features->count() < self::MIN_USABLE_FEATURES) {
                $this->command->warn('OpenStreetMap import returned too few usable Khon Kaen city features. Using curated Khon Kaen fallback dataset.');

                $features = $this->curatedKhonKaenFeatures();
            }
        } else {
            $this->command->info('Using curated Khon Kaen city demo dataset.');
            $features = $this->curatedKhonKaenFeatures();
        }

        $selectedFeatures = $this->selectDemoFeatures($features);

        Place::query()->delete();

        $selectedFeatures
            ->chunk(250)
            ->each(function (Collection $chunk): void {
                Place::query()->insert($chunk->all());
            });

        $this->command->info($selectedFeatures->count().' Khon Kaen city features imported successfully.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchOsmElements(): array
    {
        $queries = [
            $this->overpassQuery(
                $this->bboxStatements('node', [
                    '["amenity"~"^(school|university|hospital|clinic|place_of_worship|marketplace)$"]',
                    '["tourism"~"^(attraction|museum|hotel)$"]',
                    '["leisure"~"^(park|sports_centre)$"]',
                    '["shop"~"^(mall|supermarket|convenience)$"]',
                ]),
                80,
            ),
        ];

        return collect($queries)
            ->flatMap(fn (string $query): array => $this->fetchOverpassQuery($query))
            ->unique(fn (array $element): string => ($element['type'] ?? 'unknown').':'.($element['id'] ?? uniqid()))
            ->values()
            ->all();
    }

    private function overpassQuery(string $statements, int $limit): string
    {
        return <<<OVERPASS
[out:json][timeout:60];
(
{$statements}
);
out body geom {$limit};
OVERPASS;
    }

    /**
     * @param  array<int, string>  $filters
     */
    private function bboxStatements(string $elementType, array $filters): string
    {
        $statements = [];

        foreach ($filters as $filter) {
            foreach (self::SEED_BBOXES as $bbox) {
                [$south, $west, $north, $east] = $bbox;
                $statements[] = "{$elementType}{$filter}({$south},{$west},{$north},{$east});";
            }
        }

        return implode("\n", $statements);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchOverpassQuery(string $query): array
    {
        foreach (self::OVERPASS_ENDPOINTS as $endpoint) {
            try {
                $response = Http::timeout(75)
                    ->withHeaders([
                        'User-Agent' => 'MiniSpatialDataPlatform/1.0 (software-engineer-quiz)',
                    ])
                    ->asForm()
                    ->post($endpoint, [
                        'data' => $query,
                    ]);
            } catch (ConnectionException $exception) {
                $this->command->warn("Overpass endpoint timed out ({$endpoint}).");

                continue;
            }

            if ($response->successful()) {
                return $response->json('elements', []);
            }

            $this->command->warn("Overpass endpoint failed ({$endpoint}) with status {$response->status()}.");
        }

        return [];
    }

    /**
     * @param  array<int, array<string, mixed>>  $elements
     * @return Collection<int, array<string, mixed>>
     */
    private function buildFeatures(array $elements): Collection
    {
        $features = collect($elements)
            ->map(fn (array $element): ?array => $this->featureFromElement($element))
            ->filter()
            ->values();

        return $features
            ->merge($this->lineStringCollections($features))
            ->merge($this->polygonCollections($features))
            ->merge($this->multiPointCollections($features))
            ->merge($this->multiLineStringCollections($features))
            ->merge($this->multiPolygonCollections($features))
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $features
     * @return Collection<int, array<string, mixed>>
     */
    private function selectDemoFeatures(Collection $features): Collection
    {
        $geometryTypes = [
            'Point',
            'MultiPoint',
            'LineString',
            'MultiLineString',
            'Polygon',
            'MultiPolygon',
        ];

        $grouped = $features->groupBy(fn (array $feature): string => $this->decodedGeometry($feature)['type']);
        $selected = collect();
        $perType = intdiv(self::TARGET_FEATURES, count($geometryTypes));
        $remainingSlots = self::TARGET_FEATURES % count($geometryTypes);

        foreach ($geometryTypes as $index => $geometryType) {
            $limit = $perType + ($index < $remainingSlots ? 1 : 0);

            $selected = $selected->merge(
                $grouped->get($geometryType, collect())->take($limit)
            );
        }

        if ($selected->count() < self::TARGET_FEATURES) {
            $selectedKeys = $selected->map(fn (array $feature): string => $feature['name'].'|'.$feature['geometry']);

            $selected = $selected->merge(
                $features
                    ->reject(fn (array $feature): bool => $selectedKeys->contains($feature['name'].'|'.$feature['geometry']))
                    ->take(self::TARGET_FEATURES - $selected->count())
            );
        }

        return $selected->take(self::TARGET_FEATURES)->values();
    }

    /**
     * @param  array<string, mixed>  $element
     * @return array<string, mixed>|null
     */
    private function featureFromElement(array $element): ?array
    {
        $tags = $element['tags'] ?? [];
        $geometry = $this->geometryFromElement($element);

        if ($geometry === null) {
            return null;
        }

        $name = $tags['name:en']
            ?? $tags['name']
            ?? $tags['official_name:en']
            ?? $tags['official_name']
            ?? $this->fallbackName($element, $tags);

        return $this->row($name, $geometry, $element, $tags, $this->categoryFromTags($tags));
    }

    /**
     * @param  array<string, mixed>  $element
     * @return array<string, mixed>|null
     */
    private function geometryFromElement(array $element): ?array
    {
        return match ($element['type'] ?? null) {
            'node' => $this->pointGeometry($element),
            'way' => $this->wayGeometry($element),
            'relation' => $this->relationGeometry($element),
            default => null,
        };
    }

    /**
     * @param  array<string, mixed>  $element
     * @return array<string, mixed>|null
     */
    private function pointGeometry(array $element): ?array
    {
        if (! isset($element['lon'], $element['lat'])) {
            return null;
        }

        return [
            'type' => 'Point',
            'coordinates' => [
                round((float) $element['lon'], 6),
                round((float) $element['lat'], 6),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $element
     * @return array<string, mixed>|null
     */
    private function wayGeometry(array $element): ?array
    {
        $coordinates = $this->coordinatesFromGeometry($element['geometry'] ?? []);

        if (count($coordinates) < 2) {
            return null;
        }

        if ($this->isClosedRing($coordinates) && $this->isAreaElement($element['tags'] ?? [])) {
            return [
                'type' => 'Polygon',
                'coordinates' => [
                    $coordinates,
                ],
            ];
        }

        return [
            'type' => 'LineString',
            'coordinates' => $coordinates,
        ];
    }

    /**
     * @param  array<string, mixed>  $element
     * @return array<string, mixed>|null
     */
    private function relationGeometry(array $element): ?array
    {
        $members = collect($element['members'] ?? [])
            ->filter(fn (array $member): bool => ($member['type'] ?? null) === 'way')
            ->map(fn (array $member): array => $this->coordinatesFromGeometry($member['geometry'] ?? []))
            ->filter(fn (array $coordinates): bool => count($coordinates) >= 2)
            ->values();

        if ($members->isEmpty()) {
            return null;
        }

        $tags = $element['tags'] ?? [];

        if (($tags['type'] ?? null) === 'multipolygon') {
            $polygons = $members
                ->filter(fn (array $coordinates): bool => $this->isClosedRing($coordinates))
                ->map(fn (array $coordinates): array => [$coordinates])
                ->values()
                ->all();

            if ($polygons !== []) {
                return [
                    'type' => 'MultiPolygon',
                    'coordinates' => $polygons,
                ];
            }
        }

        return [
            'type' => 'MultiLineString',
            'coordinates' => $members->all(),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $geometry
     * @return array<int, array<int, float>>
     */
    private function coordinatesFromGeometry(array $geometry): array
    {
        return collect($geometry)
            ->filter(fn (array $point): bool => isset($point['lon'], $point['lat']))
            ->map(fn (array $point): array => [
                round((float) $point['lon'], 6),
                round((float) $point['lat'], 6),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<int, float>>  $coordinates
     */
    private function isClosedRing(array $coordinates): bool
    {
        if (count($coordinates) < 4) {
            return false;
        }

        $first = $coordinates[0];
        $last = $coordinates[count($coordinates) - 1];

        return $first[0] === $last[0] && $first[1] === $last[1];
    }

    /**
     * @param  array<string, mixed>  $tags
     */
    private function isAreaElement(array $tags): bool
    {
        return isset($tags['amenity'])
            || isset($tags['tourism'])
            || isset($tags['leisure'])
            || isset($tags['shop'])
            || isset($tags['natural'])
            || isset($tags['landuse'])
            || ($tags['area'] ?? null) === 'yes';
    }

    /**
     * @param  array<string, mixed>  $tags
     */
    private function categoryFromTags(array $tags): string
    {
        return $tags['amenity']
            ?? $tags['tourism']
            ?? $tags['leisure']
            ?? $tags['shop']
            ?? $tags['natural']
            ?? $tags['landuse']
            ?? $tags['route']
            ?? $tags['boundary']
            ?? 'OpenStreetMap Feature';
    }

    /**
     * @param  array<string, mixed>  $element
     * @param  array<string, mixed>  $tags
     */
    private function fallbackName(array $element, array $tags): string
    {
        $category = $this->categoryFromTags($tags);
        $type = $element['type'] ?? 'osm';
        $id = $element['id'] ?? 'unknown';

        return str($category)->headline()." {$type}/{$id}";
    }

    /**
     * @param  array<string, mixed>  $element
     * @param  array<string, mixed>  $tags
     * @return array<string, mixed>
     */
    private function row(string $name, array $geometry, array $element, array $tags, string $category): array
    {
        return [
            'name' => $name,
            'geometry' => json_encode($geometry),
            'properties' => json_encode([
                'name' => $name,
                'category' => str($category)->headline()->toString(),
                'province' => 'Khon Kaen',
                'district' => 'Mueang Khon Kaen',
                'seed_area' => 'Khon Kaen City',
                'source' => 'OpenStreetMap',
                'source_license' => 'ODbL',
                'attribution' => '© OpenStreetMap contributors',
                'osm_id' => $element['id'] ?? null,
                'osm_type' => $element['type'] ?? null,
                'osm_tags' => $tags,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $features
     * @return Collection<int, array<string, mixed>>
     */
    private function lineStringCollections(Collection $features): Collection
    {
        return $features
            ->filter(fn (array $feature): bool => $this->decodedGeometry($feature)['type'] === 'Point')
            ->chunk(3)
            ->take(40)
            ->filter(fn (Collection $chunk): bool => $chunk->count() >= 2)
            ->map(function (Collection $chunk, int $index): array {
                $coordinates = $chunk
                    ->map(fn (array $feature): array => $this->decodedGeometry($feature)['coordinates'])
                    ->values()
                    ->all();

                return $this->collectionRow('Khon Kaen POI Route '.($index + 1), [
                    'type' => 'LineString',
                    'coordinates' => $coordinates,
                ], 'POI Route');
            })
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $features
     * @return Collection<int, array<string, mixed>>
     */
    private function polygonCollections(Collection $features): Collection
    {
        return $features
            ->filter(fn (array $feature): bool => $this->decodedGeometry($feature)['type'] === 'Point')
            ->take(40)
            ->map(function (array $feature, int $index): array {
                return $this->collectionRow('Khon Kaen POI Area '.($index + 1), [
                    'type' => 'Polygon',
                    'coordinates' => [
                        $this->rectangleRing($this->decodedGeometry($feature)['coordinates']),
                    ],
                ], 'POI Area');
            })
            ->values();
    }

    /**
     * @param  array<int, float>  $point
     * @return array<int, array<int, float>>
     */
    private function rectangleRing(array $point): array
    {
        [$longitude, $latitude] = $point;
        $width = 0.002;
        $height = 0.0015;

        return [
            [round($longitude - $width, 6), round($latitude - $height, 6)],
            [round($longitude + $width, 6), round($latitude - $height, 6)],
            [round($longitude + $width, 6), round($latitude + $height, 6)],
            [round($longitude - $width, 6), round($latitude + $height, 6)],
            [round($longitude - $width, 6), round($latitude - $height, 6)],
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $features
     * @return Collection<int, array<string, mixed>>
     */
    private function multiPointCollections(Collection $features): Collection
    {
        return $features
            ->filter(fn (array $feature): bool => $this->decodedGeometry($feature)['type'] === 'Point')
            ->groupBy(fn (array $feature): string => $this->decodedProperties($feature)['category'])
            ->flatMap(function (Collection $group, string $category): array {
                return $group
                    ->chunk(4)
                    ->take(8)
                    ->filter(fn (Collection $chunk): bool => $chunk->count() >= 2)
                    ->map(function (Collection $chunk, int $index) use ($category): array {
                        $coordinates = $chunk
                            ->map(fn (array $feature): array => $this->decodedGeometry($feature)['coordinates'])
                            ->values()
                            ->all();

                        return $this->collectionRow("{$category} Cluster ".($index + 1), [
                            'type' => 'MultiPoint',
                            'coordinates' => $coordinates,
                        ], $category);
                    })
                    ->all();
            })
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function curatedKhonKaenFeatures(): Collection
    {
        $points = collect(self::CURATED_KHON_KAEN_POINTS)
            ->map(fn (array $place): array => $this->curatedPointRow($place))
            ->values();

        return $points
            ->merge($this->lineStringCollections($points))
            ->merge($this->polygonCollections($points))
            ->merge($this->multiPointCollections($points))
            ->merge($this->multiLineStringCollections($this->lineStringCollections($points)))
            ->merge($this->multiPolygonCollections($this->polygonCollections($points)))
            ->values();
    }

    /**
     * @param  array{name: string, category: string, coordinates: array<int, float>}  $place
     * @return array<string, mixed>
     */
    private function curatedPointRow(array $place): array
    {
        $name = $place['name'];

        return [
            'name' => $name,
            'geometry' => json_encode([
                'type' => 'Point',
                'coordinates' => $place['coordinates'],
            ]),
            'properties' => json_encode([
                'name' => $name,
                'category' => $place['category'],
                'province' => 'Khon Kaen',
                'district' => 'Mueang Khon Kaen',
                'seed_area' => 'Khon Kaen City',
                'source' => 'Curated Khon Kaen Demo Dataset',
                'source_note' => 'Fallback dataset used when public Overpass API endpoints are unavailable.',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $features
     * @return Collection<int, array<string, mixed>>
     */
    private function multiLineStringCollections(Collection $features): Collection
    {
        return $features
            ->filter(fn (array $feature): bool => $this->decodedGeometry($feature)['type'] === 'LineString')
            ->chunk(3)
            ->take(40)
            ->filter(fn (Collection $chunk): bool => $chunk->count() >= 2)
            ->map(function (Collection $chunk, int $index): array {
                $coordinates = $chunk
                    ->map(fn (array $feature): array => $this->decodedGeometry($feature)['coordinates'])
                    ->values()
                    ->all();

                return $this->collectionRow('OSM Road Collection '.($index + 1), [
                    'type' => 'MultiLineString',
                    'coordinates' => $coordinates,
                ], 'Road Collection');
            })
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $features
     * @return Collection<int, array<string, mixed>>
     */
    private function multiPolygonCollections(Collection $features): Collection
    {
        return $features
            ->filter(fn (array $feature): bool => $this->decodedGeometry($feature)['type'] === 'Polygon')
            ->chunk(2)
            ->take(40)
            ->filter(fn (Collection $chunk): bool => $chunk->count() >= 2)
            ->map(function (Collection $chunk, int $index): array {
                $coordinates = $chunk
                    ->map(fn (array $feature): array => $this->decodedGeometry($feature)['coordinates'])
                    ->values()
                    ->all();

                return $this->collectionRow('OSM Area Collection '.($index + 1), [
                    'type' => 'MultiPolygon',
                    'coordinates' => $coordinates,
                ], 'Area Collection');
            })
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function collectionRow(string $name, array $geometry, string $category): array
    {
        return [
            'name' => $name,
            'geometry' => json_encode($geometry),
            'properties' => json_encode([
                'name' => $name,
                'category' => $category,
                'province' => 'Khon Kaen',
                'district' => 'Mueang Khon Kaen',
                'seed_area' => 'Khon Kaen City',
                'source' => 'OpenStreetMap Derived Collection',
                'source_license' => 'ODbL',
                'attribution' => '© OpenStreetMap contributors',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * @param  array<string, mixed>  $feature
     * @return array<string, mixed>
     */
    private function decodedGeometry(array $feature): array
    {
        return json_decode($feature['geometry'], true);
    }

    /**
     * @param  array<string, mixed>  $feature
     * @return array<string, mixed>
     */
    private function decodedProperties(array $feature): array
    {
        return json_decode($feature['properties'], true);
    }
}
