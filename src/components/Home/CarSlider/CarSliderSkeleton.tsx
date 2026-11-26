/**
 * Заглушка карусели на время ожидания Encar (Suspense на главной).
 * Высота повторяет готовую карусель (заголовок + Swiper 570px + отступы),
 * чтобы страница не прыгала, когда данные приходят.
 */
export default function CarSliderSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2" aria-hidden="true">
      <div
        className="h-9 md:h-10 w-40 rounded-md mb-6 animate-pulse"
        style={{ backgroundColor: "var(--axis-graphite)" }}
      />
      <div className="py-4 pb-6">
        <div
          className="h-[610px] rounded-xl animate-pulse"
          style={{ backgroundColor: "var(--axis-charcoal)" }}
        />
      </div>
    </div>
  );
}
