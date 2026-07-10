<?php

use App\Http\Controllers\Api\PlaceController;
use Illuminate\Support\Facades\Route;

Route::get('places/categories', [PlaceController::class, 'categories']);

Route::apiResource('places', PlaceController::class);