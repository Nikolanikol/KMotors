import { useScrollAnimation } from '../hooks/useScrollAnimation'

const FEATURES = [
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="iconGrad1" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
        </defs>
        <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#iconGrad1)" stroke="#C0C0C0" strokeWidth="0.5" />
        <path d="M18 24l6 6 10-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Проверка на аукционе',
    description: 'Каждый автомобиль проходит тщательную проверку на корейских аукционах Encar, KCar и Manheim.',
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="iconGrad2" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
        </defs>
        <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#iconGrad2)" stroke="#C0C0C0" strokeWidth="0.5" />
        <circle cx="24" cy="22" r="6" stroke="white" strokeWidth="2.5" fill="none" />
        <path d="M24 16v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Полная история',
    description: 'Отчёт о ДТП, количестве владельцев, пробеге и техническом состоянии.',
  },
  {
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="iconGrad3" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
        </defs>
        <path d="M24 4L6 14v20l18 10 18-10V14L24 4z" fill="url(#iconGrad3)" stroke="#C0C0C0" strokeWidth="0.5" />
        <rect x="14" y="20" width="20" height="12" rx="2" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="18" cy="32" r="3" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="30" cy="32" r="3" stroke="white" strokeWidth="2" fill="none" />
      </svg>
    ),
    title: 'Доставка под ключ',
    description: 'От покупки на аукционе до доставки в ваш город — берём всё на себя.',
  },
]

export default function WhyChooseUs() {
  const ref = useScrollAnimation()

  return (
    <section id="why" className="bg-[var(--axis-charcoal)] py-24 md:py-32" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-heading text-3xl md:text-4xl text-[var(--axis-white)] text-center mb-16 scroll-fade-in">
          Почему K<span className="text-[var(--axis-orange)]">-Axis</span>
        </h2>

        <div className="stagger-container grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="stagger-item group bg-[var(--axis-graphite)] rounded-2xl p-8 border border-[var(--axis-orange)]/20 hover:border-[var(--axis-orange)]/50 transition-all duration-300 hover:-translate-y-2"
              style={{
                boxShadow: '0 0 0 rgba(255,69,0,0)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(255,69,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 rgba(255,69,0,0)'
              }}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-[var(--axis-white)] mb-3">{feature.title}</h3>
              <p className="text-sm text-[var(--axis-gray)] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
