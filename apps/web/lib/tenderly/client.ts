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

  constructor(account: string, project: string, accessKey: string) {
    if (!account || !project || !accessKey) {
      throw new Error("Tenderly credentials not configured");
    }

    this.baseUrl = `https://api.tenderly.co/api/v1/account/${account}/project/${project}`;
    this.accessKey = accessKey;
  }

  async simulate(params: TenderlySimulationRequest): Promise<TenderlySimulationResponse> {
    const response = await fetch(`${this.baseUrl}/simulate`, {
      method: "POST",
      headers: {
        "X-Access-Key": this.accessKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Tenderly API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Lazy initialization - only create client when needed
let _tenderlyClient: TenderlyClient | null = null;

export function getTenderlyClient(): TenderlyClient {
  if (!_tenderlyClient) {
    const account = process.env.NEXT_PUBLIC_TENDERLY_ACCOUNT || process.env.TENDERLY_ACCOUNT;
    const project = process.env.NEXT_PUBLIC_TENDERLY_PROJECT || process.env.TENDERLY_PROJECT;
    const accessKey = process.env.NEXT_PUBLIC_TENDERLY_ACCESS_KEY || process.env.TENDERLY_ACCESS_KEY;

    if (!account || !project || !accessKey) {
      throw new Error("Tenderly credentials not configured");
    }

    _tenderlyClient = new TenderlyClient(account, project, accessKey);
  }
  return _tenderlyClient;
}

export function isTenderlyConfigured(): boolean {
  const account = process.env.NEXT_PUBLIC_TENDERLY_ACCOUNT || process.env.TENDERLY_ACCOUNT;
  const project = process.env.NEXT_PUBLIC_TENDERLY_PROJECT || process.env.TENDERLY_PROJECT;
  const accessKey = process.env.NEXT_PUBLIC_TENDERLY_ACCESS_KEY || process.env.TENDERLY_ACCESS_KEY;

  return !!(account && project && accessKey);
}
