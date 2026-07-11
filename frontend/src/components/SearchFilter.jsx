function SearchFilter({
  variant = "panel",
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
  const isBar = variant === "bar";

  return (
    <section
      className={
        isBar
          ? "rounded-xl bg-white/95 p-2 shadow-2xl ring-1 ring-slate-900/10 backdrop-blur"
          : "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"
      }
    >
      {!isBar && (
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-950">
            Search & Filter
          </h2>
        </div>
      )}

      <div
        className={
          isBar
            ? "grid grid-cols-2 gap-2 md:grid-cols-[minmax(180px,1fr)_minmax(118px,136px)_minmax(130px,160px)] lg:grid-cols-[minmax(220px,1fr)_minmax(132px,150px)_minmax(150px,180px)_96px_auto] lg:items-center xl:grid-cols-[minmax(320px,1fr)_160px_200px_104px_auto]"
            : "grid grid-cols-2 gap-3"
        }
      >
        <div className={isBar ? "col-span-2 md:col-span-1" : "col-span-2"}>
          <label
            className={
              isBar
                ? "sr-only"
                : "mb-1 block text-xs font-medium text-slate-600"
            }
          >
            Search by name
          </label>
          <input
            type="text"
            value={search}
            onChange={onSearchChange}
            placeholder="Search place name..."
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className={isBar ? "min-w-0" : "col-span-2 sm:col-span-1"}>
          <label
            className={
              isBar
                ? "sr-only"
                : "mb-1 block text-xs font-medium text-slate-600"
            }
          >
            Geometry Type
          </label>
          <select
            value={geometryTypeFilter}
            onChange={onGeometryTypeFilterChange}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

        <div className={isBar ? "min-w-0" : "col-span-2 sm:col-span-1"}>
          <label
            className={
              isBar
                ? "sr-only"
                : "mb-1 block text-xs font-medium text-slate-600"
            }
          >
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={onCategoryFilterChange}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">All Collections</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className={isBar ? "min-w-0 md:col-span-1 lg:col-span-1" : ""}>
          <label
            className={
              isBar
                ? "sr-only"
                : "mb-1 block text-xs font-medium text-slate-600"
            }
          >
            Per Page
          </label>
          <select
            value={perPage}
            onChange={onPerPageChange}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
          className="h-10 min-w-0 self-end rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:col-span-2 lg:col-span-1 lg:w-[72px]"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

export default SearchFilter;
