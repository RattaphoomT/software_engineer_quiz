function SearchFilter({
  search,
  geometryTypeFilter,
  categoryFilter,
  categories,
  perPage,
  onSearchChange,
  onGeometryTypeFilterChange,
  onCategoryFilterChange,
  onPerPageChange,
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px_220px_140px_140px] lg:items-end">
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
            <option value="MultiPoint">MultiPoint</option>
            <option value="LineString">LineString</option>
            <option value="MultiLineString">MultiLineString</option>
            <option value="Polygon">Polygon</option>
            <option value="MultiPolygon">MultiPolygon</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Collection / Category
          </label>
          <select
            value={categoryFilter}
            onChange={onCategoryFilterChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">All Collections</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Per Page
          </label>
          <select
            value={perPage}
            onChange={onPerPageChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
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
