-- ============================================================================
-- Migration 003: Stock Management
-- Creates central products table, stock_mutations history, and atomic stored
-- procedure for incoming stock transactions.
-- ============================================================================

-- ─── Products Table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hpp DECIMAL(12, 2) DEFAULT 0,          -- Harga Pokok Pembelian
  stock_total INTEGER NOT NULL DEFAULT 0,
  connected_stores INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Stock Mutations Table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_mutations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  mutation_type VARCHAR(20) NOT NULL CHECK (mutation_type IN (
    'incoming',    -- barang masuk dari supplier
    'outgoing',    -- penjualan / pesanan
    'adjustment',  -- penyesuaian stok manual
    'return'       -- retur dari pembeli
  )),
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  buy_price DECIMAL(12, 2) DEFAULT 0,     -- harga beli per unit saat transaksi
  reference_type VARCHAR(50),              -- 'goods_receipt', 'order', 'adjustment'
  reference_id VARCHAR(255),               -- ID dokumen referensi
  notes TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_total);

CREATE INDEX IF NOT EXISTS idx_stock_mutations_product_id ON stock_mutations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_type ON stock_mutations(mutation_type);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_created_at ON stock_mutations(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_reference ON stock_mutations(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_user_id ON stock_mutations(user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_mutations ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  USING (auth.role() = 'authenticated');

-- Stock mutations policies
CREATE POLICY "Authenticated users can view stock mutations"
  ON stock_mutations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert stock mutations"
  ON stock_mutations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─── Stored Procedure: add_incoming_stock ─────────────────────────────────
-- Atomic operation: update stock + insert mutation record in one transaction.
-- Rolls back entirely if ANY item fails.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION add_incoming_stock(
  p_items JSONB,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  v_product_id UUID;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_quantity INTEGER;
  v_buy_price DECIMAL(12, 2);
  v_reference_type VARCHAR(50);
  v_reference_id VARCHAR(255);
  v_notes TEXT;
  v_results JSONB := '[]'::JSONB;
  v_error TEXT;
  v_success_count INTEGER := 0;
  v_fail_count INTEGER := 0;
BEGIN
  -- Validate input is a JSON array
  IF jsonb_typeof(p_items) != 'array' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Input must be a JSON array'
    );
  END IF;

  -- Process each item
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := (item ->> 'product_id')::UUID;
      v_quantity := (item ->> 'quantity')::INTEGER;
      v_buy_price := COALESCE((item ->> 'buy_price')::DECIMAL, 0);
      v_reference_type := item ->> 'reference_type';
      v_reference_id := item ->> 'reference_id';
      v_notes := COALESCE(item ->> 'notes', '');

      -- Validate quantity
      IF v_quantity IS NULL OR v_quantity <= 0 THEN
        v_results := v_results || jsonb_build_object(
          'product_id', v_product_id,
          'success', false,
          'error', 'Invalid quantity'
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      -- Get current stock before update (ROW LOCK to prevent race conditions)
      SELECT stock_total INTO v_current_stock
      FROM products
      WHERE id = v_product_id
      FOR UPDATE;

      IF NOT FOUND THEN
        v_results := v_results || jsonb_build_object(
          'product_id', v_product_id,
          'success', false,
          'error', 'Product not found'
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      v_new_stock := v_current_stock + v_quantity;

      -- Update product stock
      UPDATE products
      SET
        stock_total = v_new_stock,
        updated_at = NOW()
      WHERE id = v_product_id;

      -- Insert mutation record
      INSERT INTO stock_mutations (
        product_id,
        mutation_type,
        quantity,
        stock_before,
        stock_after,
        buy_price,
        reference_type,
        reference_id,
        notes,
        user_id
      ) VALUES (
        v_product_id,
        'incoming',
        v_quantity,
        v_current_stock,
        v_new_stock,
        v_buy_price,
        v_reference_type,
        v_reference_id,
        v_notes,
        p_user_id
      );

      v_results := v_results || jsonb_build_object(
        'product_id', v_product_id,
        'sku', (item ->> 'sku'),
        'quantity', v_quantity,
        'stock_before', v_current_stock,
        'stock_after', v_new_stock,
        'success', true
      );
      v_success_count := v_success_count + 1;

    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
        v_results := v_results || jsonb_build_object(
          'product_id', v_product_id,
          'success', false,
          'error', v_error
        );
        v_fail_count := v_fail_count + 1;
    END;
  END LOOP;

  -- If all items failed, return error
  IF v_success_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'All items failed',
      'results', v_results
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'success_count', v_success_count,
    'fail_count', v_fail_count,
    'results', v_results
  );
EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN jsonb_build_object(
      'success', false,
      'error', v_error
    );
END;
$$;

-- ─── Stored Procedure: get_product_stock_history ──────────────────────────
-- Helper to retrieve stock mutation history for a product
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_product_stock_history(
  p_product_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'success', true,
    'data', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', sm.id,
          'mutation_type', sm.mutation_type,
          'quantity', sm.quantity,
          'stock_before', sm.stock_before,
          'stock_after', sm.stock_after,
          'buy_price', sm.buy_price,
          'reference_type', sm.reference_type,
          'reference_id', sm.reference_id,
          'notes', sm.notes,
          'created_at', sm.created_at
        )
        ORDER BY sm.created_at DESC
      )
      FROM stock_mutations sm
      WHERE sm.product_id = p_product_id
      LIMIT p_limit OFFSET p_offset),
      '[]'::JSON
    ),
    'total', (SELECT COUNT(*) FROM stock_mutations WHERE product_id = p_product_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
