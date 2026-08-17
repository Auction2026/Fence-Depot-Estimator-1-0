import { ApprovalStatus, ContractStatus, EstimateStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { nextDocumentNumber } from "@/lib/services/numbering";

export async function acceptEstimateToContract(estimateId: string, approvedByName: string, approvedByEmail?: string) {
  return prisma.$transaction(async (tx) => {
    const estimate = await tx.estimate.findUnique({
      where: { id: estimateId },
      include: { currentRevision: true, contract: true },
    });

    if (!estimate || !estimate.currentRevision) {
      throw new Error("Estimate not found.");
    }

    if (estimate.contract) {
      return estimate.contract;
    }

    const numbering = await nextDocumentNumber(tx, "CONTRACT");

    await tx.estimateApproval.create({
      data: {
        estimateId: estimate.id,
        approvedByName,
        approvedByEmail,
        approvalStatus: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    const contract = await tx.contract.create({
      data: {
        contractYear: numbering.year,
        contractSequence: numbering.sequence,
        contractNumber: numbering.documentNumber,
        estimateId: estimate.id,
        sourceRevisionId: estimate.currentRevision.id,
        customerId: estimate.customerId,
        projectSiteId: estimate.projectSiteId,
        status: ContractStatus.OPEN,
        totalCents: estimate.grandTotalCents,
      },
    });

    await tx.estimate.update({
      where: { id: estimate.id },
      data: {
        status: EstimateStatus.CONTRACTED,
      },
    });

    return contract;
  });
}
