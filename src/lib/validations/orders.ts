import { z } from "zod";

/**
 * Order/Sales record validation schema
 * Used for adding new orders manually
 */
export const orderSchema = z.object({
  sku: z
    .string()
    .min(1, "Product SKU is required")
    .max(50, "SKU is too long"),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(10000, "Quantity is too high"),

  seller: z
    .string()
    .min(1, "Seller name is required")
    .max(100, "Seller name is too long")
    .trim(),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .max(500, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

/**
 * Bulk order import validation schema
 */
export const bulkOrderSchema = z.object({
  orders: z
    .array(orderSchema)
    .min(1, "At least one order is required")
    .max(100, "Too many orders at once"),
});

/**
 * Order filter validation schema
 */
export const orderFilterSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional()
    .or(z.literal("")),

  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional()
    .or(z.literal("")),

  seller: z
    .string()
    .max(100, "Seller name is too long")
    .optional()
    .or(z.literal("")),

  sku: z
    .string()
    .max(50, "SKU is too long")
    .optional()
    .or(z.literal("")),
});

/**
 * Type inference helpers
 */
export type OrderInput = z.infer<typeof orderSchema>;
export type BulkOrderInput = z.infer<typeof bulkOrderSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
