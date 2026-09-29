export default function FitmentLoading() {
  return (
    <div className="bg-gray-50 min-h-screen animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* breadcrumb */}
        <div className="h-4 bg-gray-200 rounded w-64 mb-4" />
        {/* h1 */}
        <div className="h-8 bg-gray-200 rounded w-80 mb-3" />
        {/* intro */}
        <div className="h-4 bg-gray-200 rounded w-full max-w-3xl mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 max-w-2xl mb-2" />
        <div className="h-4 bg-gray-200 rounded w-40 mb-8" />

        {/* product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-square bg-gray-100" />
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
  );
}
