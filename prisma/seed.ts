import { ProductCategory, UnitOfMeasure } from "@prisma/client";
import { prisma } from "@/lib/db";
import { demoEstimateInput, fenceDepotProfile } from "@/lib/demo";
import { createEstimate } from "@/lib/services/estimate-service";

async function upsertProductWithVariant(options: {
  productId: string;
  variantId: string;
  name: string;
  category: ProductCategory;
  title: string;
  colour?: string;
  meshGauge?: string;
  compatiblePipeDiameterMm?: number;
  wallThicknessMm?: number;
  lengthMm?: number;
  heightMm?: number;
  costCents: number;
  retailCents: number;
  unitOfMeasure: UnitOfMeasure;
  acePlu: string;
  sku: string;
  description: string;
  supplier: string;
  inventoryOnHand: number;
}) {
  await prisma.product.upsert({
    where: { id: options.productId },
    update: {
      name: options.name,
      category: options.category,
      acePlu: options.acePlu,
      sku: options.sku,
      description: options.description,
      supplier: options.supplier,
      inventoryOnHand: options.inventoryOnHand,
      defaultCostCents: options.costCents,
      defaultRetailCents: options.retailCents,
      unitOfMeasure: options.unitOfMeasure,
      variants: {
        upsert: {
          where: { id: options.variantId },
          update: {
            title: options.title,
            colour: options.colour,
            meshGauge: options.meshGauge,
            compatiblePipeDiameterMm: options.compatiblePipeDiameterMm,
            wallThicknessMm: options.wallThicknessMm,
            lengthMm: options.lengthMm,
            heightMm: options.heightMm,
            costCents: options.costCents,
            retailCents: options.retailCents,
            unitOfMeasure: options.unitOfMeasure,
            inventoryOnHand: options.inventoryOnHand,
            isDefault: true,
          },
          create: {
            id: options.variantId,
            title: options.title,
            colour: options.colour,
            meshGauge: options.meshGauge,
            compatiblePipeDiameterMm: options.compatiblePipeDiameterMm,
            wallThicknessMm: options.wallThicknessMm,
            lengthMm: options.lengthMm,
            heightMm: options.heightMm,
            costCents: options.costCents,
            retailCents: options.retailCents,
            unitOfMeasure: options.unitOfMeasure,
            inventoryOnHand: options.inventoryOnHand,
            isDefault: true,
          },
        },
      },
    },
    create: {
      id: options.productId,
      name: options.name,
      category: options.category,
      acePlu: options.acePlu,
      sku: options.sku,
      description: options.description,
      supplier: options.supplier,
      inventoryOnHand: options.inventoryOnHand,
      defaultCostCents: options.costCents,
      defaultRetailCents: options.retailCents,
      unitOfMeasure: options.unitOfMeasure,
      variants: {
        create: {
          id: options.variantId,
          title: options.title,
          colour: options.colour,
          meshGauge: options.meshGauge,
          compatiblePipeDiameterMm: options.compatiblePipeDiameterMm,
          wallThicknessMm: options.wallThicknessMm,
          lengthMm: options.lengthMm,
          heightMm: options.heightMm,
          costCents: options.costCents,
          retailCents: options.retailCents,
          unitOfMeasure: options.unitOfMeasure,
          inventoryOnHand: options.inventoryOnHand,
          isDefault: true,
        },
      },
    },
  });

  await prisma.productPriceHistory.create({
    data: {
      productVariantId: options.variantId,
      costCents: options.costCents,
      retailCents: options.retailCents,
      note: "Demo/sample seeded price history",
    },
  });
}

async function main() {
  await prisma.companySetting.upsert({
    where: { id: "seed-company-settings" },
    update: {
      businessName: fenceDepotProfile.businessName,
      addressLine1: fenceDepotProfile.addressLine1,
      city: fenceDepotProfile.city,
      province: fenceDepotProfile.province,
      postalCode: fenceDepotProfile.postalCode,
      phone: fenceDepotProfile.phone,
      email: fenceDepotProfile.email,
      defaultHstRateBasisPoints: fenceDepotProfile.defaultHstRateBasisPoints,
      defaultLinePostSpacingMm: fenceDepotProfile.defaultLinePostSpacingMm,
      defaultFabricWasteBasisPts: fenceDepotProfile.defaultFabricWasteBasisPoints,
      defaultTopRailLengthMm: fenceDepotProfile.defaultTopRailLengthMm,
      defaultFootingDiameterMm: fenceDepotProfile.defaultFootingDiameterMm,
      defaultFootingDepthMm: fenceDepotProfile.defaultFootingDepthMm,
      notes: "Demo/sample configuration for chain-link only.",
    },
    create: {
      id: "seed-company-settings",
      businessName: fenceDepotProfile.businessName,
      addressLine1: fenceDepotProfile.addressLine1,
      city: fenceDepotProfile.city,
      province: fenceDepotProfile.province,
      postalCode: fenceDepotProfile.postalCode,
      phone: fenceDepotProfile.phone,
      email: fenceDepotProfile.email,
      defaultHstRateBasisPoints: fenceDepotProfile.defaultHstRateBasisPoints,
      defaultLinePostSpacingMm: fenceDepotProfile.defaultLinePostSpacingMm,
      defaultFabricWasteBasisPts: fenceDepotProfile.defaultFabricWasteBasisPoints,
      defaultTopRailLengthMm: fenceDepotProfile.defaultTopRailLengthMm,
      defaultFootingDiameterMm: fenceDepotProfile.defaultFootingDiameterMm,
      defaultFootingDepthMm: fenceDepotProfile.defaultFootingDepthMm,
      notes: "Demo/sample configuration for chain-link only.",
    },
  });

  await upsertProductWithVariant({ productId: "product-fabric-black-6", variantId: "seed-fabric-black-6", name: "Black vinyl coated chain-link fabric", category: ProductCategory.CHAIN_LINK_FABRIC, title: "6 ft high · 9 gauge · black", colour: "Black", meshGauge: "9 gauge", heightMm: 1829, costCents: 2150, retailCents: 3250, unitOfMeasure: UnitOfMeasure.LINEAR_FOOT, acePlu: "CLF6009BK", sku: "FDF-CL-6-BLK", description: "Demo/sample black chain-link fabric priced per linear foot.", supplier: "Demo Supplier", inventoryOnHand: 1600 });
  await upsertProductWithVariant({ productId: "product-line-post-black", variantId: "seed-line-post-2-3-8-black", name: "Line post", category: ProductCategory.LINE_POST, title: "2 3/8 in OD · Schedule 40 · black", colour: "Black", compatiblePipeDiameterMm: 60, wallThicknessMm: 4, lengthMm: 2743, costCents: 4100, retailCents: 6500, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "LP238BK", sku: "FDP-LP-238-BLK", description: "Demo/sample line post", supplier: "Demo Supplier", inventoryOnHand: 200 });
  await upsertProductWithVariant({ productId: "product-terminal-post-black", variantId: "seed-terminal-post-2-7-8-black", name: "Terminal post", category: ProductCategory.TERMINAL_POST, title: "2 7/8 in OD · Schedule 40 · black", colour: "Black", compatiblePipeDiameterMm: 73, wallThicknessMm: 5, lengthMm: 2743, costCents: 6200, retailCents: 9200, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "TP278BK", sku: "FDP-TP-278-BLK", description: "Demo/sample terminal post", supplier: "Demo Supplier", inventoryOnHand: 120 });
  await upsertProductWithVariant({ productId: "product-gate-post-black", variantId: "seed-gate-post-4-black", name: "Gate post", category: ProductCategory.GATE_POST, title: "4 in OD · heavy wall · black", colour: "Black", compatiblePipeDiameterMm: 102, wallThicknessMm: 6, lengthMm: 3048, costCents: 9800, retailCents: 14200, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "GP400BK", sku: "FDP-GP-400-BLK", description: "Demo/sample gate post", supplier: "Demo Supplier", inventoryOnHand: 80 });
  await upsertProductWithVariant({ productId: "product-top-rail-black", variantId: "seed-top-rail-black", name: "Top rail", category: ProductCategory.TOP_RAIL, title: "21 ft 3 in swedged top rail · black", colour: "Black", compatiblePipeDiameterMm: 42, wallThicknessMm: 3, lengthMm: 6477, costCents: 3850, retailCents: 5600, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "TR213BK", sku: "FDP-TR-213-BLK", description: "Demo/sample swedged top rail", supplier: "Demo Supplier", inventoryOnHand: 240 });
  await upsertProductWithVariant({ productId: "product-tension-bar", variantId: "seed-tension-bar", name: "Tension bar", category: ProductCategory.TENSION_BAR, title: "Standard galvanized tension bar", costCents: 650, retailCents: 950, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "TB001", sku: "FDP-TB-001", description: "Demo/sample tension bar", supplier: "Demo Supplier", inventoryOnHand: 400 });
  await upsertProductWithVariant({ productId: "product-tension-band-black", variantId: "seed-tension-band-black", name: "Tension band", category: ProductCategory.TENSION_BAND, title: "Black tension band", colour: "Black", costCents: 95, retailCents: 160, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "TBBK01", sku: "FDP-TBAND-BLK", description: "Demo/sample tension band", supplier: "Demo Supplier", inventoryOnHand: 2000 });
  await upsertProductWithVariant({ productId: "product-brace-band-black", variantId: "seed-brace-band-black", name: "Brace band", category: ProductCategory.BRACE_BAND, title: "Black brace band", colour: "Black", costCents: 125, retailCents: 225, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "BBBK01", sku: "FDP-BBAND-BLK", description: "Demo/sample brace band", supplier: "Demo Supplier", inventoryOnHand: 1600 });
  await upsertProductWithVariant({ productId: "product-tie-wire-black", variantId: "seed-tie-wire-black", name: "Tie wire", category: ProductCategory.TIE_WIRE, title: "Black ties", colour: "Black", costCents: 18, retailCents: 32, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "TWBK01", sku: "FDP-TWIRE-BLK", description: "Demo/sample tie wire", supplier: "Demo Supplier", inventoryOnHand: 5000 });
  await upsertProductWithVariant({ productId: "product-concrete-bag", variantId: "seed-concrete-bag", name: "Concrete mix", category: ProductCategory.CONCRETE, title: "30 kg bag", costCents: 650, retailCents: 875, unitOfMeasure: UnitOfMeasure.BAG, acePlu: "CON30", sku: "FDP-CON-30", description: "Demo/sample concrete bag", supplier: "Demo Supplier", inventoryOnHand: 600 });
  await upsertProductWithVariant({ productId: "product-gate-hardware-double", variantId: "seed-gate-hardware-double", name: "Gate hardware set", category: ProductCategory.GATE_HARDWARE, title: "Double swing hinge and latch set", costCents: 12400, retailCents: 16800, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "GHD001", sku: "FDP-GH-DOUBLE", description: "Demo/sample double gate hardware", supplier: "Demo Supplier", inventoryOnHand: 40 });
  await upsertProductWithVariant({ productId: "product-gate-frame-kit", variantId: "seed-gate-frame-kit-black", name: "Gate frame kit", category: ProductCategory.GATE_FRAME_COMPONENT, title: "Black gate frame kit", colour: "Black", costCents: 18800, retailCents: 26400, unitOfMeasure: UnitOfMeasure.EACH, acePlu: "GFKBK1", sku: "FDP-GFK-BLK", description: "Demo/sample gate frame kit", supplier: "Demo Supplier", inventoryOnHand: 40 });

  await prisma.labourRate.upsert({
    where: { id: "seed-install-crew" },
    update: { name: "Demo/sample 2-person install crew", rateCents: 9500, crewSize: 2, unitOfMeasure: UnitOfMeasure.HOUR, productivityMmPerHour: 3657 },
    create: { id: "seed-install-crew", name: "Demo/sample 2-person install crew", rateCents: 9500, crewSize: 2, unitOfMeasure: UnitOfMeasure.HOUR, productivityMmPerHour: 3657 },
  });

  await prisma.equipmentRate.upsert({
    where: { id: "seed-auger" },
    update: { name: "Demo/sample auger and compact equipment", rateCents: 7800, unitOfMeasure: UnitOfMeasure.HOUR },
    create: { id: "seed-auger", name: "Demo/sample auger and compact equipment", rateCents: 7800, unitOfMeasure: UnitOfMeasure.HOUR },
  });

  await prisma.nonStockItem.upsert({
    where: { id: "seed-non-stock-freight" },
    update: { name: "Demo/sample freight allowance", defaultCostCents: 18500 },
    create: { id: "seed-non-stock-freight", name: "Demo/sample freight allowance", defaultCostCents: 18500 },
  });

  if ((await prisma.estimate.count()) === 0) {
    await createEstimate(demoEstimateInput);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
