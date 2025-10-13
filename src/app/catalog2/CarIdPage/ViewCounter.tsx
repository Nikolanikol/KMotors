"use client";

import { useEffect } from "react";

interface ViewCounterProps {
  carId: string;
}

export default function ViewCounter({ carId }: ViewCounterProps) {
  useEffect(() => {
    // Отправляем просмотр на сервер (в фоне, не блокирует)
    const sendView = async () => {
      try {
        const res = await fetch(`/api/views/${carId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        console.log("View recorded", res);
      } catch (error) {
        console.error("Failed to record view:", error);
      }
    };

    // Задержка в 2 секунды (чтобы не считать "случайные" клики)
    const timeout = setTimeout(sendView, 2000);

    return () => clearTimeout(timeout);
  }, [carId]);

  // Компонент не рендерит ничего видимого
  return null;
}
