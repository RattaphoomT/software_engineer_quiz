function PlacesTable({
  places,
  loading,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Places</h2>
          <p className="mt-1 text-sm text-slate-500">
            GeoJSON features returned from Laravel API.
          </p>
        </div>

        {loading && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Loading...
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                ID
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Province
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {places.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  No places found
                </td>
              </tr>
            ) : (
              places.map((place) => (
                <tr key={place.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                    #{place.id}
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">
                      {place.properties?.name}
                    </div>
                    <div className="mt-1 max-w-md truncate text-xs text-slate-400">
                      {JSON.stringify(place.geometry?.coordinates)}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      {place.geometry?.type}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {place.properties?.province || "-"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {place.properties?.category || "-"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(place)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(place.id)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {pagination.from || 0}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700">
            {pagination.to || 0}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">
            {pagination.total || 0}
          </span>{" "}
          results
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.current_page <= 1}
            onClick={() => onPageChange(pagination.current_page - 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
            Page {pagination.current_page || 1} / {pagination.last_page || 1}
          </span>

          <button
            type="button"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() => onPageChange(pagination.current_page + 1)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default PlacesTable;
