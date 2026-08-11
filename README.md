# Convergence Radar

Convergence Radar is a paid signal service for token-buying convergence. It detects when four or more independent, tagged wallets buy one token during a 48-hour period.

The service returns the full performance record. It shows successful and unsuccessful signals. It uses an on-chain verification path for premium results.

## Project status

This repository contains the project foundation. The product name is temporary. The name, visual identity, and public release material will be selected before submission.

## Product scope

- API service with x402 payment checks.
- Token and active-convergence endpoints.
- Data ingestion from approved OnchainOS services.
- PostgreSQL data store and Redis cache.
- GenLayer intelligent contract for signal verification.
- X Layer contracts for settlement, service registration, and optional oracle delivery.

## Repository layout

```text
apps/
  api/                 API service
  web/                 Web application
contracts/
  genlayer/            Intelligent contract source
  xlayer/              Solidity contract source
docs/                  Public technical documentation
.local/decisions/      Local decision records, ignored by Git
```

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

The service provides data signals. It does not provide investment advice. A signal can lose value. Do not state or imply a guaranteed result.
