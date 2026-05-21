import PaintSplashCanvas from '../components/PaintSplashCanvas'
import { useCountAnimation } from '../hooks/useScrollAnimation'

function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const ref = useCountAnimation(end, suffix)
  return (
    <div className="flex flex-col items-center">
      <span ref={ref} className="text-3xl md:text-4xl font-bold text-[var(--axis-orange)] tracking-tight">
        0{suffix}
      </span>
      <span className="text-xs text-[var(--axis-gray)] tracking-widest uppercase mt-1">{label}</span>
    </div>
  )
}

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <PaintSplashCanvas />

      {/* Content overlay */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--axis-white)] mb-6 leading-tight"
          style={{ textShadow: '0 0 60px rgba(255,69,0,0.3)' }}
        >
          Автомобили из Кореи
        </h1>

        <p className="text-base md:text-lg text-[var(--axis-gray)] max-w-xl mx-auto mb-10 leading-relaxed">
          Прямые поставки из Южной Кореи. Проверенные авто с полной историей.
        </p>

        <a
          href="#catalog"
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="paint-splash-btn inline-block px-10 py-4 border-2 border-[var(--axis-orange)] text-[var(--axis-orange)] font-semibold rounded-full hover:bg-[var(--axis-orange)] hover:text-[var(--axis-white)] transition-all duration-300 relative z-10"
        >
          <span className="relative z-10">Смотреть каталог</span>
        </a>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 md:gap-16 mt-20">
          <StatCounter end={1240} suffix="+" label="Авто в каталоге" />
          <div className="w-px h-12 bg-[var(--axis-gray-dim)]/30" />
          <StatCounter end={850} suffix="+" label="Довольных клиентов" />
          <div className="w-px h-12 bg-[var(--axis-gray-dim)]/30 hidden sm:block" />
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-3xl md:text-4xl font-bold text-[var(--axis-orange)] tracking-tight">12 лет</span>
            <span className="text-xs text-[var(--axis-gray)] tracking-widest uppercase mt-1">На рынке</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <div className="w-px h-10 bg-[var(--axis-gray-dim)]/30 relative overflow-hidden">
          <div
            className="w-2 h-2 rounded-full bg-[var(--axis-orange)] absolute left-1/2 -translate-x-1/2"
            style={{
              animation: 'scrollBounce 2s ease-in-out infinite',
            }}
          />
        </div>
        <style>{`
          @keyframes scrollBounce {
            0%, 100% { top: 0; opacity: 1; }
            50% { top: calc(100% - 8px); opacity: 0.3; }
          }
        `}</style>
      </div>
    </section>
  )
}
