import type { RawWalletAction } from "./domain.js";
import type { WalletActivitySource } from "./data-source.js";

export class LiveWalletActivitySource implements WalletActivitySource {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async fetchWalletActions(since: Date | undefined): Promise<RawWalletAction[]> {
    const url = new URL("wallet-actions", this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`);
    if (since !== undefined) {
      url.searchParams.set("since", since.toISOString());
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`Wallet activity request failed with status ${response.status}.`);
    }

    return (await response.json()) as RawWalletAction[];
  }
}
