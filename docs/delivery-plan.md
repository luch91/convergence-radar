# Delivery Plan

## Phase 1: Foundation

Status: complete for fixture development.

- Database migration and repository interfaces are implemented.
- API configuration and local secret handling are implemented.
- Fixture wallet activity and convergence-rule tests are implemented.

## Phase 2: Data engine

Status: complete for fixture data. Live ingestion is pending.

- Normalization, duplicate removal, rolling-window calculation, and scheduled fixture ingestion are implemented.
- The live source remains an adapter boundary. It needs an approved wallet registry and mapped provider response before use.

## Phase 3: Paid API and web application

Status: partially complete.

- The API endpoints, cache, rate limit, audit record, and dashboard are implemented.
- The dashboard and API are deployed on Render.
- The OKX x402 challenge is implemented and was verified without payment.
- A funded mainnet settlement test is deferred.
- Performance history and risk enrichment are not implemented.

## Phase 4: On-chain verification

Status: not started.

- Implement the GenLayer intelligent contract.
- Add contract tests and a test-network deployment record.
- Link API responses to verification identifiers.
- Add X Layer contracts only when they have a defined requirement.

## Phase 5: Release and submission

Status: not started.

- Add monitoring and an incident procedure.
- Complete a security review.
- Publish an API collection and demo script.
- Select the final project name and logo.
- Prepare submission evidence and a demonstration video.
