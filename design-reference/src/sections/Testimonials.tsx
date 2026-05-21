import { useRef } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const TESTIMONIALS = [
  {
    quote: 'Купил KIA K5 через K-Axis Motors. Процесс занял 3 недели — от выбора на аукционе до получения во Владивостоке. Машина в идеальном состоянии, все документы в порядке.',
    author: 'Алексей Морозов',
    car: 'KIA K5 2023',
    rating: 5,
  },
  {
    quote: 'Второй раз обращаюсь сюда. Первый раз брал Tucson для жены, теперь Genesis G80 для себя. Отличный сервис, всё прозрачно, цены адекватные. Рекомендую!',
    author: 'Дмитрий Волков',
    car: 'Genesis G80 2024',
    rating: 5,
  },
  {
    quote: 'Долго выбирала между местными дилерами и корейскими аукционами. Остановилась на K-Axis и не пожалела. Сэкономила почти миллион по сравнению с официальным дилером.',
    author: 'Екатерина Соколова',
    car: 'Hyundai Tucson 2024',
    rating: 5,
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill={i < count ? 'var(--axis-orange)' : 'var(--axis-gray-dim)'}
        >
          <path d="M6 0l1.5 3.8H12L8.2 6.2l1.5 3.8L6 9.5 2.3 10l1.5-3.8L0 3.8h4.5z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useScrollAnimation()

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 420
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <section id="testimonials" className="bg-[var(--axis-black)] py-24 md:py-32" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-12 scroll-fade-in">
          <h2 className="font-heading text-3xl md:text-4xl text-[var(--axis-white)]">
            Отзывы клиентов
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-[var(--axis-graphite)] flex items-center justify-center text-[var(--axis-orange)] hover:bg-[var(--axis-orange)] hover:text-white transition-all duration-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-[var(--axis-graphite)] flex items-center justify-center text-[var(--axis-orange)] hover:bg-[var(--axis-orange)] hover:text-white transition-all duration-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-fade-in pb-4"
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="snap-start min-w-[360px] max-w-[400px] flex-shrink-0 bg-[var(--axis-charcoal)] border border-[var(--axis-gray-dim)]/30 rounded-2xl p-6 relative"
            >
              {/* Paint splatter decoration */}
              <svg
                className="absolute top-4 right-4 opacity-10"
                width="40"
                height="40"
                viewBox="0 0 40 40"
              >
                <circle cx="20" cy="20" r="15" fill="var(--axis-orange)" />
                <circle cx="10" cy="12" r="5" fill="var(--axis-amber)" />
                <circle cx="32" cy="28" r="4" fill="var(--axis-orange-bright)" />
              </svg>

              <p className="text-[var(--axis-white)] italic leading-relaxed mb-6 text-sm">
                "{t.quote}"
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--axis-white)]">{t.author}</div>
                  <div className="text-xs text-[var(--axis-gray)]">купил {t.car}</div>
                </div>
                <StarRating count={t.rating} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
