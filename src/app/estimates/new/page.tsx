import { EstimatorWizard } from "@/components/estimator/EstimatorWizard";
import { getCatalogVariants, getCompanySettings, getRateCard } from "@/lib/services/reference-data";

export const dynamic = "force-dynamic";

export default async function NewEstimatePage() {
  const [company, variants, rateCard] = await Promise.all([
    getCompanySettings(),
    getCatalogVariants(),
    getRateCard(),
  ]);

  return (
    <EstimatorWizard
      companyName={company.businessName}
      variants={variants}
      rateCard={rateCard}
      defaults={{
        taxBasisPoints: company.defaultHstRateBasisPoints,
        linePostSpacingMm: company.defaultLinePostSpacingMm,
        fabricWasteBasisPoints: company.defaultFabricWasteBasisPts,
        topRailStockLengthMm: company.defaultTopRailLengthMm,
        footingDiameterMm: company.defaultFootingDiameterMm,
        footingDepthMm: company.defaultFootingDepthMm,
      }}
    />
  );
}
