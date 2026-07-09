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
        //bunus
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        //bunus
        if ($request->filled('geometry_type')) {
            $query->where('geometry->type', $request->geometry_type);
        }

        $places = $query
            ->latest()
            ->get();

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => PlaceResource::collection($places),
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