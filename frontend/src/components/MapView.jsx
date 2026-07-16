import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const collectPositions = (coordinates) => {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return [coordinates];
  }

  return coordinates.flatMap((coordinate) => collectPositions(coordinate));
};

const GEOMETRY_STYLES = [
  { type: "Point", color: "#d7191c", label: "Point" },
  { type: "MultiPoint", color: "#fdae61", label: "MultiPoint" },
  { type: "LineString", color: "#1a9641", label: "LineString" },
  { type: "MultiLineString", color: "#2c7bb6", label: "MultiLineString" },
  { type: "Polygon", color: "#984ea3", label: "Polygon" },
  { type: "MultiPolygon", color: "#4daf4a", label: "MultiPolygon" },
];

const geometryColorExpression = [
  "match",
  ["geometry-type"],
  "Point",
  "#d7191c",
  "MultiPoint",
  "#fdae61",
  "LineString",
  "#1a9641",
  "MultiLineString",
  "#2c7bb6",
  "Polygon",
  "#984ea3",
  "MultiPolygon",
  "#4daf4a",
  "#64748b",
];

const pointColorExpression = [
  "match",
  ["get", "original_geometry_type"],
  "MultiPoint",
  "#fdae61",
  "Point",
  "#d7191c",
  "#64748b",
];

const pointClusterFeatures = (features) => {
  return (features || []).flatMap((feature) => {
    if (feature.geometry?.type === "Point") {
      return [
        {
          ...feature,
          properties: {
            ...feature.properties,
            original_geometry_type: "Point",
          },
        },
      ];
    }

    if (feature.geometry?.type !== "MultiPoint") {
      return [];
    }

    return (feature.geometry.coordinates || []).map((coordinates, index) => ({
      ...feature,
      id: `${feature.id || feature.properties?.name || "multipoint"}-${index}`,
      properties: {
        ...feature.properties,
        original_geometry_type: "MultiPoint",
        multipoint_index: index + 1,
      },
      geometry: {
        type: "Point",
        coordinates,
      },
    }));
  });
};

const selectedColorExpression = (defaultExpression) => [
  "case",
  ["boolean", ["get", "is_selected"], false],
  "#facc15",
  defaultExpression,
];

const selectedLineWidthExpression = (defaultExpression) => [
  "case",
  ["boolean", ["get", "is_selected"], false],
  7,
  defaultExpression,
];

const selectedCircleRadiusExpression = (defaultExpression) => [
  "case",
  ["boolean", ["get", "is_selected"], false],
  11,
  defaultExpression,
];

const featurePlaceId = (feature) => feature?.properties?.place_id ?? feature?.id;

const withApiKey = (url, apiKey) => {
  if (!url || !apiKey) {
    return url;
  }

  if (url.includes("{api_key}")) {
    return url.replace("{api_key}", encodeURIComponent(apiKey));
  }

  if (url.includes("api_key=")) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(
    apiKey,
  )}`;
};

const vallarisSatelliteTileUrl = import.meta.env
  .VITE_VALLARIS_SATELLITE_TILE_URL;
const vallarisApiKey = import.meta.env.VITE_VALLARIS_API_KEY;
const vallarisSatelliteTileTemplate = withApiKey(
  vallarisSatelliteTileUrl,
  vallarisApiKey,
);
const vallarisSatelliteSource = vallarisSatelliteTileTemplate?.includes("{")
  ? {
      type: "raster",
      tiles: [vallarisSatelliteTileTemplate],
      tileSize: 256,
    }
  : {
      type: "raster",
      url: vallarisSatelliteTileTemplate,
      tileSize: 256,
    };
const vallarisSatelliteAttribution =
  import.meta.env.VITE_VALLARIS_SATELLITE_ATTRIBUTION || "Vallaris Maps";
const vallarisSatelliteOpacity = Number(
  import.meta.env.VITE_VALLARIS_SATELLITE_OPACITY || 1,
);

function MapView({
  places,
  selectedCategory = "",
  focusedPlace = null,
  onFeatureSelect,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: vallarisSatelliteTileTemplate
        ? {
            version: 8,
            sources: {},
            layers: [],
          }
        : "https://demotiles.maplibre.org/style.json",
      center: [102.835, 16.43],
      zoom: 11,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "bottom-right");
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const resizeMap = () => map.resize();
    const resizeMapSoon = () => {
      requestAnimationFrame(resizeMap);
      window.setTimeout(resizeMap, 250);
    };

    resizeMapSoon();
    window.addEventListener("resize", resizeMap);

    const resizeObserver = new ResizeObserver(resizeMapSoon);

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", resizeMap);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const selectedPlaceId = featurePlaceId(focusedPlace);

    const featuresWithSelection = (places || []).map((place) => {
      const isSelected =
        selectedPlaceId !== undefined &&
        String(selectedPlaceId) === String(place.id);

      return {
        ...place,
        properties: {
          ...place.properties,
          place_id: place.id,
          is_selected: isSelected,
        },
      };
    });

    const geojsonData = {
      type: "FeatureCollection",
      features: featuresWithSelection,
    };

    const pointGeojsonData = {
      type: "FeatureCollection",
      features: pointClusterFeatures(featuresWithSelection),
    };

    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const getFeatureTitle = (feature) => {
      return escapeHtml(feature.properties?.name || "Unnamed place");
    };

    const getFeatureDescription = (feature) => {
      const province = escapeHtml(feature.properties?.province || "-");
      const category = escapeHtml(feature.properties?.category || "-");
      const type = escapeHtml(feature.geometry?.type || "-");

      return `
        <div style="margin-top: 4px; font-size: 12px; color: #475569;">
          <div><strong>Type:</strong> ${type}</div>
          <div><strong>Province:</strong> ${province}</div>
          <div><strong>Category:</strong> ${category}</div>
        </div>
      `;
    };

    const buildPopupHtml = (features) => {
      if (features.length === 1) {
        const feature = features[0];

        return `
          <div style="min-width: 220px;">
            <div style="font-size: 14px; font-weight: 500; color: #0f172a;">
              ${getFeatureTitle(feature)}
            </div>
            ${getFeatureDescription(feature)}
          </div>
        `;
      }

      const featureItems = features
        .map((feature, index) => {
          return `
            <div
              style="
                padding: 10px 0;
                border-bottom: ${
                  index === features.length - 1 ? "none" : "1px solid #e2e8f0"
                };
              "
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <span
                  style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    border-radius: 999px;
                    background: #dbeafe;
                    color: #1d4ed8;
                    font-size: 12px;
                    font-weight: 500;
                    flex-shrink: 0;
                  "
                >
                  ${index + 1}
                </span>

                <div style="font-size: 13px; font-weight: 500; color: #0f172a;">
                  ${getFeatureTitle(feature)}
                </div>
              </div>

              <div style="margin-left: 30px;">
                ${getFeatureDescription(feature)}
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <div style="min-width: 260px; max-width: 340px;">
          <div
            style="
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
            "
          >
            <div style="font-size: 14px; font-weight: 600; color: #0f172a;">
              ${features.length} features found here
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
              Multiple geometries overlap at this location.
            </div>
          </div>

          <div
            class="custom-popup-scroll"
            style="
                max-height: 260px;
                overflow-y: auto;
                padding-right: 6px;
            "
            >
            ${featureItems}
            </div>
        </div>
      `;
    };

    const addLayers = () => {
      if (
        vallarisSatelliteTileTemplate &&
        !map.getSource("vallaris-satellite")
      ) {
        map.addSource("vallaris-satellite", {
          ...vallarisSatelliteSource,
          attribution: vallarisSatelliteAttribution,
        });

        map.addLayer({
          id: "vallaris-satellite",
          type: "raster",
          source: "vallaris-satellite",
          paint: {
            "raster-opacity": Math.min(
              Math.max(vallarisSatelliteOpacity, 0),
              1,
            ),
          },
        });
      }

      if (!map.getSource("places")) {
        map.addSource("places", {
          type: "geojson",
          data: geojsonData,
        });
      }

      if (!map.getSource("place-points")) {
        map.addSource("place-points", {
          type: "geojson",
          data: pointGeojsonData,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 48,
        });
      }

      /**
       * สำคัญ:
       * เพิ่ม polygon ก่อน เพื่อให้อยู่ชั้นล่าง
       * line อยู่กลาง
       * point อยู่บนสุด
       */
      if (!map.getLayer("places-polygons")) {
        map.addLayer({
          id: "places-polygons",
          type: "fill",
          source: "places",
          filter: [
            "any",
            ["==", ["geometry-type"], "Polygon"],
            ["==", ["geometry-type"], "MultiPolygon"],
          ],
          paint: {
            "fill-opacity": [
              "case",
              ["boolean", ["get", "is_selected"], false],
              0.52,
              0.28,
            ],
            "fill-color": selectedColorExpression(geometryColorExpression),
          },
        });
      }

      if (!map.getLayer("places-polygons-outline")) {
        map.addLayer({
          id: "places-polygons-outline",
          type: "line",
          source: "places",
          filter: [
            "any",
            ["==", ["geometry-type"], "Polygon"],
            ["==", ["geometry-type"], "MultiPolygon"],
          ],
          paint: {
            "line-width": selectedLineWidthExpression([
              "match",
              ["geometry-type"],
              "MultiPolygon",
              3,
              2,
            ]),
            "line-color": selectedColorExpression(geometryColorExpression),
          },
        });
      }

      if (!map.getLayer("places-lines")) {
        map.addLayer({
          id: "places-lines",
          type: "line",
          source: "places",
          filter: [
            "any",
            ["==", ["geometry-type"], "LineString"],
            ["==", ["geometry-type"], "MultiLineString"],
          ],
          paint: {
            "line-width": selectedLineWidthExpression([
              "match",
              ["geometry-type"],
              "MultiLineString",
              5,
              3.5,
            ]),
            "line-color": selectedColorExpression(geometryColorExpression),
          },
        });
      }

      if (!map.getLayer("point-clusters")) {
        map.addLayer({
          id: "point-clusters",
          type: "circle",
          source: "place-points",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#2c7bb6",
              25,
              "#fdae61",
              100,
              "#d7191c",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              16,
              25,
              21,
              100,
              27,
            ],
            "circle-opacity": 0.92,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
          },
        });
      }

      if (!map.getLayer("point-cluster-count")) {
        map.addLayer({
          id: "point-cluster-count",
          type: "symbol",
          source: "place-points",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
            "text-font": ["Open Sans Semibold"],
          },
          paint: {
            "text-color": "#ffffff",
          },
        });
      }

      if (!map.getLayer("places-points")) {
        map.addLayer({
          id: "places-points",
          type: "circle",
          source: "place-points",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": selectedCircleRadiusExpression([
              "match",
              ["get", "original_geometry_type"],
              "MultiPoint",
              6,
              7.5,
            ]),
            "circle-color": selectedColorExpression(pointColorExpression),
            "circle-stroke-width": 2,
            "circle-stroke-color": [
              "case",
              ["boolean", ["get", "is_selected"], false],
              "#0f172a",
              "#ffffff",
            ],
          },
        });
      }

      /**
       * คลิกแบบมืออาชีพ:
       * ไม่ผูก click ทีละ layer
       * แต่ query ทุก layer ที่เกี่ยวข้อง ณ จุดที่คลิก
       */
      map.on("click", (event) => {
        const clusterFeatures = map.queryRenderedFeatures(event.point, {
          layers: ["point-clusters"].filter((layerId) => map.getLayer(layerId)),
        });

        if (clusterFeatures.length) {
          const clusterId = clusterFeatures[0].properties.cluster_id;
          const source = map.getSource("place-points");

          source.getClusterExpansionZoom(clusterId, (error, zoom) => {
            if (error) return;

            map.easeTo({
              center: clusterFeatures[0].geometry.coordinates,
              zoom,
              duration: 650,
              essential: true,
            });
          });

          return;
        }

        const clickableLayers = [
          "places-points",
          "places-lines",
          "places-polygons",
          "places-polygons-outline",
        ].filter((layerId) => map.getLayer(layerId));

        const features = map.queryRenderedFeatures(event.point, {
          layers: clickableLayers,
        });

        if (!features.length) {
          onFeatureSelect?.(null);

          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }

          return;
        }

        /**
         * กันข้อมูลซ้ำ:
         * polygon fill กับ polygon outline อาจเป็น feature เดียวกัน
         * เลยต้อง unique ด้วย id + geometry type + name
         */
        const uniqueFeatures = [];
        const seen = new Set();

        features.forEach((feature) => {
          const key = `${feature.id || ""}-${feature.geometry?.type}-${
            feature.properties?.name || ""
          }`;

          if (!seen.has(key)) {
            seen.add(key);
            uniqueFeatures.push(feature);
          }
        });

        if (popupRef.current) {
          popupRef.current.remove();
        }

        const selectedFeatureId = featurePlaceId(uniqueFeatures[0]);
        const selectedFeature =
          (places || []).find(
            (place) => String(place.id) === String(selectedFeatureId),
          ) || uniqueFeatures[0];

        onFeatureSelect?.(selectedFeature);

        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: "420px",
        })
          .setLngLat(event.lngLat)
          .setHTML(buildPopupHtml(uniqueFeatures))
          .addTo(map);
      });

      map.on("mousemove", (event) => {
        const clickableLayers = [
          "point-clusters",
          "places-points",
          "places-lines",
          "places-polygons",
          "places-polygons-outline",
        ].filter((layerId) => map.getLayer(layerId));

        const features = map.queryRenderedFeatures(event.point, {
          layers: clickableLayers,
        });

        map.getCanvas().style.cursor = features.length ? "pointer" : "";
      });
    };

    const updateMap = () => {
      map.resize();

      if (map.getSource("places")) {
        map.getSource("places").setData(geojsonData);
        map.getSource("place-points")?.setData(pointGeojsonData);
      } else {
        addLayers();
      }

      requestAnimationFrame(() => {
        map.resize();
        map.triggerRepaint();
      });

      if (places?.length > 0) {
        const pointFeature = places.find(
          (place) =>
            place.geometry?.type === "Point" &&
            Array.isArray(place.geometry?.coordinates),
        );

        if (pointFeature) {
          map.flyTo({
            center: pointFeature.geometry.coordinates,
            zoom: 12,
            essential: true,
          });
        }
      }
    };

    if (map.loaded()) {
      updateMap();
    } else {
      map.once("load", updateMap);
    }
  }, [focusedPlace, onFeatureSelect, places]);

  useEffect(() => {
    const map = mapRef.current;
    const geometry = focusedPlace?.geometry;

    if (!map || !geometry) return;

    const positions = collectPositions(geometry.coordinates);

    if (positions.length === 0) return;

    const showFocusedPopup = (lngLat) => {
      if (popupRef.current) {
        popupRef.current.remove();
      }

      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "360px",
      })
        .setLngLat(lngLat)
        .setHTML(
          `
            <div style="min-width: 220px;">
              <div style="font-size: 14px; font-weight: 500; color: #0f172a;">
                ${String(focusedPlace.properties?.name || "Unnamed place")
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;")}
              </div>
              <div style="margin-top: 4px; font-size: 12px; color: #475569;">
                <div><strong>Type:</strong> ${geometry.type}</div>
                <div><strong>Category:</strong> ${
                  focusedPlace.properties?.category || "-"
                }</div>
              </div>
            </div>
          `,
        )
        .addTo(map);
    };

    if (geometry.type === "Point") {
      const center = positions[0];

      map.flyTo({
        center,
        zoom: Math.max(map.getZoom(), 15),
        essential: true,
      });

      showFocusedPopup(center);
      return;
    }

    const bounds = positions.reduce((currentBounds, position) => {
      return currentBounds.extend(position);
    }, new maplibregl.LngLatBounds(positions[0], positions[0]));

    map.fitBounds(bounds, {
      padding: {
        top: 120,
        right: 120,
        bottom: 120,
        left: 460,
      },
      maxZoom: 15,
      duration: 900,
      essential: true,
    });

    showFocusedPopup(bounds.getCenter());
  }, [focusedPlace]);

  return (
    <section className="absolute inset-0">
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute bottom-24 right-3 z-10 hidden max-w-[220px] rounded-lg bg-white/95 p-3 shadow-xl ring-1 ring-slate-900/10 backdrop-blur md:bottom-4 md:right-16 md:block lg:max-w-xs lg:p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-900">Geometry Types</p>
          <p className="text-xs text-slate-500">
            {selectedCategory ? `Filtered: ${selectedCategory}` : "All features"}
          </p>
        </div>

        <div className="space-y-2">
          {GEOMETRY_STYLES.map((geometryStyle) => (
            <div
              key={geometryStyle.type}
              className="flex items-center gap-2 text-xs text-slate-600"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: geometryStyle.color }}
              />
              <span className="truncate">{geometryStyle.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MapView;
