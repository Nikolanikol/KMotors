"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

const SYNC_EVENT = "kmotors_cart_sync";

export function notifyCartUpdate(quantityDelta?: number) {
  window.dispatchEvent(
    new CustomEvent(SYNC_EVENT, { detail: { delta: quantityDelta ?? 0 } })
  );
}

export function useCartCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!cart) { setCount(0); return; }

    const { data: items } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("cart_id", cart.id);

    setCount(items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0);
  }, [user]);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    fetchCount();

    const sync = (e: Event) => {
      const delta = (e as CustomEvent).detail?.delta;
      if (typeof delta === "number" && delta !== 0) {
        setCount((prev) => Math.max(0, prev + delta));
      }
      fetchCount();
    };
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, [user, fetchCount]);

  return count;
}

export function useCartProductIds() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());

  const fetchIds = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data: cart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!cart) { setIds(new Set()); return; }

    const { data: items } = await supabase
      .from("cart_items")
      .select("product_id")
      .eq("cart_id", cart.id);

    setIds(new Set(items?.map((i) => i.product_id) ?? []));
  }, [user]);

  useEffect(() => {
    if (!user) { setIds(new Set()); return; }
    fetchIds();

    const sync = () => fetchIds();
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, [user, fetchIds]);

  const addOptimistic = useCallback((productId: number) => {
    setIds((prev) => new Set(prev).add(productId));
  }, []);

  return { cartProductIds: ids, addOptimistic };
}
