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
    )
    WHERE
        bbox.xmin BETWEEN 102.72 AND 102.92
        AND bbox.ymin BETWEEN 16.35 AND 16.55
        AND geometry IS NOT NULL
    LIMIT 86
) TO 'storage/app/imports/overture_khon_kaen_places.geojson'
WITH (FORMAT GDAL, DRIVER 'GeoJSON');
