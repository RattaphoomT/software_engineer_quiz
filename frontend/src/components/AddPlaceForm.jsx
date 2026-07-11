import { useEffect, useMemo, useRef, useState } from "react";

const THAI_PROVINCES = [
  "Amnat Charoen",
  "Ang Thong",
  "Bangkok",
  "Bueng Kan",
  "Buri Ram",
  "Chachoengsao",
  "Chai Nat",
  "Chaiyaphum",
  "Chanthaburi",
  "Chiang Mai",
  "Chiang Rai",
  "Chon Buri",
  "Chumphon",
  "Kalasin",
  "Kamphaeng Phet",
  "Kanchanaburi",
  "Khon Kaen",
  "Krabi",
  "Lampang",
  "Lamphun",
  "Loei",
  "Lop Buri",
  "Mae Hong Son",
  "Maha Sarakham",
  "Mukdahan",
  "Nakhon Nayok",
  "Nakhon Pathom",
  "Nakhon Phanom",
  "Nakhon Ratchasima",
  "Nakhon Sawan",
  "Nakhon Si Thammarat",
  "Nan",
  "Narathiwat",
  "Nong Bua Lam Phu",
  "Nong Khai",
  "Nonthaburi",
  "Pathum Thani",
  "Pattani",
  "Phang Nga",
  "Phatthalung",
  "Phayao",
  "Phetchabun",
  "Phetchaburi",
  "Phichit",
  "Phitsanulok",
  "Phra Nakhon Si Ayutthaya",
  "Phrae",
  "Phuket",
  "Prachin Buri",
  "Prachuap Khiri Khan",
  "Ranong",
  "Ratchaburi",
  "Rayong",
  "Roi Et",
  "Sa Kaeo",
  "Sakon Nakhon",
  "Samut Prakan",
  "Samut Sakhon",
  "Samut Songkhram",
  "Saraburi",
  "Satun",
  "Sing Buri",
  "Sisaket",
  "Songkhla",
  "Sukhothai",
  "Suphan Buri",
  "Surat Thani",
  "Surin",
  "Tak",
  "Trang",
  "Trat",
  "Ubon Ratchathani",
  "Udon Thani",
  "Uthai Thani",
  "Uttaradit",
  "Yala",
  "Yasothon",
];

function ProvinceCombobox({ value, onChange }) {
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  const filteredProvinces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return THAI_PROVINCES;
    }

    return THAI_PROVINCES.filter((province) =>
      province.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery(value || "");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [value]);

  const selectProvince = (province) => {
    setQuery(province);
    setIsOpen(false);
    onChange({
      target: {
        name: "province",
        value: province,
      },
    });
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setIsOpen(true);
  };

  const handleBlur = () => {
    const exactMatch = THAI_PROVINCES.find(
      (province) => province.toLowerCase() === query.trim().toLowerCase(),
    );

    if (exactMatch) {
      selectProvince(exactMatch);
      return;
    }

    setQuery(value || "");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onBlur={handleBlur}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder="Search province..."
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />

      {isOpen && (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {filteredProvinces.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">
              No province found
            </div>
          ) : (
            filteredProvinces.map((province) => (
              <button
                key={province}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectProvince(province)}
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {province}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AddPlaceForm({
  form,
  isEditing,
  onChange,
  onPointChange,
  onAddPoint,
  onRemovePoint,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-950">
          {isEditing ? "Edit Place" : "Add Place"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEditing
            ? "Update the selected GeoJSON feature."
            : "Create a new GeoJSON feature."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-normal text-slate-700">
            Place Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Khon Kaen University"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-normal text-slate-700">
            Geometry Type
          </label>
          <select
            name="geometryType"
            value={form.geometryType}
            onChange={onChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="Point">Point</option>
            <option value="MultiPoint">MultiPoint</option>
            <option value="LineString">LineString</option>
            <option value="MultiLineString">MultiLineString</option>
            <option value="Polygon">Polygon</option>
            <option value="MultiPolygon">MultiPolygon</option>
          </select>
          <p className="mt-1 text-xs text-slate-400">
            LineString and Polygon are supported by API and map display.
          </p>
        </div>

        <div>
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="block text-sm font-normal text-slate-700">
                Coordinates
              </label>
              <p className="mt-1 text-xs text-slate-400">
                Enter longitude and latitude for each point.
              </p>
            </div>

            {form.geometryType !== "Point" && (
              <button
                type="button"
                onClick={onAddPoint}
                className="w-full rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 sm:w-auto"
              >
                + Add Point
              </button>
            )}
          </div>

          <div className="space-y-3">
            {form.points.map((point, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Point {index + 1}
                  </p>

                  {form.geometryType !== "Point" && form.points.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemovePoint(index)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-normal text-slate-600">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={point.longitude}
                      onChange={(event) =>
                        onPointChange(index, "longitude", event.target.value)
                      }
                      placeholder="102.822281"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-normal text-slate-600">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={point.latitude}
                      onChange={(event) =>
                        onPointChange(index, "latitude", event.target.value)
                      }
                      placeholder="16.474635"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(form.geometryType === "Polygon" ||
            form.geometryType === "MultiPolygon") && (
            <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Polygon will be closed automatically by connecting the last point
              back to the first point.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-normal text-slate-700">
              Province
            </label>
            <ProvinceCombobox
              value={form.province}
              onChange={onChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-normal text-slate-700">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={onChange}
              placeholder="University"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            {isEditing ? "Update Place" : "Add Place"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default AddPlaceForm;
