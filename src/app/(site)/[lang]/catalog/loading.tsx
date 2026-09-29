// Мгновенный скелетон при переходе в каталог (список авто).
// Зеркалит фильтр + сетку карточек, тёмная тема.
export default function CatalogLoading() {
  const box = "var(--axis-charcoal)";
  const dark = "var(--axis-graphite)";
  return (
    <div className="min-h-screen pt-8 overflow-x-hidden" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
          {/* Фильтр */}
          <div className="col-span-1 lg:col-span-3">
            <div className="rounded-2xl h-96" style={{ backgroundColor: box }} />
          </div>
          {/* Сетка карточек */}
          <div className="col-span-1 lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 min-h-[80vh]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: box }}>
                  <div className="aspect-[16/10]" style={{ backgroundColor: dark }} />
                  <div className="p-5 space-y-3">
                    <div className="h-4 rounded w-3/4" style={{ backgroundColor: dark }} />
                    <div className="h-3 rounded w-1/2" style={{ backgroundColor: dark }} />
                    <div className="h-8 rounded mt-4" style={{ backgroundColor: dark }} />
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
