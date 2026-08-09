# Data Engine

## Purpose

The data engine reads tagged wallet actions, validates the input, removes duplicates, and detects convergence signals.

## Input contract

Each wallet action must contain these fields:

| Field | Requirement |
| --- | --- |
| `chainId` | Positive chain identifier. |
| `tokenAddress` | 20-byte hexadecimal address. |
| `walletAddress` | 20-byte hexadecimal address. |
| `walletTag` | Non-empty source tag. |
| `action` | `buy` or `sell`. |
| `occurredAt` | ISO 8601 timestamp. |
| `transactionHash` | 32-byte hexadecimal transaction hash. |
| `logIndex` | Zero or positive integer. |
| `source` | Non-empty source identifier. |

The engine identifies one wallet action by transaction hash and log index. It rejects invalid input. It does not stop the full ingestion run when one item is invalid.

## Convergence calculation

The engine groups buy actions by chain and token. It evaluates each buy action as the end of a rolling 48-hour window. It creates a signal when the unique-buyer count crosses from fewer than four to four or more.

The engine does not count sell actions. It counts one wallet once per signal. The output is unverified until the on-chain verification phase completes.

## Data sources

`FixtureWalletActivitySource` provides repeatable local data. `LiveWalletActivitySource` is an adapter boundary for an approved live wallet-activity endpoint. The live endpoint is not enabled until the team confirms the provider request and response contract.

## Run locally

```text
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @convergence-radar/api start
```

Set `DATA_SOURCE=fixture` for local development. Copy `.env.example` to `.env` when configuration is required.
