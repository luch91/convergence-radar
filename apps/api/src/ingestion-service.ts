import { detectConvergences } from "./convergence.js";
import type { IngestionResult } from "./domain.js";
import type { WalletActivitySource } from "./data-source.js";
import { normalizeWalletAction } from "./normalizer.js";
import type { DataRepository } from "./repository.js";

export class IngestionService {
  private lastRunAt: Date | undefined;

  constructor(
    private readonly source: WalletActivitySource,
    private readonly repository: DataRepository,
    private readonly clock: () => Date = () => new Date()
  ) {}

  async run(): Promise<IngestionResult> {
    const rawActions = await this.source.fetchWalletActions(this.lastRunAt);
    const normalized = [];
    let rejectedCount = 0;

    for (const rawAction of rawActions) {
      try {
        normalized.push(normalizeWalletAction(rawAction));
      } catch {
        rejectedCount += 1;
      }
    }

    const saved = await this.repository.saveActions(normalized);
    const now = this.clock();
    const signals = detectConvergences(await this.repository.listActions(), now);
    await this.repository.saveSignals(signals);
    this.lastRunAt = now;

    return {
      readCount: rawActions.length,
      acceptedCount: saved.accepted.length,
      duplicateCount: saved.duplicateCount,
      rejectedCount,
      signalCount: signals.length
    };
  }
}
