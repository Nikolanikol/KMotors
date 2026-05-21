"use client";
import { useEffect, useRef } from "react";

export function useCountAnimation(end: number, suffix: string = "", duration: number = 2) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const startTime = performance.now();
    const durationMs = duration * 1000;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    let frame: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const value = Math.round(easeOut(progress) * end);
      el.textContent = value.toLocaleString("ru-RU") + suffix;
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          frame = requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, suffix, duration]);

  return ref;
}
