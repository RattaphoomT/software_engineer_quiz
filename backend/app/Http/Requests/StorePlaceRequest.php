<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesGeoJsonGeometry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePlaceRequest extends FormRequest
{
    use ValidatesGeoJsonGeometry;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            'geometry' => ['required', 'array'],

            'geometry.type' => [
                'required',
                'string',
                'in:Point,MultiPoint,LineString,MultiLineString,Polygon,MultiPolygon',
            ],

            'geometry.coordinates' => [
                'required',
                'array',
            ],

            'properties' => [
                'nullable',
                'array',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Place name is required.',

            'geometry.required' => 'Geometry is required.',

            'geometry.type.in' => 'Geometry type must be Point, MultiPoint, LineString, MultiLineString, Polygon or MultiPolygon.',

            'geometry.coordinates.required' => 'Coordinates are required.',
        ];
    }
}
