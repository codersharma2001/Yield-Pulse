import type {
  SimulationRequest,
  SimulationResult,
  UserPositionsResponse,
  VaultDetailResponse,
  VaultListResponse
} from "@yield-dashboard/sdk";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const withEnv = (url: string, env?: string) => {
  if (!env) return url;
  return url.includes("?") ? `${url}&env=${env}` : `${url}?env=${env}`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json() as Promise<T>;
}

export const api = {
  async getVaults(env?: string) {
    const response = await fetch(withEnv(`${API_BASE_URL}/api/v1/vaults`, env));
    return handleResponse<VaultListResponse>(response);
  },
  async getVault(id: string, env?: string) {
    const response = await fetch(withEnv(`${API_BASE_URL}/api/v1/vaults/${encodeURIComponent(id)}`, env));
    return handleResponse<VaultDetailResponse>(response);
  },
  async getPositions(address: string, env?: string) {
    const response = await fetch(withEnv(`${API_BASE_URL}/api/v1/users/${address}/positions`, env));
    return handleResponse<UserPositionsResponse>(response);
  },
  async simulate(body: SimulationRequest, env?: string) {
    const response = await fetch(withEnv(`${API_BASE_URL}/api/v1/simulate`, env), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return handleResponse<SimulationResult>(response);
  }
};
