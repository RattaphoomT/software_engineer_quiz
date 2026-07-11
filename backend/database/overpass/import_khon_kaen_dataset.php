<?php

declare(strict_types=1);

$sourceDir = $argv[1] ?? null;

if ($sourceDir === null || ! is_dir($sourceDir)) {
    fwrite(STDERR, "Usage: php database/overpass/import_khon_kaen_dataset.php /path/to/KhoneKean_dataset\n");
    exit(1);
}

$basePath = dirname(__DIR__, 2);
$targetDir = $basePath.'/storage/app/imports/khon-kaen';

if (! is_dir($targetDir)) {
    mkdir($targetDir, 0775, true);
}

$files = [
    'point.geojson' => ['point.geojson', 'Point.geojson'],
    'linestring.geojson' => ['LineString.geojson', 'linestring.geojson'],
    'multilinestring.geojson' => ['MultiLineString.geojson', 'multilinestring.geojson'],
    'polygon.geojson' => ['Polygon.geojson', 'polygon.geojson'],
    'multipolygon.geojson' => ['MultiPolygon.geojson', 'multipolygon.geojson'],
];

foreach ($files as $targetName => $candidates) {
    $sourcePath = firstExistingPath($sourceDir, $candidates);

    if ($sourcePath === null) {
        fwrite(STDOUT, "Skipping {$targetName}; source file not found.\n");

        continue;
    }

    copy($sourcePath, $targetDir.'/'.$targetName);
    fwrite(STDOUT, "Imported {$sourcePath} -> {$targetDir}/{$targetName}\n");
}

$pointPath = $targetDir.'/point.geojson';

if (file_exists($pointPath)) {
    $multiPointFeatures = buildMultiPointFeatures($pointPath);

    file_put_contents($targetDir.'/multipoint.geojson', json_encode([
        'type' => 'FeatureCollection',
        'features' => $multiPointFeatures,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

    fwrite(STDOUT, "Generated {$targetDir}/multipoint.geojson (".count($multiPointFeatures)." features)\n");
}

function firstExistingPath(string $sourceDir, array $candidates): ?string
{
    foreach ($candidates as $candidate) {
        $path = rtrim($sourceDir, '/').'/'.$candidate;

        if (file_exists($path)) {
            return $path;
        }
    }

    return null;
}

function buildMultiPointFeatures(string $pointPath): array
{
    $geojson = json_decode((string) file_get_contents($pointPath), true);
    $features = $geojson['features'] ?? [];
    $groups = [];

    foreach ($features as $feature) {
        if (($feature['geometry']['type'] ?? null) !== 'Point') {
            continue;
        }

        $category = categoryFromProperties($feature['properties'] ?? []);
        $groups[$category][] = $feature;
    }

    $multiPointFeatures = [];

    foreach ($groups as $category => $group) {
        foreach (array_chunk($group, 8) as $index => $chunk) {
            if (count($chunk) < 2) {
                continue;
            }

            $multiPointFeatures[] = [
                'type' => 'Feature',
                'id' => 'derived/multipoint/'.strtolower(preg_replace('/[^a-z0-9]+/i', '-', $category)).'/'.$index,
                'properties' => [
                    'name' => "กลุ่ม{$category} ".($index + 1),
                    'category' => "กลุ่ม{$category}",
                    'province' => 'ขอนแก่น',
                    'district' => 'อำเภอเมืองขอนแก่น',
                    'seed_area' => 'เมืองขอนแก่น',
                    'source' => 'OpenStreetMap Derived Collection',
                    'source_license' => 'ODbL',
                    'attribution' => 'ผู้ร่วมให้ข้อมูล OpenStreetMap',
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

    return $multiPointFeatures;
}

function categoryFromProperties(array $properties): string
{
    $category = $properties['amenity']
        ?? $properties['tourism']
        ?? $properties['shop']
        ?? $properties['leisure']
        ?? $properties['category']
        ?? 'Place';

    return thaiCategory((string) $category);
}

function thaiCategory(string $category): string
{
    $normalized = strtolower(str_replace([' ', '-'], '_', $category));

    return [
        'fuel' => 'สถานีบริการน้ำมัน',
        'police' => 'สถานีตำรวจ',
        'school' => 'โรงเรียน',
        'university' => 'มหาวิทยาลัย',
        'hospital' => 'โรงพยาบาล',
        'clinic' => 'คลินิก',
        'dentist' => 'ทันตกรรม',
        'doctors' => 'คลินิกแพทย์',
        'veterinary' => 'คลินิกสัตวแพทย์',
        'restaurant' => 'ร้านอาหาร',
        'cafe' => 'คาเฟ่',
        'fast_food' => 'ร้านอาหารจานด่วน',
        'bar' => 'บาร์',
        'pub' => 'ผับ',
        'food_court' => 'ศูนย์อาหาร',
        'bank' => 'ธนาคาร',
        'atm' => 'ตู้เอทีเอ็ม',
        'pharmacy' => 'ร้านขายยา',
        'place_of_worship' => 'ศาสนสถาน',
        'marketplace' => 'ตลาด',
        'parking' => 'ลานจอดรถ',
        'toilets' => 'ห้องน้ำ',
        'bus_station' => 'สถานีขนส่ง',
        'public_building' => 'อาคารสาธารณะ',
        'community_centre' => 'ศูนย์ชุมชน',
        'townhall' => 'ศาลากลาง',
        'courthouse' => 'ศาล',
        'fire_station' => 'สถานีดับเพลิง',
        'post_office' => 'ที่ทำการไปรษณีย์',
        'library' => 'ห้องสมุด',
        'college' => 'วิทยาลัย',
        'kindergarten' => 'โรงเรียนอนุบาล',
        'charging_station' => 'สถานีชาร์จรถไฟฟ้า',
        'attraction' => 'สถานที่ท่องเที่ยว',
        'hotel' => 'โรงแรม',
        'guest_house' => 'เกสต์เฮาส์',
        'motel' => 'โมเทล',
        'viewpoint' => 'จุดชมวิว',
        'park' => 'สวนสาธารณะ',
        'pitch' => 'สนามกีฬา',
        'sports_centre' => 'ศูนย์กีฬา',
        'playground' => 'สนามเด็กเล่น',
        'garden' => 'สวน',
    ][$normalized] ?? ucwords(str_replace('_', ' ', $category));
}
