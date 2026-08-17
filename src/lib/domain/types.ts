export type SelectionCategory =
  | "fabric"
  | "linePost"
  | "terminalPost"
  | "gatePost"
  | "topRail"
  | "tensionBar"
  | "tensionBand"
  | "braceBand"
  | "tieWire"
  | "concrete"
  | "gateHardware"
  | "gateFrame";

export type LineItemOverride = {
  quantity?: number;
  unitPriceCents?: number;
  reason: string;
};

export type EstimateInput = {
  customer: {
    displayName: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  projectSite: {
    siteName: string;
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  };
  configuration: {
    installationMethod: "CONCRETE_FOOTING" | "DRIVEN_POST";
    linePostSpacingMm: number;
    fabricWasteBasisPoints: number;
    topRailStockLengthMm: number;
    footingDiameterMm: number;
    footingDepthMm: number;
    pricingMode: "MARKUP" | "MARGIN";
    adjustmentBasisPoints: number;
    taxBasisPoints: number;
    freightCents: number;
    nonStockCents: number;
    contingencyBasisPoints: number;
    labourHours: number;
    equipmentHours: number;
    labourRateId: string;
    equipmentRateId: string;
    tieWireSpacingMm: number;
    overrideReason?: string;
  };
  runs: Array<{
    name: string;
    lengthMm: number;
    heightMm: number;
    endTerminalPosts: number;
    cornerTerminalPosts: number;
  }>;
  gates: Array<{
    name: string;
    gateType: "SINGLE_SWING" | "DOUBLE_SWING";
    widthMm: number;
    heightMm: number;
    quantity: number;
    includeFrameKit: boolean;
    overrideReason?: string;
  }>;
  selections: Record<SelectionCategory, string>;
  overrides?: Record<string, LineItemOverride>;
};

export type CatalogVariant = {
  id: string;
  productId: string;
  productName: string;
  category: SelectionCategory;
  title: string;
  description?: string | null;
  colour?: string | null;
  meshGauge?: string | null;
  compatiblePipeDiameterMm?: number | null;
  wallThicknessMm?: number | null;
  lengthMm?: number | null;
  heightMm?: number | null;
  unitOfMeasure: "EACH" | "LINEAR_FOOT" | "LINEAR_METRE" | "BAG" | "CUBIC_METRE" | "HOUR" | "DAY" | "LOT";
  costCents: number;
  retailCents: number;
};

export type RateCard = {
  labourRates: Array<{ id: string; name: string; rateCents: number }>;
  equipmentRates: Array<{ id: string; name: string; rateCents: number }>;
};

export type CalculatedLineItem = {
  code: string;
  section: string;
  name: string;
  description?: string;
  quantity: number;
  unitOfMeasure: CatalogVariant["unitOfMeasure"];
  unitCostCents: number;
  unitPriceCents: number;
  extendedCostCents: number;
  extendedPriceCents: number;
  productVariantId?: string;
  productId?: string;
  overrideReason?: string;
};

export type CalculationSummary = {
  totalFenceLengthMm: number;
  linePosts: number;
  endAndCornerTerminalPosts: number;
  gatePosts: number;
  totalTerminalPosts: number;
  topRailPieces: number;
  fabricLengthMm: number;
  tensionBars: number;
  tensionBands: number;
  braceBands: number;
  tieWires: number;
  concreteFootingCount: number;
  concreteVolumeCubicMetres: number;
  drivenPosts: number;
};

export type CalculatedEstimate = {
  lineItems: CalculatedLineItem[];
  summary: CalculationSummary;
  materialTotalCents: number;
  labourTotalCents: number;
  equipmentTotalCents: number;
  nonStockTotalCents: number;
  subtotalCents: number;
  taxTotalCents: number;
  grandTotalCents: number;
  pricingMode: "MARKUP" | "MARGIN";
  adjustmentBasisPoints: number;
  taxBasisPoints: number;
};
