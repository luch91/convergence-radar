import type { WalletActivitySource } from "./data-source.js";
import type { RawWalletAction } from "./domain.js";
import type { OkxClient } from "./okx-client.js";

export class LiveWalletActivitySource implements WalletActivitySource {
  constructor(private readonly client: OkxClient) {}

  async fetchWalletActions(_since: Date | undefined): Promise<RawWalletAction[]> {
    void this.client;
    throw new Error("Live ingestion needs an approved tracked-wallet registry and a mapped transaction-history response.");
  }
}
