import { describe, expect, it } from "vitest";
import { calculateChainLinkEstimate } from "@/lib/domain/chain-link";
import { demoEstimateInput } from "@/lib/demo";
import { feetAndInchesToMm } from "@/lib/units";
import { type CatalogVariant, type RateCard } from "@/lib/domain/types";

const variants: CatalogVariant[] = [
  { id: "seed-fabric-black-6", productId: "1", productName: "Fabric", category: "fabric", title: "Fabric", colour: "Black", meshGauge: "9 gauge", heightMm: feetAndInchesToMm(6), unitOfMeasure: "LINEAR_FOOT", costCents: 2000, retailCents: 3000 },
  { id: "seed-line-post-2-3-8-black", productId: "2", productName: "Line post", category: "linePost", title: "Line post", colour: "Black", compatiblePipeDiameterMm: 60, wallThicknessMm: 4, lengthMm: 2743, unitOfMeasure: "EACH", costCents: 4000, retailCents: 6000 },
  { id: "seed-terminal-post-2-7-8-black", productId: "3", productName: "Terminal post", category: "terminalPost", title: "Terminal post", colour: "Black", compatiblePipeDiameterMm: 73, wallThicknessMm: 5, lengthMm: 2743, unitOfMeasure: "EACH", costCents: 6000, retailCents: 9000 },
  { id: "seed-gate-post-4-black", productId: "4", productName: "Gate post", category: "gatePost", title: "Gate post", colour: "Black", compatiblePipeDiameterMm: 102, wallThicknessMm: 6, lengthMm: 3048, unitOfMeasure: "EACH", costCents: 9000, retailCents: 13000 },
  { id: "seed-top-rail-black", productId: "5", productName: "Top rail", category: "topRail", title: "Top rail", colour: "Black", compatiblePipeDiameterMm: 42, wallThicknessMm: 3, lengthMm: feetAndInchesToMm(21, 3), unitOfMeasure: "EACH", costCents: 3500, retailCents: 5000 },
  { id: "seed-tension-bar", productId: "6", productName: "Tension bar", category: "tensionBar", title: "Tension bar", unitOfMeasure: "EACH", costCents: 500, retailCents: 800 },
  { id: "seed-tension-band-black", productId: "7", productName: "Tension band", category: "tensionBand", title: "Tension band", unitOfMeasure: "EACH", costCents: 100, retailCents: 150 },
  { id: "seed-brace-band-black", productId: "8", productName: "Brace band", category: "braceBand", title: "Brace band", unitOfMeasure: "EACH", costCents: 150, retailCents: 200 },
  { id: "seed-tie-wire-black", productId: "9", productName: "Tie wire", category: "tieWire", title: "Tie wire", unitOfMeasure: "EACH", costCents: 10, retailCents: 25 },
  { id: "seed-concrete-bag", productId: "10", productName: "Concrete", category: "concrete", title: "Concrete", unitOfMeasure: "BAG", costCents: 650, retailCents: 850 },
  { id: "seed-gate-hardware-double", productId: "11", productName: "Gate hardware", category: "gateHardware", title: "Gate hardware", unitOfMeasure: "EACH", costCents: 12000, retailCents: 16000 },
  { id: "seed-gate-frame-kit-black", productId: "12", productName: "Gate frame", category: "gateFrame", title: "Gate frame", unitOfMeasure: "EACH", costCents: 18000, retailCents: 26000 },
];

const rateCard: RateCard = {
  labourRates: [{ id: "seed-install-crew", name: "Crew", rateCents: 9500 }],
  equipmentRates: [{ id: "seed-auger", name: "Auger", rateCents: 7800 }],
};

describe("calculateChainLinkEstimate", () => {
  it("calculates line posts, terminals, gates, concrete, markup, and tax deterministically", () => {
    const result = calculateChainLinkEstimate(demoEstimateInput, variants, rateCard);

    expect(result.summary.linePosts).toBe(11);
    expect(result.summary.endAndCornerTerminalPosts).toBe(4);
    expect(result.summary.gatePosts).toBe(2);
    expect(result.summary.totalTerminalPosts).toBe(6);
    expect(result.summary.topRailPieces).toBe(6);
    expect(result.summary.tensionBands).toBe(36);
    expect(result.summary.concreteFootingCount).toBe(17);
    expect(result.materialTotalCents).toBeGreaterThan(0);
    expect(result.subtotalCents).toBeGreaterThan(result.materialTotalCents);
    expect(result.taxTotalCents).toBeGreaterThan(0);
  });

  it("supports driven posts and margin pricing", () => {
    const result = calculateChainLinkEstimate(
      {
        ...demoEstimateInput,
        configuration: {
          ...demoEstimateInput.configuration,
          installationMethod: "DRIVEN_POST",
          pricingMode: "MARGIN",
          adjustmentBasisPoints: 2500,
        },
      },
      variants,
      rateCard,
    );

    expect(result.summary.concreteFootingCount).toBe(0);
    expect(result.summary.drivenPosts).toBe(17);
    expect(result.grandTotalCents).toBeGreaterThan(result.subtotalCents);
  });

  it("applies controlled line item overrides", () => {
    const result = calculateChainLinkEstimate(
      {
        ...demoEstimateInput,
        overrides: {
          fabric: {
            quantity: 140,
            unitPriceCents: 3500,
            reason: "Customer requested full roll billing.",
          },
        },
      },
      variants,
      rateCard,
    );

    const fabric = result.lineItems.find((item) => item.code === "fabric");
    expect(fabric?.quantity).toBe(140);
    expect(fabric?.unitPriceCents).toBe(3500);
    expect(fabric?.overrideReason).toBe("Customer requested full roll billing.");
  });
});
