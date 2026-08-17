import Link from "next/link";
import { listEstimateSummaries } from "@/lib/services/reference-data";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const estimates = await listEstimateSummaries();
  const totalValue = estimates.reduce((sum, estimate) => sum + estimate.grandTotalCents, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Open estimates</p>
          <p className="mt-3 text-3xl font-semibold">{estimates.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Contracts created</p>
          <p className="mt-3 text-3xl font-semibold">{estimates.filter((estimate) => estimate.contract).length}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Tracked pipeline</p>
          <p className="mt-3 text-3xl font-semibold">{money.format(BigInt(totalValue))}</p>
        </div>
      </section>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Latest chain-link estimates</h2>
            <p className="text-sm text-zinc-600">Create, reopen, and convert chain-link estimates. This release intentionally excludes wood, vinyl/PVC, ornamental iron, guide rail, bollards, and all other materials.</p>
          </div>
          <Link href="/estimates/new" className="rounded-xl bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800">Start a new estimate</Link>
        </div>
        {estimates.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-8 text-sm text-zinc-600">No estimates yet. Seed the demo data or create your first chain-link estimate.</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500"><th className="py-2">Estimate</th><th className="py-2">Customer</th><th className="py-2">Status</th><th className="py-2">Amount</th><th className="py-2"></th></tr>
              </thead>
              <tbody>
                {estimates.map((estimate) => (
                  <tr key={estimate.id} className="border-b border-zinc-100">
                    <td className="py-3">{estimate.estimateNumber}</td>
                    <td className="py-3">{estimate.customer.displayName}</td>
                    <td className="py-3">{estimate.status}</td>
                    <td className="py-3">{money.format(BigInt(estimate.grandTotalCents))}</td>
                    <td className="py-3 text-right"><Link href={`/estimates/${estimate.id}`} className="font-medium text-emerald-700">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
