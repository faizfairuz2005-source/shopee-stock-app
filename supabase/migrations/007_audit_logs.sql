-- ============================================================================
-- Migration 007: Audit Logs
-- Tracks all important user actions for security and accountability.
-- ============================================================================

-- ─── Audit Logs Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name VARCHAR(255) DEFAULT '',
  action VARCHAR(100) NOT NULL,          -- e.g., 'login', 'logout', 'product.create', 'product.update', 'product.delete', 'order.create', 'stock.adjust', 'user.invite', 'user.role_change', etc.
  entity_type VARCHAR(50),               -- e.g., 'product', 'order', 'user', 'receipt', 'supplier', 'expense', 'return'
  entity_id VARCHAR(100),                -- ID of the affected entity (UUID, SKU, order number, etc.)
  entity_name VARCHAR(255),              -- Human-readable name for display
  details JSONB DEFAULT '{}',            -- Additional context (old/new values, quantities, amounts, etc.)
  ip_address VARCHAR(45) DEFAULT '',     -- Client IP address (for non-server-action events like login)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_range ON audit_logs(created_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admin and Manager roles can view audit logs
CREATE POLICY "Admin and Manager can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
    )
  );

-- Only the system (service_role) can insert audit logs via the API
-- But we allow any authenticated user to insert via server-side code (which bypasses RLS with service_role)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Audit logs are immutable (no update or delete policies)
-- Only admins can delete old audit logs for data retention
CREATE POLICY "Admin can delete audit logs"
  ON audit_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- ─── Auto-cleanup function (optional, for data retention) ─────────────────
-- Deletes audit logs older than specified days
-- Run via cron or manually
-- ──────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_audit_logs(p_retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
