"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateChainLinkEstimate } from "@/lib/domain/chain-link";
import { type CatalogVariant, type EstimateInput, type RateCard, type SelectionCategory } from "@/lib/domain/types";
import { demoEstimateInput } from "@/lib/demo";
import { money } from "@/lib/money";
import { feetAndInchesToMm, formatImperialFromMm, mmToMetres } from "@/lib/units";

const steps = [
  "Customer & project",
  "Fence configuration",
  "Gates",
  "Labour & pricing",
  "Takeoff review",
  "Summary",
];

function splitMm(mm: number) {
  const totalInches = mm / 25.4;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
}

type Props = {
  companyName: string;
  variants: CatalogVariant[];
  rateCard: RateCard;
  defaults: {
    taxBasisPoints: number;
    linePostSpacingMm: number;
    fabricWasteBasisPoints: number;
    topRailStockLengthMm: number;
    footingDiameterMm: number;
    footingDepthMm: number;
  };
};

function updateVariantByFilters(
  variants: CatalogVariant[],
  category: SelectionCategory,
  currentId: string,
  filters: Partial<Record<"colour" | "meshGauge" | "diameter" | "thickness" | "length" | "height", string>>,
) {
  const matches = variants.filter((variant) => {
    if (variant.category !== category) return false;
    if (filters.colour && (variant.colour ?? "") !== filters.colour) return false;
    if (filters.meshGauge && (variant.meshGauge ?? "") !== filters.meshGauge) return false;
    if (filters.diameter && String(variant.compatiblePipeDiameterMm ?? "") !== filters.diameter) return false;
    if (filters.thickness && String(variant.wallThicknessMm ?? "") !== filters.thickness) return false;
    if (filters.length && String(variant.lengthMm ?? "") !== filters.length) return false;
    if (filters.height && String(variant.heightMm ?? "") !== filters.height) return false;
    return true;
  });

  return matches.find((variant) => variant.id === currentId)?.id ?? matches[0]?.id ?? currentId;
}

function distinct(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function EstimatorWizard({ companyName, variants, rateCard, defaults }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<EstimateInput>({
    ...demoEstimateInput,
    configuration: {
      ...demoEstimateInput.configuration,
      taxBasisPoints: defaults.taxBasisPoints,
      linePostSpacingMm: defaults.linePostSpacingMm,
      fabricWasteBasisPoints: defaults.fabricWasteBasisPoints,
      topRailStockLengthMm: defaults.topRailStockLengthMm,
      footingDiameterMm: defaults.footingDiameterMm,
      footingDepthMm: defaults.footingDepthMm,
    },
  });

  const preview = useMemo(() => calculateChainLinkEstimate(form, variants, rateCard), [form, rateCard, variants]);

  const fabricVariants = variants.filter((variant) => variant.category === "fabric");
  const linePostVariants = variants.filter((variant) => variant.category === "linePost");
  const terminalPostVariants = variants.filter((variant) => variant.category === "terminalPost");
  const topRailVariants = variants.filter((variant) => variant.category === "topRail");

  const selectedFabric = variants.find((variant) => variant.id === form.selections.fabric);
  const selectedLinePost = variants.find((variant) => variant.id === form.selections.linePost);
  const selectedTerminalPost = variants.find((variant) => variant.id === form.selections.terminalPost);
  const selectedTopRail = variants.find((variant) => variant.id === form.selections.topRail);

  function setSelection(category: SelectionCategory, id: string) {
    setForm((current) => ({
      ...current,
      selections: {
        ...current.selections,
        [category]: id,
      },
    }));
  }

  function setOverride(code: string, field: "quantity" | "unitPriceCents" | "reason", value: string) {
    setForm((current) => {
      const existing = current.overrides?.[code] ?? { reason: "" };
      return {
        ...current,
        overrides: {
          ...current.overrides,
          [code]: {
            ...existing,
            [field]: field === "reason" ? value : Number(value),
          },
        },
      };
    });
  }

  async function saveEstimate() {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setSaveError(payload.error ?? "Could not save estimate.");
        setIsSaving(false);
        return;
      }

      const payload = (await response.json()) as { id: string };
      router.push(`/estimates/${payload.id}`);
    } catch {
      setSaveError("Could not save estimate. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">{companyName} chain-link estimator</p>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-xl border px-3 py-2 text-left text-sm ${
                step === index ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-zinc-200"
              }`}
            >
              <span className="block text-xs uppercase tracking-wide text-zinc-500">Step {index + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {step === 0 ? (
        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">Customer name
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.customer.displayName} onChange={(event) => setForm({ ...form, customer: { ...form.customer, displayName: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Company name
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.customer.companyName ?? ""} onChange={(event) => setForm({ ...form, customer: { ...form.customer, companyName: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Email
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.customer.email ?? ""} onChange={(event) => setForm({ ...form, customer: { ...form.customer, email: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Phone
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.customer.phone ?? ""} onChange={(event) => setForm({ ...form, customer: { ...form.customer, phone: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-2">Project / site name
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.projectSite.siteName} onChange={(event) => setForm({ ...form, projectSite: { ...form.projectSite, siteName: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-2">Address
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.projectSite.addressLine1} onChange={(event) => setForm({ ...form, projectSite: { ...form.projectSite, addressLine1: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">City
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.projectSite.city} onChange={(event) => setForm({ ...form, projectSite: { ...form.projectSite, city: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Province
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.projectSite.province} onChange={(event) => setForm({ ...form, projectSite: { ...form.projectSite, province: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Postal code
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.projectSite.postalCode} onChange={(event) => setForm({ ...form, projectSite: { ...form.projectSite, postalCode: event.target.value } })} />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-2">Project notes
            <textarea className="min-h-24 w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.projectSite.notes ?? ""} onChange={(event) => setForm({ ...form, projectSite: { ...form.projectSite, notes: event.target.value } })} />
          </label>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {form.runs.map((run, index) => (
            <div key={`${run.name}-${index}`} className="grid gap-4 border-b border-zinc-100 pb-4 last:border-b-0 last:pb-0 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium">Run name
                <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={run.name} onChange={(event) => setForm({ ...form, runs: form.runs.map((entry, runIndex) => runIndex === index ? { ...entry, name: event.target.value } : entry) })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Length (ft / in)
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(run.lengthMm).feet} onChange={(event) => setForm({ ...form, runs: form.runs.map((entry, runIndex) => runIndex === index ? { ...entry, lengthMm: feetAndInchesToMm(Number(event.target.value), splitMm(run.lengthMm).inches) } : entry) })} />
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(run.lengthMm).inches} onChange={(event) => setForm({ ...form, runs: form.runs.map((entry, runIndex) => runIndex === index ? { ...entry, lengthMm: feetAndInchesToMm(splitMm(run.lengthMm).feet, Number(event.target.value)) } : entry) })} />
                </div>
                <span className="text-xs text-zinc-500">Canonical: {run.lengthMm} mm</span>
              </label>
              <label className="space-y-2 text-sm font-medium">Height (ft / in)
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(run.heightMm).feet} onChange={(event) => setForm({ ...form, runs: form.runs.map((entry, runIndex) => runIndex === index ? { ...entry, heightMm: feetAndInchesToMm(Number(event.target.value), splitMm(run.heightMm).inches) } : entry) })} />
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(run.heightMm).inches} onChange={(event) => setForm({ ...form, runs: form.runs.map((entry, runIndex) => runIndex === index ? { ...entry, heightMm: feetAndInchesToMm(splitMm(run.heightMm).feet, Number(event.target.value)) } : entry) })} />
                </div>
                <span className="text-xs text-zinc-500">Canonical: {run.heightMm} mm</span>
              </label>
              <label className="space-y-2 text-sm font-medium">End terminals
                <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={run.endTerminalPosts} onChange={(event) => setForm({ ...form, runs: form.runs.map((entry, runIndex) => runIndex === index ? { ...entry, endTerminalPosts: Number(event.target.value) } : entry) })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Corner terminals
                <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={run.cornerTerminalPosts} onChange={(event) => setForm({ ...form, runs: form.runs.map((entry, runIndex) => runIndex === index ? { ...entry, cornerTerminalPosts: Number(event.target.value) } : entry) })} />
              </label>
              <p className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">Quick length view: {formatImperialFromMm(run.lengthMm)} at {formatImperialFromMm(run.heightMm)} high.</p>
            </div>
          ))}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">Line post spacing (ft / in)
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(form.configuration.linePostSpacingMm).feet} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, linePostSpacingMm: feetAndInchesToMm(Number(event.target.value), splitMm(form.configuration.linePostSpacingMm).inches) } })} />
                <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(form.configuration.linePostSpacingMm).inches} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, linePostSpacingMm: feetAndInchesToMm(splitMm(form.configuration.linePostSpacingMm).feet, Number(event.target.value)) } })} />
              </div>
              <span className="text-xs text-zinc-500">Canonical: {form.configuration.linePostSpacingMm} mm</span>
            </label>
            <label className="space-y-2 text-sm font-medium">Fabric waste (%)
              <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.fabricWasteBasisPoints / 100} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, fabricWasteBasisPoints: Number(event.target.value) * 100 } })} />
            </label>
            <label className="space-y-2 text-sm font-medium">Installation method
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.installationMethod} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, installationMethod: event.target.value as EstimateInput['configuration']['installationMethod'] } })}>
                <option value="CONCRETE_FOOTING">Concrete footing</option>
                <option value="DRIVEN_POST">Driven post</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-2 text-sm font-medium">Fabric colour
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={selectedFabric?.colour ?? ""} onChange={(event) => setSelection("fabric", updateVariantByFilters(variants, "fabric", form.selections.fabric, { colour: event.target.value, meshGauge: selectedFabric?.meshGauge ?? "", height: String(selectedFabric?.heightMm ?? "") }))}>
                {distinct(fabricVariants.map((variant) => variant.colour)).map((colour) => <option key={colour} value={colour}>{colour}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Fabric mesh gauge
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={selectedFabric?.meshGauge ?? ""} onChange={(event) => setSelection("fabric", updateVariantByFilters(variants, "fabric", form.selections.fabric, { colour: selectedFabric?.colour ?? "", meshGauge: event.target.value, height: String(selectedFabric?.heightMm ?? "") }))}>
                {distinct(fabricVariants.filter((variant) => !selectedFabric?.colour || variant.colour === selectedFabric.colour).map((variant) => variant.meshGauge)).map((gauge) => <option key={gauge} value={gauge}>{gauge}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Line post diameter
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={String(selectedLinePost?.compatiblePipeDiameterMm ?? "")} onChange={(event) => setSelection("linePost", updateVariantByFilters(variants, "linePost", form.selections.linePost, { colour: selectedLinePost?.colour ?? "", diameter: event.target.value, thickness: String(selectedLinePost?.wallThicknessMm ?? ""), length: String(selectedLinePost?.lengthMm ?? "") }))}>
                {distinct(linePostVariants.map((variant) => String(variant.compatiblePipeDiameterMm))).map((value) => <option key={value} value={value}>{value} mm</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Line post thickness
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={String(selectedLinePost?.wallThicknessMm ?? "")} onChange={(event) => setSelection("linePost", updateVariantByFilters(variants, "linePost", form.selections.linePost, { colour: selectedLinePost?.colour ?? "", diameter: String(selectedLinePost?.compatiblePipeDiameterMm ?? ""), thickness: event.target.value, length: String(selectedLinePost?.lengthMm ?? "") }))}>
                {distinct(linePostVariants.filter((variant) => !selectedLinePost?.compatiblePipeDiameterMm || variant.compatiblePipeDiameterMm === selectedLinePost.compatiblePipeDiameterMm).map((variant) => String(variant.wallThicknessMm))).map((value) => <option key={value} value={value}>{value} mm</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Terminal post diameter
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={String(selectedTerminalPost?.compatiblePipeDiameterMm ?? "")} onChange={(event) => setSelection("terminalPost", updateVariantByFilters(variants, "terminalPost", form.selections.terminalPost, { colour: selectedTerminalPost?.colour ?? "", diameter: event.target.value, thickness: String(selectedTerminalPost?.wallThicknessMm ?? ""), length: String(selectedTerminalPost?.lengthMm ?? "") }))}>
                {distinct(terminalPostVariants.map((variant) => String(variant.compatiblePipeDiameterMm))).map((value) => <option key={value} value={value}>{value} mm</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Top rail length
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={String(selectedTopRail?.lengthMm ?? "")} onChange={(event) => { const lengthMm = Number(event.target.value); setForm((current) => ({ ...current, selections: { ...current.selections, topRail: updateVariantByFilters(variants, "topRail", current.selections.topRail, { colour: selectedTopRail?.colour ?? "", length: String(lengthMm), thickness: String(selectedTopRail?.wallThicknessMm ?? ""), diameter: String(selectedTopRail?.compatiblePipeDiameterMm ?? "") }) }, configuration: { ...current.configuration, topRailStockLengthMm: lengthMm } })); }}>
                {distinct(topRailVariants.map((variant) => String(variant.lengthMm))).map((value) => <option key={value} value={value}>{value} mm</option>)}
              </select>
            </label>
            <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium" onClick={() => setForm({ ...form, runs: [...form.runs, { name: `Run ${form.runs.length + 1}`, lengthMm: feetAndInchesToMm(40), heightMm: feetAndInchesToMm(6), endTerminalPosts: 2, cornerTerminalPosts: 0 }] })}>Add another run</button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {form.gates.map((gate, index) => (
            <div key={`${gate.name}-${index}`} className="grid gap-4 border-b border-zinc-100 pb-4 last:border-b-0 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium">Gate name
                <input className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={gate.name} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, name: event.target.value } : entry) })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Gate type
                <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={gate.gateType} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, gateType: event.target.value as EstimateInput['gates'][number]['gateType'] } : entry) })}>
                  <option value="SINGLE_SWING">Single swing</option>
                  <option value="DOUBLE_SWING">Double swing</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">Quantity
                <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={gate.quantity} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, quantity: Number(event.target.value) } : entry) })} />
              </label>
              <label className="space-y-2 text-sm font-medium">Width (ft / in)
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(gate.widthMm).feet} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, widthMm: feetAndInchesToMm(Number(event.target.value), splitMm(gate.widthMm).inches) } : entry) })} />
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(gate.widthMm).inches} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, widthMm: feetAndInchesToMm(splitMm(gate.widthMm).feet, Number(event.target.value)) } : entry) })} />
                </div>
                <span className="text-xs text-zinc-500">Canonical: {gate.widthMm} mm</span>
              </label>
              <label className="space-y-2 text-sm font-medium">Height (ft / in)
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(gate.heightMm).feet} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, heightMm: feetAndInchesToMm(Number(event.target.value), splitMm(gate.heightMm).inches) } : entry) })} />
                  <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={splitMm(gate.heightMm).inches} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, heightMm: feetAndInchesToMm(splitMm(gate.heightMm).feet, Number(event.target.value)) } : entry) })} />
                </div>
                <span className="text-xs text-zinc-500">Canonical: {gate.heightMm} mm</span>
              </label>
              <label className="flex items-center gap-3 pt-8 text-sm font-medium"><input type="checkbox" checked={gate.includeFrameKit} onChange={(event) => setForm({ ...form, gates: form.gates.map((entry, gateIndex) => gateIndex === index ? { ...entry, includeFrameKit: event.target.checked } : entry) })} /> Include gate frame kit</label>
            </div>
          ))}
          <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium" onClick={() => setForm({ ...form, gates: [...form.gates, { name: `Gate ${form.gates.length + 1}`, gateType: "SINGLE_SWING", widthMm: feetAndInchesToMm(4), heightMm: feetAndInchesToMm(6), quantity: 1, includeFrameKit: true }] })}>Add gate</button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-3">
          <label className="space-y-2 text-sm font-medium">Labour rate
            <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.labourRateId} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, labourRateId: event.target.value } })}>
              {rateCard.labourRates.map((rate) => <option key={rate.id} value={rate.id}>{rate.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">Labour hours
            <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.labourHours} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, labourHours: Number(event.target.value) } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Equipment rate
            <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.equipmentRateId} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, equipmentRateId: event.target.value } })}>
              {rateCard.equipmentRates.map((rate) => <option key={rate.id} value={rate.id}>{rate.name}</option>)}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">Equipment hours
            <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.equipmentHours} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, equipmentHours: Number(event.target.value) } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Freight (CAD)
            <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.freightCents / 100} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, freightCents: Number(event.target.value) * 100 } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Non-stock (CAD)
            <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.nonStockCents / 100} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, nonStockCents: Number(event.target.value) * 100 } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Contingency (%)
            <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.contingencyBasisPoints / 100} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, contingencyBasisPoints: Number(event.target.value) * 100 } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">Pricing mode
            <select className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.pricingMode} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, pricingMode: event.target.value as EstimateInput['configuration']['pricingMode'] } })}>
              <option value="MARKUP">Markup</option>
              <option value="MARGIN">Margin</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium">Markup / margin (%)
            <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.adjustmentBasisPoints / 100} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, adjustmentBasisPoints: Number(event.target.value) * 100 } })} />
          </label>
          <label className="space-y-2 text-sm font-medium">HST (%)
            <input type="number" className="w-full rounded-lg border border-zinc-300 px-3 py-2" value={form.configuration.taxBasisPoints / 100} onChange={(event) => setForm({ ...form, configuration: { ...form.configuration, taxBasisPoints: Number(event.target.value) * 100 } })} />
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <p className="rounded-xl bg-zinc-50 p-4 text-sm">Fence length<br /><strong>{mmToMetres(preview.summary.totalFenceLengthMm).toFixed(2)} m</strong></p>
            <p className="rounded-xl bg-zinc-50 p-4 text-sm">Line posts<br /><strong>{preview.summary.linePosts}</strong></p>
            <p className="rounded-xl bg-zinc-50 p-4 text-sm">Terminal posts<br /><strong>{preview.summary.totalTerminalPosts}</strong></p>
            <p className="rounded-xl bg-zinc-50 p-4 text-sm">Concrete volume<br /><strong>{preview.summary.concreteVolumeCubicMetres.toFixed(3)} m³</strong></p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="py-2">Item</th><th className="py-2">Qty</th><th className="py-2">Unit price</th><th className="py-2">Override reason</th>
                </tr>
              </thead>
              <tbody>
                {preview.lineItems.map((item) => (
                  <tr key={item.code} className="border-b border-zinc-100 align-top">
                    <td className="py-3 pr-4"><div className="font-medium">{item.name}</div><div className="text-zinc-500">{item.description}</div></td>
                    <td className="py-3 pr-4"><input aria-label={`${item.name} quantity`} type="number" step="0.01" className="w-24 rounded-lg border border-zinc-300 px-2 py-1" value={form.overrides?.[item.code]?.quantity ?? item.quantity} onChange={(event) => setOverride(item.code, "quantity", event.target.value)} /></td>
                    <td className="py-3 pr-4"><input aria-label={`${item.name} unit price`} type="number" step="0.01" className="w-28 rounded-lg border border-zinc-300 px-2 py-1" value={(form.overrides?.[item.code]?.unitPriceCents ?? item.unitPriceCents) / 100} onChange={(event) => setOverride(item.code, "unitPriceCents", String(Math.round(Number(event.target.value) * 100)))} /></td>
                    <td className="py-3"><input aria-label={`${item.name} override reason`} className="w-full rounded-lg border border-zinc-300 px-2 py-1" value={form.overrides?.[item.code]?.reason ?? ""} onChange={(event) => setOverride(item.code, "reason", event.target.value)} placeholder="Required if changed" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Estimate summary</h2>
            <p className="text-sm text-zinc-600">This first release is intentionally chain-link only. It saves the estimate, revisions, takeoff lines, contract conversion boundary, and ACE POS staging payload without supporting any other fence material.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <p className="rounded-xl bg-zinc-50 p-4 text-sm">Customer<br /><strong>{form.customer.displayName}</strong></p>
              <p className="rounded-xl bg-zinc-50 p-4 text-sm">Project<br /><strong>{form.projectSite.siteName}</strong></p>
              <p className="rounded-xl bg-zinc-50 p-4 text-sm">Installation<br /><strong>{form.configuration.installationMethod === "CONCRETE_FOOTING" ? "Concrete footing" : "Driven post"}</strong></p>
              <p className="rounded-xl bg-zinc-50 p-4 text-sm">Gate count<br /><strong>{form.gates.reduce((sum, gate) => sum + gate.quantity, 0)}</strong></p>
            </div>
          </div>
          <aside className="space-y-3 rounded-2xl bg-zinc-950 p-6 text-white">
            <p className="text-sm text-zinc-300">Material total</p>
            <p className="text-2xl font-semibold">{money.format(BigInt(preview.materialTotalCents))}</p>
            <p className="text-sm text-zinc-300">Labour</p>
            <p className="text-lg font-medium">{money.format(BigInt(preview.labourTotalCents))}</p>
            <p className="text-sm text-zinc-300">Equipment</p>
            <p className="text-lg font-medium">{money.format(BigInt(preview.equipmentTotalCents))}</p>
            <p className="text-sm text-zinc-300">Non-stock / freight / contingency</p>
            <p className="text-lg font-medium">{money.format(BigInt(preview.nonStockTotalCents))}</p>
            <p className="text-sm text-zinc-300">Subtotal</p>
            <p className="text-xl font-semibold">{money.format(BigInt(preview.subtotalCents))}</p>
            <p className="text-sm text-zinc-300">Tax</p>
            <p className="text-lg font-medium">{money.format(BigInt(preview.taxTotalCents))}</p>
            <p className="text-sm text-zinc-300">Total</p>
            <p className="text-3xl font-semibold">{money.format(BigInt(preview.grandTotalCents))}</p>
            <button type="button" onClick={saveEstimate} disabled={isSaving} className="mt-2 w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300">{isSaving ? "Saving..." : "Save estimate"}</button>
            {saveError ? <p className="text-sm text-rose-200">{saveError}</p> : null}
          </aside>
        </section>
      ) : null}

      <div className="flex justify-between">
        <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">Back</button>
        <button type="button" onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))} disabled={step === steps.length - 1} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300">Next</button>
      </div>
    </div>
  );
}
