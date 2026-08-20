import { describe, expect, it } from "vitest";
import { detectConvergences } from "./convergence.js";
import type { WalletAction } from "./domain.js";
import { InMemoryDataRepository } from "./repository.js";

function action(walletAddress: string, walletTag: string, occurredAt: string): WalletAction {
  return {
    id: `${walletAddress}:${occurredAt}`,
    chainId: 196,
    tokenAddress: "0x1111111111111111111111111111111111111111",
    walletAddress,
    walletTag,
    action: "buy",
    occurredAt: new Date(occurredAt),
    transactionHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    logIndex: 0,
    source: "test"
  };
}

describe("InMemoryDataRepository", () => {
  it("does not replace an existing observation when a later cohort differs", async () => {
    const signals = detectConvergences([
      action("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "fund-alpha", "2026-08-08T09:00:00.000Z"),
      action("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "fund-beta", "2026-08-08T14:00:00.000Z"),
      action("0xcccccccccccccccccccccccccccccccccccccccc", "fund-gamma", "2026-08-09T01:00:00.000Z"),
      action("0xdddddddddddddddddddddddddddddddddddddddd", "fund-delta", "2026-08-09T08:00:00.000Z")
    ], new Date("2026-08-09T09:00:00.000Z"));
    const original = signals[0]!;
    const repository = new InMemoryDataRepository();

    await repository.saveSignals([original]);
    original.cohortSnapshot.members[0]!.walletTag = "later-classification";
    await repository.saveSignals([original]);

    const stored = (await repository.listSignals())[0]!;
    expect(stored.cohortSnapshot.members[0]?.walletTag).toBe("fund-alpha");
    expect(stored.provenance.provenanceHash).not.toBe("");
  });
});
