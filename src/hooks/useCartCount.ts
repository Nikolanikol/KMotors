"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

const SYNC_EVENT = "kmotors_cart_sync";

export function notifyCartUpdate() {
  window.dispatchEvent(new Event(SYNC_EVENT));
}

export function useCartCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) { setCount(0); return; }

    const fetchCount = async () => {
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
    };

    fetchCount();

    const sync = () => fetchCount();
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, [user]);

  return count;
}
