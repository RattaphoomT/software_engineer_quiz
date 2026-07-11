import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "./services/api";
import AddPlaceForm from "./components/AddPlaceForm";
import SearchFilter from "./components/SearchFilter";
import MapView from "./components/MapView";
import PlacesTable from "./components/PlacesTable";

function App() {
  const [places, setPlaces] = useState([]);
  const [mapPlaces, setMapPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [geometryTypeFilter, setGeometryTypeFilter] = useState("");

  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activePanel, setActivePanel] = useState("browse");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const ToggleSidebarIcon = isSidebarOpen ? (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
    </svg>
  );

  const [form, setForm] = useState({
    name: "",
    geometryType: "Point",
    points: [
      {
        longitude: "",
        latitude: "",
      },
    ],
    province: "",
    category: "",
  });

  const showSuccess = useCallback((message) => {
    Swal.fire({
      icon: "success",
      title: "Success",
      text: message,
      timer: 1600,
      showConfirmButton: false,
    });
  }, []);

  const showError = useCallback((message) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      confirmButtonText: "OK",
    });
  }, []);

  const [editingPlaceId, setEditingPlaceId] = useState(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: null,
    to: null,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/places/categories");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch categories:",
        error.response?.data || error,
      );
    }
  }, []);

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/places", {
        params: {
          search: search || undefined,
          geometry_type: geometryTypeFilter || undefined,
          category: categoryFilter || undefined,
          page,
          per_page: perPage,
        },
      });

      setPlaces(response.data.features || []);
      setPagination(
        response.data.meta || {
          current_page: 1,
          per_page: perPage,
          total: 0,
          last_page: 1,
          from: null,
          to: null,
        },
      );
    } catch (error) {
      console.error("Failed to fetch places:", error.response?.data || error);
      showError("Failed to fetch places");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, geometryTypeFilter, page, perPage, search, showError]);

  const fetchMapPlaces = useCallback(async () => {
    try {
      const response = await api.get("/places", {
        params: {
          search: search || undefined,
          geometry_type: geometryTypeFilter || undefined,
          category: categoryFilter || undefined,
          all: true,
        },
      });

      setMapPlaces(response.data.features || []);
    } catch (error) {
      console.error("Failed to fetch map places:", error.response?.data || error);
      showError("Failed to fetch map places");
    }
  }, [categoryFilter, geometryTypeFilter, search, showError]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  useEffect(() => {
    fetchMapPlaces();
  }, [fetchMapPlaces]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleGeometryTypeFilterChange = (event) => {
    setGeometryTypeFilter(event.target.value);
    setPage(1);
  };

  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
    setPage(1);
  };

  const handlePerPageChange = (event) => {
    setPerPage(Number(event.target.value));
    setPage(1);
  };

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
    const hasEmptyPoint = form.points.some(
      (point) => point.longitude === "" || point.latitude === "",
    );

    if (hasEmptyPoint) {
      throw new Error("Please fill longitude and latitude for every point.");
    }

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
      return [{ longitude: "", latitude: "" }];
    }

    if (geometryType === "MultiPoint") {
      return [
        { longitude: "", latitude: "" },
        { longitude: "", latitude: "" },
      ];
    }

    if (geometryType === "LineString" || geometryType === "MultiLineString") {
      return [
        { longitude: "", latitude: "" },
        { longitude: "", latitude: "" },
      ];
    }

    if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
      return [
        { longitude: "", latitude: "" },
        { longitude: "", latitude: "" },
        { longitude: "", latitude: "" },
        { longitude: "", latitude: "" },
      ];
    }

    return [{ longitude: "", latitude: "" }];
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
      await Promise.all([fetchPlaces(), fetchMapPlaces(), fetchCategories()]);
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

      await Promise.all([fetchPlaces(), fetchMapPlaces(), fetchCategories()]);

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
    setActivePanel("add");

    setForm({
      name: place.properties?.name || "",
      geometryType: place.geometry?.type || "Point",
      points: convertGeometryToPoints(place.geometry),
      province: place.properties?.province || "",
      category: place.properties?.category || "",
    });
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-slate-950 text-slate-900">
      <MapView
        places={mapPlaces}
        selectedCategory={categoryFilter}
        focusedPlace={selectedPlace}
        onFeatureSelect={setSelectedPlace}
      />

      <div
        className={`fixed left-3 right-3 top-3 z-20 transition-all duration-300 sm:left-4 sm:right-4 md:right-auto md:top-4 md:max-w-[760px] lg:max-w-[920px] ${
          isSidebarOpen
            ? "md:left-[352px] lg:left-[432px]"
            : "md:left-20"
        }`}
      >
        <SearchFilter
          variant="bar"
          search={search}
          geometryTypeFilter={geometryTypeFilter}
          categoryFilter={categoryFilter}
          categories={categories}
          perPage={perPage}
          onSearchChange={handleSearchChange}
          onGeometryTypeFilterChange={handleGeometryTypeFilterChange}
          onCategoryFilterChange={handleCategoryFilterChange}
          onPerPageChange={handlePerPageChange}
          onReset={() => {
            setSearch("");
            setGeometryTypeFilter("");
            setCategoryFilter("");
            setPerPage(10);
            setPage(1);
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => setIsSidebarOpen((current) => !current)}
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
        className={`fixed z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-xl ring-1 ring-slate-900/10 transition-all duration-300 hover:text-blue-700 ${
          isSidebarOpen
            ? "bottom-[calc(58dvh+0.75rem)] right-4 md:bottom-auto md:right-auto md:left-[316px] md:top-1/2 md:-translate-y-1/2 lg:left-[396px]"
            : "bottom-4 left-4 md:bottom-auto md:top-4"
        }`}
      >
        {ToggleSidebarIcon}
      </button>

      <aside
        className={`fixed bottom-0 left-0 right-0 z-10 flex max-h-[58dvh] min-h-0 flex-col overflow-hidden rounded-t-2xl bg-white/95 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur transition-transform duration-300 sm:bottom-3 sm:left-3 sm:right-3 sm:rounded-2xl md:bottom-4 md:left-4 md:right-auto md:top-4 md:max-h-none md:w-[312px] md:rounded-xl lg:w-[392px] ${
          isSidebarOpen
            ? "translate-y-0 md:translate-x-0 md:translate-y-0"
            : "translate-y-[calc(100%+1rem)] md:-translate-x-[calc(100%+1rem)] md:translate-y-0"
        }`}
      >
        <div className="border-b border-slate-200 px-4 py-3 lg:py-4">
          <p className="text-xs font-medium uppercase text-blue-600">
            Software Engineer Quiz
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-950 lg:text-xl">
                Mini Spatial Data Platform
              </h1>
              <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                Laravel API, React, MapLibre and TailwindCSS.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 lg:mt-4">
            <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <p className="text-base font-semibold text-slate-950 lg:text-lg">
                {pagination.total}
              </p>
              <p className="text-[11px] font-normal text-slate-500">
                Features
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <p className="text-base font-semibold text-slate-950 lg:text-lg">
                {new Set(mapPlaces.map((place) => place.geometry?.type)).size}
              </p>
              <p className="text-[11px] font-normal text-slate-500">Types</p>
            </div>

            <div className="rounded-lg bg-blue-50 px-3 py-2 ring-1 ring-blue-100">
              <p className="text-base font-semibold text-blue-700 lg:text-lg">API</p>
              <p className="text-[11px] font-normal text-blue-600">Live</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 rounded-lg bg-slate-100 p-1 lg:mt-4">
            <button
              type="button"
              onClick={() => setActivePanel("browse")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activePanel === "browse"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Browse
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("add")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activePanel === "add"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {editingPlaceId ? "Edit" : "Add"}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 lg:py-4">
          {activePanel === "browse" ? (
            <div>
              <PlacesTable
                places={places}
                loading={loading}
                pagination={pagination}
                selectedPlaceId={selectedPlace?.id}
                onPageChange={setPage}
                onSelect={setSelectedPlace}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ) : (
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
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
