import { validateEnv } from "./env";
import { logger } from "@/lib/utils/logger";

/**
 * Initialize application on startup
 * Call this function in the root layout or middleware
 */
export function initializeApp() {
  try {
    // Validate environment variables
    const envResult = validateEnv();

    if (!envResult.success) {
      logger.error("Application startup failed: Invalid environment configuration");
      return false;
    }

    // Log successful startup (info level)
    logger.info("Application initialized successfully", {
      environment: process.env.NODE_ENV || "development",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
      shopeeConfigured: process.env.SHOPEE_PARTNER_ID ? "configured" : "missing",
    });

    return true;
  } catch (error) {
    logger.error("Application startup error", undefined, error);
    return false;
  }
}

/**
 * Check if all required security features are properly configured
 */
export function validateSecurityConfig() {
  const warnings: string[] = [];

  // Check cookie security settings
  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://")) {
      warnings.push("Supabase URL should use HTTPS in production");
    }
  }

  // Check if rate limiting is properly configured
  // (This would check Redis/store connection in a real implementation)

  // Log warnings
  if (warnings.length > 0) {
    logger.warn("Security configuration warnings", { warnings });
  }

  return warnings;
}
