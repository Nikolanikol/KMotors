-- Добавить колонки логистики в order_items (если не существуют)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS weight_kg       NUMERIC(7,3),
  ADD COLUMN IF NOT EXISTS billed_weight_kg NUMERIC(7,3),
  ADD COLUMN IF NOT EXISTS ship_method     TEXT;

-- Добавить missing колонки в orders (если не существуют)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cost_usd NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS exchange_rate      NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS total_usd          NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS shipping_address   JSONB,
  ADD COLUMN IF NOT EXISTS notes              TEXT;

-- RLS: пользователь видит только свои заказы
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users_own_orders"
  ON public.orders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "users_own_order_items"
  ON public.order_items FOR ALL
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

-- Service role bypass (нужен для нашего API)
CREATE POLICY IF NOT EXISTS "service_role_orders"
  ON public.orders FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_order_items"
  ON public.order_items FOR ALL
  TO service_role USING (true) WITH CHECK (true);
