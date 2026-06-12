export default function PartsLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-[#0a1628] min-h-[50vh] flex items-center">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-12">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 max-w-xl space-y-4">
              <div className="h-4 bg-gray-700 rounded w-48" />
              <div className="h-10 bg-gray-700 rounded w-80" />
              <div className="h-10 bg-gray-700 rounded w-64" />
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="flex gap-3 mt-4">
                <div className="h-12 bg-gray-700 rounded-full w-40" />
                <div className="h-12 bg-gray-700 rounded-full w-40" />
              </div>
            </div>
            <div className="flex-1 max-w-md h-64 bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Catalog skeleton */}
      <div className="bg-[#F5F7FA] py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8" />
          <div className="h-12 bg-white rounded-xl w-full max-w-2xl mx-auto mb-8 border border-gray-100" />

          <div className="flex gap-6">
            {/* Filters skeleton */}
            <div className="w-60 shrink-0 hidden lg:block space-y-4">
              <div className="bg-white rounded-2xl p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-20" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded flex-1" />
                    <div className="h-4 bg-gray-200 rounded w-10" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cards skeleton */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-40 bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-16 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
