import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function MapView({ places, categories = [], selectedCategory = "" }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [102.835, 16.43],
      zoom: 11,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    const geojsonData = {
      type: "FeatureCollection",
      features: places || [],
    };

    const getFeatureTitle = (feature) => {
      return feature.properties?.name || "Unnamed place";
    };

    const getFeatureDescription = (feature) => {
      const province = feature.properties?.province || "-";
      const category = feature.properties?.category || "-";
      const type = feature.geometry?.type || "-";

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
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
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
                    font-weight: 700;
                    flex-shrink: 0;
                  "
                >
                  ${index + 1}
                </span>

                <div style="font-size: 13px; font-weight: 700; color: #0f172a;">
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
            <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
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
      if (!map.getSource("places")) {
        map.addSource("places", {
          type: "geojson",
          data: geojsonData,
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
            "fill-opacity": 0.28,
            "fill-color": "#2563eb",
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
            "line-width": 2,
            "line-color": "#1d4ed8",
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
            "line-width": 4,
            "line-color": "#16a34a",
          },
        });
      }

      if (!map.getLayer("places-points")) {
        map.addLayer({
          id: "places-points",
          type: "circle",
          source: "places",
          filter: [
            "any",
            ["==", ["geometry-type"], "Point"],
            ["==", ["geometry-type"], "MultiPoint"],
          ],
          paint: {
            "circle-radius": 8,
            "circle-color": "#dc2626",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      /**
       * คลิกแบบมืออาชีพ:
       * ไม่ผูก click ทีละ layer
       * แต่ query ทุก layer ที่เกี่ยวข้อง ณ จุดที่คลิก
       */
      map.on("click", (event) => {
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
      if (map.getSource("places")) {
        map.getSource("places").setData(geojsonData);
      } else {
        addLayers();
      }

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
  }, [places]);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Interactive Map</h2>
        <p className="mt-1 text-sm text-slate-500">
          Click on the map to inspect all overlapping GeoJSON features at that
          location.
        </p>
      </div>

      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[360px] w-full sm:h-[420px] lg:h-[520px]"
        />

        <div className="absolute bottom-4 left-4 max-w-xs rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <div className="mb-2">
            <p className="text-sm font-bold text-slate-900">Map Collections</p>
            <p className="text-xs text-slate-500">
              {selectedCategory
                ? `Filtered: ${selectedCategory}`
                : "All categories"}
            </p>
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">No category data</p>
            ) : (
              categories.slice(0, 6).map((category) => (
                <div
                  key={category}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="truncate">{category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MapView;
