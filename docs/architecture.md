# Architecture

## Purpose

The system detects token-buying convergence from tagged wallet actions. The current implementation uses fixture data. It provides an API and a web dashboard.

## Implemented components

| Component | Responsibility | Status |
| --- | --- | --- |
| Web application | Shows dashboard state and protected-feed state. | Deployed. |
| API service | Reads stored signals and returns API responses. | Deployed. |
| Fixture ingestion | Reads repeatable wallet-action data on a schedule. | Implemented. |
| PostgreSQL repository | Stores normalized actions and signals when configured. | Implemented. |
| Redis cache | Caches successful API responses when configured. | Implemented with memory fallback. |
| x402 middleware | Creates a payment challenge when payment mode is enabled. | Implemented. Public settlement is disabled. |

## Planned components

| Component | Intended responsibility | Status |
| --- | --- | --- |
| Live OnchainOS ingestion | Read approved tracked-wallet activity. | Not implemented. |
| Performance service | Calculate and publish signal outcomes. | Not implemented. |
| GenLayer contract | Verify a signal and record its result. | Not implemented. |
| X Layer contracts | Add service registration and optional oracle delivery. | Not implemented. |

## Current request flow

```text
Dashboard
  -> API: request active convergences
  <- API: HTTP 503 when public payment mode is disabled

API
  -> repository and cache: read fixture-derived signal data
  <- API: health or protected-route response
```

## Optional x402 flow

```text
Client
  -> API: request a protected route
  <- API: HTTP 402 payment challenge, when payment mode is okx
Client
  -> API: request with signed payment authorization
API
  -> OKX facilitator: verify and settle authorization
  <- API: protected result after successful settlement
```

The project verified the HTTP 402 challenge. It has not completed a funded mainnet buyer payment test.

## Convergence rule

A token meets the baseline convergence rule when at least four unique, tagged wallets record a buy action for that token within a rolling 48-hour window.

The implementation must define and test these items before public live-data use:

- Wallet tag source and tag quality requirement.
- Buy normalization rule.
- Token address and chain validation rule.
- Duplicate event rule.
- Time-source rule.
- Signal replacement and expiration rule.
- Performance measurement method.
