import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SimulationRequest } from "@yield-dashboard/sdk";
import { simulateAction } from "@/lib/api/data-service";

const simulationSchema = z.object({
  vaultId: z.string(),
  action: z.enum(["deposit", "withdraw"]),
  chainId: z.number(),
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),
  slippageBps: z.number().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = simulationSchema.parse(body);

    const result = await simulateAction(validatedData as SimulationRequest);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request data",
          code: "VALIDATION_ERROR",
          errors: error.errors
        },
        { status: 400 }
      );
    }

    console.error("Error simulating action:", error);
    return NextResponse.json(
      { message: "Failed to simulate action", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
