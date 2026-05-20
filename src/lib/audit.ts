"use server";

import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Audit log action types — all possible actions in the system.
 * Convention: <entity>.<verb> (e.g., 'product.create', 'order.create')
 */
export type AuditAction =
  // Authentication
  | "login"
  | "logout"
  | "login.failed"

  // Products / Inventory
  | "product.create"
  | "product.update"
  | "product.delete"
  | "product.import"
  | "stock.adjust"
  | "stock.transfer_rack"
  | "stock.bulk_update"

  // Orders & POS
  | "order.create"
  | "order.update"
  | "order.delete"
  | "pos.transaction"
  | "goods_return.create"

  // Goods Receipt
  | "goods_receipt.create"

  // Expenses
  | "expense.create"
  | "expense.delete"

  // Suppliers
  | "supplier.create"
  | "supplier.update"
  | "supplier.delete"

  // Categories & Racks
  | "category.create"
  | "category.update"
  | "category.delete"
  | "rack.create"
  | "rack.update"
  | "rack.delete"

  // Kits (Paket Barang)
  | "kit.create"
  | "kit.update"
  | "kit.delete"

  // Customers
  | "customer.create"
  | "customer.update"
  | "customer.delete"

  // User Management
  | "user.invite"
  | "user.role_change"
  | "user.activate"
  | "user.deactivate"

  // Backup & Export
  | "backup.export_json"
  | "backup.export_csv"
  | "backup.download"
  | "backup.delete"
  | "backup.restore"

  // Settings
  | "settings.update";

/**
 * Entity types that can be tracked
 */
export type AuditEntityType =
  | "product"
  | "order"
  | "user"
  | "receipt"
  | "supplier"
  | "expense"
  | "return"
  | "customer"
  | "category"
  | "rack"
  | "adjustment"
  | "settings"
  | "auth"
  | "kit"
  | "backup";

// ─── Audit Log Entry Shape ────────────────────────────────────────────────

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string;
  entity_name?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

const AUDIT_LOG_FILE = path.join(process.cwd(), "audit-logs.json");

// ─── Local file helpers ────────────────────────────────────────────────────

function readLocalLogs(): AuditLogPayload[] {
  try {
    if (!fs.existsSync(AUDIT_LOG_FILE)) return [];
    const content = fs.readFileSync(AUDIT_LOG_FILE, "utf8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function appendLocalLog(entry: AuditLogPayload): void {
  try {
    const logs = readLocalLogs();
    logs.push(entry);
    // Keep max 10,000 entries to prevent unbounded file growth
    const trimmed = logs.length > 10000 ? logs.slice(-10000) : logs;
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(trimmed, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write local audit log:", err);
  }
}

// ─── In-memory fallback store (when Supabase is unavailable) ──────────────

interface AuditLogPayload {
  id?: string;
  user_id: string | null;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: string;
  ip_address: string;
  created_at: string;
  [key: string]: unknown;
}

let fallbackLogs: AuditLogPayload[] = [];

function addFallbackLog(entry: AuditLogPayload) {
  const logEntry: AuditLogPayload = {
    ...entry,
    id: entry.id || `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: entry.created_at || new Date().toISOString(),
  };
  fallbackLogs.push(logEntry);
  // Keep max 100 fallback logs in memory
  if (fallbackLogs.length > 100) {
    fallbackLogs = fallbackLogs.slice(-100);
  }
}

/**
 * Get fallback logs (for debugging / when Supabase is down)
 */
export async function getFallbackLogs() {
  return fallbackLogs;
}

// ─── Main Audit Log Function ──────────────────────────────────────────────

/**
 * Log an action to the audit trail.
 *
 * This is a server-only function that uses the Supabase admin client
 * (service_role) to bypass RLS for writes. The admin client requires
 * SUPABASE_SERVICE_ROLE_KEY to be set in environment variables.
 *
 * If the admin client is unavailable (no service key), logs are stored
 * in an in-memory fallback store (not persisted across restarts).
 *
 * @example
 *   await auditLog({
 *     action: "product.create",
 *     entity_type: "product",
 *     entity_id: product.sku,
 *     entity_name: product.name,
 *     details: { price: product.price, stock: product.totalStock },
 *   });
 */
export async function auditLog(
  entry: AuditLogEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to get current user info
    let userId = "";
    let userName = "";

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userName =
          (user.user_metadata?.full_name as string) ||
          user.email?.split("@")[0] ||
          "";
      }
    } catch {
      // User might not be authenticated — that's ok for login.failed, etc.
    }

    const logPayload: AuditLogPayload = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: userId || null,
      user_name: userName,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      entity_name: entry.entity_name || null,
      details: entry.details ? JSON.stringify(entry.details) : "{}",
      ip_address: entry.ip_address || "",
      created_at: new Date().toISOString(),
    };

    // Always persist to local file first (most reliable)
    appendLocalLog(logPayload);

    // Try Supabase admin client (requires SERVICE_ROLE_KEY)
    try {
      const adminClient = createAdminClient();
      const { error } = await adminClient.from("audit_logs").insert(logPayload);

      if (error) {
        console.warn("Audit log Supabase insert failed, using fallback:", error.message);
        return { success: true, error: error.message };
      }

      return { success: true };
    } catch (adminErr) {
      // Admin client not available — OK as long as local file worked
      return { success: true };
    }
  } catch (error) {
    console.error("Audit log error:", error);
    return { success: false, error: "Failed to log audit entry" };
  }
}

/**
 * Get audit logs from the local file store.
 * Supports pagination and optional filters.
 */
export async function getLocalAuditLogs(options: {
  limit?: number;
  offset?: number;
  action?: string;
  entity_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
} = {}): Promise<{
  success: boolean;
  data?: AuditLogPayload[];
  total?: number;
  error?: string;
}> {
  try {
    let logs = readLocalLogs();

    // Apply filters
    if (options.action) {
      logs = logs.filter((l) => l.action === options.action);
    }
    if (options.entity_type) {
      logs = logs.filter((l) => l.entity_type === options.entity_type);
    }
    if (options.user_id) {
      logs = logs.filter((l) => l.user_id === options.user_id);
    }
    if (options.start_date) {
      logs = logs.filter((l) => l.created_at >= options.start_date!);
    }
    if (options.end_date) {
      logs = logs.filter((l) => l.created_at <= options.end_date!);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.user_name.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.entity_name && l.entity_name.toLowerCase().includes(q)) ||
          (l.entity_id && l.entity_id.toLowerCase().includes(q)) ||
          l.details.toLowerCase().includes(q)
      );
    }

    // Sort by created_at descending
    logs.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const total = logs.length;
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const paged = logs.slice(offset, offset + limit);

    return {
      success: true,
      data: paged,
      total,
    };
  } catch (error) {
    console.error("Error reading local audit logs:", error);
    return { success: false, error: "Failed to read audit logs" };
  }
}

/**
 * Get audit logs from Supabase (for the audit log viewer).
 * Only Admin and Manager roles via RLS can read.
 */
export async function getAuditLogs(options: {
  limit?: number;
  offset?: number;
  action?: string;
  entity_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
} = {}): Promise<{
  success: boolean;
  data?: AuditLogPayload[];
  total?: number;
  error?: string;
}> {
  try {
    const adminClient = createAdminClient();
    let query = adminClient
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(options.limit || 50)
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

    if (options.action) {
      query = query.eq("action", options.action);
    }
    if (options.entity_type) {
      query = query.eq("entity_type", options.entity_type);
    }
    if (options.user_id) {
      query = query.eq("user_id", options.user_id);
    }
    if (options.start_date) {
      query = query.gte("created_at", options.start_date);
    }
    if (options.end_date) {
      query = query.lte("created_at", options.end_date);
    }

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}
