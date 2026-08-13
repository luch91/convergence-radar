# Convergence Radar

Convergence Radar is an experimental smart-money signal service. It detects a convergence when four or more independent, tagged wallets buy one token within a 48-hour period.

The current application uses fixture wallet activity. It does not publish live wallet data, performance metrics, failed-signal metrics, or on-chain verification results.

## Current status

| Area | Status |
| --- | --- |
| Convergence rule and fixture ingestion | Implemented and tested. |
| PostgreSQL repository and migration | Implemented. |
| API, rate limit, audit record, and cache | Implemented. |
| x402 payment challenge | Implemented for X Layer. Public payment settlement is disabled. |
| Web dashboard | Deployed. It shows the API state and protected-feed state. |
| Live OnchainOS ingestion | Not implemented. It needs an approved wallet registry and mapped provider response. |
| Performance tracking | Schema only. Calculation and publication are not implemented. |
| GenLayer verification | Not implemented. |
| X Layer contracts | Not implemented. |

## Deployed services

- API: `https://convergence-radar.onrender.com`
- Dashboard: `https://convergence-radar-dashboard.onrender.com`

The deployed API uses `DATA_SOURCE=fixture` and `PAYMENT_MODE=disabled`. The health endpoint is public. Protected signal endpoints return HTTP 503 until payment processing is enabled.

## Product rule

A token meets the baseline convergence rule when at least four unique, tagged wallets record a buy action for that token in a rolling 48-hour window.

A convergence is not a recommendation or a forecast. It can lose value.

## Repository layout

```text
apps/
  api/                 Express API service
  web/                 Next.js dashboard
contracts/
  genlayer/            Reserved for future intelligent contract source
  xlayer/              Reserved for future Solidity contract source
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
- [Delivery plan](docs/delivery-plan.md)
- [Engineering standards](docs/engineering-standards.md)
- [Decision record template](docs/decision-record-template.md)
- [Contribution guide](CONTRIBUTING.md)

## Safety notice

The service provides experimental market data. It does not provide investment advice. Do not state or imply a guaranteed result.
