import { createHash } from "node:crypto";
import type {
  CohortMember,
  CohortSnapshot,
  ObservationProvenance,
  RawWalletAction,
  WalletAction
} from "./domain.js";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const TRANSACTION_PATTERN = /^0x[a-fA-F0-9]{64}$/;

function normalizeAddress(value: string, field: string): string {
  if (!ADDRESS_PATTERN.test(value)) {
    throw new Error(`${field} must be a 20-byte hexadecimal address.`);
  }

  return value.toLowerCase();
}

function parseOccurredAt(value: string): Date {
  const occurredAt = new Date(value);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error("occurredAt must be an ISO 8601 timestamp.");
  }

  return occurredAt;
}

export function actionId(transactionHash: string, logIndex: number): string {
  return `${transactionHash.toLowerCase()}:${logIndex}`;
}

export function signalId(chainId: number, tokenAddress: string, windowEnd: Date): string {
  const input = `${chainId}:${tokenAddress}:${windowEnd.toISOString()}`;
  return createHash("sha256").update(input).digest("hex");
}

function contentHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function cohortSnapshot(
  members: CohortMember[],
  snapshotAt: Date,
  version: string,
  qualificationMethod: string
): CohortSnapshot {
  const orderedMembers = [...members].sort((left, right) =>
    left.walletAddress.localeCompare(right.walletAddress)
  );
  const snapshotHash = contentHash({
    version,
    qualificationMethod,
    snapshotAt: snapshotAt.toISOString(),
    members: orderedMembers
  });

  return {
    id: snapshotHash,
    version,
    qualificationMethod,
    snapshotAt,
    snapshotHash,
    members: orderedMembers
  };
}

export function observationProvenance(
  actions: WalletAction[],
  cohort: CohortSnapshot,
  normalizationVersion: string,
  ruleVersion: string,
  datasetVersion: string,
  calculationMethodVersion: string
): ObservationProvenance {
  const orderedActions = [...actions]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((action) => ({
      id: action.id,
      transactionHash: action.transactionHash,
      logIndex: action.logIndex,
      occurredAt: action.occurredAt.toISOString(),
      source: action.source
    }));

  return {
    normalizationVersion,
    ruleVersion,
    datasetVersion,
    calculationMethodVersion,
    provenanceHash: contentHash({
      actions: orderedActions,
      cohortSnapshotHash: cohort.snapshotHash,
      normalizationVersion,
      ruleVersion,
      datasetVersion,
      calculationMethodVersion
    })
  };
}

export function normalizeWalletAction(raw: RawWalletAction): WalletAction {
  if (!Number.isSafeInteger(raw.chainId) || raw.chainId <= 0) {
    throw new Error("chainId must be a positive integer.");
  }
  if (!TRANSACTION_PATTERN.test(raw.transactionHash)) {
    throw new Error("transactionHash must be a 32-byte hexadecimal hash.");
  }
  if (!Number.isSafeInteger(raw.logIndex) || raw.logIndex < 0) {
    throw new Error("logIndex must be zero or a positive integer.");
  }
  if (raw.walletTag.trim() === "") {
    throw new Error("walletTag is required.");
  }
  if (raw.source.trim() === "") {
    throw new Error("source is required.");
  }

  const transactionHash = raw.transactionHash.toLowerCase();
  return {
    ...raw,
    tokenAddress: normalizeAddress(raw.tokenAddress, "tokenAddress"),
    walletAddress: normalizeAddress(raw.walletAddress, "walletAddress"),
    walletTag: raw.walletTag.trim(),
    transactionHash,
    occurredAt: parseOccurredAt(raw.occurredAt),
    id: actionId(transactionHash, raw.logIndex)
  };
}
