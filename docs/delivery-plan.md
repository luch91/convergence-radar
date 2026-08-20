# Five-Phase Implementation Plan

## Objective

Build Convergence Radar as a calibrated market-evidence service for autonomous agents. The service must preserve provenance, measure historical outcomes, state execution limits, and return machine-readable evidence. It must not execute trades.

## Phase 1: Evidence foundation

Status: partially complete.

Build the data model and version controls that make each observation reproducible.

- Keep the existing normalized wallet-action pipeline and baseline convergence rule.
- Define versioned schemas for normalization, convergence rules, datasets, and calculation methods.
- Add immutable records for source events, observation versions, and provenance hashes.
- Add point-in-time cohort snapshots with wallet membership, qualification method, timestamp, and snapshot hash.
- Define correction and replacement rules. Do not overwrite completed observations.

Exit criteria:

- A fixture observation has a complete provenance chain.
- Tests prove that a later cohort label cannot change a historical observation.
- Database migrations and rollback procedure are reviewed.

## Phase 2: Live observation and market context

Status: not started.

Connect approved live sources and construct complete observations.

- Integrate the approved OKX smart-money data source.
- Map provider responses into the normalized action contract.
- Define provider error, duplicate, late-event, and clock-source rules.
- Add market context from approved price, liquidity, token, and security sources.
- Calculate participation, temporal concentration, and weighted convergence fields.

Exit criteria:

- A controlled live-data run produces a reproducible observation.
- Every observation identifies its source events and market-data source.
- Input validation and provider-failure tests pass.

## Phase 3: Calibration and execution measurement

Status: not started.

Measure what comparable historical observations did and what a participant could realistically execute.

- Define comparable-observation matching and a versioned calibration method.
- Implement the initial nearest-neighbor calibration method.
- Store measured upside, downside, drawdown, survival, liquidity-collapse, and time-based outcomes.
- Publish sample size, confidence interval, historical regime, and matching method.
- Model detection latency, transaction latency, liquidity, position size, slippage, gas, fees, capacity, and exit rules.
- Include adverse outcomes in every published distribution.

Exit criteria:

- A calibration result is reproducible from its dataset and method version.
- Tests cover sparse samples, missing market data, and adverse outcomes.
- Documentation distinguishes theoretical movement from executable return.

## Phase 4: Paid evidence API and provenance verification

Status: partially complete for the baseline API and x402 challenge.

Expose evidence objects and verify their provenance.

- Implement the evidence-object API routes.
- Return observation, calibration, execution, and provenance data as separate, documented resources.
- Complete x402 settlement testing with a funded controlled account on X Layer.
- Implement the GenLayer observation and cohort registry.
- Record observation hashes and verification references. Do not claim verification when the contract does not return a confirmed record.
- Add cache invalidation, durable audit logging, payment monitoring, and reconciliation.

Exit criteria:

- A paid controlled request returns an evidence object after verified settlement.
- A client can retrieve the matching provenance record.
- Security and integration tests pass on the selected test network.

## Phase 5: Release and hackathon submission

Status: not started.

Prepare a verifiable production release and submission package.

- Deploy approved services and contracts to the required networks.
- Record deployment addresses, transaction hashes, versions, and verification results.
- Register the agent when the applicable registry requirements are available.
- Publish API examples, an integration collection, operating procedures, and failure notices.
- Complete security review, monitoring, alerting, backup checks, and incident procedure.
- Prepare the demonstration video, X account activity, peer voting evidence, and submission materials.
- Rename the project and add the approved professional logo before submission.

Exit criteria:

- The release checklist has evidence for every required item.
- Public claims match deployed and tested functionality.
- The submission package identifies all known limits and dependencies.
