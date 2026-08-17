import {
  ApprovalStatus,
  CostComponentType,
  DocumentType,
  EstimateStatus,
  Prisma,
  UnitOfMeasure,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateChainLinkEstimate } from "@/lib/domain/chain-link";
import { type EstimateInput } from "@/lib/domain/types";
import { nextDocumentNumber } from "@/lib/services/numbering";
import { getCatalogVariants, getRateCard } from "@/lib/services/reference-data";
import { estimateInputSchema } from "@/lib/validation/estimate";

export async function createEstimate(input: EstimateInput) {
  const parsed = estimateInputSchema.parse(input);
  const [variants, rateCard] = await Promise.all([getCatalogVariants(), getRateCard()]);
  const calculated = calculateChainLinkEstimate(parsed, variants, rateCard);

  return prisma.$transaction(async (tx) => {
    const numbering = await nextDocumentNumber(tx, DocumentType.ESTIMATE);

    const customer = await tx.customer.create({
      data: {
        displayName: parsed.customer.displayName,
        companyName: parsed.customer.companyName,
        email: parsed.customer.email || null,
        phone: parsed.customer.phone || null,
      },
    });

    const projectSite = await tx.projectSite.create({
      data: {
        customerId: customer.id,
        siteName: parsed.projectSite.siteName,
        addressLine1: parsed.projectSite.addressLine1,
        city: parsed.projectSite.city,
        province: parsed.projectSite.province,
        postalCode: parsed.projectSite.postalCode,
        notes: parsed.projectSite.notes,
      },
    });

    const estimate = await tx.estimate.create({
      data: {
        estimateYear: numbering.year,
        estimateSequence: numbering.sequence,
        estimateNumber: numbering.documentNumber,
        customerId: customer.id,
        projectSiteId: projectSite.id,
        status: EstimateStatus.DRAFT,
        materialTotalCents: calculated.materialTotalCents,
        labourTotalCents: calculated.labourTotalCents,
        equipmentTotalCents: calculated.equipmentTotalCents,
        nonStockTotalCents: calculated.nonStockTotalCents,
        subtotalCents: calculated.subtotalCents,
        taxTotalCents: calculated.taxTotalCents,
        grandTotalCents: calculated.grandTotalCents,
      },
    });

    const revision = await tx.estimateRevision.create({
      data: {
        estimateId: estimate.id,
        revisionNumber: 1,
        isCurrent: true,
        overrideReason: parsed.configuration.overrideReason,
        pricingMode: parsed.configuration.pricingMode,
        adjustmentBasisPoints: parsed.configuration.adjustmentBasisPoints,
        taxBasisPoints: parsed.configuration.taxBasisPoints,
        inputSnapshotJson: JSON.stringify(parsed),
        outputSnapshotJson: JSON.stringify(calculated),
        materialTotalCents: calculated.materialTotalCents,
        labourTotalCents: calculated.labourTotalCents,
        equipmentTotalCents: calculated.equipmentTotalCents,
        nonStockTotalCents: calculated.nonStockTotalCents,
        subtotalCents: calculated.subtotalCents,
        taxTotalCents: calculated.taxTotalCents,
        grandTotalCents: calculated.grandTotalCents,
        estimateRuns: {
          create: parsed.runs.map((run) => ({
            name: run.name,
            lengthMm: run.lengthMm,
            heightMm: run.heightMm,
            endTerminalPosts: run.endTerminalPosts,
            cornerTerminalPosts: run.cornerTerminalPosts,
            linePostSpacingMm: parsed.configuration.linePostSpacingMm,
            topRailStockLengthMm: parsed.configuration.topRailStockLengthMm,
            fabricWasteBasisPts: parsed.configuration.fabricWasteBasisPoints,
            installationMethod: parsed.configuration.installationMethod,
            footingDiameterMm: parsed.configuration.footingDiameterMm,
            footingDepthMm: parsed.configuration.footingDepthMm,
          })),
        },
        gates: {
          create: parsed.gates.map((gate) => ({
            name: gate.name,
            gateType: gate.gateType,
            widthMm: gate.widthMm,
            heightMm: gate.heightMm,
            quantity: gate.quantity,
            includeFrameKit: gate.includeFrameKit,
            overrideReason: gate.overrideReason,
          })),
        },
        lineItems: {
          create: calculated.lineItems.map((item, index) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            code: item.code,
            section: item.section,
            name: item.name,
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity),
            unitOfMeasure: item.unitOfMeasure,
            unitCostCents: item.unitCostCents,
            unitPriceCents: item.unitPriceCents,
            extendedCostCents: item.extendedCostCents,
            extendedPriceCents: item.extendedPriceCents,
            overrideReason: item.overrideReason,
            sortOrder: index,
          })),
        },
        costComponents: {
          create: [
            {
              componentType: CostComponentType.LABOUR,
              name: "Installation labour",
              quantity: new Prisma.Decimal(parsed.configuration.labourHours),
              unitOfMeasure: UnitOfMeasure.HOUR,
              unitCostCents: Math.round(calculated.labourTotalCents / Math.max(parsed.configuration.labourHours || 1, 1)),
              totalCostCents: calculated.labourTotalCents,
              totalPriceCents: calculated.labourTotalCents,
            },
            {
              componentType: CostComponentType.EQUIPMENT,
              name: "Equipment",
              quantity: new Prisma.Decimal(parsed.configuration.equipmentHours),
              unitOfMeasure: UnitOfMeasure.HOUR,
              unitCostCents: Math.round(
                calculated.equipmentTotalCents / Math.max(parsed.configuration.equipmentHours || 1, 1),
              ),
              totalCostCents: calculated.equipmentTotalCents,
              totalPriceCents: calculated.equipmentTotalCents,
            },
            {
              componentType: CostComponentType.NON_STOCK,
              name: "Freight, non-stock, contingency",
              quantity: new Prisma.Decimal(1),
              unitOfMeasure: UnitOfMeasure.LOT,
              unitCostCents: calculated.nonStockTotalCents,
              totalCostCents: calculated.nonStockTotalCents,
              totalPriceCents: calculated.nonStockTotalCents,
            },
            {
              componentType: CostComponentType.TAX,
              name: "HST",
              quantity: new Prisma.Decimal(1),
              unitOfMeasure: UnitOfMeasure.LOT,
              unitCostCents: calculated.taxTotalCents,
              totalCostCents: calculated.taxTotalCents,
              totalPriceCents: calculated.taxTotalCents,
            },
          ],
        },
      },
    });

    await tx.estimateApproval.create({
      data: {
        estimateId: estimate.id,
        approvedByName: "Pending customer approval",
        approvalStatus: ApprovalStatus.PENDING,
      },
    });

    await tx.inventoryReservation.create({
      data: {
        estimateId: estimate.id,
        status: "STAGED",
        payloadJson: JSON.stringify({
          estimateNumber: numbering.documentNumber,
          note: "Boundary payload only. No ACE POS call is made in this release.",
        }),
      },
    });

    return tx.estimate.update({
      where: { id: estimate.id },
      data: { currentRevisionId: revision.id },
      include: { currentRevision: true, customer: true, projectSite: true },
    });
  });
}
