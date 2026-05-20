import { z } from "zod";

/**
 * Environment variable validation schema
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("Invalid Supabase URL")
    .startsWith("https://", "Supabase URL must use HTTPS"),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required")
    .startsWith("ey", "Invalid Supabase anon key format"),

  // Optional: Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Optional: Log level
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info"),
});

/**
 * Validate environment variables
 * Call this function at application startup
 */
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return { success: true, data: env } as const;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );

      console.error(
        "❌ Environment variable validation failed:\n",
        missingVars.join("\n")
      );

      // In production, throw error to prevent startup with invalid config
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Invalid environment configuration: ${missingVars.join(", ")}`
        );
      }
    }

    return { success: false, error } as const;
  }
}

/**
 * Get validated environment variables
 * Throws an error if validation fails
 */
export function getEnv() {
  const result = validateEnv();

  if (!result.success) {
    throw new Error("Environment validation failed");
  }

  return result.data;
}

// Type inference for environment variables
export type Env = z.infer<typeof envSchema>;
