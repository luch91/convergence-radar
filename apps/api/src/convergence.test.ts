import { describe, expect, it } from "vitest";
import { detectConvergences } from "./convergence.js";
import type { WalletAction } from "./domain.js";

function action(walletAddress: string, occurredAt: string, actionType: "buy" | "sell" = "buy"): WalletAction {
  return {
    id: `${walletAddress}:${occurredAt}`,
    chainId: 196,
    tokenAddress: "0x1111111111111111111111111111111111111111",
    walletAddress,
    walletTag: "test-wallet",
    action: actionType,
    occurredAt: new Date(occurredAt),
    transactionHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    logIndex: 0,
    source: "test"
  };
}

describe("detectConvergences", () => {
  it("creates one signal for four unique buyers in 48 hours", () => {
    const result = detectConvergences([
      action("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "2026-08-08T09:00:00.000Z"),
      action("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "2026-08-08T14:00:00.000Z"),
      action("0xcccccccccccccccccccccccccccccccccccccccc", "2026-08-09T01:00:00.000Z"),
      action("0xdddddddddddddddddddddddddddddddddddddddd", "2026-08-09T08:00:00.000Z")
    ], new Date("2026-08-09T09:00:00.000Z"));

    expect(result).toHaveLength(1);
    expect(result[0]?.buyerCount).toBe(4);
    expect(result[0]?.cohortSnapshot.members).toHaveLength(4);
    expect(result[0]?.cohortSnapshot.snapshotHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result[0]?.provenance.provenanceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not count repeated buys from one wallet as separate buyers", () => {
    const result = detectConvergences([
      action("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "2026-08-08T09:00:00.000Z"),
      action("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "2026-08-08T10:00:00.000Z"),
      action("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "2026-08-08T14:00:00.000Z"),
      action("0xcccccccccccccccccccccccccccccccccccccccc", "2026-08-09T01:00:00.000Z")
    ], new Date("2026-08-09T09:00:00.000Z"));

    expect(result).toHaveLength(0);
  });

  it("does not count sell actions", () => {
    const result = detectConvergences([
      action("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "2026-08-08T09:00:00.000Z"),
      action("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "2026-08-08T14:00:00.000Z"),
      action("0xcccccccccccccccccccccccccccccccccccccccc", "2026-08-09T01:00:00.000Z"),
      action("0xdddddddddddddddddddddddddddddddddddddddd", "2026-08-09T08:00:00.000Z", "sell")
    ], new Date("2026-08-09T09:00:00.000Z"));

    expect(result).toHaveLength(0);
  });

  it("detects a crossing before a later action moves the time window", () => {
    const result = detectConvergences([
      action("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "2026-08-01T00:00:00.000Z"),
      action("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "2026-08-01T01:00:00.000Z"),
      action("0xcccccccccccccccccccccccccccccccccccccccc", "2026-08-01T02:00:00.000Z"),
      action("0xdddddddddddddddddddddddddddddddddddddddd", "2026-08-01T03:00:00.000Z"),
      action("0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "2026-08-05T00:00:00.000Z")
    ], new Date("2026-08-05T01:00:00.000Z"));

    expect(result).toHaveLength(1);
    expect(result[0]?.windowEnd.toISOString()).toBe("2026-08-01T03:00:00.000Z");
  });
});
