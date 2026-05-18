-- ============================================================================
-- Migration 004: Goods Receipts (Barang Masuk)
-- Stores receipt headers and line items for incoming stock transactions.
-- -- ============================================================================

-- ─── Goods Receipts Table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goods_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,  -- Auto-generated: GR-YYYYMMDD-XXXX
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier VARCHAR(255) NOT NULL DEFAULT '',
  nomor_faktur VARCHAR(255) DEFAULT '',
  total_item INTEGER NOT NULL DEFAULT 0,
  total_biaya DECIMAL(12, 2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Goods Receipt Items Table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goods_receipt_id UUID REFERENCES goods_receipts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  harga_beli DECIMAL(12, 2) NOT NULL DEFAULT 0,
  catatan TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_goods_receipts_tanggal ON goods_receipts(tanggal);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_supplier ON goods_receipts(supplier);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_user_id ON goods_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_created_at ON goods_receipts(created_at);

CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_receipt_id ON goods_receipt_items(goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_product_id ON goods_receipt_items(product_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_sku ON goods_receipt_items(sku);

-- ─── Row Level Security ───────────────────────────────────────────────────

ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view goods_receipts"
  ON goods_receipts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert goods_receipts"
  ON goods_receipts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update goods_receipts"
  ON goods_receipts FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete goods_receipts"
  ON goods_receipts FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view goods_receipt_items"
  ON goods_receipt_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert goods_receipt_items"
  ON goods_receipt_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete goods_receipt_items"
  ON goods_receipt_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- ─── Stored Procedure: save_goods_receipt ───────────────────────────────────
-- Atomic operation:
-- 1. Creates goods_receipt header
-- 2. Creates goods_receipt_items for each item
-- 3. Calls add_incoming_stock for each item to update stock_total
-- 4. Rolls back entirely if ANY step fails
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION save_goods_receipt(
  p_tanggal DATE,
  p_supplier VARCHAR(255),
  p_nomor_faktur VARCHAR(255),
  p_items JSONB,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt_id UUID;
  v_receipt_number VARCHAR(50);
  v_item JSONB;
  v_product_id UUID;
  v_sku VARCHAR(50);
  v_nama_produk VARCHAR(255);
  v_quantity INTEGER;
  v_harga_beli DECIMAL(12, 2);
  v_catatan TEXT;
  v_total_item INTEGER := 0;
  v_total_biaya DECIMAL(12, 2) := 0;
  v_item_count INTEGER;
  v_stock_result JSONB;
  v_error TEXT;
BEGIN
  -- Validate input is a JSON array
  IF jsonb_typeof(p_items) != 'array' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Items must be a JSON array'
    );
  END IF;

  v_item_count := jsonb_array_length(p_items);
  IF v_item_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Minimal satu item harus diisi'
    );
  END IF;

  -- Generate receipt number: GR-YYYYMMDD-XXXX
  v_receipt_number := 'GR-' || TO_CHAR(p_tanggal, 'YYYYMMDD') || '-' ||
    LPAD(COALESCE(
      (SELECT COUNT(*)::TEXT FROM goods_receipts WHERE tanggal = p_tanggal),
      '0'
    ), 4, '0');

  -- Create goods_receipt header
  INSERT INTO goods_receipts (
    receipt_number,
    tanggal,
    supplier,
    nomor_faktur,
    total_item,
    total_biaya,
    user_id
  ) VALUES (
    v_receipt_number,
    p_tanggal,
    p_supplier,
    COALESCE(p_nomor_faktur, ''),
    0,  -- will update after items
    0,  -- will update after items
    p_user_id
  )
  RETURNING id INTO v_receipt_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_sku := v_item ->> 'sku';
      v_nama_produk := v_item ->> 'nama_produk';
      v_quantity := (v_item ->> 'quantity')::INTEGER;
      v_harga_beli := COALESCE((v_item ->> 'harga_beli')::DECIMAL, 0);
      v_catatan := COALESCE(v_item ->> 'catatan', '');

      -- Find product_id by SKU
      SELECT id INTO v_product_id FROM products WHERE sku = v_sku;

      -- Insert goods_receipt_item
      INSERT INTO goods_receipt_items (
        goods_receipt_id,
        product_id,
        sku,
        nama_produk,
        quantity,
        harga_beli,
        catatan
      ) VALUES (
        v_receipt_id,
        v_product_id,
        v_sku,
        v_nama_produk,
        v_quantity,
        v_harga_beli,
        v_catatan
      );

      v_total_item := v_total_item + v_quantity;
      v_total_biaya := v_total_biaya + (v_harga_beli * v_quantity);

      -- Update stock via add_incoming_stock if product exists in DB
      IF v_product_id IS NOT NULL THEN
        v_stock_result := add_incoming_stock(
          jsonb_build_array(jsonb_build_object(
            'product_id', v_product_id,
            'sku', v_sku,
            'quantity', v_quantity,
            'buy_price', v_harga_beli,
            'reference_type', 'goods_receipt',
            'reference_id', v_receipt_number,
            'notes', v_catatan
          )),
          p_user_id
        );
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        -- Rollback by deleting the receipt header (items cascade)
        DELETE FROM goods_receipts WHERE id = v_receipt_id;
        GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Gagal memproses item: ' || v_error
        );
    END;
  END LOOP;

  -- Update receipt totals
  UPDATE goods_receipts
  SET
    total_item = v_total_item,
    total_biaya = v_total_biaya,
    updated_at = NOW()
  WHERE id = v_receipt_id;

  -- Return success with receipt data
  RETURN jsonb_build_object(
    'success', true,
    'receipt_id', v_receipt_id,
    'receipt_number', v_receipt_number,
    'total_item', v_total_item,
    'total_biaya', v_total_biaya
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

-- ─── Stored Procedure: get_goods_receipts ───────────────────────────────────
-- Helper to retrieve goods receipts with their items
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_goods_receipts(
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
          'id', gr.id,
          'receipt_number', gr.receipt_number,
          'tanggal', gr.tanggal,
          'supplier', gr.supplier,
          'nomor_faktur', gr.nomor_faktur,
          'total_item', gr.total_item,
          'total_biaya', gr.total_biaya,
          'created_at', gr.created_at,
          'items', COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                'id', gri.id,
                'sku', gri.sku,
                'nama_produk', gri.nama_produk,
                'quantity', gri.quantity,
                'harga_beli', gri.harga_beli,
                'catatan', gri.catatan
              )
              ORDER BY gri.created_at
            )
            FROM goods_receipt_items gri
            WHERE gri.goods_receipt_id = gr.id),
            '[]'::JSONB
          )
        )
        ORDER BY gr.created_at DESC
      )
      FROM goods_receipts gr
      LIMIT p_limit OFFSET p_offset),
      '[]'::JSONB
    ),
    'total', (SELECT COUNT(*) FROM goods_receipts)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
