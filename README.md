# Convergence Radar

Convergence Radar is a decision-grade market-evidence and calibration layer for autonomous agents. It is designed to preserve an observed market event, its provenance, market context, calibration result, and execution assumptions in a structured evidence object.

The service does not execute trades. A consuming agent retains authority for risk limits, capital allocation, portfolio exposure, and execution.

## Current implementation

The repository contains an experimental foundation for the target product. It uses fixture wallet activity and detects a baseline convergence event. It does not yet publish live wallet data, calibrated outcomes, execution measurements, evidence objects, or on-chain provenance records.

| Area | Status |
| --- | --- |
| Baseline convergence rule and fixture ingestion | Implemented and tested. |
| PostgreSQL repository and migration | Implemented. |
| API, rate limit, in-memory audit record, and cache | Implemented. |
| x402 payment challenge | Implemented for X Layer. Public payment settlement is disabled. |
| Web dashboard | Deployed. It identifies fixture-derived signals as unverified. |
| Live OnchainOS ingestion | Not implemented. It needs an approved wallet registry and mapped provider response. |
| Point-in-time cohort snapshots and provenance hashes | Not implemented. |
| Calibration and execution-aware measurement | Not implemented. |
| Evidence-object API routes | Not implemented. |
| GenLayer provenance registry | Not implemented. |
| X Layer contracts and agent registry | Not implemented. |

## Target product model

The target product is a calibrated convergence observation. It records:

- The observed event and participating cohort.
- The source events and construction method.
- The market context at the observation time.
- Historical outcomes for comparable observations.
- Execution assumptions, including latency, liquidity, and transaction costs.

The evidence chain is:

```text
raw event -> normalization -> cohort snapshot -> observation -> calibration -> outcome
```

Every completed observation must identify its cohort version, rule version, calculation method, dataset version, and provenance hash. A future GenLayer registry can provide an immutable provenance reference. No GenLayer contract source or deployment exists yet.

## Baseline rule

The current implementation creates a baseline convergence event when four or more distinct, tagged wallets record buy actions for the same token on the same chain within a rolling 48-hour window.

This event is an observation. It is not a recommendation, a prediction, or investment advice. It can have an adverse outcome.

## Deployed services

- API: `https://convergence-radar.onrender.com`
- Dashboard: `https://convergence-radar-dashboard.onrender.com`

The deployed API uses `DATA_SOURCE=fixture` and `PAYMENT_MODE=disabled`. The health endpoint is public. Protected signal endpoints return HTTP 503 until payment processing is enabled.

## Repository layout

```text
apps/
  api/                 Express API service
  web/                 Next.js dashboard
contracts/
  genlayer/            Reserved for planned provenance-registry source
  xlayer/              Reserved for planned Solidity contract source
db/                    PostgreSQL migration source
docs/                  Public technical documentation
.local/decisions/      Local decision records, ignored by Git
```

## Local use

```text
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

`pnpm dev` starts the API service. Run `pnpm --filter @convergence-radar/web dev` to start the dashboard.

Copy `.env.example` to `.env` before you add local configuration. Do not commit `.env`.

## Documentation

- [Architecture](docs/architecture.md)
- [Data engine](docs/data-engine.md)
- [API service](docs/api.md)
- [Database](docs/database.md)
- [Deployment](docs/deployment.md)
- [Five-phase implementation plan](docs/delivery-plan.md)
- [Engineering standards](docs/engineering-standards.md)
- [Decision record template](docs/decision-record-template.md)

## Safety notice

The service provides experimental market evidence. It does not provide investment advice. Do not state or imply a guaranteed result.
