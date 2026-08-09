import { readFile } from "node:fs/promises";
import type { RawWalletAction } from "./domain.js";
import type { WalletActivitySource } from "./data-source.js";

export class FixtureWalletActivitySource implements WalletActivitySource {
  constructor(private readonly fixturePath: URL) {}

  async fetchWalletActions(since: Date | undefined): Promise<RawWalletAction[]> {
    const content = await readFile(this.fixturePath, "utf8");
    const actions = JSON.parse(content) as RawWalletAction[];
    if (since === undefined) {
      return actions;
    }
    return actions.filter((action) => new Date(action.occurredAt) > since);
  }
}
