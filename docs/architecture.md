# Architecture

## Scope

Convergence Radar detects a defined event. The event occurs when four or more distinct, tagged wallets record buy actions for the same token on the same chain within a rolling 48-hour window.

The current system is an experimental API and dashboard. It uses repeatable fixture activity. It does not publish live wallet activity, price performance, risk ratings, or on-chain verification results.

The system does not provide investment advice. A convergence signal is an observation of wallet activity. It is not a price prediction or a recommendation to trade.

## System boundary

```text
Web dashboard
  -> HTTP API
     -> payment gate
     -> response cache
     -> data repository
        -> PostgreSQL, when DATABASE_URL is set
        -> memory, when DATABASE_URL is not set

Ingestion scheduler
  -> wallet activity source
     -> fixture JSON in the current deployment
     -> live OnchainOS adapter in a future deployment
  -> normalization and duplicate handling
  -> convergence detection
  -> data repository
```

The API service and web dashboard run as separate Render web services. The dashboard reads the API base URL from `API_BASE_URL` during server-side rendering. The API health endpoint is public. The signal endpoints are protected.

## Implemented components

| Component | Responsibility | Current behavior |
| --- | --- | --- |
| Web application | Shows the signal-feed state and the method summary. | Deployed. It identifies the current data as fixture-derived and unverified. |
| API service | Serves health, crossings, and token-detail routes. | Deployed. It validates token addresses, limits requests, and adds a request identifier. |
| Ingestion service | Reads activity, normalizes records, detects convergence, and stores results. | Runs at startup and on the configured interval. |
| Fixture activity source | Provides repeatable test wallet actions. | Used by local development and the public deployment. |
| Convergence detector | Counts distinct wallet addresses for each chain and token. | Creates a signal when the count first reaches four in a 48-hour rolling window. |
| Data repository | Stores actions and signals. | Uses PostgreSQL when configured. Otherwise it uses memory and loses data on restart. |
| Cache | Caches successful protected-route responses for 60 seconds. | Uses Redis when available. It falls back to memory if Redis is unavailable. |
| Audit sink | Records request metadata. | The current sink is in memory only. It does not create durable audit records. |
| Payment integration | Protects `/v1/crossings` and `/v1/token`. | Supports disabled, demo, and OKX x402 modes. The public deployment is disabled. |

## Data model and processing rules

Each normalized wallet action has a chain ID, token address, wallet address, wallet tag, action type, time, transaction hash, log index, and source identifier.

The repository accepts an action once for each transaction-hash and log-index pair. The detector ignores sell actions. It groups buy actions by chain ID and token address. At every action time, it counts the most recent buy action from each distinct wallet within the preceding 48 hours. It creates a signal when the count crosses from fewer than four buyers to four or more buyers.

Each current signal has the status `unverified`. The system does not calculate a confidence score, token liquidity, token risk, price change, drawdown, or historical outcome.

## Request behavior

```text
Client
  -> GET /health
  <- 200 with service status

Client
  -> GET /v1/crossings or GET /v1/token?address=0x...
  -> rate limit and request audit
  -> payment gate
  <- 503 when payment mode is disabled
  <- 402 when demo mode has no payment-signature header
  <- x402 challenge or settled result when OKX mode is enabled
  -> cache and repository after payment acceptance
  <- 200 response with fixture-derived, unverified signal data
```

`PAYMENT_MODE=disabled` is the public deployment setting. It prevents protected routes from returning signal data. `PAYMENT_MODE=demo` accepts a non-empty `PAYMENT-SIGNATURE` header for local tests only. `PAYMENT_MODE=okx` initializes the OKX x402 resource server and uses the X Layer network identifier `eip155:196`.

The project verified that the OKX mode generates an HTTP 402 challenge. It has not completed a funded mainnet buyer payment test.

## External dependencies and trust boundaries

| Dependency | Boundary | Current use |
| --- | --- | --- |
| PostgreSQL | Durable application data | Optional. The repository stores wallet actions and signals. |
| Redis | Performance cache | Optional. It stores API responses only. |
| OKX x402 facilitator | Payment verification and settlement | Code integration exists. Public settlement is disabled. |
| OKX OnchainOS | Live wallet activity | Not connected to the ingestion pipeline. |
| GenLayer | On-chain verification | Not implemented. |
| X Layer contracts | Registry, settlement support, or oracle delivery | Not implemented. |

API credentials, payment secrets, database URLs, and Redis URLs must exist only in environment configuration. They must not be committed to the repository or returned by an API route.

## Not implemented

- An approved tagged-wallet registry.
- A mapped OnchainOS transaction-history response.
- Live wallet ingestion.
- Durable audit logging.
- Signal expiration and replacement rules.
- Token metadata, liquidity, and security enrichment.
- Historical performance calculations and failed-signal reporting.
- GenLayer intelligent-contract source or deployment.
- X Layer contract source or deployment.
- A funded mainnet x402 settlement test.

## Conditions before live use

Before the system uses public live data, the project must define, implement, and test these items:

- Wallet tag source, ownership, and quality requirements.
- Buy normalization and chain-validation rules.
- Provider response mapping and error handling.
- Clock source and late-event policy.
- Signal expiration, replacement, and correction rules.
- Durable audit retention and access controls.
- Price source and performance measurement method.
- Payment settlement monitoring and reconciliation.
