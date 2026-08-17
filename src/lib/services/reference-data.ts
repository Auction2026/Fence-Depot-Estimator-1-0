import { ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fenceDepotProfile } from "@/lib/demo";
import { type CatalogVariant, type RateCard, type SelectionCategory } from "@/lib/domain/types";

const categoryMap: Record<ProductCategory, SelectionCategory> = {
  CHAIN_LINK_FABRIC: "fabric",
  LINE_POST: "linePost",
  TERMINAL_POST: "terminalPost",
  GATE_POST: "gatePost",
  TOP_RAIL: "topRail",
  TENSION_BAR: "tensionBar",
  TENSION_BAND: "tensionBand",
  BRACE_BAND: "braceBand",
  TIE_WIRE: "tieWire",
  CONCRETE: "concrete",
  GATE_HARDWARE: "gateHardware",
  GATE_FRAME_COMPONENT: "gateFrame",
  NON_STOCK: "gateFrame"
};

export async function getCompanySettings() {
  return (
    (await prisma.companySetting.findFirst()) ?? {
      id: "default",
      ...fenceDepotProfile,
      currencyCode: "CAD",
      defaultFabricWasteBasisPts: fenceDepotProfile.defaultFabricWasteBasisPoints,
      notes: "Seed the database to replace fallback settings.",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
}

export async function getCatalogVariants(): Promise<CatalogVariant[]> {
  const variants = await prisma.productVariant.findMany({
    include: { product: true },
    orderBy: [{ product: { category: "asc" } }, { title: "asc" }],
  });

  return variants.map((variant) => ({
    id: variant.id,
    productId: variant.productId,
    productName: variant.product.name,
    category: categoryMap[variant.product.category],
    title: variant.title,
    description: variant.product.description,
    colour: variant.colour,
    meshGauge: variant.meshGauge,
    compatiblePipeDiameterMm: variant.compatiblePipeDiameterMm,
    wallThicknessMm: variant.wallThicknessMm,
    lengthMm: variant.lengthMm,
    heightMm: variant.heightMm,
    unitOfMeasure: variant.unitOfMeasure,
    costCents: variant.costCents,
    retailCents: variant.retailCents,
  }));
}

export async function getRateCard(): Promise<RateCard> {
  const [labourRates, equipmentRates] = await Promise.all([
    prisma.labourRate.findMany({ orderBy: { name: "asc" } }),
    prisma.equipmentRate.findMany({ orderBy: { name: "asc" } }),
  ]);

  return {
    labourRates: labourRates.map((rate) => ({ id: rate.id, name: rate.name, rateCents: rate.rateCents })),
    equipmentRates: equipmentRates.map((rate) => ({ id: rate.id, name: rate.name, rateCents: rate.rateCents })),
  };
}

export async function listEstimateSummaries() {
  return prisma.estimate.findMany({
    include: {
      customer: true,
      contract: true,
      currentRevision: { include: { lineItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEstimateById(id: string) {
  return prisma.estimate.findUnique({
    where: { id },
    include: {
      customer: true,
      projectSite: true,
      approvals: true,
      currentRevision: {
        include: {
          estimateRuns: true,
          gates: true,
          lineItems: { orderBy: [{ section: "asc" }, { sortOrder: "asc" }] },
          costComponents: true,
        },
      },
      contract: true,
    },
  });
}
