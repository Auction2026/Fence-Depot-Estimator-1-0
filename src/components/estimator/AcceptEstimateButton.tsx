"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptEstimateButton({ estimateId }: { estimateId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptEstimate() {
    setIsSaving(true);
    setError(null);

    const response = await fetch(`/api/estimates/${estimateId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedByName: "Fence Depot office", approvedByEmail: "fencedepot@hotmail.com" }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Could not accept the estimate.");
      setIsSaving(false);
      return;
    }

    router.refresh();
    setIsSaving(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={acceptEstimate}
        disabled={isSaving}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {isSaving ? "Converting..." : "Accept estimate and create contract"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
