"use client";

import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/utils/gtag";

/**
 * Parts cart — localStorage backed (no auth, no DB).
 * Mirrors the usePartsFavorites approach. Checkout is a Telegram lead to a
 * manager (see /cart), so no payment/order pipeline is involved.
 */

const STORAGE_KEY = "kmotors_parts_cart";
const SYNC_EVENT = "kmotors_cart_sync";

export interface CartItem {
  id: number;
  name_ru: string;
  name_en: string;
  name_ko: string | null;
  part_number: string;
  price_krw: number;
  image_url: string | null;
  is_new: boolean;
  quantity: number;
}

export type CartProductInput = Omit<CartItem, "quantity">;

/** Строка из localStorage могла быть испорчена (старая версия, ручная правка): берём только годное. */
function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  const seen = new Set<number>();
  for (const e of raw) {
    if (!e || typeof e !== "object") continue;
    const i = e as Partial<CartItem>;
    if (typeof i.id !== "number" || !Number.isFinite(i.id) || seen.has(i.id)) continue;
    if (typeof i.quantity !== "number" || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99) continue;
    if (typeof i.price_krw !== "number" || !Number.isFinite(i.price_krw) || i.price_krw < 0) continue;
    seen.add(i.id);
    out.push({
      id: i.id,
      name_ru: typeof i.name_ru === "string" ? i.name_ru : "",
      name_en: typeof i.name_en === "string" ? i.name_en : "",
      name_ko: typeof i.name_ko === "string" ? i.name_ko : null,
      part_number: typeof i.part_number === "string" ? i.part_number : "",
      price_krw: i.price_krw,
      image_url: typeof i.image_url === "string" ? i.image_url : null,
      is_new: i.is_new === true,
      quantity: i.quantity,
    });
  }
  return out;
}

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** false — запись не удалась (квота, приватный режим); корзина в этом случае не меняется. */
function write(next: CartItem[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(SYNC_EVENT));
  return true;
}

// ── Imperative helpers (callable outside React render) ──────────────────────

/** Add `qty` of a product; merges quantity if already in cart. false — не удалось сохранить. */
export function addToPartsCart(product: CartProductInput, qty = 1): boolean {
  const prev = read();
  const idx = prev.findIndex((i) => i.id === product.id);
  const next =
    idx >= 0
      ? prev.map((i, k) => (k === idx ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i))
      : [...prev, { ...product, quantity: Math.min(99, qty) }];
  if (!write(next)) return false;
  trackEvent("add_to_cart", {
    item_id: String(product.id),
    part_number: product.part_number,
    quantity: qty,
  });
  return true;
}

export function setPartsCartQty(id: number, qty: number): void {
  if (!Number.isInteger(qty) || qty < 1) return;
  // 99 — верхняя граница, которую пропускает read(); выше позиция пропала бы из корзины
  const q = Math.min(99, qty);
  write(read().map((i) => (i.id === id ? { ...i, quantity: q } : i)));
}

export function removeFromPartsCart(id: number): void {
  write(read().filter((i) => i.id !== id));
}

export function clearPartsCart(): void {
  write([]);
}

// ── Reactive store ──────────────────────────────────────────────────────────

function useCartStore(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", sync); // cross-tab
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}

/** Full cart state + mutators. */
export function usePartsCart() {
  const items = useCartStore();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const isInCart = useCallback((id: number) => items.some((i) => i.id === id), [items]);
  return {
    items,
    count,
    isInCart,
    addItem: addToPartsCart,
    setQty: setPartsCartQty,
    removeItem: removeFromPartsCart,
    clear: clearPartsCart,
  };
}

/** Total item count (for the header badge). */
export function useCartCount(): number {
  const items = useCartStore();
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/** Set of product ids in the cart (+ no-op optimistic add kept for compat). */
export function useCartProductIds() {
  const items = useCartStore();
  const cartProductIds = new Set(items.map((i) => i.id));
  const addOptimistic = useCallback((_productId: number) => {}, []);
  return { cartProductIds, addOptimistic };
}
