import { useState, useRef, useCallback } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const CARS = [
  {
    id: 1,
    name: 'KIA K5',
    year: 2024,
    mileage: '15 000 км',
    fuel: 'Бензин',
    priceWon: '32 000 000',
    priceRub: '2 080 000',
    image: '/car-kia-k5.jpg',
    brand: 'Kia',
    type: 'Седан',
  },
  {
    id: 2,
    name: 'Hyundai Tucson',
    year: 2024,
    mileage: '8 000 км',
    fuel: 'Бензин',
    priceWon: '35 000 000',
    priceRub: '2 275 000',
    image: '/car-hyundai-tucson.jpg',
    brand: 'Hyundai',
    type: 'SUV',
  },
  {
    id: 3,
    name: 'Genesis G80',
    year: 2023,
    mileage: '12 000 км',
    fuel: 'Бензин',
    priceWon: '58 000 000',
    priceRub: '3 770 000',
    image: '/car-genesis-g80.jpg',
    brand: 'Genesis',
    type: 'Седан',
  },
  {
    id: 4,
    name: 'KIA Sportage',
    year: 2024,
    mileage: '5 000 км',
    fuel: 'Дизель',
    priceWon: '38 000 000',
    priceRub: '2 470 000',
    image: '/car-kia-sportage.jpg',
    brand: 'Kia',
    type: 'SUV',
  },
  {
    id: 5,
    name: 'Hyundai Staria',
    year: 2024,
    mileage: '3 000 км',
    fuel: 'Дизель',
    priceWon: '42 000 000',
    priceRub: '2 730 000',
    image: '/car-hyundai-staria.jpg',
    brand: 'Hyundai',
    type: 'SUV',
  },
  {
    id: 6,
    name: 'KIA K5 GT',
    year: 2024,
    mileage: '7 000 км',
    fuel: 'Бензин',
    priceWon: '38 000 000',
    priceRub: '2 470 000',
    image: '/car-kia-k5.jpg',
    brand: 'Kia',
    type: 'Седан',
  },
]

const FILTERS = ['Все', 'Kia', 'Hyundai', 'Genesis', 'SUV', 'Седан']

function CarCard({ car }: { car: typeof CARS[0] }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glossyRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    const glossy = glossyRef.current
    if (!card || !glossy) return

    const rect = card.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY

    const rotateY = dx * 0.03
    const rotateX = -dy * 0.03

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`

    const glossyX = ((e.clientX - rect.left) / rect.width) * 100
    const glossyY = ((e.clientY - rect.top) / rect.height) * 100
    glossy.style.background = `radial-gradient(circle at ${glossyX}% ${glossyY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    const glossy = glossyRef.current
    if (!card || !glossy) return
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    glossy.style.background = 'transparent'
  }, [])

  return (
    <div className="stagger-item">
      <div
        ref={cardRef}
        className="group relative bg-[var(--axis-charcoal)] border border-[var(--axis-gray-dim)]/20 rounded-2xl overflow-hidden transition-transform duration-400 cursor-pointer"
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glossy overlay */}
        <div ref={glossyRef} className="absolute inset-0 z-20 pointer-events-none rounded-2xl" />

        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={car.image}
            alt={car.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--axis-charcoal)]/60 to-transparent" />
          <div className="absolute top-3 left-3 px-3 py-1 bg-[var(--axis-orange)] text-white text-xs font-semibold rounded-full">
            {car.year}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-[var(--axis-white)] mb-3">{car.name}</h3>

          {/* Specs */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--axis-orange)" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
              <span className="text-xs text-[var(--axis-gray)]">{car.mileage}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--axis-orange)" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-xs text-[var(--axis-gray)]">{car.fuel}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-xl font-bold text-[var(--axis-orange)] tracking-tight">
              {car.priceWon} <span className="text-sm font-normal">₩</span>
            </div>
            <div className="text-sm text-[var(--axis-gray)]">
              ≈ {car.priceRub} ₽
            </div>
          </div>

          {/* Button */}
          <button className="w-full py-2.5 bg-[var(--axis-graphite)] text-[var(--axis-white)] text-sm font-medium rounded-lg hover:bg-[var(--axis-orange)] transition-colors duration-300">
            Подробнее →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CarCatalog() {
  const [activeFilter, setActiveFilter] = useState('Все')
  const containerRef = useScrollAnimation()

  const filteredCars = activeFilter === 'Все'
    ? CARS
    : CARS.filter((car) =>
        car.brand === activeFilter || car.type === activeFilter
      )

  return (
    <section id="catalog" className="bg-[var(--axis-black)] py-24 md:py-32" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="scroll-fade-in">
            <h2 className="font-heading text-3xl md:text-4xl text-[var(--axis-white)] mb-2">
              Каталог автомобилей
            </h2>
            {/* Paint drip accent SVG */}
            <svg width="200" height="12" viewBox="0 0 200 12" className="opacity-80">
              <defs>
                <linearGradient id="dripGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4500" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="200" height="3" fill="url(#dripGrad)" rx="1.5" />
              <circle cx="30" cy="6" r="4" fill="url(#dripGrad)" opacity="0.8">
                <animate attributeName="cy" values="6;9;6" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="80" cy="5" r="3" fill="url(#dripGrad)" opacity="0.7">
                <animate attributeName="cy" values="5;8;5" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="140" cy="7" r="5" fill="url(#dripGrad)" opacity="0.9">
                <animate attributeName="cy" values="7;10;7" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="180" cy="5" r="3.5" fill="url(#dripGrad)" opacity="0.75">
                <animate attributeName="cy" values="5;8;5" dur="2.8s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <a href="#" className="text-sm text-[var(--axis-orange)] hover:text-[var(--axis-orange-bright)] transition-colors scroll-fade-in">
            Все автомобили →
          </a>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-10 scroll-fade-in">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-[var(--axis-orange)] text-white'
                  : 'bg-[var(--axis-graphite)] text-[var(--axis-gray)] hover:bg-[var(--axis-charcoal)]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="stagger-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  )
}
