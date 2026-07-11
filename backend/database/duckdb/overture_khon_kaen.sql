INSTALL spatial;
INSTALL httpfs;
LOAD spatial;
LOAD httpfs;

SET s3_region = 'us-west-2';
SET geometry_always_xy = true;
SET VARIABLE latest = (
    SELECT latest FROM 'https://stac.overturemaps.org/catalog.json'
);

COPY (
    WITH bounds AS (
        SELECT
            102.72::DOUBLE AS min_lon,
            16.35::DOUBLE AS min_lat,
            102.92::DOUBLE AS max_lon,
            16.55::DOUBLE AS max_lat
    )
    SELECT
        id,
        COALESCE(names.primary, 'Overture Place ' || id) AS name,
        COALESCE(categories.primary, 'place') AS category,
        'places' AS source_theme,
        'place' AS source_type,
        getvariable('latest') AS overture_release,
        geometry
    FROM read_parquet(
        's3://overturemaps-us-west-2/release/' || getvariable('latest') || '/theme=places/type=place/*',
        filename = true,
        hive_partitioning = 1
    ), bounds
    WHERE
        bbox.xmin <= max_lon
        AND bbox.xmax >= min_lon
        AND bbox.ymin <= max_lat
        AND bbox.ymax >= min_lat
        AND geometry IS NOT NULL
    LIMIT 86
) TO 'storage/app/imports/overture_khon_kaen_places.geojson'
WITH (FORMAT GDAL, DRIVER 'GeoJSON');

COPY (
    WITH bounds AS (
        SELECT
            102.72::DOUBLE AS min_lon,
            16.35::DOUBLE AS min_lat,
            102.92::DOUBLE AS max_lon,
            16.55::DOUBLE AS max_lat
    )
    SELECT
        id,
        'Overture Division Boundary ' || id AS name,
        COALESCE(subtype, class, 'division_boundary') AS category,
        'divisions' AS source_theme,
        'division_boundary' AS source_type,
        getvariable('latest') AS overture_release,
        geometry
    FROM read_parquet(
        's3://overturemaps-us-west-2/release/' || getvariable('latest') || '/theme=divisions/type=division_boundary/*',
        filename = true,
        hive_partitioning = 1
    ), bounds
    WHERE
        bbox.xmin <= max_lon
        AND bbox.xmax >= min_lon
        AND bbox.ymin <= max_lat
        AND bbox.ymax >= min_lat
        AND bbox.xmax - bbox.xmin <= 0.3
        AND bbox.ymax - bbox.ymin <= 0.3
        AND geometry IS NOT NULL
    LIMIT 25
) TO 'storage/app/imports/overture_khon_kaen_boundaries.geojson'
WITH (FORMAT GDAL, DRIVER 'GeoJSON');

COPY (
    WITH bounds AS (
        SELECT
            102.72::DOUBLE AS min_lon,
            16.35::DOUBLE AS min_lat,
            102.92::DOUBLE AS max_lon,
            16.55::DOUBLE AS max_lat
    )
    SELECT
        id,
        COALESCE(names.primary, 'Overture Division Area ' || id) AS name,
        COALESCE(subtype, 'division_area') AS category,
        'divisions' AS source_theme,
        'division_area' AS source_type,
        getvariable('latest') AS overture_release,
        geometry
    FROM read_parquet(
        's3://overturemaps-us-west-2/release/' || getvariable('latest') || '/theme=divisions/type=division_area/*',
        filename = true,
        hive_partitioning = 1
    ), bounds
    WHERE
        bbox.xmin BETWEEN min_lon AND max_lon
        AND bbox.ymin BETWEEN min_lat AND max_lat
        AND geometry IS NOT NULL
    LIMIT 25
) TO 'storage/app/imports/overture_khon_kaen_areas.geojson'
WITH (FORMAT GDAL, DRIVER 'GeoJSON');
