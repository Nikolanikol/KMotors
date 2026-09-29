export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] py-8 px-4 animate-pulse">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <div className="h-4 bg-gray-200 rounded w-40 mb-6" />

        {/* Title */}
        <div className="h-8 bg-gray-200 rounded w-56 mb-8" />

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 py-3 border-b border-gray-50">
              <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 space-y-4">
          <div className="h-5 bg-gray-200 rounded w-36" />
          <div className="h-10 bg-gray-100 rounded-lg w-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-10 bg-gray-100 rounded-lg w-full" />
        </div>

        {/* Total */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-28" />
            </div>
            <div className="h-12 bg-gray-200 rounded-xl w-44" />
          </div>
        </div>
      </div>
    </div>
  );
}
