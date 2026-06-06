"use client";

import { useMemo } from "react";

const CATALOG_BLOCKED_COUNTRIES = ["KR"];

function getCookieValue(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function useCountry() {
  const country = useMemo(() => getCookieValue("x-user-country"), []);
  const isCatalogBlocked = CATALOG_BLOCKED_COUNTRIES.includes(country);
  return { country, isCatalogBlocked };
}
