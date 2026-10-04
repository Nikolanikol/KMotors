"use client";

import { useEffect } from "react";
import { trackEvent } from "@/utils/gtag";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import FunnelTracker from "@/components/analytics/FunnelTracker";

interface CarViewTrackerProps {
  carId: string;
  carName: string;
  price?: number;
}

export default function CarViewTracker({ carId, carName, price }: CarViewTrackerProps) {
  useScrollDepth(`car_${carId}`);

  useEffect(() => {
    trackEvent("view_item", {
      item_id:       carId,
      item_name:     carName,
      // Раздел воронки (section) проставляет trackEvent; item_category — для
      // отчётов GA4 по товарам, тем же словом.
      item_category: "encar",
      value:         price,
    });
    // Один просмотр на машину за сессию — обновление страницы не считается
    const key = `cv_${carId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const sessionId = document.cookie
      .split("; ")
      .find((r) => r.startsWith("session_id="))
      ?.split("=")[1];

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "car_view",
        sessionId: sessionId || null,
        properties: { car_id: carId, car_name: carName },
      }),
      keepalive: true,
    }).catch(() => {});
  }, [carId, carName]);

  // Шаги страницы машины: какие блоки увидел, что нажимал (FunnelTracker).
  return <FunnelTracker itemId={carId} itemName={carName} />;
}
