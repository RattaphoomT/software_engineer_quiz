#!/usr/bin/env sh
set -e

php artisan migrate --force

php artisan tinker --execute='if (\App\Models\Place::query()->count() === 0) { \Illuminate\Support\Facades\Artisan::call("db:seed", ["--force" => true]); echo \Illuminate\Support\Facades\Artisan::output(); }'

php artisan config:cache

php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
