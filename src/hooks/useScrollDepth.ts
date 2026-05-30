"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/utils/gtag";

export function useScrollDepth(pageName?: string) {
  const reached = useRef<Set<number>>(new Set());

  useEffect(() => {
    reached.current = new Set();

    function onScroll() {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.round((scrolled / total) * 100);

      for (const milestone of [25, 50, 75, 90]) {
        if (pct >= milestone && !reached.current.has(milestone)) {
          reached.current.add(milestone);
          trackEvent("scroll_depth", {
            depth:     milestone,
            page_name: pageName ?? window.location.pathname,
          });
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pageName]);
}
