import { z } from "zod";

/**
 * Phone number validation
 * Supports Indonesian phone number formats
 */
const phoneSchema = z
  .string()
  .regex(
    /^(\+62|62|0)8[1-9][0-9]{6,9}$/,
    "Invalid Indonesian phone number format"
  )
  .optional()
  .or(z.literal(""))
  .transform((val) => val || undefined);

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long")
    .regex(
      /^[a-zA-Z\s\u00C0-\u017F]+$/,
      "Full name can only contain letters and spaces"
    )
    .trim(),

  email: z
    .string()
    .email("Invalid email address")
    .min(5, "Email is too short")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),

  phone: phoneSchema,
});

/**
 * Password change validation schema
 * More strict than auth version - requires current password
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Shop connection validation schema
 */
export const shopConnectionSchema = z.object({
  shopId: z
    .number()
    .int("Shop ID must be an integer")
    .positive("Shop ID must be positive"),

  region: z.enum(["ID", "SG", "MY", "TH", "VN", "PH"] as const),

  authorizationCode: z
    .string()
    .min(1, "Authorization code is required")
    .max(500, "Authorization code is too long"),
});

/**
 * Notification settings validation schema
 */
export const notificationSettingsSchema = z.object({
  lowStockAlert: z.boolean().default(true),
  newOrderAlert: z.boolean().default(true),
  dailySummary: z.boolean().default(false),
  weeklyReport: z.boolean().default(true),
  browserPush: z.boolean().default(true),
});

/**
 * Type inference helpers
 */
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type ShopConnectionInput = z.infer<typeof shopConnectionSchema>;
export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;
