-- ============================================================================
-- Migration 008: Full Data Tables (Complete Data.json Migration)
--
-- Adds all remaining tables and columns needed to store the full application
-- data in Supabase, replacing data.json as the primary data store.
--
-- Tables added:
--   1. Alter `products` — add kategori, lokasi_rak, barcode, min_stok
--   2. `product_categories` — master kategori dengan warna
--   3. `product_racks` — master rak penyimpanan
--   4. `pos_orders` + `pos_order_items` — transaksi POS dan pesanan
--   5. `goods_returns` + `return_items` — retur barang
--   6. `stock_adjustments` — penyesuaian stok
--   7. `rack_transfers` — transfer antar rak
--   8. `expenses` — pengeluaran harian
--   9. `suppliers` — data supplier
--  10. `poin_history` — riwayat poin reward
--  11. `item_kits` + `kit_components` — paket barang
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 0: Helper function for updated_at auto-update
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 1: Alter existing `products` table (from migration 003)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS kategori VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS lokasi_rak VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS min_stok INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS connected_stores INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_kategori ON products(kategori);
CREATE INDEX IF NOT EXISTS idx_products_lokasi_rak ON products(lokasi_rak);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Add updated_at trigger to products
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 2: Product Categories (Kategori Produk)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#6B7280',  -- Hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_product_categories_updated_at ON product_categories;
CREATE TRIGGER trg_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product_categories"
  ON product_categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert product_categories"
  ON product_categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product_categories"
  ON product_categories FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product_categories"
  ON product_categories FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 3: Product Racks (Rak Penyimpanan)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_racks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  zone VARCHAR(50) DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_racks_name ON product_racks(name);
CREATE INDEX IF NOT EXISTS idx_product_racks_zone ON product_racks(zone);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_product_racks_updated_at ON product_racks;
CREATE TRIGGER trg_product_racks_updated_at
  BEFORE UPDATE ON product_racks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_racks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product_racks"
  ON product_racks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert product_racks"
  ON product_racks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update product_racks"
  ON product_racks FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete product_racks"
  ON product_racks FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 4: POS Orders (Pesanan / Transaksi POS)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pos_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_order VARCHAR(50) NOT NULL UNIQUE,        -- POS-000001
  tanggal_pesanan TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name VARCHAR(255) DEFAULT '',
  nama_pembeli VARCHAR(255) NOT NULL DEFAULT 'Umum',
  alamat_pengiriman TEXT DEFAULT '',
  nama_toko VARCHAR(255) DEFAULT 'POS Direct',
  status_pesanan VARCHAR(20) NOT NULL DEFAULT 'selesai'
    CHECK (status_pesanan IN ('diproses', 'dikirim', 'selesai', 'dibatalkan')),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ongkir DECIMAL(12, 2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'qris', 'transfer', 'split')),
  cash_amount DECIMAL(12, 2) DEFAULT 0,
  transfer_amount DECIMAL(12, 2) DEFAULT 0,
  change_amount DECIMAL(12, 2) DEFAULT 0,
  per_item_discount_total DECIMAL(12, 2) DEFAULT 0,
  transaction_discount_percent DECIMAL(5, 2) DEFAULT 0,
  transaction_discount_amount DECIMAL(12, 2) DEFAULT 0,
  ppn_amount DECIMAL(12, 2) DEFAULT 0,
  ppn_rate DECIMAL(5, 2) DEFAULT 11,
  poin_used INTEGER DEFAULT 0,
  discount_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES pos_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  harga DECIMAL(12, 2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  is_kit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for pos_orders
CREATE INDEX IF NOT EXISTS idx_pos_orders_tanggal ON pos_orders(tanggal_pesanan);
CREATE INDEX IF NOT EXISTS idx_pos_orders_nomor ON pos_orders(nomor_order);
CREATE INDEX IF NOT EXISTS idx_pos_orders_user_id ON pos_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_customer ON pos_orders(nama_pembeli);
CREATE INDEX IF NOT EXISTS idx_pos_orders_status ON pos_orders(status_pesanan);
CREATE INDEX IF NOT EXISTS idx_pos_orders_created_at ON pos_orders(created_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_pos_orders_updated_at ON pos_orders;
CREATE TRIGGER trg_pos_orders_updated_at
  BEFORE UPDATE ON pos_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_id ON pos_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_product_id ON pos_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_sku ON pos_order_items(sku);

-- RLS for pos_orders
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pos_orders"
  ON pos_orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert pos_orders"
  ON pos_orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update pos_orders"
  ON pos_orders FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete pos_orders"
  ON pos_orders FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view pos_order_items"
  ON pos_order_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert pos_order_items"
  ON pos_order_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete pos_order_items"
  ON pos_order_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 5: Goods Returns (Retur Barang)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS goods_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_retur VARCHAR(50) NOT NULL UNIQUE,        -- RET-000001
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  original_order_id UUID REFERENCES pos_orders(id) ON DELETE SET NULL,
  nomor_order VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL DEFAULT 'Umum',
  alasan TEXT NOT NULL,
  total_item INTEGER NOT NULL DEFAULT 0,
  total_refund DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hpp_loss DECIMAL(12, 2) DEFAULT 0,
  restocked BOOLEAN NOT NULL DEFAULT TRUE,
  user_name VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goods_return_id UUID REFERENCES goods_returns(id) ON DELETE CASCADE NOT NULL,
  sku VARCHAR(50) NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  harga_jual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  hpp DECIMAL(12, 2) DEFAULT 0,
  subtotal_retur DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goods_returns_tanggal ON goods_returns(tanggal);
CREATE INDEX IF NOT EXISTS idx_goods_returns_nomor ON goods_returns(nomor_retur);
CREATE INDEX IF NOT EXISTS idx_goods_returns_order ON goods_returns(nomor_order);
CREATE INDEX IF NOT EXISTS idx_goods_returns_created_at ON goods_returns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(goods_return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_sku ON return_items(sku);

ALTER TABLE goods_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view goods_returns"
  ON goods_returns FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert goods_returns"
  ON goods_returns FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update goods_returns"
  ON goods_returns FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete goods_returns"
  ON goods_returns FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view return_items"
  ON return_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert return_items"
  ON return_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete return_items"
  ON return_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 6: Stock Adjustments (Penyesuaian Stok)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  stok_sebelum INTEGER NOT NULL,
  stok_sesudah INTEGER NOT NULL,
  jenis VARCHAR(10) NOT NULL CHECK (jenis IN ('tambah', 'kurangi')),
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  alasan TEXT NOT NULL,
  catatan TEXT DEFAULT '',
  nilai_kerugian DECIMAL(12, 2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_sku ON stock_adjustments(sku);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_jenis ON stock_adjustments(jenis);

ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock_adjustments"
  ON stock_adjustments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert stock_adjustments"
  ON stock_adjustments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete stock_adjustments"
  ON stock_adjustments FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 7: Rack Transfers (Transfer Antar Rak)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rack_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  nama_produk VARCHAR(255) NOT NULL,
  dari_rak VARCHAR(100) NOT NULL,
  ke_rak VARCHAR(100) NOT NULL,
  catatan TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rack_transfers_product_id ON rack_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_rack_transfers_sku ON rack_transfers(sku);
CREATE INDEX IF NOT EXISTS idx_rack_transfers_created_at ON rack_transfers(created_at DESC);

ALTER TABLE rack_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rack_transfers"
  ON rack_transfers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert rack_transfers"
  ON rack_transfers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete rack_transfers"
  ON rack_transfers FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 8: Expenses (Pengeluaran Harian)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori VARCHAR(100) NOT NULL,
  deskripsi TEXT NOT NULL,
  jumlah DECIMAL(12, 2) NOT NULL CHECK (jumlah > 0),
  metode VARCHAR(20) NOT NULL DEFAULT 'tunai'
    CHECK (metode IN ('tunai', 'transfer', 'kartu')),
  catatan TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_tanggal ON expenses(tanggal);
CREATE INDEX IF NOT EXISTS idx_expenses_kategori ON expenses(kategori);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete expenses"
  ON expenses FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 9: Suppliers (Data Supplier)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_person VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update suppliers"
  ON suppliers FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete suppliers"
  ON suppliers FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 10: Poin History (Riwayat Poin Reward)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS poin_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('earned', 'redeemed', 'adjusted')),
  jumlah INTEGER NOT NULL,
  saldo_setelah INTEGER NOT NULL,
  referensi VARCHAR(100) DEFAULT '',           -- nomor transaksi referensi
  detail TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poin_history_customer_id ON poin_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_poin_history_customer_name ON poin_history(customer_name);
CREATE INDEX IF NOT EXISTS idx_poin_history_created_at ON poin_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poin_history_tipe ON poin_history(tipe);

ALTER TABLE poin_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view poin_history"
  ON poin_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert poin_history"
  ON poin_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 11: Item Kits (Paket Barang)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS item_kits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kit_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_id UUID REFERENCES item_kits(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sku VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_kits_name ON item_kits(name);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS trg_item_kits_updated_at ON item_kits;
CREATE TRIGGER trg_item_kits_updated_at
  BEFORE UPDATE ON item_kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_kit_components_kit_id ON kit_components(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_components_sku ON kit_components(sku);

ALTER TABLE item_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view item_kits"
  ON item_kits FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert item_kits"
  ON item_kits FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update item_kits"
  ON item_kits FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete item_kits"
  ON item_kits FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view kit_components"
  ON kit_components FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert kit_components"
  ON kit_components FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete kit_components"
  ON kit_components FOR DELETE
  USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 12: POS Transaction Stored Procedure (Atomic)
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION save_pos_transaction(
  p_nomor_order VARCHAR(50),
  p_user_id UUID,
  p_seller_name VARCHAR(255),
  p_nama_pembeli VARCHAR(255),
  p_nama_toko VARCHAR(255),
  p_items JSONB,
  p_subtotal DECIMAL,
  p_per_item_discount_total DECIMAL,
  p_transaction_discount_percent DECIMAL,
  p_transaction_discount_amount DECIMAL,
  p_ppn_amount DECIMAL,
  p_ppn_rate DECIMAL,
  p_grand_total DECIMAL,
  p_payment_method VARCHAR(20),
  p_cash_amount DECIMAL,
  p_transfer_amount DECIMAL,
  p_change_amount DECIMAL,
  p_poin_used INTEGER DEFAULT 0,
  p_discount_note TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_sku VARCHAR(50);
  v_nama_produk VARCHAR(255);
  v_harga DECIMAL;
  v_quantity INTEGER;
  v_subtotal_item DECIMAL;
  v_discount_percent DECIMAL;
  v_is_kit BOOLEAN;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_error TEXT;
BEGIN
  -- Validate items
  IF jsonb_typeof(p_items) != 'array' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Items must be a JSON array');
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tidak ada item dalam transaksi');
  END IF;

  -- Create the order header
  INSERT INTO pos_orders (
    nomor_order, user_id, seller_name, nama_pembeli, nama_toko,
    status_pesanan, subtotal, ongkir, grand_total,
    payment_method, cash_amount, transfer_amount, change_amount,
    per_item_discount_total, transaction_discount_percent,
    transaction_discount_amount, ppn_amount, ppn_rate,
    poin_used, discount_note
  ) VALUES (
    p_nomor_order, p_user_id, p_seller_name, p_nama_pembeli, p_nama_toko,
    'selesai', p_subtotal, 0, p_grand_total,
    p_payment_method, p_cash_amount, p_transfer_amount, p_change_amount,
    p_per_item_discount_total, p_transaction_discount_percent,
    p_transaction_discount_amount, p_ppn_amount, p_ppn_rate,
    p_poin_used, p_discount_note
  )
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_sku := v_item ->> 'sku';
      v_nama_produk := v_item ->> 'nama_produk';
      v_harga := COALESCE((v_item ->> 'harga')::DECIMAL, 0);
      v_quantity := (v_item ->> 'quantity')::INTEGER;
      v_subtotal_item := COALESCE((v_item ->> 'subtotal')::DECIMAL, 0);
      v_discount_percent := COALESCE((v_item ->> 'discount_percent')::DECIMAL, 0);
      v_is_kit := COALESCE((v_item ->> 'is_kit')::BOOLEAN, FALSE);

      -- Find product_id by SKU
      SELECT id INTO v_product_id FROM products WHERE sku = v_sku;

      -- Insert order item
      INSERT INTO pos_order_items (
        order_id, product_id, sku, nama_produk, harga,
        quantity, subtotal, discount_percent, is_kit
      ) VALUES (
        v_order_id, v_product_id, v_sku, v_nama_produk, v_harga,
        v_quantity, v_subtotal_item, v_discount_percent, v_is_kit
      );

      -- Deduct stock if product exists
      IF v_product_id IS NOT NULL THEN
        SELECT stock_total INTO v_current_stock
        FROM products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Product % not found', v_sku;
        END IF;

        IF v_current_stock < v_quantity THEN
          RAISE EXCEPTION 'Stok % tidak mencukupi: tersedia %, dibutuhkan %',
            v_nama_produk, v_current_stock, v_quantity;
        END IF;

        v_new_stock := v_current_stock - v_quantity;

        UPDATE products
        SET
          stock_total = v_new_stock,
          sales = sales + v_quantity,
          updated_at = NOW()
        WHERE id = v_product_id;

        -- Record stock mutation
        INSERT INTO stock_mutations (
          product_id, mutation_type, quantity, stock_before, stock_after,
          reference_type, reference_id, user_id
        ) VALUES (
          v_product_id, 'outgoing', -v_quantity, v_current_stock, v_new_stock,
          'order', p_nomor_order, p_user_id
        );
      END IF;

    EXCEPTION
      WHEN OTHERS THEN
        -- Rollback entire transaction on error
        DELETE FROM pos_orders WHERE id = v_order_id;
        RAISE;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'nomor_order', p_nomor_order
  );

EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 13: Add lokasi_rak to existing goods_receipt_items (from migration 004)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE goods_receipt_items
  ADD COLUMN IF NOT EXISTS lokasi_rak VARCHAR(100) DEFAULT '';

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 14: App Configuration table
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS app_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view app_config"
  ON app_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can insert app_config"
  ON app_config FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
  );

CREATE POLICY "Admin can update app_config"
  ON app_config FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
  );

-- Insert default config values
INSERT INTO app_config (key, value, description)
VALUES ('sample_store_count', '2', 'Jumlah toko yang terhubung untuk tampilan dashboard')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 15: Helpful View for Dashboard Stats
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM products) AS total_products,
  (SELECT COALESCE(SUM(stock_total), 0) FROM products) AS total_stock,
  (SELECT COUNT(*) FROM products WHERE stock_total = 0) AS out_of_stock_count,
  (SELECT COUNT(*) FROM products WHERE stock_total > 0 AND stock_total <= min_stok) AS low_stock_count,
  (SELECT COALESCE(SUM(grand_total), 0) FROM pos_orders) AS total_revenue,
  (SELECT COUNT(*) FROM pos_orders) AS total_transactions,
  (SELECT COALESCE(SUM(sales), 0) FROM products) AS total_sold;

-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 16: Functions to migrate data from JSON import
-- Used by the migration script to transfer existing data.json to Supabase tables.
-- All functions use ON CONFLICT ... DO UPDATE for idempotent re-imports.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION import_product_from_json(
  p_sku VARCHAR(50),
  p_name VARCHAR(255),
  p_barcode VARCHAR(100),
  p_price DECIMAL,
  p_hpp DECIMAL,
  p_stock INTEGER,
  p_connected_stores INTEGER,
  p_sales INTEGER,
  p_kategori VARCHAR(100),
  p_lokasi_rak VARCHAR(100),
  p_min_stok INTEGER,
  p_description TEXT,
  p_created_at TIMESTAMP
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
BEGIN
  INSERT INTO products (
    sku, name, barcode, price, hpp, stock_total,
    connected_stores, sales, kategori, lokasi_rak,
    min_stok, description, created_at, updated_at
  ) VALUES (
    p_sku, p_name, COALESCE(p_barcode, ''), p_price,
    COALESCE(p_hpp, 0), p_stock, COALESCE(p_connected_stores, 0),
    COALESCE(p_sales, 0), COALESCE(p_kategori, ''),
    COALESCE(p_lokasi_rak, ''), COALESCE(p_min_stok, 10),
    COALESCE(p_description, ''), COALESCE(p_created_at, NOW()), NOW()
  )
  ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    barcode = EXCLUDED.barcode,
    price = EXCLUDED.price,
    hpp = EXCLUDED.hpp,
    stock_total = EXCLUDED.stock_total,
    connected_stores = EXCLUDED.connected_stores,
    sales = EXCLUDED.sales,
    kategori = EXCLUDED.kategori,
    lokasi_rak = EXCLUDED.lokasi_rak,
    min_stok = EXCLUDED.min_stok,
    description = EXCLUDED.description,
    updated_at = NOW()
  RETURNING id INTO v_product_id;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);
END;
$$;

CREATE OR REPLACE FUNCTION import_category_from_json(
  p_id VARCHAR(50),
  p_name VARCHAR(100),
  p_color VARCHAR(7)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO product_categories (name, color)
  VALUES (p_name, COALESCE(p_color, '#6B7280'))
  ON CONFLICT (name) DO UPDATE SET
    color = EXCLUDED.color,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION import_rack_from_json(
  p_name VARCHAR(100),
  p_zone VARCHAR(50)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO product_racks (name, zone)
  VALUES (p_name, COALESCE(p_zone, ''))
  ON CONFLICT (name) DO UPDATE SET
    zone = EXCLUDED.zone,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION import_order_from_json(
  p_nomor_order VARCHAR(50),
  p_tanggal_pesanan TIMESTAMP,
  p_user_id UUID,
  p_seller_name VARCHAR(255),
  p_nama_pembeli VARCHAR(255),
  p_alamat_pengiriman TEXT,
  p_nama_toko VARCHAR(255),
  p_status_pesanan VARCHAR(20),
  p_subtotal DECIMAL,
  p_ongkir DECIMAL,
  p_grand_total DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO pos_orders (
    nomor_order, tanggal_pesanan, user_id, seller_name,
    nama_pembeli, alamat_pengiriman, nama_toko, status_pesanan,
    subtotal, ongkir, grand_total
  ) VALUES (
    p_nomor_order, p_tanggal_pesanan, p_user_id, p_seller_name,
    p_nama_pembeli, COALESCE(p_alamat_pengiriman, ''),
    COALESCE(p_nama_toko, 'POS Direct'), COALESCE(p_status_pesanan, 'selesai'),
    p_subtotal, COALESCE(p_ongkir, 0), p_grand_total
  )
  ON CONFLICT (nomor_order) DO UPDATE SET
    status_pesanan = EXCLUDED.status_pesanan,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true);
END;
$$;
