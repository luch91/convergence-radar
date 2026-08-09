import { describe, expect, it } from "vitest";
import type { RawWalletAction } from "./domain.js";
import type { WalletActivitySource } from "./data-source.js";
import { IngestionService } from "./ingestion-service.js";
import { InMemoryDataRepository } from "./repository.js";

const rawAction: RawWalletAction = {
  chainId: 196,
  tokenAddress: "0x1111111111111111111111111111111111111111",
  walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  walletTag: "fund-alpha",
  action: "buy",
  occurredAt: "2026-08-09T08:00:00.000Z",
  transactionHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  logIndex: 0,
  source: "test"
};

class StaticSource implements WalletActivitySource {
  constructor(private readonly actions: RawWalletAction[]) {}

  async fetchWalletActions(): Promise<RawWalletAction[]> {
    return this.actions;
  }
}

describe("IngestionService", () => {
  it("rejects invalid actions and removes duplicate actions", async () => {
    const service = new IngestionService(
      new StaticSource([rawAction, rawAction, { ...rawAction, walletAddress: "invalid" }]),
      new InMemoryDataRepository(),
      () => new Date("2026-08-09T09:00:00.000Z")
    );

    const result = await service.run();

    expect(result).toEqual({
      readCount: 3,
      acceptedCount: 1,
      duplicateCount: 1,
      rejectedCount: 1,
      signalCount: 0
    });
  });
});
