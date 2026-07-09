import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function MapView({ places }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

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
      features: places,
    };

    const updateMapData = () => {
      if (map.getSource("places")) {
        map.getSource("places").setData(geojsonData);
      } else {
        map.addSource("places", {
          type: "geojson",
          data: geojsonData,
        });

        map.addLayer({
          id: "places-points",
          type: "circle",
          source: "places",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "places-lines",
          type: "line",
          source: "places",
          filter: ["==", ["geometry-type"], "LineString"],
          paint: {
            "line-width": 4,
          },
        });

        map.addLayer({
          id: "places-polygons",
          type: "fill",
          source: "places",
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "fill-opacity": 0.4,
          },
        });

        map.addLayer({
          id: "places-polygons-outline",
          type: "line",
          source: "places",
          filter: ["==", ["geometry-type"], "Polygon"],
          paint: {
            "line-width": 2,
          },
        });

        map.on("click", "places-points", handleFeatureClick);
        map.on("click", "places-lines", handleFeatureClick);
        map.on("click", "places-polygons", handleFeatureClick);

        map.on("mouseenter", "places-points", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "places-points", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    };

    const handleFeatureClick = (event) => {
      const feature = event.features[0];

      new maplibregl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(
          `
            <strong>${feature.properties.name || "Unnamed place"}</strong>
            <br />
            Type: ${feature.geometry.type}
            <br />
            Province: ${feature.properties.province || "-"}
            <br />
            Category: ${feature.properties.category || "-"}
          `,
        )
        .addTo(map);
    };

    if (map.loaded()) {
      updateMapData();
    } else {
      map.on("load", updateMapData);
    }
  }, [places]);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">Interactive Map</h2>
        <p className="mt-1 text-sm text-slate-500">
          Visualize Point, LineString and Polygon features from the API.
        </p>
      </div>

      <div
        ref={mapContainerRef}
        className="h-[360px] w-full sm:h-[420px] lg:h-[520px]"
      />
    </section>
  );
}

export default MapView;
