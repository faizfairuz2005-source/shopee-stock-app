-- ============================================================================
-- Migration 005: Customers (Pelanggan)
-- Stores customer data with transaction counters and reward points.
-- ============================================================================

-- ─── Customers Table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nama_lengkap VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT '',
  nomor_hp VARCHAR(50) NOT NULL,
  alamat TEXT DEFAULT '',
  catatan TEXT DEFAULT '',
  total_transaksi BIGINT NOT NULL DEFAULT 0,
  total_poin INTEGER NOT NULL DEFAULT 0,
  terakhir_transaksi TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_customers_nama ON customers(nama_lengkap);
CREATE INDEX IF NOT EXISTS idx_customers_nomor_hp ON customers(nomor_hp);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_total_transaksi ON customers(total_transaksi DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view customers
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can insert customers
CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update customers
CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Only admin users can delete customers
CREATE POLICY "Admin can delete customers"
  ON customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- ─── Stored Procedure: increment_customer_transaction ──────────────────────
-- Atomically increments total_transaksi and updates last transaction date.
-- Called after a successful POS transaction.
-- ──────────────────────────────────────────────────────────────────────────

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
    terakhir_transaksi = NOW(),
    updated_at = NOW()
  WHERE id = p_customer_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── Stored Procedure: search_customers ────────────────────────────────────
-- Full-text search across name, phone, and email fields.
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_customers(
  p_query TEXT DEFAULT '',
  p_limit INTEGER DEFAULT 20,
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
          'id', c.id,
          'nama_lengkap', c.nama_lengkap,
          'email', c.email,
          'nomor_hp', c.nomor_hp,
          'alamat', c.alamat,
          'catatan', c.catatan,
          'total_transaksi', c.total_transaksi,
          'total_poin', c.total_poin,
          'terakhir_transaksi', c.terakhir_transaksi,
          'created_at', c.created_at,
          'updated_at', c.updated_at
        )
        ORDER BY c.total_transaksi DESC, c.nama_lengkap ASC
      )
      FROM customers c
      WHERE
        p_query = '' OR
        LOWER(c.nama_lengkap) LIKE '%' || LOWER(p_query) || '%' OR
        c.nomor_hp LIKE '%' || p_query || '%' OR
        LOWER(c.email) LIKE '%' || LOWER(p_query) || '%'
      LIMIT p_limit OFFSET p_offset),
      '[]'::JSONB
    ),
    'total', (
      SELECT COUNT(*)
      FROM customers c
      WHERE
        p_query = '' OR
        LOWER(c.nama_lengkap) LIKE '%' || LOWER(p_query) || '%' OR
        c.nomor_hp LIKE '%' || p_query || '%' OR
        LOWER(c.email) LIKE '%' || LOWER(p_query) || '%'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
