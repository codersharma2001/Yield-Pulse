import { NextRequest, NextResponse } from "next/server";
import { getVaultDetail } from "@/lib/api/data-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const env = searchParams.get("env") as "mainnet" | "testnet" | undefined;
    const id = decodeURIComponent(params.id);

    const detail = await getVaultDetail(id, env);

    if (!detail) {
      return NextResponse.json(
        { message: "Vault not found", code: "VAULT_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Error fetching vault detail:", error);
    return NextResponse.json(
      { message: "Failed to fetch vault detail", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
