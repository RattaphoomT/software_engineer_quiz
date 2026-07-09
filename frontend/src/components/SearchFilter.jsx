function SearchFilter({
  search,
  geometryTypeFilter,
  onSearchChange,
  onGeometryTypeFilterChange,
  onReset,
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-950">Search & Filter</h2>
        <p className="mt-1 text-sm text-slate-500">
          Filter features by name and geometry type.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Search by name
          </label>
          <input
            type="text"
            value={search}
            onChange={onSearchChange}
            placeholder="Search place name..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Geometry Type
          </label>
          <select
            value={geometryTypeFilter}
            onChange={onGeometryTypeFilterChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">All Types</option>
            <option value="Point">Point</option>
            <option value="LineString">LineString</option>
            <option value="Polygon">Polygon</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reset Filters
        </button>
      </div>
    </section>
  );
}

export default SearchFilter;