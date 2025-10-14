import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { SimulationRequest } from "@yield-dashboard/sdk";

import { getUserPositions, getVaultDetail, getVaults, simulateAction } from "../data/sample";

export async function registerV1Routes(server: FastifyInstance) {
  const envQuerySchema = z.object({
    env: z.enum(["mainnet", "testnet"]).optional()
  });

  server.get("/api/v1/vaults", async (request) => {
    const { env } = envQuerySchema.parse(request.query);
    return getVaults(env);
  });

  server.get("/api/v1/vaults/:id", async (request, reply) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const { env } = envQuerySchema.parse(request.query);
    const detail = await getVaultDetail(params.id, env);
    if (!detail) {
      reply.code(404);
      return {
        message: "Vault not found",
        code: "VAULT_NOT_FOUND"
      };
    }
    return detail;
  });

  server.get("/api/v1/users/:address/positions", async (request) => {
    const params = z.object({ address: z.string().regex(/^0x[a-fA-F0-9]{40}$/) }).parse(request.params);
    const { env } = envQuerySchema.parse(request.query);
    return getUserPositions(params.address, env);
  });

  const simulationSchema = z.object({
    vaultId: z.string(),
    action: z.enum(["deposit", "withdraw"]),
    chainId: z.coerce.number(),
    from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    amount: z.string(),
    slippageBps: z.coerce.number().optional()
  });

  server.post("/api/v1/simulate", async (request, reply) => {
    const body = simulationSchema.parse(request.body);
    const result = await simulateAction(body as SimulationRequest);
    if (!result.success) {
      reply.code(422);
    }
    return result;
  });
}
