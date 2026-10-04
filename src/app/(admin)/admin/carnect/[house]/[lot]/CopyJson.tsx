"use client";

// Кнопка «скопировать JSON» в служебной панели — для разборов с разработчиком.
// Клиентский только этот кусок: вся панель серверная.

import { useState } from "react";

export default function CopyJson({ json }: { json: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        // Кнопка стоит в <summary>: без этого клик ещё и сворачивал бы блок.
        e.preventDefault();
        navigator.clipboard
          ?.writeText(json)
          .then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          })
          .catch(() => {});
      }}
      className="rounded-lg px-3 py-1 text-xs"
      style={{ border: "1px solid rgba(138,138,138,0.45)", color: "var(--axis-gray)" }}
    >
      {done ? "скопировано" : "скопировать JSON"}
    </button>
  );
}
