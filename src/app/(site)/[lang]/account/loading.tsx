export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] py-8 px-4 animate-pulse">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-5">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-3" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="h-7 bg-gray-200 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-52" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-10 bg-gray-100 rounded-xl" />
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-10 bg-gray-100 rounded-lg w-full" />
            </div>
          ))}
          <div className="h-10 bg-gray-200 rounded-xl w-32 mt-4" />
        </div>
      </div>
    </div>
  );
}
