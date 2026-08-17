import { NextResponse } from "next/server";
import { getEstimateById } from "@/lib/services/reference-data";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const estimate = await getEstimateById(id);

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  return NextResponse.json(estimate);
}
