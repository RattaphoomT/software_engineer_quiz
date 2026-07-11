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
    )
    WHERE
        bbox.xmin <= 102.92
        AND bbox.xmax >= 102.72
        AND bbox.ymin <= 16.55
        AND bbox.ymax >= 16.35
        AND bbox.xmax - bbox.xmin <= 0.3
        AND bbox.ymax - bbox.ymin <= 0.3
        AND geometry IS NOT NULL
    LIMIT 25
) TO 'storage/app/imports/overture_khon_kaen_boundaries.geojson'
WITH (FORMAT GDAL, DRIVER 'GeoJSON');
