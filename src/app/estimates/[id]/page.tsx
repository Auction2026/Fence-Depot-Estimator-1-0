import Link from "next/link";
import { notFound } from "next/navigation";
import { AcceptEstimateButton } from "@/components/estimator/AcceptEstimateButton";
import { money } from "@/lib/money";
import { formatImperialFromMm } from "@/lib/units";
import { getCompanySettings, getEstimateById } from "@/lib/services/reference-data";

export const dynamic = "force-dynamic";

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [estimate, company] = await Promise.all([getEstimateById(id), getCompanySettings()]);

  if (!estimate || !estimate.currentRevision) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Estimate</p>
          <h2 className="text-2xl font-semibold">{estimate.estimateNumber}</h2>
          <p className="mt-2 text-sm text-zinc-600">{estimate.customer.displayName} · {estimate.projectSite.siteName}</p>
          <p className="text-sm text-zinc-600">{estimate.projectSite.addressLine1}, {estimate.projectSite.city}, {estimate.projectSite.province}</p>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl bg-zinc-950 p-4 text-white">
            <p className="text-sm text-zinc-300">Total</p>
            <p className="text-3xl font-semibold">{money.format(BigInt(estimate.grandTotalCents))}</p>
          </div>
          {estimate.contract ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">Contract created: <strong>{estimate.contract.contractNumber}</strong></div>
          ) : (
            <AcceptEstimateButton
              estimateId={estimate.id}
              defaultApprovedByName={`${company.businessName} office`}
              defaultApprovedByEmail={company.email}
            />
          )}
          <Link href="/estimates/new" className="block rounded-lg border border-zinc-300 px-4 py-2 text-center text-sm font-medium">Create another estimate</Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Chain-link takeoff</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500"><th className="py-2">Section</th><th className="py-2">Item</th><th className="py-2">Qty</th><th className="py-2">Price</th></tr>
              </thead>
              <tbody>
                {estimate.currentRevision.lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100">
                    <td className="py-3">{item.section}</td>
                    <td className="py-3"><div className="font-medium">{item.name}</div><div className="text-zinc-500">{item.description}</div>{item.overrideReason ? <div className="text-xs text-amber-700">Override: {item.overrideReason}</div> : null}</td>
                    <td className="py-3">{item.quantity.toString()}</td>
                    <td className="py-3">{money.format(BigInt(item.extendedPriceCents))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Runs and gates</h3>
          {estimate.currentRevision.estimateRuns.map((run) => (
            <div key={run.id} className="rounded-xl bg-zinc-50 p-4 text-sm">
              <div className="font-medium">{run.name}</div>
              <div>{formatImperialFromMm(run.lengthMm)} long · {formatImperialFromMm(run.heightMm)} high</div>
              <div>{run.endTerminalPosts} end terminals · {run.cornerTerminalPosts} corner terminals</div>
            </div>
          ))}
          {estimate.currentRevision.gates.map((gate) => (
            <div key={gate.id} className="rounded-xl bg-zinc-50 p-4 text-sm">
              <div className="font-medium">{gate.name}</div>
              <div>{gate.gateType.replaceAll("_", " ")}</div>
              <div>{gate.quantity} × {formatImperialFromMm(gate.widthMm)} wide · {formatImperialFromMm(gate.heightMm)} high</div>
            </div>
          ))}
          <div className="rounded-xl bg-zinc-950 p-4 text-white">
            <p className="text-sm text-zinc-300">Breakdown</p>
            <p>Materials: {money.format(BigInt(estimate.materialTotalCents))}</p>
            <p>Labour: {money.format(BigInt(estimate.labourTotalCents))}</p>
            <p>Equipment: {money.format(BigInt(estimate.equipmentTotalCents))}</p>
            <p>Other: {money.format(BigInt(estimate.nonStockTotalCents))}</p>
            <p>Tax: {money.format(BigInt(estimate.taxTotalCents))}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
