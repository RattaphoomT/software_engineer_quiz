#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

php database/overpass/export_khon_kaen_geojson.php
