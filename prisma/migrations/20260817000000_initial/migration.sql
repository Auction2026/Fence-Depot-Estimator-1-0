-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ProductCategory" AS ENUM ('CHAIN_LINK_FABRIC', 'LINE_POST', 'TERMINAL_POST', 'GATE_POST', 'TOP_RAIL', 'TENSION_BAR', 'TENSION_BAND', 'BRACE_BAND', 'TIE_WIRE', 'CONCRETE', 'GATE_HARDWARE', 'GATE_FRAME_COMPONENT', 'NON_STOCK');

-- CreateEnum
CREATE TYPE "public"."UnitOfMeasure" AS ENUM ('EACH', 'LINEAR_FOOT', 'LINEAR_METRE', 'BAG', 'CUBIC_METRE', 'HOUR', 'DAY', 'LOT');

-- CreateEnum
CREATE TYPE "public"."EstimateStatus" AS ENUM ('DRAFT', 'REVIEW', 'SENT', 'ACCEPTED', 'CONTRACTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."InstallationMethod" AS ENUM ('CONCRETE_FOOTING', 'DRIVEN_POST');

-- CreateEnum
CREATE TYPE "public"."GateType" AS ENUM ('SINGLE_SWING', 'DOUBLE_SWING');

-- CreateEnum
CREATE TYPE "public"."CostComponentType" AS ENUM ('MATERIAL', 'LABOUR', 'EQUIPMENT', 'NON_STOCK', 'FREIGHT', 'CONTINGENCY', 'TAX');

-- CreateEnum
CREATE TYPE "public"."PricingMode" AS ENUM ('MARKUP', 'MARGIN');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('ESTIMATE', 'CONTRACT');

-- CreateEnum
CREATE TYPE "public"."ContractStatus" AS ENUM ('OPEN', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."SyncDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "public"."SyncStatus" AS ENUM ('STAGED', 'READY', 'SENT', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."CompanySetting" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'CAD',
    "defaultHstRateBasisPoints" INTEGER NOT NULL DEFAULT 1300,
    "defaultLinePostSpacingMm" INTEGER NOT NULL DEFAULT 3048,
    "defaultFabricWasteBasisPts" INTEGER NOT NULL DEFAULT 500,
    "defaultTopRailLengthMm" INTEGER NOT NULL DEFAULT 6480,
    "defaultFootingDiameterMm" INTEGER NOT NULL DEFAULT 203,
    "defaultFootingDepthMm" INTEGER NOT NULL DEFAULT 1067,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "companyName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectSite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."ProductCategory" NOT NULL,
    "acePlu" TEXT,
    "sku" TEXT,
    "manufacturerPartNumber" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "supplier" TEXT,
    "inventoryOnHand" INTEGER NOT NULL DEFAULT 0,
    "inventoryReserved" INTEGER NOT NULL DEFAULT 0,
    "defaultCostCents" INTEGER NOT NULL,
    "defaultRetailCents" INTEGER NOT NULL,
    "unitOfMeasure" "public"."UnitOfMeasure" NOT NULL,
    "isStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "colour" TEXT,
    "meshGauge" TEXT,
    "compatiblePipeDiameterMm" INTEGER,
    "wallThicknessMm" INTEGER,
    "lengthMm" INTEGER,
    "heightMm" INTEGER,
    "inventoryOnHand" INTEGER NOT NULL DEFAULT 0,
    "inventoryReserved" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL,
    "retailCents" INTEGER NOT NULL,
    "unitOfMeasure" "public"."UnitOfMeasure" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPriceHistory" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "retailCents" INTEGER NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "ProductPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabourRate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitOfMeasure" "public"."UnitOfMeasure" NOT NULL DEFAULT 'HOUR',
    "rateCents" INTEGER NOT NULL,
    "crewSize" INTEGER NOT NULL DEFAULT 1,
    "productivityMmPerHour" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabourRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EquipmentRate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitOfMeasure" "public"."UnitOfMeasure" NOT NULL DEFAULT 'HOUR',
    "rateCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NonStockItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitOfMeasure" "public"."UnitOfMeasure" NOT NULL DEFAULT 'LOT',
    "defaultCostCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonStockItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Estimate" (
    "id" TEXT NOT NULL,
    "estimateYear" INTEGER NOT NULL,
    "estimateSequence" INTEGER NOT NULL,
    "estimateNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectSiteId" TEXT NOT NULL,
    "status" "public"."EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "currentRevisionId" TEXT,
    "materialTotalCents" INTEGER NOT NULL DEFAULT 0,
    "labourTotalCents" INTEGER NOT NULL DEFAULT 0,
    "equipmentTotalCents" INTEGER NOT NULL DEFAULT 0,
    "nonStockTotalCents" INTEGER NOT NULL DEFAULT 0,
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "taxTotalCents" INTEGER NOT NULL DEFAULT 0,
    "grandTotalCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstimateRevision" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "pricingMode" "public"."PricingMode" NOT NULL,
    "adjustmentBasisPoints" INTEGER NOT NULL,
    "taxBasisPoints" INTEGER NOT NULL,
    "inputSnapshotJson" TEXT NOT NULL,
    "outputSnapshotJson" TEXT NOT NULL,
    "materialTotalCents" INTEGER NOT NULL,
    "labourTotalCents" INTEGER NOT NULL,
    "equipmentTotalCents" INTEGER NOT NULL,
    "nonStockTotalCents" INTEGER NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxTotalCents" INTEGER NOT NULL,
    "grandTotalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstimateRun" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lengthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "endTerminalPosts" INTEGER NOT NULL,
    "cornerTerminalPosts" INTEGER NOT NULL,
    "linePostSpacingMm" INTEGER NOT NULL,
    "topRailStockLengthMm" INTEGER NOT NULL,
    "fabricWasteBasisPts" INTEGER NOT NULL,
    "installationMethod" "public"."InstallationMethod" NOT NULL,
    "footingDiameterMm" INTEGER NOT NULL,
    "footingDepthMm" INTEGER NOT NULL,

    CONSTRAINT "EstimateRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstimateGate" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gateType" "public"."GateType" NOT NULL,
    "widthMm" INTEGER NOT NULL,
    "heightMm" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "includeFrameKit" BOOLEAN NOT NULL DEFAULT true,
    "overrideReason" TEXT,

    CONSTRAINT "EstimateGate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstimateLineItem" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "productId" TEXT,
    "productVariantId" TEXT,
    "code" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitOfMeasure" "public"."UnitOfMeasure" NOT NULL,
    "unitCostCents" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "extendedCostCents" INTEGER NOT NULL,
    "extendedPriceCents" INTEGER NOT NULL,
    "overrideReason" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "EstimateLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstimateCostComponent" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "componentType" "public"."CostComponentType" NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitOfMeasure" "public"."UnitOfMeasure" NOT NULL,
    "unitCostCents" INTEGER NOT NULL,
    "totalCostCents" INTEGER NOT NULL,
    "totalPriceCents" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "EstimateCostComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EstimateApproval" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "approvedByName" TEXT NOT NULL,
    "approvedByEmail" TEXT,
    "notes" TEXT,
    "approvalStatus" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contract" (
    "id" TEXT NOT NULL,
    "contractYear" INTEGER NOT NULL,
    "contractSequence" INTEGER NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "sourceRevisionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectSiteId" TEXT NOT NULL,
    "status" "public"."ContractStatus" NOT NULL DEFAULT 'OPEN',
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentSequence" (
    "id" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL,
    "year" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryReservation" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "status" "public"."SyncStatus" NOT NULL DEFAULT 'STAGED',
    "payloadJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AceSyncLog" (
    "id" TEXT NOT NULL,
    "direction" "public"."SyncDirection" NOT NULL,
    "status" "public"."SyncStatus" NOT NULL,
    "externalKey" TEXT,
    "payloadJson" TEXT NOT NULL,
    "responseSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AceSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AceSyncStagingRecord" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "status" "public"."SyncStatus" NOT NULL DEFAULT 'STAGED',
    "rawPayloadJson" TEXT NOT NULL,
    "normalizedJson" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AceSyncStagingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_estimateNumber_key" ON "public"."Estimate"("estimateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EstimateRevision_estimateId_revisionNumber_key" ON "public"."EstimateRevision"("estimateId", "revisionNumber");

-- CreateIndex
CREATE INDEX "EstimateLineItem_revisionId_section_sortOrder_idx" ON "public"."EstimateLineItem"("revisionId", "section", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNumber_key" ON "public"."Contract"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_estimateId_key" ON "public"."Contract"("estimateId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_documentType_year_key" ON "public"."DocumentSequence"("documentType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AceSyncStagingRecord_sourceKey_key" ON "public"."AceSyncStagingRecord"("sourceKey");

-- AddForeignKey
ALTER TABLE "public"."ProjectSite" ADD CONSTRAINT "ProjectSite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Estimate" ADD CONSTRAINT "Estimate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Estimate" ADD CONSTRAINT "Estimate_projectSiteId_fkey" FOREIGN KEY ("projectSiteId") REFERENCES "public"."ProjectSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Estimate" ADD CONSTRAINT "Estimate_currentRevisionId_fkey" FOREIGN KEY ("currentRevisionId") REFERENCES "public"."EstimateRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstimateRevision" ADD CONSTRAINT "EstimateRevision_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "public"."Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstimateRun" ADD CONSTRAINT "EstimateRun_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "public"."EstimateRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstimateGate" ADD CONSTRAINT "EstimateGate_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "public"."EstimateRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "public"."EstimateRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstimateCostComponent" ADD CONSTRAINT "EstimateCostComponent_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "public"."EstimateRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EstimateApproval" ADD CONSTRAINT "EstimateApproval_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "public"."Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "public"."Estimate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_sourceRevisionId_fkey" FOREIGN KEY ("sourceRevisionId") REFERENCES "public"."EstimateRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contract" ADD CONSTRAINT "Contract_projectSiteId_fkey" FOREIGN KEY ("projectSiteId") REFERENCES "public"."ProjectSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryReservation" ADD CONSTRAINT "InventoryReservation_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "public"."Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

