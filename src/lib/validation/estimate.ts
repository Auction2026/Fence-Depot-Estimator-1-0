import { z } from "zod";

const runSchema = z.object({
  name: z.string().min(1),
  lengthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  endTerminalPosts: z.number().int().min(0),
  cornerTerminalPosts: z.number().int().min(0),
});

const gateSchema = z.object({
  name: z.string().min(1),
  gateType: z.enum(["SINGLE_SWING", "DOUBLE_SWING"]),
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  quantity: z.number().int().min(1),
  includeFrameKit: z.boolean(),
  overrideReason: z.string().optional(),
});

const selectionSchema = z.object({
  fabric: z.string().min(1),
  linePost: z.string().min(1),
  terminalPost: z.string().min(1),
  gatePost: z.string().min(1),
  topRail: z.string().min(1),
  tensionBar: z.string().min(1),
  tensionBand: z.string().min(1),
  braceBand: z.string().min(1),
  tieWire: z.string().min(1),
  concrete: z.string().min(1),
  gateHardware: z.string().min(1),
  gateFrame: z.string().min(1),
});

export const estimateInputSchema = z.object({
  customer: z.object({
    displayName: z.string().min(1),
    companyName: z.string().optional(),
    email: z.email().optional().or(z.literal("")),
    phone: z.string().optional(),
  }),
  projectSite: z.object({
    siteName: z.string().min(1),
    addressLine1: z.string().min(1),
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
    notes: z.string().optional(),
  }),
  configuration: z.object({
    installationMethod: z.enum(["CONCRETE_FOOTING", "DRIVEN_POST"]),
    linePostSpacingMm: z.number().int().positive(),
    fabricWasteBasisPoints: z.number().int().min(0),
    topRailStockLengthMm: z.number().int().positive(),
    footingDiameterMm: z.number().int().positive(),
    footingDepthMm: z.number().int().positive(),
    pricingMode: z.enum(["MARKUP", "MARGIN"]),
    adjustmentBasisPoints: z.number().int().min(0).max(9000),
    taxBasisPoints: z.number().int().min(0).max(10000),
    freightCents: z.number().int().min(0),
    nonStockCents: z.number().int().min(0),
    contingencyBasisPoints: z.number().int().min(0).max(10000),
    labourHours: z.number().min(0),
    equipmentHours: z.number().min(0),
    labourRateId: z.string().min(1),
    equipmentRateId: z.string().min(1),
    tieWireSpacingMm: z.number().int().positive(),
    overrideReason: z.string().optional(),
  }),
  runs: z.array(runSchema).min(1),
  gates: z.array(gateSchema),
  selections: selectionSchema,
  overrides: z
    .record(
      z.string(),
      z.object({
        quantity: z.number().min(0).optional(),
        unitPriceCents: z.number().int().min(0).optional(),
        reason: z.string().min(1),
      }),
    )
    .optional(),
});

export type EstimateInputSchema = z.infer<typeof estimateInputSchema>;
