import { NextResponse } from "next/server";
import { createEstimate } from "@/lib/services/estimate-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const estimate = await createEstimate(payload);
    return NextResponse.json({ id: estimate.id, estimateNumber: estimate.estimateNumber });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save estimate." },
      { status: 400 },
    );
  }
}
