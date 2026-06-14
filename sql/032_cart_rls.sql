-- RLS для корзины: пользователь работает только со своей корзиной

-- carts
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_carts" ON public.carts;
CREATE POLICY "users_own_carts"
  ON public.carts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role_carts" ON public.carts;
CREATE POLICY "service_role_carts"
  ON public.carts FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_cart_items" ON public.cart_items;
CREATE POLICY "users_own_cart_items"
  ON public.cart_items FOR ALL
  USING (
    cart_id IN (
      SELECT id FROM public.carts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    cart_id IN (
      SELECT id FROM public.carts WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "service_role_cart_items" ON public.cart_items;
CREATE POLICY "service_role_cart_items"
  ON public.cart_items FOR ALL
  TO service_role USING (true) WITH CHECK (true);
