import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "../../../.env") });

const schema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  TENDERLY_ACCOUNT: z.string().optional(),
  TENDERLY_PROJECT: z.string().optional(),
  TENDERLY_ACCESS_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  NETWORK_ENV: z.enum(["mainnet", "testnet"]).default("testnet")
});

export const env = schema.parse(process.env);
