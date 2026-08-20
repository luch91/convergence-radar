export const CONVERGENCE_WINDOW_MS = 48 * 60 * 60 * 1000;
export const MINIMUM_UNIQUE_BUYERS = 4;
export const NORMALIZATION_VERSION = "v1";
export const CONVERGENCE_RULE_VERSION = "v1";
export const DATASET_VERSION = "fixture-v1";
export const CALCULATION_METHOD_VERSION = "baseline-convergence-v1";

export type ChainId = number;

export type WalletActionType = "buy" | "sell";

export interface RawWalletAction {
  chainId: ChainId;
  tokenAddress: string;
  walletAddress: string;
  walletTag: string;
  action: WalletActionType;
  occurredAt: string;
  transactionHash: string;
  logIndex: number;
  source: string;
}

export interface WalletAction extends Omit<RawWalletAction, "occurredAt"> {
  id: string;
  occurredAt: Date;
}

export interface CohortMember {
  walletAddress: string;
  walletTag: string;
}

export interface CohortSnapshot {
  id: string;
  version: string;
  qualificationMethod: string;
  snapshotAt: Date;
  snapshotHash: string;
  members: CohortMember[];
}

export interface ObservationProvenance {
  normalizationVersion: string;
  ruleVersion: string;
  datasetVersion: string;
  calculationMethodVersion: string;
  provenanceHash: string;
}

export interface ConvergenceSignal {
  id: string;
  chainId: ChainId;
  tokenAddress: string;
  buyerAddresses: string[];
  buyerCount: number;
  windowStart: Date;
  windowEnd: Date;
  createdAt: Date;
  sourceActionIds: string[];
  cohortSnapshot: CohortSnapshot;
  provenance: ObservationProvenance;
  verificationStatus: "unverified";
}

export interface IngestionResult {
  readCount: number;
  acceptedCount: number;
  duplicateCount: number;
  rejectedCount: number;
  signalCount: number;
}
