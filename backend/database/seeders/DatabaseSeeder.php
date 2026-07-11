<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $hasOverpassGeoJsonImport = collect(OverpassKhonKaenGeoJsonSeeder::IMPORT_PATHS)
            ->contains(fn (string $path): bool => file_exists(storage_path($path)));

        if ($hasOverpassGeoJsonImport) {
            $this->call([
                OverpassKhonKaenGeoJsonSeeder::class,
            ]);

            return;
        }

        $hasOvertureImport = collect([
            'app/imports/overture_khon_kaen.geojson',
            'app/imports/overture_khon_kaen_places.geojson',
            'app/imports/overture_khon_kaen_boundaries.geojson',
            'app/imports/overture_khon_kaen_areas.geojson',
        ])->contains(fn (string $path): bool => file_exists(storage_path($path)));

        if ($hasOvertureImport) {
            $this->call([
                OvertureKhonKaenSeeder::class,
            ]);

            return;
        }

        $this->call([
            SampleThaiPlaceSeeder::class,
        ]);
    }
}
