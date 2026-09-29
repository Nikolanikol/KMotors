export default function PartsLoading() {
  return (
    <div className="min-h-screen bg-[#131313] animate-pulse">
      {/* Hero skeleton — centered, dark */}
      <section className="pt-16 pb-14 lg:pt-24 lg:pb-20">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 flex flex-col items-center gap-5">
          <div className="h-4 bg-[#2a2a2a] rounded w-52" />
          <div className="h-12 bg-[#2a2a2a] rounded w-full max-w-2xl" />
          <div className="h-6 bg-[#242424] rounded w-full max-w-xl" />
          <div className="h-14 bg-[#1c1b1b] border border-[#333] rounded-full w-full max-w-2xl mt-2" />
          <div className="flex gap-10 sm:gap-16 mt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-7 bg-[#2a2a2a] rounded w-16" />
                <div className="h-3 bg-[#242424] rounded w-14" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog skeleton */}
      <div className="py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-[#2a2a2a] rounded w-64 mx-auto mb-4" />
          <div className="h-4 bg-[#242424] rounded w-96 max-w-full mx-auto mb-8" />
          <div className="h-12 bg-[#201f1f] border border-[#333] rounded-xl w-full max-w-2xl mx-auto mb-8" />

          <div className="flex gap-6">
            {/* Filters skeleton */}
            <div className="w-[260px] shrink-0 hidden lg:block">
              <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl p-5 space-y-3">
                <div className="h-5 bg-[#2a2a2a] rounded w-20" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#2a2a2a] rounded" />
                    <div className="h-4 bg-[#2a2a2a] rounded flex-1" />
                    <div className="h-4 bg-[#242424] rounded w-8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cards skeleton */}
            <div className="flex-1 grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#1c1b1b] border border-[#333] rounded-xl overflow-hidden">
                  <div className="aspect-square bg-white/90" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
                    <div className="h-4 bg-[#2a2a2a] rounded" />
                    <div className="h-9 bg-[#242424] rounded mt-3" />
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
