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
    coordinates: "[102.822281, 16.474635]",
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildGeometry = () => {
    let parsedCoordinates;

    try {
      parsedCoordinates = JSON.parse(form.coordinates);
    } catch {
      throw new Error("Coordinates must be valid JSON.");
    }

    return {
      type: form.geometryType,
      coordinates: parsedCoordinates,
    };
  };

  const resetForm = () => {
    setForm({
      name: "",
      geometryType: "Point",
      coordinates: "[102.822281, 16.474635]",
      province: "",
      category: "",
    });

    setEditingPlaceId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.coordinates) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Please fill name and coordinates.",
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

  const handleEdit = (place) => {
    setEditingPlaceId(place.id);

    setForm({
      name: place.properties?.name || "",
      geometryType: place.geometry?.type || "Point",
      coordinates: JSON.stringify(place.geometry?.coordinates || [], null, 2),
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
