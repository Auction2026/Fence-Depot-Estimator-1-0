import { NextResponse } from "next/server";
import { acceptEstimateToContract } from "@/lib/services/contract-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { approvedByName: string; approvedByEmail?: string };
    const contract = await acceptEstimateToContract(id, payload.approvedByName, payload.approvedByEmail);
    return NextResponse.json({ id: contract.id, contractNumber: contract.contractNumber });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to convert estimate." },
      { status: 400 },
    );
  }
}
