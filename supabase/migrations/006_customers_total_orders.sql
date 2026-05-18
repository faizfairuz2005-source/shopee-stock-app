-- ============================================================================
-- Migration 006: Add total_orders column to customers table
-- Tracks the total number of orders a customer has made (for order count badge).
-- ============================================================================

-- ─── Add total_orders column ──────────────────────────────────────────────

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0;

-- ─── Update increment_customer_transaction to also increment total_orders ──

CREATE OR REPLACE FUNCTION increment_customer_transaction(
  p_customer_id UUID,
  p_total_amount BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE customers
  SET
    total_transaksi = total_transaksi + p_total_amount,
    total_orders = total_orders + 1,
    terakhir_transaksi = NOW(),
    updated_at = NOW()
  WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
