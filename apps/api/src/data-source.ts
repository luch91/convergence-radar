import type { RawWalletAction } from "./domain.js";

export interface WalletActivitySource {
  fetchWalletActions(since: Date | undefined): Promise<RawWalletAction[]>;
}
