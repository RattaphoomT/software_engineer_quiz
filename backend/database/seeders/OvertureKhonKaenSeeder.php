<?php

namespace Database\Seeders;

use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use RuntimeException;

class OvertureKhonKaenSeeder extends Seeder
{
    private const IMPORT_PATHS = [
        'app/imports/overture_khon_kaen.geojson',
        'app/imports/overture_khon_kaen_places.geojson',
        'app/imports/overture_khon_kaen_boundaries.geojson',
        'app/imports/overture_khon_kaen_areas.geojson',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paths = collect(self::IMPORT_PATHS)
            ->map(fn (string $path): string => storage_path($path))
            ->filter(fn (string $path): bool => file_exists($path))
            ->values();

        if ($paths->isEmpty()) {
            throw new RuntimeException('Overture GeoJSON files not found. Run: bash database/duckdb/export_overture_khon_kaen.sh');
        }

        $features = $paths
            ->flatMap(fn (string $path): Collection => $this->featuresFromPath($path))
            ->values();

        if ($features->isEmpty()) {
            throw new RuntimeException('Overture GeoJSON files are empty or invalid.');
        }

        $rows = $features
            ->map(fn (array $feature): ?array => $this->rowFromFeature($feature))
            ->filter()
            ->values();

        $rows = $rows
            ->merge($this->multiPointRows($rows))
            ->merge($this->multiLineStringRows($rows))
            ->merge($this->multiPolygonRows($rows))
            ->values();

        Place::query()->delete();

        $rows
            ->chunk(50)
            ->each(fn (Collection $chunk): bool => Place::query()->insert($chunk->all()));

        $this->command->info($rows->count().' Overture Khon Kaen features imported successfully from '.$paths->count().' GeoJSON file(s).');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function featuresFromPath(string $path): Collection
    {
        $content = file_get_contents($path);
        $geojson = json_decode($content ?: '', true);

        return collect($geojson['features'] ?? []);
    }

    /**
     * @param  array<string, mixed>  $feature
     * @return array<string, mixed>|null
     */
    private function rowFromFeature(array $feature): ?array
    {
        $geometry = $feature['geometry'] ?? null;

        if (! is_array($geometry)) {
            return null;
        }

        $properties = $feature['properties'] ?? [];
        $name = $properties['name'] ?? 'Overture Feature';
        $category = $properties['category'] ?? $properties['source_type'] ?? 'Overture Feature';

        return $this->row($name, $geometry, [
            ...$properties,
            'name' => $name,
            'category' => str((string) $category)->headline()->toString(),
            'province' => 'Khon Kaen',
            'district' => 'Mueang Khon Kaen',
            'seed_area' => 'Khon Kaen City',
            'source' => 'Overture Maps',
            'source_license' => 'CDLA Permissive 2.0',
        ]);
    }

    /**
     * @param  array<string, mixed>  $properties
     * @return array<string, mixed>
     */
    private function row(string $name, array $geometry, array $properties): array
    {
        return [
            'name' => $name,
            'geometry' => json_encode($geometry),
            'properties' => json_encode($properties),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return Collection<int, array<string, mixed>>
     */
    private function multiPointRows(Collection $rows): Collection
    {
        return $rows
            ->filter(fn (array $row): bool => $this->geometry($row)['type'] === 'Point')
            ->chunk(4)
            ->take(8)
            ->filter(fn (Collection $chunk): bool => $chunk->count() >= 2)
            ->map(function (Collection $chunk, int $index): array {
                return $this->row('Overture Khon Kaen Place Cluster '.($index + 1), [
                    'type' => 'MultiPoint',
                    'coordinates' => $chunk
                        ->map(fn (array $row): array => $this->geometry($row)['coordinates'])
                        ->values()
                        ->all(),
                ], $this->collectionProperties('Place Cluster'));
            })
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return Collection<int, array<string, mixed>>
     */
    private function multiLineStringRows(Collection $rows): Collection
    {
        return $rows
            ->filter(fn (array $row): bool => $this->geometry($row)['type'] === 'LineString')
            ->chunk(3)
            ->take(8)
            ->filter(fn (Collection $chunk): bool => $chunk->count() >= 2)
            ->map(function (Collection $chunk, int $index): array {
                return $this->row('Overture Khon Kaen Boundary Collection '.($index + 1), [
                    'type' => 'MultiLineString',
                    'coordinates' => $chunk
                        ->map(fn (array $row): array => $this->geometry($row)['coordinates'])
                        ->values()
                        ->all(),
                ], $this->collectionProperties('Boundary Collection'));
            })
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     * @return Collection<int, array<string, mixed>>
     */
    private function multiPolygonRows(Collection $rows): Collection
    {
        return $rows
            ->filter(fn (array $row): bool => $this->geometry($row)['type'] === 'Polygon')
            ->chunk(2)
            ->take(8)
            ->filter(fn (Collection $chunk): bool => $chunk->count() >= 2)
            ->map(function (Collection $chunk, int $index): array {
                return $this->row('Overture Khon Kaen Area Collection '.($index + 1), [
                    'type' => 'MultiPolygon',
                    'coordinates' => $chunk
                        ->map(fn (array $row): array => $this->geometry($row)['coordinates'])
                        ->values()
                        ->all(),
                ], $this->collectionProperties('Area Collection'));
            })
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function collectionProperties(string $category): array
    {
        return [
            'name' => "Overture Khon Kaen {$category}",
            'category' => $category,
            'province' => 'Khon Kaen',
            'district' => 'Mueang Khon Kaen',
            'seed_area' => 'Khon Kaen City',
            'source' => 'Overture Maps Derived Collection',
            'source_license' => 'CDLA Permissive 2.0',
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function geometry(array $row): array
    {
        return json_decode($row['geometry'], true);
    }
}
