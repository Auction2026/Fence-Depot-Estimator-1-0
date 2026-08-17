"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptEstimateButton({
  estimateId,
  defaultApprovedByName,
  defaultApprovedByEmail,
}: {
  estimateId: string;
  defaultApprovedByName: string;
  defaultApprovedByEmail: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedByName, setApprovedByName] = useState(defaultApprovedByName);
  const [approvedByEmail, setApprovedByEmail] = useState(defaultApprovedByEmail);

  async function acceptEstimate() {
    setIsSaving(true);
    setError(null);

    const response = await fetch(`/api/estimates/${estimateId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedByName, approvedByEmail }),
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
      <label className="block space-y-1 text-sm font-medium text-zinc-700">
        Approved by
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={approvedByName}
          onChange={(event) => setApprovedByName(event.target.value)}
        />
      </label>
      <label className="block space-y-1 text-sm font-medium text-zinc-700">
        Approval email
        <input
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          value={approvedByEmail}
          onChange={(event) => setApprovedByEmail(event.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={acceptEstimate}
        disabled={isSaving || !approvedByName.trim()}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {isSaving ? "Converting..." : "Accept estimate and create contract"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
