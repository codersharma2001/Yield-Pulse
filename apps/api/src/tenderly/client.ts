import axios from "axios";
import { env } from "../env";

interface TenderlySimulationRequest {
  network_id: string;
  from: string;
  to: string;
  input: string;
  value: string;
  save?: boolean;
  save_if_fails?: boolean;
  simulation_type?: "quick" | "full";
  state_objects?: Record<
    string,
    {
      balance?: string;
      storage?: Record<string, string>;
      code?: string;
    }
  >;
}

interface TenderlySimulationResponse {
  transaction: {
    status: boolean;
    gas_used: number;
    logs: Array<{
      name?: string;
      inputs?: Array<{ name: string; value: string }>;
    }>;
  };
  simulation: {
    status: boolean;
  };
}

export class TenderlyClient {
  private readonly baseUrl: string;
  private readonly accessKey: string;

  constructor() {
    const account = env.TENDERLY_ACCOUNT;
    const project = env.TENDERLY_PROJECT;
    const accessKey = env.TENDERLY_ACCESS_KEY;

    if (!account || !project || !accessKey) {
      throw new Error("Tenderly credentials not configured");
    }

    this.baseUrl = `https://api.tenderly.co/api/v1/account/${account}/project/${project}`;
    this.accessKey = accessKey;
  }

  async simulate(params: TenderlySimulationRequest): Promise<TenderlySimulationResponse> {
    const response = await axios.post(
      `${this.baseUrl}/simulate`,
      params,
      {
        headers: {
          "X-Access-Key": this.accessKey,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  }
}

// Lazy initialization - only create client when needed
let _tenderlyClient: TenderlyClient | null = null;

export function getTenderlyClient(): TenderlyClient {
  if (!_tenderlyClient) {
    _tenderlyClient = new TenderlyClient();
  }
  return _tenderlyClient;
}

export function isTenderlyConfigured(): boolean {
  return !!(env.TENDERLY_ACCOUNT && env.TENDERLY_PROJECT && env.TENDERLY_ACCESS_KEY);
}
