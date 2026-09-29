export default function Loading() {
  return (
    <div className="min-h-screen bg-[#131313] animate-pulse">
      {/* Breadcrumb */}
      <div className="border-b border-[#333]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-[#2a2a2a] rounded w-12" />
            <div className="h-4 bg-[#242424] rounded w-3" />
            <div className="h-4 bg-[#2a2a2a] rounded w-16" />
            <div className="h-4 bg-[#242424] rounded w-3" />
            <div className="h-4 bg-[#2a2a2a] rounded w-40" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back link */}
        <div className="h-4 bg-[#2a2a2a] rounded w-32 mb-7" />

        {/* Hero grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Framed image card */}
          <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl overflow-hidden self-start w-full">
            <div className="bg-white/90 aspect-square" />
            <div className="h-14 border-t border-[#333]" />
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="h-6 bg-[#2a2a2a] rounded w-28" />
              <div className="h-6 bg-[#2a2a2a] rounded w-24" />
            </div>
            <div className="h-9 bg-[#2a2a2a] rounded w-4/5" />
            <div className="h-9 bg-[#2a2a2a] rounded w-3/5" />
            {/* part-number plate */}
            <div className="h-12 bg-[#242424] rounded-xl w-64 mt-1" />
            <div className="space-y-2">
              <div className="h-4 bg-[#242424] rounded w-full" />
              <div className="h-4 bg-[#242424] rounded w-5/6" />
            </div>
            {/* price card */}
            <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl p-5 space-y-4 mt-1">
              <div className="h-10 bg-[#2a2a2a] rounded w-28" />
              <div className="h-12 bg-[#2a2a2a] rounded-xl w-full" />
              <div className="h-12 bg-[#242424] rounded-xl w-full" />
            </div>
            {/* info tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-[#1c1b1b] border border-[#333] rounded-xl" />
              <div className="h-16 bg-[#1c1b1b] border border-[#333] rounded-xl" />
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#1c1b1b] border border-[#333] rounded-xl" />
          ))}
        </div>

        {/* Banner */}
        <div className="h-28 bg-[#2a2a2a] rounded-2xl" />
      </div>
    </div>
  );
}
