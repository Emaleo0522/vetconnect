import { z } from "zod";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from apps/api/ root (2 levels up from src/lib/)
dotenv.config({ path: resolve(__dirname, "../../.env") });

const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGINS: z.string().default("http://localhost:8081"),
  BETTER_AUTH_SECRET: z.string().min(16),
  ENCRYPTION_KEY: z.string().min(16),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
