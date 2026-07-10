<?php

namespace Database\Seeders;

use App\Models\Place;
use Illuminate\Database\Seeder;

class SampleThaiPlaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Place::query()->delete();

        $places = [
            [
                'name' => 'Khon Kaen University',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [102.822281, 16.474635],
                ],
                'properties' => [
                    'province' => 'Khon Kaen',
                    'district' => 'Mueang Khon Kaen',
                    'category' => 'University',
                    'description' => 'A major university in Khon Kaen province.',
                    'source' => 'Demo Dataset',
                ],
            ],
            [
                'name' => 'Khon Kaen City Important Places',
                'geometry' => [
                    'type' => 'MultiPoint',
                    'coordinates' => [
                        [102.835250, 16.432193],
                        [102.838890, 16.418450],
                        [102.823610, 16.441935],
                    ],
                ],
                'properties' => [
                    'province' => 'Khon Kaen',
                    'district' => 'Mueang Khon Kaen',
                    'category' => 'Landmark Group',
                    'description' => 'Multiple important places around Khon Kaen city.',
                    'source' => 'Demo Dataset',
                ],
            ],
            [
                'name' => 'Khon Kaen Sample Route',
                'geometry' => [
                    'type' => 'LineString',
                    'coordinates' => [
                        [102.822281, 16.474635],
                        [102.830000, 16.460000],
                        [102.835250, 16.432193],
                    ],
                ],
                'properties' => [
                    'province' => 'Khon Kaen',
                    'district' => 'Mueang Khon Kaen',
                    'category' => 'Route',
                    'description' => 'A sample route from Khon Kaen University toward the city center.',
                    'source' => 'Demo Dataset',
                ],
            ],
            [
                'name' => 'Khon Kaen Multiple Sample Routes',
                'geometry' => [
                    'type' => 'MultiLineString',
                    'coordinates' => [
                        [
                            [102.822281, 16.474635],
                            [102.830000, 16.460000],
                            [102.835250, 16.432193],
                        ],
                        [
                            [102.838890, 16.418450],
                            [102.845000, 16.425000],
                            [102.850000, 16.435000],
                        ],
                    ],
                ],
                'properties' => [
                    'province' => 'Khon Kaen',
                    'district' => 'Mueang Khon Kaen',
                    'category' => 'Multiple Routes',
                    'description' => 'Multiple sample routes around Khon Kaen city.',
                    'source' => 'Demo Dataset',
                ],
            ],
            [
                'name' => 'Bueng Kaen Nakhon Sample Area',
                'geometry' => [
                    'type' => 'Polygon',
                    'coordinates' => [
                        [
                            [102.835500, 16.414500],
                            [102.843000, 16.414500],
                            [102.843000, 16.421500],
                            [102.835500, 16.421500],
                            [102.835500, 16.414500],
                        ],
                    ],
                ],
                'properties' => [
                    'province' => 'Khon Kaen',
                    'district' => 'Mueang Khon Kaen',
                    'category' => 'Park / Lake Area',
                    'description' => 'A sample polygon area around Bueng Kaen Nakhon.',
                    'source' => 'Demo Dataset',
                ],
            ],
            [
                'name' => 'Khon Kaen Multiple Sample Areas',
                'geometry' => [
                    'type' => 'MultiPolygon',
                    'coordinates' => [
                        [
                            [
                                [102.820000, 16.470000],
                                [102.830000, 16.470000],
                                [102.830000, 16.480000],
                                [102.820000, 16.480000],
                                [102.820000, 16.470000],
                            ],
                        ],
                        [
                            [
                                [102.840000, 16.430000],
                                [102.850000, 16.430000],
                                [102.850000, 16.440000],
                                [102.840000, 16.440000],
                                [102.840000, 16.430000],
                            ],
                        ],
                    ],
                ],
                'properties' => [
                    'province' => 'Khon Kaen',
                    'district' => 'Mueang Khon Kaen',
                    'category' => 'Multiple Areas',
                    'description' => 'Multiple sample polygon areas in Khon Kaen.',
                    'source' => 'Demo Dataset',
                ],
            ],
        ];

        foreach ($places as $place) {
            Place::create($place);
        }

        $this->command->info('Sample Thai GeoJSON dataset imported successfully.');
    }
}