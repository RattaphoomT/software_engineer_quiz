<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Validator;

trait ValidatesGeoJsonGeometry
{
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $geometry = $this->input('geometry');

            if (! is_array($geometry)) {
                return;
            }

            $type = $geometry['type'] ?? null;
            $coordinates = $geometry['coordinates'] ?? null;

            if (! is_string($type) || ! is_array($coordinates)) {
                return;
            }

            if (! $this->hasValidCoordinates($type, $coordinates)) {
                $validator->errors()->add(
                    'geometry.coordinates',
                    'Coordinates must match the selected GeoJSON geometry type and use valid longitude/latitude values.'
                );
            }
        });
    }

    private function hasValidCoordinates(string $type, array $coordinates): bool
    {
        return match ($type) {
            'Point' => $this->isPosition($coordinates),
            'MultiPoint' => $this->isPositionList($coordinates, 1),
            'LineString' => $this->isPositionList($coordinates, 2),
            'MultiLineString' => $this->isNestedPositionList($coordinates, 2),
            'Polygon' => $this->isPolygon($coordinates),
            'MultiPolygon' => $this->isMultiPolygon($coordinates),
            default => false,
        };
    }

    private function isPosition(mixed $position): bool
    {
        if (! is_array($position) || count($position) < 2) {
            return false;
        }

        [$longitude, $latitude] = array_values($position);

        if (! is_numeric($longitude) || ! is_numeric($latitude)) {
            return false;
        }

        $longitude = (float) $longitude;
        $latitude = (float) $latitude;

        return $longitude >= -180
            && $longitude <= 180
            && $latitude >= -90
            && $latitude <= 90;
    }

    private function isPositionList(mixed $positions, int $minimum): bool
    {
        return is_array($positions)
            && count($positions) >= $minimum
            && collect($positions)->every(fn (mixed $position): bool => $this->isPosition($position));
    }

    private function isNestedPositionList(mixed $lines, int $minimumPositions): bool
    {
        return is_array($lines)
            && count($lines) > 0
            && collect($lines)->every(fn (mixed $line): bool => $this->isPositionList($line, $minimumPositions));
    }

    private function isPolygon(mixed $rings): bool
    {
        return is_array($rings)
            && count($rings) > 0
            && collect($rings)->every(fn (mixed $ring): bool => $this->isClosedRing($ring));
    }

    private function isMultiPolygon(mixed $polygons): bool
    {
        return is_array($polygons)
            && count($polygons) > 0
            && collect($polygons)->every(fn (mixed $polygon): bool => $this->isPolygon($polygon));
    }

    private function isClosedRing(mixed $ring): bool
    {
        if (! $this->isPositionList($ring, 4)) {
            return false;
        }

        $first = array_values($ring[0]);
        $last = array_values($ring[count($ring) - 1]);

        return (float) $first[0] === (float) $last[0]
            && (float) $first[1] === (float) $last[1];
    }
}
