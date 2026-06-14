-- Add PayPal payment tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add 'paid' to status if not already present in check constraint
-- (status already accepts any text, no enum constraint to update)

-- Index for quick lookup by PayPal order ID
CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders (paypal_order_id) WHERE paypal_order_id IS NOT NULL;
