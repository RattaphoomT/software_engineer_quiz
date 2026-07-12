# Mini Spatial Data Platform

โปรเจกต์สำหรับแบบทดสอบตำแหน่ง Software Engineer ระบบจัดการข้อมูลสถานที่ในรูปแบบ GeoJSON โดยทั้ง Backend และ frontend อยู่ใน Repository ครับโดยผมได้ทำการ Deploy เรียบร้อย แนบลิ้ง git Repository และลิ้งของโปรเจคที่ผมทำการ Deploy ไว้ให้ด้านล่างนี้ครับ

## Repository
https://github.com/RattaphoomT/software_engineer_quiz.git

## URL Deploy Project
https://materialmy.com

## Tech Stack

- Backend: Laravel 13, PHP 8.3+, MySQL/SQLite
- Frontend: React, Vite, TailwindCSS
- Map: MapLibre GL JS
- HTTP Client: Axios
- Sever : Xampp

## Features

- RESTful API สำหรับจัดการข้อมูลสถานที่
- GeoJSON Feature และ FeatureCollection response
- แสดงสถานที่ในแบบตาราง
- แสดงข้อมูลบน Interactive Map ด้วย MapLibre
- เพิ่ม แก้ไข ลบ และดูข้อมูลสถานที่ผ่านหน้าเว็บ
- Search ตามชื่อสถานที่
- Filter ตาม geometry type และ category
- Pagination สำหรับรองรับข้อมูลจำนวนมากขึ้น
- รองรับ geometry หลายประเภท: Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon
- Seeder ดึงข้อมูลสถานที่จริงเฉพาะพื้นที่เมืองขอนแก่นโดยผม Query ข้อมมูลแต่ละ Geometry Type จาก https://overpass-turbo.eu/ และทำการให้ Seeder นำไฟล์ที่ Query มารวมกัน

## Project Structure

```text
backend/    Laravel API
frontend/   React + Vite UI
postman/    Postman collection สำหรับทดสอบ API
```

## Backend Setup

ค่า default ใน `backend/.env.example`:
อันนี้นำค่าฐานข้อมูลในเครื่องมาใส่ได้เลยครับ

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mater_spatial_platform_demo
DB_USERNAME=mater_spatial_platform_demo
DB_PASSWORD=NYS$3facp~cl6wp1
```

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```


ค่าเริ่มต้นของ Backend คือ `http://127.0.0.1:8000`
หากต้องการทดสอบ Backend ที่ Deploy แล้วจะเป็น `https://api.materialmy.com/`

### Dataset ผม Seed ข้อมูลจริงจาก OpenStreetMap/Overpass แบบแยก Geometry Type

Seeder หลักใช้ `OverpassKhonKaenGeoJsonSeeder` เพียงตัวเดียว โดยอ่านไฟล์ GeoJSON จริงจาก `storage/app/imports/khon-kaen/` ที่ export จาก OpenStreetMap/Overpass API ไว้ล่วงหน้า วิธีนี้ทำให้ `php artisan migrate:fresh --seed` เร็วและไม่ต้องยิง external API ตอน seed ครับผมจึงเลือกใช้วิธีนี้

## คำสั่ง Seed ข้อมูล
```bash
cd backend
php artisan migrate:fresh --seed
```

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
```

จากนั้นเปิด URL ที่ Vite แสดงได้เลยครับ เช่น `http://127.0.0.1:5173`

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




## Bonus ที่ทำเพิ่ม

- แก้ไข (Edit) ข้อมูลสถานที่ ✅
- กรอง (Filter) หรือค้นหา (Search) สถานที่ตามชื่อหรือ Property อื่น ✅
- รองรับข้อมูลจำนวนมากได้อย่างมีประสิทธิภาพ เช่น Pagination หรือ Infinite Scroll ✅ ผมทำเป็น Pagination
- แบ่งประเภทสถานที่ (Collection) และแสดงผลแยกประเภทบนแผนที่ ✅
- รองรับ Geometry หลายประเภท เช่น LineString หรือ Polygon ✅
- สิ่งที่คิดขึ้นเองและคิดว่าทำให้ Platform ดีขึ้น ✅
  สิ่งที่ผมทำเพิ่มไปนะครับ:
  1.Data Clustering มีการทำ Clustering ข้อมูล ชนิดที่เป็น point เพื่อให้เวลาดูข้อมูลดูง่ายและข้อมูลชนิด point ไม่ไปบดบังข้อมูลชนิดอื่นๆ
  2.fly to คือ เมื่อคลิ๊กข้อมูลไหนในตารางจะทำการ fly to ในแมพไปหาข้อมูลนั้นบนแมพด้วยทำให้การค้นหาสถาณที่สะดวกสบายมากขึ้น

## สิ่งที่ยังไม่ได้ทำ

- ตอนนี้เท่าที่ดูผมทำตามโจทย์ครบหมดแล้วครับ ขอบคุณที่พิจารณาครับ 😊
