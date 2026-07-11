#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

mkdir -p storage/app/imports

duckdb < database/duckdb/overture_khon_kaen_places.sql
duckdb < database/duckdb/overture_khon_kaen_boundaries.sql
duckdb < database/duckdb/overture_khon_kaen_areas.sql
