import { useState, useEffect } from 'react'

const NAV_LINKS = [
  { label: 'Главная', href: '#hero' },
  { label: 'Каталог', href: '#catalog' },
  { label: 'Как купить', href: '#why' },
  { label: 'Контакты', href: '#contacts' },
  { label: 'Запчасти', href: '#catalog' },
  { label: 'Блог', href: '#testimonials' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-300 ${
          scrolled ? 'glass-effect' : 'bg-transparent'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 group" onClick={() => handleNavClick('#hero')}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="transition-transform duration-300 group-hover:scale-110">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#FF4500" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </linearGradient>
              </defs>
              <path d="M4 32L16 4H22L14 20L28 4H32L18 20L28 32H22L12 20L8 32H4Z" fill="url(#logoGrad)" stroke="#C0C0C0" strokeWidth="0.5" />
              <path d="M20 4L32 4L24 14L20 4Z" fill="#FF6B1A" opacity="0.6" />
            </svg>
            <span className="font-heading text-xl tracking-tight text-[var(--axis-white)]">
              K<span className="text-[var(--axis-orange)]">-Axis</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-medium text-[var(--axis-gray)] hover:text-[var(--axis-orange)] transition-colors duration-200 tracking-wide"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:+821077324344" className="text-sm text-[var(--axis-gray)] hover:text-[var(--axis-white)] transition-colors">
              +82 10-7732-4344
            </a>
            <button
              onClick={() => handleNavClick('#contacts')}
              className="px-6 py-2.5 bg-[var(--axis-orange)] text-[var(--axis-white)] text-sm font-semibold rounded-full hover:bg-[var(--axis-orange-bright)] transition-all duration-300 glow-orange"
            >
              Оставить заявку
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span className="w-6 h-0.5 bg-[var(--axis-white)]" />
            <span className="w-6 h-0.5 bg-[var(--axis-white)]" />
            <span className="w-4 h-0.5 bg-[var(--axis-white)]" />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-[var(--axis-black)]/95 backdrop-blur-xl transition-transform duration-400 lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex flex-col h-full p-8">
          <button
            onClick={() => setMobileOpen(false)}
            className="self-end p-2 text-[var(--axis-white)]"
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <nav className="flex flex-col items-center justify-center flex-1 gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-2xl font-heading text-[var(--axis-white)] hover:text-[var(--axis-orange)] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}
