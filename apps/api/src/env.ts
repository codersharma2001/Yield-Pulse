import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3001),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  TENDERLY_PROJECT: z.string().optional(),
  TENDERLY_ACCESS_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  NETWORK_ENV: z.enum(["mainnet", "testnet"]).default("testnet")
});

export const env = schema.parse(process.env);
