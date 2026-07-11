# Mini Spatial Data Platform

โปรเจกต์สำหรับแบบทดสอบตำแหน่ง Software Engineer: ระบบจัดการข้อมูลสถานที่ในรูปแบบ GeoJSON Feature โดยมี Backend API และ Frontend UI อยู่ใน repository เดียวกัน

## Tech Stack

- Backend: Laravel 13, PHP 8.3+, MySQL/SQLite
- Frontend: React, Vite, TailwindCSS
- Map: MapLibre GL JS
- HTTP Client: Axios

## Features

- RESTful API สำหรับจัดการข้อมูลสถานที่
- GeoJSON Feature และ FeatureCollection response
- แสดงสถานที่ในตาราง
- แสดงข้อมูลบน Interactive Map ด้วย MapLibre
- เพิ่ม แก้ไข ลบ และดูข้อมูลสถานที่ผ่านหน้าเว็บ
- Search ตามชื่อสถานที่
- Filter ตาม geometry type และ category
- Pagination สำหรับรองรับข้อมูลจำนวนมากขึ้น
- รองรับ geometry หลายประเภท: Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
- แสดง category/collection บนแผนที่
- เลือกจังหวัดจาก searchable dropdown เพื่อลดการกรอกชื่อจังหวัดผิด
- Seeder ดึงข้อมูลสถานที่จริงเฉพาะพื้นที่เมืองขอนแก่นจาก open map data แล้ว import ลงฐานข้อมูลของแอป

## Project Structure

```text
backend/    Laravel API
frontend/   React + Vite UI
postman/    Postman collection สำหรับทดสอบ API
```

## Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

ค่าเริ่มต้นของ backend คือ `http://127.0.0.1:8000`

Seeder หลักมี curated demo dataset เฉพาะพื้นที่เมืองขอนแก่นเป็น fallback เพื่อให้ `php artisan migrate:fresh --seed` ใช้งานได้เร็วและเสถียรโดยไม่ต้องมี API key ข้อมูลชุดนี้มี geometry ครบทุกประเภทที่ระบบรองรับ และตั้งค่า `province`, `district`, `seed_area` เป็นขอนแก่นทั้งหมด

### Seed ข้อมูลจริงจาก OpenStreetMap/Overpass แบบแยก Geometry Type

workflow หลักสำหรับ demo คือ export ข้อมูลจริงจาก OpenStreetMap ผ่าน Overpass API ออกมาเป็น GeoJSON local ก่อน แล้วค่อย seed จากไฟล์ local วิธีนี้ทำให้ `php artisan migrate:fresh --seed` เร็วและเสถียร เพราะไม่ต้องยิง external API ตอน seed

```bash
cd backend
bash database/overpass/export_khon_kaen_geojson.sh
php artisan migrate:fresh --seed
```

script จะ export ไฟล์ไปที่ `storage/app/imports/khon-kaen/` แยกตาม geometry type:

- `point.geojson`
- `multipoint.geojson`
- `linestring.geojson`
- `multilinestring.geojson`
- `polygon.geojson`
- `multipolygon.geojson`

เมื่อมีไฟล์เหล่านี้ `DatabaseSeeder` จะเลือกใช้ `OverpassKhonKaenGeoJsonSeeder` อัตโนมัติ ผลลัพธ์ที่ทดสอบล่าสุด seed ได้ 272 records:

- Point: 120
- MultiPoint: 30
- LineString: 80
- MultiLineString: 2
- Polygon: 29
- MultiPolygon: 11

ถ้าต้องการ refresh เฉพาะบาง type สามารถรัน:

```bash
php database/overpass/export_khon_kaen_geojson.php polygon multipolygon --force
php database/overpass/export_khon_kaen_geojson.php multipoint
```

ถ้ามีไฟล์ GeoJSON ที่ export จาก overpass-turbo เองแล้ว สามารถ import เข้า path ที่ seeder ใช้ด้วยคำสั่ง:

```bash
cd backend
php database/overpass/import_khon_kaen_dataset.php /Users/web2damoon/Desktop/KhoneKean_dataset
php artisan migrate:fresh --seed
```

ตัว importer รองรับชื่อไฟล์ `point.geojson`, `LineString.geojson`, `MultiLineString.geojson`, `Polygon.geojson`, `MultiPolygon.geojson` และจะสร้าง `multipoint.geojson` จากข้อมูล Point ให้อัตโนมัติ

### Optional: Seed จาก Overture Maps ด้วย DuckDB

ถ้าต้องการ seed ข้อมูลจริงจาก Overture Maps เฉพาะพื้นที่เมืองขอนแก่น ให้ติดตั้ง DuckDB ก่อน:

```bash
brew install duckdb
```

จากนั้น export GeoJSON และ seed เข้า database:

```bash
cd backend
bash database/duckdb/export_overture_khon_kaen.sh
php artisan migrate:fresh --seed
```

script จะ export ไฟล์ GeoJSON ไปที่ `storage/app/imports/` จำนวน 3 ชุด:

- `overture_khon_kaen_places.geojson` สำหรับ Point
- `overture_khon_kaen_boundaries.geojson` สำหรับ LineString
- `overture_khon_kaen_areas.geojson` สำหรับ Polygon/MultiPolygon

เมื่อมีไฟล์เหล่านี้ `DatabaseSeeder` จะเลือกใช้ `OvertureKhonKaenSeeder` อัตโนมัติ และสร้าง derived collection เพิ่มเพื่อให้ครบทุก geometry type ที่ระบบรองรับ: `Point`, `MultiPoint`, `LineString`, `MultiLineString`, `Polygon`, `MultiPolygon`

ชุดข้อมูล Overture ใช้ release ล่าสุดจาก STAC catalog อัตโนมัติ จึงไม่ต้อง hardcode `[LATEST_RELEASE]` เอง

ถ้าต้องการลองให้ fallback seeder ดึงข้อมูลสดจาก OpenStreetMap ผ่าน Overpass API โดยตรง ให้ตั้งค่าใน `backend/.env`:

```env
SEED_USE_LIVE_OVERPASS=true
```

จากการสอบถาม Vallaris Maps, raw dataset สำหรับนำไป seed ลงฐานข้อมูลควรใช้ open map data เช่น Overture Maps/OpenStreetMap ส่วน Vallaris เหมาะกับ tile/basemap หรือข้อมูลที่ผู้ใช้มีและนำเข้าเป็น Collections เอง

ถ้าคุณมี Vallaris Features Collection ของตัวเองจริง ๆ สามารถใช้ optional seeder นี้ได้:

```env
VALLARIS_ITEMS_URL=https://va-cdn-02.vallarismaps.com/core/api/features/1.1/collections/your_collection_id/items
VALLARIS_API_KEY=your_api_key_here
```

ถ้าไม่ใช้ `VALLARIS_ITEMS_URL` สามารถแยกค่าเป็น `VALLARIS_BASE_URL` และ `VALLARIS_COLLECTION_ID` ได้ โดย `VALLARIS_COLLECTION_ID` คือค่าที่อยู่หลัง `/collections/` และก่อน `/items` ใน URL ของ Vallaris

หลังจากตั้งค่าแล้ว seed ด้วยคำสั่ง:

```bash
php artisan db:seed --class=VallarisPlaceSeeder
```

Data attribution: Overpass seed data and `SEED_USE_LIVE_OVERPASS=true` data come from OpenStreetMap. `© OpenStreetMap contributors`, available under the Open Database License (ODbL). Overture seed data comes from Overture Maps and is distributed under CDLA Permissive 2.0.

## Frontend Setup

เปิด terminal อีกหน้าหนึ่ง:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

ค่า default ใน `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_VALLARIS_SATELLITE_TILE_URL=
VITE_VALLARIS_API_KEY=
VITE_VALLARIS_SATELLITE_ATTRIBUTION=Vallaris Maps
VITE_VALLARIS_SATELLITE_OPACITY=1
```

ถ้าต้องการใช้ tile ดาวเทียมจาก Vallaris เป็น basemap ให้ใส่ TileJSON URL หรือ raster tile URL template ใน `VITE_VALLARIS_SATELLITE_TILE_URL` เช่น URL ที่มี `{z}`, `{x}`, `{y}` จาก Vallaris แล้วใส่ key ใน `VITE_VALLARIS_API_KEY` ระบบจะเติม `api_key` ให้เอง ถ้า URL มี `api_key` อยู่แล้ว ระบบจะใช้ URL นั้นตามเดิม เมื่อ `VITE_VALLARIS_SATELLITE_TILE_URL` ว่าง ระบบจะใช้ MapLibre demo basemap ตามเดิม

หมายเหตุ: ค่า env ของ Vite ฝั่ง frontend จะถูกส่งไปที่ browser เสมอ จึงควรใช้ API key ที่ตั้ง restriction สำหรับ domain ที่ใช้งานจริงเท่านั้น

จากนั้นเปิด URL ที่ Vite แสดง เช่น `http://127.0.0.1:5173`

## API Endpoints

Base URL: `http://127.0.0.1:8000/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/places` | List places แบบ FeatureCollection พร้อม search/filter/pagination |
| GET | `/places?all=true` | List ทุก feature ที่ตรง filter สำหรับแสดงบน map |
| GET | `/places/{id}` | Get place by id |
| POST | `/places` | Create place |
| PUT/PATCH | `/places/{id}` | Update place |
| DELETE | `/places/{id}` | Delete place |
| GET | `/places/categories` | List available categories |

ตัวอย่าง query:

```text
GET /api/places?search=ป.ต.ท.&geometry_type=Point&category=สถานีบริการน้ำมัน&page=1&per_page=10
GET /api/places?search=ป.ต.ท.&geometry_type=Point&category=สถานีบริการน้ำมัน&all=true
```

## GeoJSON Payload Example

```json
{
  "name": "มหาวิทยาลัยขอนแก่น",
  "geometry": {
    "type": "Point",
    "coordinates": [102.822281, 16.474635]
  },
  "properties": {
    "province": "ขอนแก่น",
    "category": "มหาวิทยาลัย"
  }
}
```

## Postman

Import collection ได้จาก:

```text
postman/Mini-Spatial-Data-Platform.postman_collection.json
```

Collection นี้มีตัวแปร:

- `base_url`: ค่าเริ่มต้น `http://127.0.0.1:8000/api`
- `place_id`: ถูกตั้งค่าอัตโนมัติหลัง request Create Place สำเร็จ

## Testing & Quality Checks

Backend:

```bash
cd backend
composer test
./vendor/bin/pint --test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Bonus ที่ทำเพิ่ม

- Edit place
- Search และ filter
- Pagination
- Category/collection
- Multiple geometry support
- Real Overture Maps seed workflow with DuckDB for Khon Kaen city
- Popup บนแผนที่สำหรับ inspect feature
- Validation geometry ฝั่ง API
- Postman collection และ API feature tests

## สิ่งที่ยังไม่ได้ทำ

- ยังไม่ได้ deploy online
- MultiLineString และ MultiPolygon ในฟอร์มรองรับการสร้างแบบ basic จากชุดพิกัดเดียวเป็นหลัก
