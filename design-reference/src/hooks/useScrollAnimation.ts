import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const ctx = gsap.context(() => {
      // Fade in elements
      gsap.utils.toArray<HTMLElement>('.scroll-fade-in').forEach((el) => {
        gsap.from(el, {
          y: 40,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        })
      })

      // Stagger cards
      gsap.utils.toArray<HTMLElement>('.stagger-container').forEach((container) => {
        const cards = container.querySelectorAll('.stagger-item')
        gsap.from(cards, {
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            once: true,
          },
        })
      })
    }, ref)

    return () => ctx.revert()
  }, [])

  return ref
}

export function useCountAnimation(end: number, suffix: string = '', duration: number = 2) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const obj = { val: 0 }
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: end,
        duration,
        ease: 'power2.out',
        snap: { val: 1 },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          once: true,
        },
        onUpdate: () => {
          if (ref.current) {
            ref.current.textContent = obj.val.toLocaleString('ru-RU') + suffix
          }
        },
      })
    })

    return () => ctx.revert()
  }, [end, suffix, duration])

  return ref
}
