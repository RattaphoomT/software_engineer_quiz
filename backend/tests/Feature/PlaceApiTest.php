<?php

namespace Tests\Feature;

use App\Models\Place;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlaceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_places_index_returns_geojson_feature_collection_with_pagination(): void
    {
        Place::create([
            'name' => 'Khon Kaen University',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [102.822281, 16.474635],
            ],
            'properties' => [
                'province' => 'Khon Kaen',
                'category' => 'University',
            ],
        ]);

        $response = $this->getJson('/api/places?per_page=5');

        $response
            ->assertOk()
            ->assertJsonPath('type', 'FeatureCollection')
            ->assertJsonPath('features.0.type', 'Feature')
            ->assertJsonPath('features.0.properties.name', 'Khon Kaen University')
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_places_index_can_return_all_filtered_features_for_map_display(): void
    {
        foreach (range(1, 12) as $index) {
            Place::create([
                'name' => "Map Place {$index}",
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [100 + ($index / 100), 13 + ($index / 100)],
                ],
                'properties' => [
                    'province' => 'Bangkok',
                    'category' => 'Map',
                ],
            ]);
        }

        $this->getJson('/api/places?category=Map&page=1&per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'features')
            ->assertJsonPath('meta.total', 12);

        $this->getJson('/api/places?category=Map&all=true')
            ->assertOk()
            ->assertJsonCount(12, 'features')
            ->assertJsonPath('meta.total', 12);
    }

    public function test_place_can_be_created_shown_updated_and_deleted(): void
    {
        $createResponse = $this->postJson('/api/places', [
            'name' => 'Demo Place',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [100.5018, 13.7563],
            ],
            'properties' => [
                'province' => 'Bangkok',
                'category' => 'Landmark',
            ],
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('data.type', 'Feature')
            ->assertJsonPath('data.properties.name', 'Demo Place');

        $placeId = $createResponse->json('data.id');

        $this->getJson("/api/places/{$placeId}")
            ->assertOk()
            ->assertJsonPath('data.properties.category', 'Landmark');

        $this->putJson("/api/places/{$placeId}", [
            'name' => 'Updated Demo Place',
            'geometry' => [
                'type' => 'LineString',
                'coordinates' => [
                    [100.5018, 13.7563],
                    [100.5231, 13.7367],
                ],
            ],
            'properties' => [
                'province' => 'Bangkok',
                'category' => 'Route',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.geometry.type', 'LineString')
            ->assertJsonPath('data.properties.name', 'Updated Demo Place');

        $this->deleteJson("/api/places/{$placeId}")
            ->assertOk()
            ->assertJsonPath('message', 'Place deleted successfully.');

        $this->assertDatabaseMissing('places', ['id' => $placeId]);
    }

    public function test_places_can_be_filtered_by_search_geometry_type_and_category(): void
    {
        Place::create([
            'name' => 'City Route',
            'geometry' => [
                'type' => 'LineString',
                'coordinates' => [
                    [102.82, 16.47],
                    [102.83, 16.48],
                ],
            ],
            'properties' => [
                'province' => 'Khon Kaen',
                'category' => 'Route',
            ],
        ]);

        Place::create([
            'name' => 'Museum Point',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [102.84, 16.49],
            ],
            'properties' => [
                'province' => 'Khon Kaen',
                'category' => 'Museum',
            ],
        ]);

        $this->getJson('/api/places?search=City&geometry_type=LineString&category=Route')
            ->assertOk()
            ->assertJsonCount(1, 'features')
            ->assertJsonPath('features.0.properties.name', 'City Route');

        $this->getJson('/api/places/categories')
            ->assertOk()
            ->assertJsonPath('data.0', 'Museum')
            ->assertJsonPath('data.1', 'Route');
    }

    public function test_geometry_coordinates_must_match_geojson_type_and_valid_ranges(): void
    {
        $this->postJson('/api/places', [
            'name' => 'Invalid Place',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [200, 95],
            ],
            'properties' => [
                'category' => 'Invalid',
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('geometry.coordinates');
    }
}
