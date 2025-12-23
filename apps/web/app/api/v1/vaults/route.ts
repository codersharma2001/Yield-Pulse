import { NextRequest, NextResponse } from "next/server";
import { getVaults } from "@/lib/api/data-service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const env = searchParams.get("env") as "mainnet" | "testnet" | undefined;

    const vaults = await getVaults(env);
    return NextResponse.json(vaults);
  } catch (error) {
    console.error("Error fetching vaults:", error);
    return NextResponse.json(
      { message: "Failed to fetch vaults", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
