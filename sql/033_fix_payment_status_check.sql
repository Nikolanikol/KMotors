-- 1. Убрать старые constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Нормализовать существующие данные: "pending" → "pending_payment"
UPDATE public.orders SET payment_status = 'pending_payment' WHERE payment_status = 'pending';

-- 3. Обновить застрявший заказ (PayPal забрал деньги, а статус не сменился)
UPDATE public.orders
SET payment_status = 'paid', status = 'paid', paid_at = COALESCE(paid_at, NOW())
WHERE paypal_transaction_id IS NOT NULL AND payment_status != 'paid';

-- 4. Создать constraints с полным списком значений
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN (
    'pending_payment', 'paid', 'bank_transfer',
    'payment_submitted', 'payment_confirmed',
    'refunded', 'cancelled'
  ));

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending_payment', 'paid', 'payment_submitted', 'payment_confirmed',
    'processing', 'shipped', 'delivered', 'cancelled'
  ));
