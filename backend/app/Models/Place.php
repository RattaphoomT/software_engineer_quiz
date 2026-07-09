<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Place extends Model
{
    protected $fillable = [
        'name',
        'geometry',
        'properties',
    ];

    protected $casts = [
        'geometry' => 'array',
        'properties' => 'array',
    ];
}
