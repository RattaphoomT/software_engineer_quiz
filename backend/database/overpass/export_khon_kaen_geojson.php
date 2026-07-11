<?php

declare(strict_types=1);

$basePath = dirname(__DIR__, 2);
$queryPath = __DIR__;
$outputPath = $basePath.'/storage/app/imports/khon-kaen';

if (! is_dir($outputPath)) {
    mkdir($outputPath, 0775, true);
}

$endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter',
];

$exports = [
    'point' => 'point.overpassql',
    'linestring' => 'linestring.overpassql',
    'multilinestring' => 'multilinestring.overpassql',
    'polygon' => 'polygon.overpassql',
    'multipolygon' => 'multipolygon.overpassql',
];

$force = in_array('--force', $argv, true);
$requestedTypes = array_values(array_filter(
    array_slice($argv, 1),
    fn (string $argument): bool => ! str_starts_with($argument, '--'),
));

if ($requestedTypes !== []) {
    $exports = array_intersect_key($exports, array_flip($requestedTypes));
}

$featureSets = [];

foreach ($exports as $type => $file) {
    $targetPath = $outputPath.'/'.$type.'.geojson';

    if (! $force && file_exists($targetPath)) {
        fwrite(STDOUT, "Skipping {$type}; {$targetPath} already exists. Use --force to refresh.\n");
        $featureSets[$type] = featuresFromGeoJson($targetPath);

        continue;
    }

    $query = file_get_contents($queryPath.'/'.$file);

    if ($query === false) {
        throw new RuntimeException("Unable to read {$file}");
    }

    fwrite(STDOUT, "Fetching {$type} from Overpass...\n");
    $elements = fetchOverpassElements($query, $endpoints);
    $features = elementsToFeatures($elements, $type);
    $featureSets[$type] = $features;

    writeGeoJson($targetPath, $features);
    fwrite(STDOUT, "Wrote {$targetPath} (".count($features)." features)\n");
}

if ($requestedTypes === [] || in_array('multipoint', $requestedTypes, true) || isset($featureSets['point'])) {
    $pointFeatures = $featureSets['point'] ?? featuresFromGeoJson($outputPath.'/point.geojson');
    $multiPointFeatures = buildMultiPointFeatures($pointFeatures);
    $featureSets['multipoint'] = $multiPointFeatures;
    writeGeoJson($outputPath.'/multipoint.geojson', $multiPointFeatures);
    fwrite(STDOUT, "Wrote {$outputPath}/multipoint.geojson (".count($multiPointFeatures)." features)\n");
}

function fetchOverpassElements(string $query, array $endpoints): array
{
    foreach ($endpoints as $endpoint) {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Content-Type: application/x-www-form-urlencoded',
                    'User-Agent: MiniSpatialDataPlatform/1.0',
                ],
                'content' => http_build_query(['data' => $query]),
                'timeout' => 90,
                'ignore_errors' => true,
            ],
        ]);

        $body = @file_get_contents($endpoint, false, $context);

        if ($body === false) {
            fwrite(STDERR, "Overpass endpoint failed: {$endpoint}\n");

            continue;
        }

        $statusLine = $http_response_header[0] ?? '';

        if (! str_contains($statusLine, '200')) {
            fwrite(STDERR, "Overpass endpoint returned {$statusLine}: {$endpoint}\n");

            continue;
        }

        $json = json_decode($body, true);

        if (is_array($json)) {
            return $json['elements'] ?? [];
        }
    }

    return [];
}

function featuresFromGeoJson(string $path): array
{
    if (! file_exists($path)) {
        return [];
    }

    $geojson = json_decode((string) file_get_contents($path), true);

    return is_array($geojson) ? ($geojson['features'] ?? []) : [];
}

function elementsToFeatures(array $elements, string $targetType): array
{
    $features = [];

    foreach ($elements as $element) {
        $geometry = geometryFromElement($element, $targetType);

        if ($geometry === null) {
            continue;
        }

        $tags = $element['tags'] ?? [];
        $name = $tags['name:en']
            ?? $tags['name:th']
            ?? $tags['name']
            ?? fallbackName($element, $tags, $targetType);

        $features[] = [
            'type' => 'Feature',
            'id' => ($element['type'] ?? 'osm').'/'.($element['id'] ?? uniqid('', true)),
            'properties' => [
                'name' => $name,
                'category' => categoryFromTags($tags, $targetType),
                'province' => 'Khon Kaen',
                'district' => 'Mueang Khon Kaen',
                'seed_area' => 'Khon Kaen City',
                'source' => 'OpenStreetMap',
                'source_license' => 'ODbL',
                'attribution' => 'OpenStreetMap contributors',
                'osm_id' => $element['id'] ?? null,
                'osm_type' => $element['type'] ?? null,
                'osm_tags' => $tags,
            ],
            'geometry' => $geometry,
        ];
    }

    return $features;
}

function geometryFromElement(array $element, string $targetType): ?array
{
    return match ($targetType) {
        'point' => pointGeometry($element),
        'linestring' => lineStringGeometry($element),
        'multilinestring' => multiLineStringGeometry($element),
        'polygon' => polygonGeometry($element),
        'multipolygon' => multiPolygonGeometry($element),
        default => null,
    };
}

function pointGeometry(array $element): ?array
{
    if (($element['type'] ?? null) !== 'node' || ! isset($element['lon'], $element['lat'])) {
        return null;
    }

    return [
        'type' => 'Point',
        'coordinates' => [(float) $element['lon'], (float) $element['lat']],
    ];
}

function lineStringGeometry(array $element): ?array
{
    $coordinates = coordinatesFromGeometry($element['geometry'] ?? []);

    if (count($coordinates) < 2) {
        return null;
    }

    return [
        'type' => 'LineString',
        'coordinates' => $coordinates,
    ];
}

function multiLineStringGeometry(array $element): ?array
{
    $lines = [];

    foreach ($element['members'] ?? [] as $member) {
        $coordinates = coordinatesFromGeometry($member['geometry'] ?? []);

        if (count($coordinates) >= 2) {
            $lines[] = $coordinates;
        }
    }

    if ($lines === []) {
        $lineString = lineStringGeometry($element);

        return $lineString === null ? null : [
            'type' => 'MultiLineString',
            'coordinates' => [$lineString['coordinates']],
        ];
    }

    return [
        'type' => 'MultiLineString',
        'coordinates' => $lines,
    ];
}

function polygonGeometry(array $element): ?array
{
    $coordinates = coordinatesFromGeometry($element['geometry'] ?? []);

    if (count($coordinates) < 4) {
        return null;
    }

    return [
        'type' => 'Polygon',
        'coordinates' => [closedRing($coordinates)],
    ];
}

function multiPolygonGeometry(array $element): ?array
{
    $polygons = [];

    foreach ($element['members'] ?? [] as $member) {
        if (($member['type'] ?? null) !== 'way') {
            continue;
        }

        $coordinates = coordinatesFromGeometry($member['geometry'] ?? []);

        if (count($coordinates) >= 4) {
            $polygons[] = [closedRing($coordinates)];
        }
    }

    if ($polygons === []) {
        $polygon = polygonGeometry($element);

        return $polygon === null ? null : [
            'type' => 'MultiPolygon',
            'coordinates' => [$polygon['coordinates']],
        ];
    }

    return [
        'type' => 'MultiPolygon',
        'coordinates' => $polygons,
    ];
}

function coordinatesFromGeometry(array $geometry): array
{
    $coordinates = [];

    foreach ($geometry as $point) {
        if (isset($point['lon'], $point['lat'])) {
            $coordinates[] = [(float) $point['lon'], (float) $point['lat']];
        }
    }

    return $coordinates;
}

function closedRing(array $coordinates): array
{
    $first = $coordinates[0];
    $last = $coordinates[count($coordinates) - 1];

    if ($first[0] !== $last[0] || $first[1] !== $last[1]) {
        $coordinates[] = $first;
    }

    return $coordinates;
}

function buildMultiPointFeatures(array $pointFeatures): array
{
    $groups = [];

    foreach ($pointFeatures as $feature) {
        $category = $feature['properties']['category'] ?? 'Place Cluster';
        $groups[$category][] = $feature;
    }

    $features = [];

    foreach ($groups as $category => $group) {
        foreach (array_chunk($group, 4) as $index => $chunk) {
            if (count($chunk) < 2) {
                continue;
            }

            $features[] = [
                'type' => 'Feature',
                'id' => 'derived/multipoint/'.strtolower(preg_replace('/[^a-z0-9]+/i', '-', $category)).'/'.$index,
                'properties' => [
                    'name' => "{$category} Cluster ".($index + 1),
                    'category' => "{$category} Cluster",
                    'province' => 'Khon Kaen',
                    'district' => 'Mueang Khon Kaen',
                    'seed_area' => 'Khon Kaen City',
                    'source' => 'OpenStreetMap Derived Collection',
                    'source_license' => 'ODbL',
                    'attribution' => 'OpenStreetMap contributors',
                ],
                'geometry' => [
                    'type' => 'MultiPoint',
                    'coordinates' => array_map(
                        fn (array $feature): array => $feature['geometry']['coordinates'],
                        $chunk,
                    ),
                ],
            ];
        }
    }

    return array_slice($features, 0, 30);
}

function categoryFromTags(array $tags, string $targetType): string
{
    $category = $tags['amenity']
        ?? $tags['tourism']
        ?? $tags['highway']
        ?? $tags['waterway']
        ?? $tags['route']
        ?? $tags['leisure']
        ?? $tags['landuse']
        ?? $tags['natural']
        ?? $tags['boundary']
        ?? $targetType;

    return ucwords(str_replace('_', ' ', (string) $category));
}

function fallbackName(array $element, array $tags, string $targetType): string
{
    return categoryFromTags($tags, $targetType).' '.($element['type'] ?? 'osm').'/'.($element['id'] ?? 'unknown');
}

function writeGeoJson(string $path, array $features): void
{
    file_put_contents($path, json_encode([
        'type' => 'FeatureCollection',
        'features' => $features,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}
