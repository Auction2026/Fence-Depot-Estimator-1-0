import { money } from "@/lib/money";
import { mmToFeet, mmToMetres, roundQuantity } from "@/lib/units";
import {
  type CalculatedEstimate,
  type CalculatedLineItem,
  type CatalogVariant,
  type EstimateInput,
  type RateCard,
  type SelectionCategory,
} from "@/lib/domain/types";

function requireVariant(variants: CatalogVariant[], category: SelectionCategory, id: string) {
  const variant = variants.find((entry) => entry.id === id && entry.category === category);
  if (!variant) {
    throw new Error(`Missing required ${category} variant selection.`);
  }
  return variant;
}

function quantityForUnit(mm: number, unit: CatalogVariant["unitOfMeasure"]): number {
  if (unit === "LINEAR_FOOT") {
    return roundQuantity(mmToFeet(mm));
  }
  if (unit === "LINEAR_METRE") {
    return roundQuantity(mmToMetres(mm));
  }
  return mm;
}

function bandsPerTerminal(heightMm: number): number {
  return Math.max(3, Math.ceil(mmToFeet(heightMm)) - 1);
}

function createLineItem(
  variant: CatalogVariant,
  code: string,
  section: string,
  quantity: number,
  override?: NonNullable<EstimateInput["overrides"]>[string],
): CalculatedLineItem {
  const appliedQuantity = override?.quantity ?? quantity;
  const appliedUnitPrice = override?.unitPriceCents ?? variant.retailCents;
  const extendedCostCents = Math.round(appliedQuantity * variant.costCents);
  const extendedPriceCents = Math.round(appliedQuantity * appliedUnitPrice);

  return {
    code,
    section,
    name: variant.productName,
    description: variant.title,
    quantity: roundQuantity(appliedQuantity),
    unitOfMeasure: variant.unitOfMeasure,
    unitCostCents: variant.costCents,
    unitPriceCents: appliedUnitPrice,
    extendedCostCents,
    extendedPriceCents,
    productId: variant.productId,
    productVariantId: variant.id,
    overrideReason: override?.reason,
  };
}

export function calculateChainLinkEstimate(
  input: EstimateInput,
  variants: CatalogVariant[],
  rateCard: RateCard,
): CalculatedEstimate {
  const totalFenceLengthMm = input.runs.reduce((sum, run) => sum + run.lengthMm, 0);
  const maxFenceHeightMm = Math.max(...input.runs.map((run) => run.heightMm), 0);
  const linePosts = input.runs.reduce((sum, run) => {
    const segments = Math.max(1, Math.ceil(run.lengthMm / input.configuration.linePostSpacingMm));
    return sum + Math.max(segments - 1, 0);
  }, 0);
  const endAndCornerTerminalPosts = input.runs.reduce(
    (sum, run) => sum + run.endTerminalPosts + run.cornerTerminalPosts,
    0,
  );
  const gatePosts = input.gates.reduce((sum, gate) => sum + gate.quantity * 2, 0);
  const totalTerminalPosts = endAndCornerTerminalPosts + gatePosts;
  const averageWasteMultiplier = 1 + input.configuration.fabricWasteBasisPoints / 10000;
  const fabricLengthMm = Math.ceil(totalFenceLengthMm * averageWasteMultiplier);
  const topRailPieces = Math.ceil(totalFenceLengthMm / input.configuration.topRailStockLengthMm);
  const tensionBars = totalTerminalPosts;
  const tensionBands = totalTerminalPosts * bandsPerTerminal(maxFenceHeightMm);
  const braceBands = totalTerminalPosts * 2;
  const tieWires = Math.ceil(totalFenceLengthMm / input.configuration.tieWireSpacingMm);
  const totalPosts = linePosts + endAndCornerTerminalPosts + gatePosts;
  const concreteFootingCount =
    input.configuration.installationMethod === "CONCRETE_FOOTING" ? totalPosts : 0;
  const radiusMetres = input.configuration.footingDiameterMm / 1000 / 2;
  const depthMetres = input.configuration.footingDepthMm / 1000;
  const concreteVolumeCubicMetres =
    input.configuration.installationMethod === "CONCRETE_FOOTING"
      ? roundQuantity(Math.PI * radiusMetres * radiusMetres * depthMetres * concreteFootingCount, 3)
      : 0;
  const drivenPosts = input.configuration.installationMethod === "DRIVEN_POST" ? totalPosts : 0;

  const selected = {
    fabric: requireVariant(variants, "fabric", input.selections.fabric),
    linePost: requireVariant(variants, "linePost", input.selections.linePost),
    terminalPost: requireVariant(variants, "terminalPost", input.selections.terminalPost),
    gatePost: requireVariant(variants, "gatePost", input.selections.gatePost),
    topRail: requireVariant(variants, "topRail", input.selections.topRail),
    tensionBar: requireVariant(variants, "tensionBar", input.selections.tensionBar),
    tensionBand: requireVariant(variants, "tensionBand", input.selections.tensionBand),
    braceBand: requireVariant(variants, "braceBand", input.selections.braceBand),
    tieWire: requireVariant(variants, "tieWire", input.selections.tieWire),
    concrete: requireVariant(variants, "concrete", input.selections.concrete),
    gateHardware: requireVariant(variants, "gateHardware", input.selections.gateHardware),
    gateFrame: requireVariant(variants, "gateFrame", input.selections.gateFrame),
  };

  const lineItems: CalculatedLineItem[] = [
    createLineItem(
      selected.fabric,
      "fabric",
      "Materials",
      quantityForUnit(fabricLengthMm, selected.fabric.unitOfMeasure),
      input.overrides?.fabric,
    ),
    createLineItem(selected.linePost, "line-posts", "Materials", linePosts, input.overrides?.["line-posts"]),
    createLineItem(
      selected.terminalPost,
      "terminal-posts",
      "Materials",
      endAndCornerTerminalPosts,
      input.overrides?.["terminal-posts"],
    ),
    createLineItem(selected.gatePost, "gate-posts", "Materials", gatePosts, input.overrides?.["gate-posts"]),
    createLineItem(selected.topRail, "top-rail", "Materials", topRailPieces, input.overrides?.["top-rail"]),
    createLineItem(
      selected.tensionBar,
      "tension-bars",
      "Fittings",
      tensionBars,
      input.overrides?.["tension-bars"],
    ),
    createLineItem(
      selected.tensionBand,
      "tension-bands",
      "Fittings",
      tensionBands,
      input.overrides?.["tension-bands"],
    ),
    createLineItem(
      selected.braceBand,
      "brace-bands",
      "Fittings",
      braceBands,
      input.overrides?.["brace-bands"],
    ),
    createLineItem(selected.tieWire, "tie-wire", "Fittings", tieWires, input.overrides?.["tie-wire"]),
    createLineItem(
      selected.gateHardware,
      "gate-hardware",
      "Gates",
      input.gates.reduce((sum, gate) => sum + gate.quantity, 0),
      input.overrides?.["gate-hardware"],
    ),
    createLineItem(
      selected.gateFrame,
      "gate-frames",
      "Gates",
      input.gates.filter((gate) => gate.includeFrameKit).reduce((sum, gate) => sum + gate.quantity, 0),
      input.overrides?.["gate-frames"],
    ),
  ];

  if (input.configuration.installationMethod === "CONCRETE_FOOTING") {
    lineItems.push(
      createLineItem(
        selected.concrete,
        "concrete",
        "Installation",
        Math.ceil(concreteVolumeCubicMetres / 0.014),
        input.overrides?.concrete,
      ),
    );
  }

  const materialCost = lineItems.reduce((sum, item) => sum + item.extendedCostCents, 0);
  const labourRate = rateCard.labourRates.find((rate) => rate.id === input.configuration.labourRateId);
  const equipmentRate = rateCard.equipmentRates.find(
    (rate) => rate.id === input.configuration.equipmentRateId,
  );

  if (!labourRate || !equipmentRate) {
    throw new Error("Missing labour or equipment rate selection.");
  }

  const labourCostCents = Math.round(input.configuration.labourHours * labourRate.rateCents);
  const equipmentCostCents = Math.round(input.configuration.equipmentHours * equipmentRate.rateCents);
  const nonStockCostCents = input.configuration.nonStockCents + input.configuration.freightCents;
  const contingencyCents = Math.round(
    ((materialCost + labourCostCents + equipmentCostCents + nonStockCostCents) *
      input.configuration.contingencyBasisPoints) /
      10000,
  );
  const costSubtotal = materialCost + labourCostCents + equipmentCostCents + nonStockCostCents + contingencyCents;
  const adjustedSubtotal =
    input.configuration.pricingMode === "MARKUP"
      ? money.toNumber(money.markup(money.fromCents(costSubtotal), input.configuration.adjustmentBasisPoints))
      : money.toNumber(money.margin(money.fromCents(costSubtotal), input.configuration.adjustmentBasisPoints));
  const taxTotalCents = Math.round((adjustedSubtotal * input.configuration.taxBasisPoints) / 10000);
  const grandTotalCents = adjustedSubtotal + taxTotalCents;

  return {
    lineItems,
    summary: {
      totalFenceLengthMm,
      linePosts,
      endAndCornerTerminalPosts,
      gatePosts,
      totalTerminalPosts,
      topRailPieces,
      fabricLengthMm,
      tensionBars,
      tensionBands,
      braceBands,
      tieWires,
      concreteFootingCount,
      concreteVolumeCubicMetres,
      drivenPosts,
    },
    materialTotalCents: materialCost,
    labourTotalCents: labourCostCents,
    equipmentTotalCents: equipmentCostCents,
    nonStockTotalCents: nonStockCostCents + contingencyCents,
    subtotalCents: adjustedSubtotal,
    taxTotalCents,
    grandTotalCents,
    pricingMode: input.configuration.pricingMode,
    adjustmentBasisPoints: input.configuration.adjustmentBasisPoints,
    taxBasisPoints: input.configuration.taxBasisPoints,
  };
}
