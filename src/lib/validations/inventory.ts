import { z } from "zod";

/**
 * Inventory product validation schema
 * Used for adding/editing products in the inventory
 */
export const inventoryProductSchema = z.object({
  name: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .max(255, "Product name is too long")
    .trim()
    .refine((val) => val.length > 0, "Product name is required"),

  sku: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU is too long")
    .regex(
      /^[A-Za-z0-9\-_]+$/,
      "SKU can only contain letters, numbers, hyphens, and underscores"
    )
    .trim()
    .toUpperCase(),

  price: z
    .number()
    .min(0, "Price cannot be negative")
    .max(999999999, "Price is too high")
    .positive("Price must be greater than 0"),

  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(999999, "Stock is too high"),

  description: z
    .string()
    .max(1000, "Description is too long")
    .optional()
    .or(z.literal("")),

  category: z
    .string()
    .max(100, "Category is too long")
    .optional()
    .or(z.literal("")),

  connectedStores: z
    .number()
    .int("Connected stores must be a whole number")
    .min(0, "Connected stores cannot be negative")
    .max(100, "Too many connected stores"),
});

/**
 * Stock update validation schema
 * Used for updating product stock levels
 */
export const stockUpdateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  stock: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(999999, "Stock is too high"),
});

/**
 * Bulk stock update validation schema
 */
export const bulkStockUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        sku: z.string().min(1, "SKU is required"),
        stock: z.number().int().min(0),
      })
    )
    .min(1, "At least one update is required")
    .max(100, "Too many updates at once"),
});

/**
 * Product search/filter validation schema
 */
export const productFilterSchema = z.object({
  search: z
    .string()
    .max(100, "Search term is too long")
    .optional()
    .or(z.literal("")),
  stockFilter: z.enum(["semua", "aman", "rendah", "habis"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Type inference helpers
 */
export type InventoryProductInput = z.infer<typeof inventoryProductSchema>;
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;
export type BulkStockUpdateInput = z.infer<typeof bulkStockUpdateSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
