# Architecture

## Purpose

The system detects token-buying convergence from tagged wallet actions. It makes a paid result available through an API. A premium request can receive an on-chain verification result.

## Components

| Component | Responsibility |
| --- | --- |
| Web application | Lets a human view and request signals. |
| API service | Validates payment, aggregates data, and returns results. |
| Data ingestion worker | Reads wallet actions and token data on a fixed schedule. |
| PostgreSQL | Stores normalized actions, signals, and performance data. |
| Redis | Caches short-lived API and verification results. |
| GenLayer contract | Produces and records a consensus-backed verification result. |
| X Layer contracts | Support payment settlement, service registration, and oracle delivery. |

## Request flow

```text
Client
  -> API: request a token signal or active convergences
  <- API: HTTP 402 payment challenge, when payment is absent
Client
  -> API: request with payment authorization
API
  -> payment verifier: validate authorization
  -> data store and cache: read current signal
  -> GenLayer: request verification for premium result
  <- API: paid result with source and verification status
```

## Convergence rule

A token meets the baseline convergence rule when at least four unique, tagged wallets record a buy action for that token within a rolling 48-hour window.

The implementation must define and test these items before public use:

- Wallet tag source and tag quality requirement.
- Buy normalization rule.
- Token address and chain validation rule.
- Duplicate event rule.
- Time-source rule.
- Signal replacement and expiration rule.
- Performance measurement method.

## Verification boundary

The API must retain the raw input reference, the verification request identifier, the verdict, and the verification transaction reference. The API must identify an unverified result clearly.
