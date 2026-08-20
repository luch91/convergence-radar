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

The engine does not count sell actions. It counts one wallet once per signal. Each fixture-derived signal stores a point-in-time cohort snapshot and a provenance hash. The output remains unverified until an on-chain verification phase completes.

The cohort snapshot records the selected wallet addresses and tags at the observation time. The provenance hash includes the selected source actions, cohort snapshot hash, normalization version, rule version, dataset version, and calculation method version. The in-memory and PostgreSQL repositories do not replace an existing signal identifier.

## Data sources

`FixtureWalletActivitySource` provides repeatable local data. `LiveWalletActivitySource` is an adapter boundary only. It throws an error because the project does not yet have an approved tracked-wallet registry or mapped transaction-history response.

The application reads `.env` locally. It signs Open API requests with `OKX_API_KEY`, `OKX_SECRET_KEY`, and `OKX_PASSPHRASE`. Run `pnpm check:okx` to verify credentials with a read-only supported-chain request. This command does not submit a transaction or change account data.

## Run locally

```text
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @convergence-radar/api start
```

Set `DATA_SOURCE=fixture` for local development and public deployment. Copy `.env.example` to `.env` when configuration is required.
