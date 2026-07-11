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

Seeder หลักใช้ `OverpassKhonKaenGeoJsonSeeder` เพียงตัวเดียว โดยอ่านไฟล์ GeoJSON จริงจาก `storage/app/imports/khon-kaen/` ที่ export จาก OpenStreetMap/Overpass API ไว้ล่วงหน้า วิธีนี้ทำให้ `php artisan migrate:fresh --seed` เร็วและไม่ต้องยิง external API ตอน seed

### Seed ข้อมูลจริงจาก OpenStreetMap/Overpass แบบแยก Geometry Type

ถ้ามีไฟล์ GeoJSON ใน `storage/app/imports/khon-kaen/` อยู่แล้ว สามารถ seed ได้ทันที:

```bash
cd backend
php artisan migrate:fresh --seed
```

script จะ export ไฟล์ไปที่ `storage/app/imports/khon-kaen/` แยกตาม geometry type:

- `point.geojson`
- `multipoint.geojson`
- `linestring.geojson`
- `multilinestring.geojson`
- `polygon.geojson`
- `multipolygon.geojson`

หากต้องการ export ข้อมูลใหม่จาก Overpass API สามารถรัน:

```bash
cd backend
bash database/overpass/export_khon_kaen_geojson.sh
php artisan migrate:fresh --seed
```

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

ผลลัพธ์จากไฟล์ Overpass ชุดล่าสุด seed ได้ 3,725 records และมีข้อมูลครบทุก geometry type:

- Point: 1,782
- MultiPoint: 246
- LineString: 1,548
- MultiLineString: 2
- Polygon: 143
- MultiPolygon: 4

Data attribution: seed data comes from OpenStreetMap. `© OpenStreetMap contributors`, available under the Open Database License (ODbL).

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

## Deployment

โปรเจกต์นี้ deploy แบบแยก service ได้ตรงไปตรงมา:

- Backend: Laravel API ใน `backend/` deploy ด้วย Docker
- Frontend: React/Vite ใน `frontend/` deploy เป็น static site
- Database: แนะนำใช้ MySQL/MariaDB managed database สำหรับ production

### Backend Deploy

เตรียม repository ขึ้น GitHub ก่อน จากนั้นสร้าง Web Service บน platform ที่รองรับ Docker เช่น Render หรือ Railway แล้วตั้งค่า root directory เป็น `backend`

Environment variables ที่ต้องตั้งบน backend service:

```env
APP_NAME="Mini Spatial Data Platform"
APP_ENV=production
APP_KEY=base64:your_generated_key
APP_DEBUG=false
APP_URL=https://your-backend-domain.example
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.example

DB_CONNECTION=mysql
DB_HOST=your_database_host
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
```

สร้าง `APP_KEY` ได้จากเครื่อง local:

```bash
cd backend
php artisan key:generate --show
```

ไฟล์ `backend/Dockerfile` และ `backend/scripts/start.sh` ถูกเตรียมไว้แล้ว ตอน container start ระบบจะ:

1. รัน migration
2. seed ข้อมูล Overpass เฉพาะตอนตาราง `places` ยังว่าง
3. cache config/route
4. start Laravel API ด้วย port ที่ platform กำหนด

### Frontend Deploy

สร้าง Static Site/Project จาก directory `frontend` เช่นบน Vercel แล้วตั้งค่า:

```text
Build Command: npm run build
Output Directory: dist
```

Environment variables ที่ต้องตั้งบน frontend service:

```env
VITE_API_BASE_URL=https://your-backend-domain.example/api
VITE_VALLARIS_SATELLITE_TILE_URL=
VITE_VALLARIS_API_KEY=
VITE_VALLARIS_SATELLITE_ATTRIBUTION=Vallaris Maps
VITE_VALLARIS_SATELLITE_OPACITY=1
```

หลัง deploy frontend แล้ว ให้แก้ `APP_URL` หรือ CORS ตาม domain จริงหาก platform มีการบล็อก cross-origin request

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
- Real OpenStreetMap/Overpass GeoJSON seed workflow for Khon Kaen city
- Popup บนแผนที่สำหรับ inspect feature
- Validation geometry ฝั่ง API
- Postman collection และ API feature tests

## สิ่งที่ยังไม่ได้ทำ

- ยังไม่ได้ใส่ URL deploy online ใน README
- MultiLineString และ MultiPolygon ในฟอร์มรองรับการสร้างแบบ basic จากชุดพิกัดเดียวเป็นหลัก
