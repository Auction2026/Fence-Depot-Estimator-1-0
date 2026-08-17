import { DocumentType, Prisma } from "@prisma/client";

export async function nextDocumentNumber(
  tx: Prisma.TransactionClient,
  documentType: DocumentType,
  year = new Date().getFullYear(),
) {
  const sequence = await tx.documentSequence.upsert({
    where: {
      documentType_year: {
        documentType,
        year,
      },
    },
    update: {
      currentValue: {
        increment: 1,
      },
    },
    create: {
      documentType,
      year,
      currentValue: 1,
    },
  });

  const prefix = documentType === DocumentType.ESTIMATE ? "EST" : "CON";
  return {
    year,
    sequence: sequence.currentValue,
    documentNumber: `${prefix}-${year}-${String(sequence.currentValue).padStart(4, "0")}`,
  };
}
