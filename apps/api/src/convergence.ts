import {
  CALCULATION_METHOD_VERSION,
  CONVERGENCE_WINDOW_MS,
  CONVERGENCE_RULE_VERSION,
  DATASET_VERSION,
  MINIMUM_UNIQUE_BUYERS,
  NORMALIZATION_VERSION,
  type ConvergenceSignal,
  type WalletAction
} from "./domain.js";
import { cohortSnapshot, observationProvenance, signalId } from "./normalizer.js";

function groupKey(action: WalletAction): string {
  return `${action.chainId}:${action.tokenAddress}`;
}

export function detectConvergences(actions: WalletAction[], now: Date): ConvergenceSignal[] {
  const groupedActions = new Map<string, WalletAction[]>();

  for (const action of actions) {
    if (action.action !== "buy") {
      continue;
    }
    const key = groupKey(action);
    const group = groupedActions.get(key) ?? [];
    group.push(action);
    groupedActions.set(key, group);
  }

  const signals: ConvergenceSignal[] = [];
  for (const group of groupedActions.values()) {
    const ordered = [...group].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());
    let previousBuyerCount = 0;

    for (const boundaryAction of ordered) {
      const windowEnd = boundaryAction.occurredAt;
      const windowStart = new Date(windowEnd.getTime() - CONVERGENCE_WINDOW_MS);
      const actionsByWallet = new Map<string, WalletAction>();
      for (const action of ordered) {
        if (action.occurredAt < windowStart || action.occurredAt > windowEnd) {
          continue;
        }
        const current = actionsByWallet.get(action.walletAddress);
        if (current === undefined || action.occurredAt > current.occurredAt) {
          actionsByWallet.set(action.walletAddress, action);
        }
      }

      if (
        actionsByWallet.size < MINIMUM_UNIQUE_BUYERS ||
        previousBuyerCount >= MINIMUM_UNIQUE_BUYERS
      ) {
        previousBuyerCount = actionsByWallet.size;
        continue;
      }

      const selectedActions = [...actionsByWallet.values()].sort(
        (left, right) => left.walletAddress.localeCompare(right.walletAddress)
      );
      const cohort = cohortSnapshot(
        selectedActions.map((action) => ({
          walletAddress: action.walletAddress,
          walletTag: action.walletTag
        })),
        windowEnd,
        "source-wallet-tag-v1",
        "latest normalized buy action in the convergence window"
      );
      const provenance = observationProvenance(
        selectedActions,
        cohort,
        NORMALIZATION_VERSION,
        CONVERGENCE_RULE_VERSION,
        DATASET_VERSION,
        CALCULATION_METHOD_VERSION
      );
      signals.push({
        id: signalId(boundaryAction.chainId, boundaryAction.tokenAddress, windowEnd),
        chainId: boundaryAction.chainId,
        tokenAddress: boundaryAction.tokenAddress,
        buyerAddresses: selectedActions.map((action) => action.walletAddress),
        buyerCount: selectedActions.length,
        windowStart,
        windowEnd,
        createdAt: now,
        sourceActionIds: selectedActions.map((action) => action.id),
        cohortSnapshot: cohort,
        provenance,
        verificationStatus: "unverified"
      });
      previousBuyerCount = actionsByWallet.size;
    }
  }

  return signals;
}
