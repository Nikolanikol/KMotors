"use client";

import { useEffect } from "react";

interface CarViewTrackerProps {
  carId: string;
  carName: string;
}

export default function CarViewTracker({ carId, carName }: CarViewTrackerProps) {
  useEffect(() => {
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

  return null;
}
