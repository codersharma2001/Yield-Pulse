import { NextRequest, NextResponse } from "next/server";
import { getUserPositions } from "@/lib/api/data-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const env = searchParams.get("env") as "mainnet" | "testnet" | undefined;
    const address = params.address;

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { message: "Invalid Ethereum address", code: "INVALID_ADDRESS" },
        { status: 400 }
      );
    }

    const positions = await getUserPositions(address, env);
    return NextResponse.json(positions);
  } catch (error) {
    console.error("Error fetching user positions:", error);
    return NextResponse.json(
      { message: "Failed to fetch user positions", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
