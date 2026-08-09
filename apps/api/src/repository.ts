import type { ConvergenceSignal, WalletAction } from "./domain.js";

export interface DataRepository {
  saveActions(actions: WalletAction[]): { accepted: WalletAction[]; duplicateCount: number };
  listActions(): WalletAction[];
  saveSignals(signals: ConvergenceSignal[]): void;
  listSignals(): ConvergenceSignal[];
}

export class InMemoryDataRepository implements DataRepository {
  private readonly actions = new Map<string, WalletAction>();
  private readonly signals = new Map<string, ConvergenceSignal>();

  saveActions(actions: WalletAction[]): { accepted: WalletAction[]; duplicateCount: number } {
    const accepted: WalletAction[] = [];
    let duplicateCount = 0;

    for (const action of actions) {
      if (this.actions.has(action.id)) {
        duplicateCount += 1;
        continue;
      }
      this.actions.set(action.id, action);
      accepted.push(action);
    }

    return { accepted, duplicateCount };
  }

  listActions(): WalletAction[] {
    return [...this.actions.values()];
  }

  saveSignals(signals: ConvergenceSignal[]): void {
    for (const signal of signals) {
      this.signals.set(signal.id, signal);
    }
  }

  listSignals(): ConvergenceSignal[] {
    return [...this.signals.values()];
  }
}
