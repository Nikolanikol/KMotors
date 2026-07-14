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

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(next: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SYNC_EVENT));
}

// ── Imperative helpers (callable outside React render) ──────────────────────

/** Add `qty` of a product; merges quantity if already in cart. */
export function addToPartsCart(product: CartProductInput, qty = 1): boolean {
  const prev = read();
  const idx = prev.findIndex((i) => i.id === product.id);
  const next =
    idx >= 0
      ? prev.map((i, k) => (k === idx ? { ...i, quantity: i.quantity + qty } : i))
      : [...prev, { ...product, quantity: qty }];
  write(next);
  trackEvent("add_to_cart", {
    item_id: String(product.id),
    part_number: product.part_number,
    quantity: qty,
  });
  return true;
}

export function setPartsCartQty(id: number, qty: number): void {
  if (qty < 1) return;
  write(read().map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
}

export function removeFromPartsCart(id: number): void {
  write(read().filter((i) => i.id !== id));
}

export function clearPartsCart(): void {
  write([]);
}

/** Kept for backwards-compat with existing call sites; store already emits sync. */
export function notifyCartUpdate(_quantityDelta?: number): void {
  window.dispatchEvent(new Event(SYNC_EVENT));
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
