import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "./services/api";
import AddPlaceForm from "./components/AddPlaceForm";
import SearchFilter from "./components/SearchFilter";
import MapView from "./components/MapView";
import PlacesTable from "./components/PlacesTable";

function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [geometryTypeFilter, setGeometryTypeFilter] = useState("");

  const [form, setForm] = useState({
    name: "",
    geometryType: "Point",
    points: [
      {
        longitude: "102.822281",
        latitude: "16.474635",
      },
    ],
    province: "",
    category: "",
  });

  const showSuccess = (message) => {
    Swal.fire({
      icon: "success",
      title: "Success",
      text: message,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const showError = (message) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonText: "OK",
    });
  };

  const [editingPlaceId, setEditingPlaceId] = useState(null);

  const fetchPlaces = async () => {
    try {
      setLoading(true);

      const response = await api.get("/places", {
        params: {
          search: search || undefined,
          geometry_type: geometryTypeFilter || undefined,
        },
      });

      setPlaces(response.data.features || []);
    } catch (error) {
      console.error("Failed to fetch places:", error.response?.data || error);
      showError("Failed to fetch places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [search, geometryTypeFilter]);

  const handlePointChange = (index, field, value) => {
    setForm((prev) => {
      const updatedPoints = [...prev.points];

      updatedPoints[index] = {
        ...updatedPoints[index],
        [field]: value,
      };

      return {
        ...prev,
        points: updatedPoints,
      };
    });
  };

  const addPoint = () => {
    setForm((prev) => ({
      ...prev,
      points: [
        ...prev.points,
        {
          longitude: "",
          latitude: "",
        },
      ],
    }));
  };

  const removePoint = (index) => {
    setForm((prev) => {
      if (prev.points.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        points: prev.points.filter((_, pointIndex) => pointIndex !== index),
      };
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "geometryType") {
      setForm((prev) => ({
        ...prev,
        geometryType: value,
        points: getDefaultPointsByGeometryType(value),
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildGeometry = () => {
    const coordinates = form.points.map((point) => [
      Number(point.longitude),
      Number(point.latitude),
    ]);

    const hasInvalidPoint = coordinates.some(
      ([longitude, latitude]) =>
        Number.isNaN(longitude) || Number.isNaN(latitude),
    );

    if (hasInvalidPoint) {
      throw new Error(
        "All longitude and latitude values must be valid numbers.",
      );
    }

    if (form.geometryType === "Point") {
      if (coordinates.length !== 1) {
        throw new Error("Point requires exactly 1 coordinate.");
      }

      return {
        type: "Point",
        coordinates: coordinates[0],
      };
    }

    if (form.geometryType === "MultiPoint") {
      return {
        type: "MultiPoint",
        coordinates,
      };
    }

    if (form.geometryType === "LineString") {
      if (coordinates.length < 2) {
        throw new Error("LineString requires at least 2 coordinates.");
      }

      return {
        type: "LineString",
        coordinates,
      };
    }

    if (form.geometryType === "MultiLineString") {
      if (coordinates.length < 2) {
        throw new Error("MultiLineString requires at least 2 coordinates.");
      }

      return {
        type: "MultiLineString",
        coordinates: [coordinates],
      };
    }

    if (form.geometryType === "Polygon") {
      if (coordinates.length < 4) {
        throw new Error("Polygon requires at least 4 coordinates.");
      }

      const firstPoint = coordinates[0];
      const lastPoint = coordinates[coordinates.length - 1];

      const isClosed =
        firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];

      const closedRing = isClosed ? coordinates : [...coordinates, firstPoint];

      return {
        type: "Polygon",
        coordinates: [closedRing],
      };
    }

    if (form.geometryType === "MultiPolygon") {
      if (coordinates.length < 4) {
        throw new Error("MultiPolygon requires at least 4 coordinates.");
      }

      const firstPoint = coordinates[0];
      const lastPoint = coordinates[coordinates.length - 1];

      const isClosed =
        firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];

      const closedRing = isClosed ? coordinates : [...coordinates, firstPoint];

      return {
        type: "MultiPolygon",
        coordinates: [[closedRing]],
      };
    }

    throw new Error("Unsupported geometry type.");
  };

  const getDefaultPointsByGeometryType = (geometryType) => {
    if (geometryType === "Point") {
      return [{ longitude: "102.822281", latitude: "16.474635" }];
    }

    if (geometryType === "MultiPoint") {
      return [
        { longitude: "102.822281", latitude: "16.474635" },
        { longitude: "102.835000", latitude: "16.480000" },
      ];
    }

    if (geometryType === "LineString" || geometryType === "MultiLineString") {
      return [
        { longitude: "102.822281", latitude: "16.474635" },
        { longitude: "102.835000", latitude: "16.480000" },
        { longitude: "102.845000", latitude: "16.490000" },
      ];
    }

    if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
      return [
        { longitude: "102.820000", latitude: "16.470000" },
        { longitude: "102.830000", latitude: "16.470000" },
        { longitude: "102.830000", latitude: "16.480000" },
        { longitude: "102.820000", latitude: "16.480000" },
      ];
    }

    return [{ longitude: "102.822281", latitude: "16.474635" }];
  };

  const resetForm = () => {
    setForm({
      name: "",
      geometryType: "Point",
      points: getDefaultPointsByGeometryType("Point"),
      province: "",
      category: "",
    });

    setEditingPlaceId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || form.points.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Please fill place name and coordinates.",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const payload = {
        name: form.name,
        geometry: buildGeometry(),
        properties: {
          province: form.province,
          category: form.category,
        },
      };

      if (editingPlaceId) {
        await api.put(`/places/${editingPlaceId}`, payload);
        showSuccess("Place updated successfully.");
      } else {
        await api.post("/places", payload);
        showSuccess("Place created successfully.");
      }

      resetForm();
      await fetchPlaces();
    } catch (error) {
      console.error("Failed to save place:", error.response?.data || error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save place.";

      showError(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this place?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/places/${id}`);

      await fetchPlaces();

      showSuccess("Place deleted successfully.");
    } catch (error) {
      console.error("Failed to delete place:", error.response?.data || error);
      showError("Failed to delete place.");
    }
  };

  const convertGeometryToPoints = (geometry) => {
    if (!geometry) {
      return getDefaultPointsByGeometryType("Point");
    }

    if (geometry.type === "Point") {
      return [
        {
          longitude: String(geometry.coordinates?.[0] ?? ""),
          latitude: String(geometry.coordinates?.[1] ?? ""),
        },
      ];
    }

    if (geometry.type === "MultiPoint" || geometry.type === "LineString") {
      return (geometry.coordinates || []).map(([longitude, latitude]) => ({
        longitude: String(longitude),
        latitude: String(latitude),
      }));
    }

    if (geometry.type === "MultiLineString") {
      return (geometry.coordinates?.[0] || []).map(([longitude, latitude]) => ({
        longitude: String(longitude),
        latitude: String(latitude),
      }));
    }

    if (geometry.type === "Polygon") {
      const ring = geometry.coordinates?.[0] || [];

      return ring.slice(0, -1).map(([longitude, latitude]) => ({
        longitude: String(longitude),
        latitude: String(latitude),
      }));
    }

    if (geometry.type === "MultiPolygon") {
      const ring = geometry.coordinates?.[0]?.[0] || [];

      return ring.slice(0, -1).map(([longitude, latitude]) => ({
        longitude: String(longitude),
        latitude: String(latitude),
      }));
    }

    return getDefaultPointsByGeometryType("Point");
  };

  const handleEdit = (place) => {
    setEditingPlaceId(place.id);

    setForm({
      name: place.properties?.name || "",
      geometryType: place.geometry?.type || "Point",
      points: convertGeometryToPoints(place.geometry),
      province: place.properties?.province || "",
      category: place.properties?.category || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Software Engineer Quiz
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Mini Spatial Data Platform
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage GeoJSON places with Laravel API, React, MapLibre and
              TailwindCSS.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200">
              <p className="text-2xl font-bold text-slate-950">
                {places.length}
              </p>
              <p className="text-xs font-medium text-slate-500">Features</p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-200">
              <p className="text-2xl font-bold text-slate-950">
                {new Set(places.map((place) => place.geometry?.type)).size}
              </p>
              <p className="text-xs font-medium text-slate-500">Types</p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center ring-1 ring-blue-100">
              <p className="text-2xl font-bold text-blue-700">API</p>
              <p className="text-xs font-medium text-blue-600">Live Data</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <AddPlaceForm
            form={form}
            isEditing={Boolean(editingPlaceId)}
            onChange={handleChange}
            onPointChange={handlePointChange}
            onAddPoint={addPoint}
            onRemovePoint={removePoint}
            onSubmit={handleSubmit}
            onCancelEdit={resetForm}
          />

          <SearchFilter
            search={search}
            geometryTypeFilter={geometryTypeFilter}
            onSearchChange={(event) => setSearch(event.target.value)}
            onGeometryTypeFilterChange={(event) =>
              setGeometryTypeFilter(event.target.value)
            }
            onReset={() => {
              setSearch("");
              setGeometryTypeFilter("");
            }}
          />
        </aside>

        <section className="min-w-0 space-y-6">
          <MapView places={places} />

          <PlacesTable
            places={places}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
