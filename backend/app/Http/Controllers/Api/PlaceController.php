<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlaceRequest;
use App\Http\Requests\UpdatePlaceRequest;
use App\Http\Resources\PlaceResource;
use App\Models\Place;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlaceController extends Controller
{
    /**
     * Display a listing of places as GeoJSON FeatureCollection.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Place::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('geometry_type')) {
            $query->where('geometry->type', $request->geometry_type);
        }

        if ($request->filled('category')) {
            $query->where('properties->category', $request->category);
        }

        if ($request->boolean('all')) {
            $places = $query
                ->latest()
                ->get();

            return response()->json([
                'type' => 'FeatureCollection',
                'features' => PlaceResource::collection($places),
                'meta' => [
                    'total' => $places->count(),
                ],
                'links' => [
                    'first' => null,
                    'last' => null,
                    'prev' => null,
                    'next' => null,
                ],
            ]);
        }

        $perPage = (int) $request->get('per_page', 10);

        $perPage = min(max($perPage, 1), 50);

        $places = $query
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => PlaceResource::collection($places->items()),
            'meta' => [
                'current_page' => $places->currentPage(),
                'per_page' => $places->perPage(),
                'total' => $places->total(),
                'last_page' => $places->lastPage(),
                'from' => $places->firstItem(),
                'to' => $places->lastItem(),
            ],
            'links' => [
                'first' => $places->url(1),
                'last' => $places->url($places->lastPage()),
                'prev' => $places->previousPageUrl(),
                'next' => $places->nextPageUrl(),
            ],
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Place::query()
            ->get()
            ->map(fn ($place) => $place->properties['category'] ?? null)
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Store a newly created place.
     */
    public function store(StorePlaceRequest $request): JsonResponse
    {
        $place = Place::create($request->validated());

        return response()->json([
            'message' => 'Place created successfully.',
            'data' => new PlaceResource($place),
        ], 201);
    }

    /**
     * Display the specified place.
     */
    public function show(Place $place): PlaceResource
    {
        return new PlaceResource($place);
    }

    /**
     * Update the specified place.
     */
    public function update(UpdatePlaceRequest $request, Place $place): JsonResponse
    {
        $place->update($request->validated());

        return response()->json([
            'message' => 'Place updated successfully.',
            'data' => new PlaceResource($place),
        ]);
    }

    /**
     * Remove the specified place.
     */
    public function destroy(Place $place): JsonResponse
    {
        $place->delete();

        return response()->json([
            'message' => 'Place deleted successfully.',
        ]);
    }
}
