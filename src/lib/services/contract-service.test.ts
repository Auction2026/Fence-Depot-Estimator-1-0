import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTransaction = {
  estimate: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  estimateApproval: {
    create: vi.fn(),
  },
  contract: {
    create: vi.fn(),
  },
  documentSequence: {
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: typeof mockTransaction) => Promise<unknown>) => callback(mockTransaction)),
  },
}));

import { acceptEstimateToContract } from "@/lib/services/contract-service";

describe("acceptEstimateToContract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransaction.documentSequence.upsert.mockResolvedValue({ currentValue: 1 });
    mockTransaction.estimate.findUnique.mockResolvedValue({
      id: "estimate-1",
      customerId: "customer-1",
      projectSiteId: "site-1",
      grandTotalCents: 123456,
      currentRevision: { id: "revision-1" },
      contract: null,
    });
    mockTransaction.contract.create.mockResolvedValue({ id: "contract-1", contractNumber: "CON-2026-0001" });
  });

  it("creates a contract and updates the estimate status", async () => {
    const contract = await acceptEstimateToContract("estimate-1", "Fence Depot office", "fencedepot@hotmail.com");

    expect(mockTransaction.estimateApproval.create).toHaveBeenCalled();
    expect(mockTransaction.contract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estimateId: "estimate-1",
          sourceRevisionId: "revision-1",
          totalCents: 123456,
        }),
      }),
    );
    expect(mockTransaction.estimate.update).toHaveBeenCalled();
    expect(contract).toEqual({ id: "contract-1", contractNumber: "CON-2026-0001" });
  });

  it("returns existing contract without creating a duplicate", async () => {
    mockTransaction.estimate.findUnique.mockResolvedValueOnce({
      id: "estimate-1",
      customerId: "customer-1",
      projectSiteId: "site-1",
      grandTotalCents: 123456,
      currentRevision: { id: "revision-1" },
      contract: { id: "contract-existing", contractNumber: "CON-2026-0002" },
    });

    const contract = await acceptEstimateToContract("estimate-1", "Fence Depot office");

    expect(mockTransaction.contract.create).not.toHaveBeenCalled();
    expect(contract).toEqual({ id: "contract-existing", contractNumber: "CON-2026-0002" });
  });
});
