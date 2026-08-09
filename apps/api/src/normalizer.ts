import { createHash } from "node:crypto";
import type { RawWalletAction, WalletAction } from "./domain.js";

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
