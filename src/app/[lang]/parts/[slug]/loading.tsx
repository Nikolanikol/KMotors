export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] animate-pulse">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-12" />
            <div className="h-4 bg-gray-200 rounded w-3" />
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-3" />
            <div className="h-4 bg-gray-200 rounded w-40" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back link */}
        <div className="h-4 bg-gray-200 rounded w-32 mb-7" />

        {/* Hero grid */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 mb-10">
          {/* Image card */}
          <div className="bg-white rounded-2xl shadow-sm" style={{ minHeight: "320px" }} />

          {/* Info card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-4">
            <div className="h-7 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded w-36 mt-2" />
            <div className="h-14 bg-gray-200 rounded w-full mt-1" />
            <div className="h-12 bg-gray-200 rounded w-full" />
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
              <div className="h-4 bg-gray-200 rounded w-3/5" />
            </div>
          </div>
        </div>

        {/* Compatible models */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-10">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
          <div className="grid sm:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="h-7 bg-gray-200 rounded-full w-20" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gray-200 rounded-2xl h-24" />
      </div>
    </div>
  );
}
