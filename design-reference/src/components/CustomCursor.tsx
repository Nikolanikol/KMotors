import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100 })
  const targetRef = useRef({ x: -100, y: -100 })
  const isHoveringRef = useRef(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    if (isTouchDevice) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [role="button"], .cursor-pointer')) {
        isHoveringRef.current = true
      }
    }

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [role="button"], .cursor-pointer')) {
        isHoveringRef.current = false
      }
    }

    const animate = () => {
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.15
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.15

      const ringX = posRef.current.x + (targetRef.current.x - posRef.current.x) * 0.5
      const ringY = posRef.current.y + (targetRef.current.y - posRef.current.y) * 0.5

      dot.style.transform = `translate(${posRef.current.x - 6}px, ${posRef.current.y - 6}px)`
      ring.style.transform = `translate(${ringX - 16}px, ${ringY - 16}px)`

      if (isHoveringRef.current) {
        dot.style.width = '0px'
        dot.style.height = '0px'
        ring.style.width = '48px'
        ring.style.height = '48px'
        ring.style.background = 'var(--axis-glow)'
        ring.style.marginLeft = '-8px'
        ring.style.marginTop = '-8px'
      } else {
        dot.style.width = '12px'
        dot.style.height = '12px'
        ring.style.width = '32px'
        ring.style.height = '32px'
        ring.style.background = 'transparent'
        ring.style.marginLeft = '0px'
        ring.style.marginTop = '0px'
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  if (isTouchDevice) return null

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-3 h-3 rounded-full bg-[var(--axis-orange)] pointer-events-none z-[9999] transition-[width,height] duration-300"
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[var(--axis-orange-bright)] pointer-events-none z-[9999] transition-all duration-300"
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </>
  )
}
