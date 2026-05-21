import { useState } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function CTASection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const ref = useScrollAnimation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className="relative py-24 md:py-32 overflow-hidden" ref={ref}>
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/bg-paint-splash.jpg)' }}
      />
      <div className="absolute inset-0 bg-[var(--axis-black)]/80" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center scroll-fade-in">
        <h2 className="font-heading text-3xl md:text-4xl text-[var(--axis-white)] mb-4">
          Готовы найти свой автомобиль?
        </h2>
        <p className="text-[var(--axis-gray)] mb-10 leading-relaxed">
          Оставьте заявку — мы подберём лучшие варианты из Кореи под ваш бюджет.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ваш email"
              required
              className="flex-1 px-6 py-4 bg-transparent border border-[var(--axis-gray-dim)]/50 rounded-full text-[var(--axis-white)] placeholder:text-[var(--axis-gray)]/50 focus:outline-none focus:border-[var(--axis-orange)] transition-colors"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-[var(--axis-orange)] text-white font-semibold rounded-full hover:bg-[var(--axis-orange-bright)] transition-all duration-300 glow-orange whitespace-nowrap"
            >
              Отправить
            </button>
          </form>
        ) : (
          <div className="px-8 py-4 bg-[var(--axis-orange)]/20 border border-[var(--axis-orange)]/50 rounded-full text-[var(--axis-orange)] font-semibold inline-block">
            Спасибо! Мы свяжемся с вами в ближайшее время.
          </div>
        )}
      </div>
    </section>
  )
}
