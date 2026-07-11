<?php

namespace Database\Seeders;

use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use RuntimeException;

class OverpassKhonKaenGeoJsonSeeder extends Seeder
{
    public const IMPORT_PATHS = [
        'app/imports/khon-kaen/point.geojson',
        'app/imports/khon-kaen/multipoint.geojson',
        'app/imports/khon-kaen/linestring.geojson',
        'app/imports/khon-kaen/multilinestring.geojson',
        'app/imports/khon-kaen/polygon.geojson',
        'app/imports/khon-kaen/multipolygon.geojson',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paths = collect(self::IMPORT_PATHS)
            ->map(fn (string $path): string => storage_path($path))
            ->filter(fn (string $path): bool => file_exists($path))
            ->values();

        if ($paths->isEmpty()) {
            throw new RuntimeException('Khon Kaen GeoJSON files not found. Run: bash database/overpass/export_khon_kaen_geojson.sh');
        }

        $rows = $paths
            ->flatMap(fn (string $path): Collection => $this->featuresFromPath($path))
            ->map(fn (array $feature): ?array => $this->rowFromFeature($feature))
            ->filter()
            ->values();

        if ($rows->isEmpty()) {
            throw new RuntimeException('Khon Kaen GeoJSON files are empty or invalid.');
        }

        Place::query()->delete();

        $rows
            ->chunk(50)
            ->each(fn (Collection $chunk): bool => Place::query()->insert($chunk->all()));

        $this->command->info($rows->count().' Khon Kaen GeoJSON features imported successfully from '.$paths->count().' file(s).');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function featuresFromPath(string $path): Collection
    {
        $content = file_get_contents($path);
        $geojson = json_decode($content ?: '', true);

        return collect($geojson['features'] ?? []);
    }

    /**
     * @param  array<string, mixed>  $feature
     * @return array<string, mixed>|null
     */
    private function rowFromFeature(array $feature): ?array
    {
        $geometry = $feature['geometry'] ?? null;

        if (! is_array($geometry) || ! isset($geometry['type'], $geometry['coordinates'])) {
            return null;
        }

        $properties = $feature['properties'] ?? [];
        $name = $this->nameFromProperties($properties, $geometry['type']);
        $category = $this->categoryFromProperties($properties, $geometry['type']);

        return [
            'name' => $name,
            'geometry' => json_encode($geometry),
            'properties' => json_encode([
                ...$properties,
                'name' => $name,
                'category' => $category,
                'province' => $properties['province'] ?? 'ขอนแก่น',
                'district' => $properties['district'] ?? 'อำเภอเมืองขอนแก่น',
                'seed_area' => $properties['seed_area'] ?? 'เมืองขอนแก่น',
                'source' => $properties['source'] ?? 'OpenStreetMap',
                'source_license' => $properties['source_license'] ?? 'ODbL',
                'attribution' => $properties['attribution'] ?? 'ผู้ร่วมให้ข้อมูล OpenStreetMap',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    private function nameFromProperties(array $properties, string $geometryType): string
    {
        $osmLabel = isset($properties['@id'])
            ? 'รหัส OSM '.str_replace('/', ' ', (string) $properties['@id'])
            : $geometryType;

        return $properties['name:th']
            ?? $properties['name']
            ?? $properties['official_name:th']
            ?? $properties['official_name']
            ?? $properties['name:en']
            ?? $properties['official_name:en']
            ?? $this->categoryFromProperties($properties, $geometryType).' '.$osmLabel;
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    private function categoryFromProperties(array $properties, string $geometryType): string
    {
        $category = $properties['category']
            ?? $properties['amenity']
            ?? $properties['tourism']
            ?? $properties['shop']
            ?? $properties['leisure']
            ?? $properties['highway']
            ?? $properties['waterway']
            ?? $properties['route']
            ?? $properties['landuse']
            ?? $properties['natural']
            ?? $properties['boundary']
            ?? $geometryType;

        return $this->thaiCategory((string) $category);
    }

    private function thaiCategory(string $category): string
    {
        $normalized = str($category)->lower()->replace([' ', '-'], '_')->toString();

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
            'drinking_water' => 'จุดน้ำดื่ม',
            'fountain' => 'น้ำพุ',
            'shelter' => 'ศาลาพัก',
            'bicycle_parking' => 'ที่จอดจักรยาน',
            'motorcycle_parking' => 'ที่จอดรถจักรยานยนต์',
            'charging_station' => 'สถานีชาร์จรถไฟฟ้า',
            'grave_yard' => 'สุสาน',
            'monastery' => 'วัด',
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
            'primary' => 'ถนนสายหลัก',
            'secondary' => 'ถนนสายรอง',
            'tertiary' => 'ถนนสายย่อย',
            'residential' => 'ถนนในชุมชน',
            'service' => 'ถนนบริการ',
            'river' => 'แม่น้ำ',
            'stream' => 'ลำธาร',
            'canal' => 'คลอง',
            'bus' => 'เส้นทางรถโดยสาร',
            'train' => 'เส้นทางรถไฟ',
            'railway' => 'ทางรถไฟ',
            'commercial' => 'พื้นที่พาณิชยกรรม',
            'reservoir' => 'อ่างเก็บน้ำ',
            'basin' => 'พื้นที่รับน้ำ',
            'water' => 'แหล่งน้ำ',
            'administrative' => 'เขตปกครอง',
            'point' => 'จุดสถานที่',
            'multipoint' => 'กลุ่มจุดสถานที่',
            'linestring' => 'เส้นทาง',
            'multilinestring' => 'กลุ่มเส้นทาง',
            'polygon' => 'พื้นที่',
            'multipolygon' => 'กลุ่มพื้นที่',
        ][$normalized] ?? str($category)->headline()->toString();
    }
}
