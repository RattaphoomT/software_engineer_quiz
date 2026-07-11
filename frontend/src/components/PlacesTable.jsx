function PlacesTable({
  places,
  loading,
  pagination,
  selectedPlaceId,
  onPageChange,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Places</h2>
          <p className="mt-1 text-xs text-slate-500">Laravel API results</p>
        </div>

        {loading && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Loading...
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {places.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No places found
          </div>
        ) : (
          places.map((place) => (
            <article
              key={place.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(place)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(place);
                }
              }}
              className={`cursor-pointer px-4 py-3 outline-none transition hover:bg-blue-50/60 focus:bg-blue-50 ${
                selectedPlaceId === place.id
                  ? "bg-blue-50 ring-1 ring-inset ring-blue-100"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-xs font-normal text-slate-400">
                      #{place.id}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                      {place.geometry?.type}
                    </span>
                  </div>

                  <h3 className="mt-1 truncate text-sm font-medium text-slate-950">
                    {place.properties?.name}
                  </h3>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {place.properties?.category || "-"} ·{" "}
                    {place.properties?.province || "-"}
                  </p>

                  <p className="mt-1 truncate text-[11px] text-slate-400">
                    {JSON.stringify(place.geometry?.coordinates)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-1">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(place);
                    }}
                    className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    Edit
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(place.id);
                    }}
                    className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-medium text-slate-700">
            {pagination.from || 0}
          </span>{" "}
          to{" "}
          <span className="font-medium text-slate-700">
            {pagination.to || 0}
          </span>{" "}
          of{" "}
          <span className="font-medium text-slate-700">
            {pagination.total || 0}
          </span>{" "}
          results
        </p>

        <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <button
            type="button"
            disabled={pagination.current_page <= 1}
            onClick={() => onPageChange(pagination.current_page - 1)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="order-first col-span-2 rounded-md bg-slate-100 px-3 py-1.5 text-center text-xs font-medium text-slate-700 sm:order-none sm:col-span-1">
            Page {pagination.current_page || 1} / {pagination.last_page || 1}
          </span>

          <button
            type="button"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() => onPageChange(pagination.current_page + 1)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default PlacesTable;
