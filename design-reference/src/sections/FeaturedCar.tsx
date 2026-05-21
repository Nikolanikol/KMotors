import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function FeaturedCar() {
  const ref = useScrollAnimation()

  return (
    <section className="bg-gradient-to-b from-[var(--axis-black)] to-[var(--axis-charcoal)] py-24 md:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center scroll-fade-in">
          {/* Image with paint drip frame */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="/car-kia-k5.jpg"
                alt="KIA K5 2024"
                className="w-full aspect-[3/2] object-cover"
              />
              {/* Paint drip frame overlay */}
              <svg
                className="absolute bottom-0 left-0 right-0"
                viewBox="0 0 600 40"
                preserveAspectRatio="none"
                style={{ height: '30px', width: '100%' }}
              >
                <defs>
                  <linearGradient id="frameDrip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4500" />
                    <stop offset="100%" stopColor="#FF8C00" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 0 L0 10 Q15 30, 30 15 Q45 35, 60 12 Q75 28, 90 14 Q105 32, 120 10 Q135 25, 150 15 Q165 30, 180 12 Q195 26, 210 14 Q225 28, 240 10 Q255 24, 270 16 Q285 30, 300 12 Q315 26, 330 14 Q345 28, 360 10 Q375 24, 390 16 Q405 30, 420 12 Q435 26, 450 14 Q465 28, 480 10 Q495 24, 510 16 Q525 30, 540 12 Q555 26, 570 14 Q585 28, 600 10 L600 0 Z"
                  fill="url(#frameDrip)"
                />
              </svg>
            </div>
            {/* Drop shadow */}
            <div
              className="absolute -bottom-4 left-4 right-4 h-8 rounded-full opacity-30 blur-xl"
              style={{ background: 'linear-gradient(135deg, #FF4500, #FF8C00)' }}
            />
          </div>

          {/* Content */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-[var(--axis-orange)] text-white text-xs font-semibold rounded-full tracking-wide mb-4">
              Хит продаж
            </span>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-[var(--axis-white)] mb-4 leading-tight">
              KIA K5 2024
            </h2>

            <p className="text-[var(--axis-gray)] mb-8 leading-relaxed">
              Премиальный седан бизнес-класса. Полная комплектация с люком, кожаным салоном и системой автопилота.
            </p>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 6v6l4 2', label: 'Пробег', value: '15 000 км' },
                { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', label: 'Двигатель', value: '2.0L' },
                { icon: 'M4 4h16v16H4zM4 12h16M12 4v16', label: 'КПП', value: 'Автомат' },
                { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', label: 'Топливо', value: 'Бензин' },
              ].map((spec) => (
                <div key={spec.label} className="flex items-center gap-3 bg-[var(--axis-graphite)] rounded-xl p-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--axis-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={spec.icon} />
                  </svg>
                  <div>
                    <div className="text-xs text-[var(--axis-gray)]">{spec.label}</div>
                    <div className="text-sm font-medium text-[var(--axis-white)]">{spec.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="mb-8">
              <span className="text-3xl font-bold text-[var(--axis-orange)] tracking-tight">18 500 000 ₽</span>
              <span className="ml-3 text-sm text-[var(--axis-gray)] line-through">22 000 000 ₽</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3.5 bg-[var(--axis-orange)] text-white font-semibold rounded-full hover:bg-[var(--axis-orange-bright)] transition-all duration-300 glow-orange">
                Оставить заявку
              </button>
              <button className="px-8 py-3.5 border-2 border-[var(--axis-orange)] text-[var(--axis-orange)] font-semibold rounded-full hover:bg-[var(--axis-orange)] hover:text-white transition-all duration-300">
                Рассчитать доставку
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
