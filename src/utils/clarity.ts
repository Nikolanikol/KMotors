"use client";

// Microsoft Clarity custom events
// Docs: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api

declare global {
  interface Window {
    clarity?: (method: string, ...args: unknown[]) => void;
  }
}

export function clarityEvent(event: string, value?: string) {
  try {
    if (typeof window !== "undefined" && window.clarity) {
      window.clarity("event", event);
      if (value) window.clarity("set", event, value);
    }
  } catch {}
}

export function clarityTag(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.clarity) {
      window.clarity("set", key, value);
    }
  } catch {}
}
