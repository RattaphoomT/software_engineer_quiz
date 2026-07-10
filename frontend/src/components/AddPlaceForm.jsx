function AddPlaceForm({ form, isEditing, onChange, onSubmit, onCancelEdit }) {
  const getCoordinateExample = (type) => {
    const examples = {
      Point: "[102.822281, 16.474635]",
      MultiPoint: "[[102.822281, 16.474635], [102.835000, 16.480000]]",
      LineString:
        "[[102.822281, 16.474635], [102.835000, 16.480000], [102.845000, 16.490000]]",
      MultiLineString:
        "[[[102.822281, 16.474635], [102.835000, 16.480000]], [[102.840000, 16.485000], [102.850000, 16.495000]]]",
      Polygon:
        "[[[102.820000, 16.470000], [102.830000, 16.470000], [102.830000, 16.480000], [102.820000, 16.480000], [102.820000, 16.470000]]]",
      MultiPolygon:
        "[[[[102.820000, 16.470000], [102.830000, 16.470000], [102.830000, 16.480000], [102.820000, 16.480000], [102.820000, 16.470000]]], [[[102.840000, 16.490000], [102.850000, 16.490000], [102.850000, 16.500000], [102.840000, 16.500000], [102.840000, 16.490000]]]]",
    };

    return examples[type] || examples.Point;
  };
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-950">
          {isEditing ? "Edit Place" : "Add Place"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {isEditing
            ? "Update selected Point feature."
            : "Create a new GeoJSON Point feature."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
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
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Coordinates JSON
          </label>

          <textarea
            name="coordinates"
            value={form.coordinates}
            onChange={onChange}
            rows={6}
            placeholder="[102.822281, 16.474635]"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={() =>
              onChange({
                target: {
                  name: "coordinates",
                  value: getCoordinateExample(form.geometryType),
                },
              })
            }
            className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Use Example Coordinates
          </button>

          <p className="mt-1 text-xs text-slate-400">
            Use GeoJSON coordinates format. Example Point: [102.822281,
            16.474635]
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Province
            </label>
            <input
              type="text"
              name="province"
              value={form.province}
              onChange={onChange}
              placeholder="Khon Kaen"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
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
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            {isEditing ? "Update Place" : "Add Place"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
