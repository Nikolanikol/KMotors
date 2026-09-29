// Мгновенный скелетон при переходе на страницу авто.
// Encar-фетч в page.tsx блокирующий, поэтому без loading.tsx клик по машине
// оставляет пустой/замерший экран до ответа прокси. Тёмная тема — под реальную вёрстку.
export default function CarDetailLoading() {
  const box = "var(--axis-charcoal)";
  const dark = "var(--axis-graphite)";
  return (
    <div className="min-h-screen pb-24 lg:pb-0" style={{ backgroundColor: "var(--axis-black)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_300px] gap-5 animate-pulse">
          {/* Col 1 — калькулятор (только desktop) */}
          <div className="hidden lg:block order-2 lg:order-1">
            <div className="rounded-2xl h-[520px]" style={{ backgroundColor: box }} />
          </div>

          {/* Col 2 — заголовок + фото + спеки */}
          <div className="space-y-5 order-1 lg:order-2 min-w-0">
            {/* Заголовок */}
            <div className="space-y-2">
              <div className="h-8 rounded w-3/4" style={{ backgroundColor: box }} />
              <div className="h-6 rounded-full w-24" style={{ backgroundColor: box }} />
            </div>
            {/* Главное фото 16/10 */}
            <div className="rounded-2xl" style={{ aspectRatio: "16/10", backgroundColor: dark }} />
            {/* Полоса миниатюр */}
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg flex-shrink-0" style={{ width: 90, height: 60, backgroundColor: box }} />
              ))}
            </div>
            {/* Блоки спеков */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: box }} />
              ))}
            </div>
          </div>

          {/* Col 3 — цена + форма (только desktop) */}
          <div className="hidden lg:block order-3">
            <div className="rounded-2xl h-80" style={{ backgroundColor: box }} />
          </div>
        </div>
      </div>
    </div>
  );
}
