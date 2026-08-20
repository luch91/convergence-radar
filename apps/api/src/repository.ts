import { Pool, type PoolClient } from "pg";
import type { CohortMember, ConvergenceSignal, WalletAction } from "./domain.js";

export interface DataRepository {
  saveActions(actions: WalletAction[]): Promise<{ accepted: WalletAction[]; duplicateCount: number }>;
  listActions(): Promise<WalletAction[]>;
  saveSignals(signals: ConvergenceSignal[]): Promise<void>;
  listSignals(): Promise<ConvergenceSignal[]>;
}

function copySignal(signal: ConvergenceSignal): ConvergenceSignal {
  return {
    ...signal,
    buyerAddresses: [...signal.buyerAddresses],
    windowStart: new Date(signal.windowStart),
    windowEnd: new Date(signal.windowEnd),
    createdAt: new Date(signal.createdAt),
    sourceActionIds: [...signal.sourceActionIds],
    cohortSnapshot: {
      ...signal.cohortSnapshot,
      snapshotAt: new Date(signal.cohortSnapshot.snapshotAt),
      members: signal.cohortSnapshot.members.map((member) => ({ ...member }))
    },
    provenance: { ...signal.provenance }
  };
}

export class InMemoryDataRepository implements DataRepository {
  private readonly actions = new Map<string, WalletAction>();
  private readonly signals = new Map<string, ConvergenceSignal>();

  async saveActions(actions: WalletAction[]): Promise<{ accepted: WalletAction[]; duplicateCount: number }> {
    const accepted: WalletAction[] = [];
    let duplicateCount = 0;

    for (const action of actions) {
      if (this.actions.has(action.id)) {
        duplicateCount += 1;
        continue;
      }
      this.actions.set(action.id, action);
      accepted.push(action);
    }

    return { accepted, duplicateCount };
  }

  async listActions(): Promise<WalletAction[]> {
    return [...this.actions.values()];
  }

  async saveSignals(signals: ConvergenceSignal[]): Promise<void> {
    for (const signal of signals) {
      if (!this.signals.has(signal.id)) {
        this.signals.set(signal.id, copySignal(signal));
      }
    }
  }

  async listSignals(): Promise<ConvergenceSignal[]> {
    return [...this.signals.values()].map(copySignal);
  }
}

interface ActionRow {
  id: string;
  chain_id: number;
  token_address: string;
  wallet_address: string;
  wallet_tag: string;
  action_type: "buy" | "sell";
  occurred_at: Date;
  transaction_hash: string;
  log_index: number;
  source: string;
}

interface SignalRow {
  id: string;
  chain_id: number;
  token_address: string;
  buyer_count: number;
  window_start: Date;
  window_end: Date;
  created_at: Date;
  verification_status: "unverified";
  buyer_addresses: string[];
  source_action_ids: string[];
  cohort_snapshot_id: string;
  cohort_version: string;
  qualification_method: string;
  snapshot_at: Date;
  snapshot_hash: string;
  cohort_members: CohortMember[];
  normalization_version: string;
  rule_version: string;
  dataset_version: string;
  calculation_method_version: string;
  provenance_hash: string;
}

function mapAction(row: ActionRow): WalletAction {
  return {
    id: row.id,
    chainId: row.chain_id,
    tokenAddress: row.token_address,
    walletAddress: row.wallet_address,
    walletTag: row.wallet_tag,
    action: row.action_type,
    occurredAt: row.occurred_at,
    transactionHash: row.transaction_hash,
    logIndex: row.log_index,
    source: row.source
  };
}

function mapSignal(row: SignalRow): ConvergenceSignal {
  return {
    id: row.id,
    chainId: row.chain_id,
    tokenAddress: row.token_address,
    buyerAddresses: row.buyer_addresses,
    buyerCount: row.buyer_count,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    createdAt: row.created_at,
    sourceActionIds: row.source_action_ids,
    cohortSnapshot: {
      id: row.cohort_snapshot_id,
      version: row.cohort_version,
      qualificationMethod: row.qualification_method,
      snapshotAt: row.snapshot_at,
      snapshotHash: row.snapshot_hash,
      members: row.cohort_members
    },
    provenance: {
      normalizationVersion: row.normalization_version,
      ruleVersion: row.rule_version,
      datasetVersion: row.dataset_version,
      calculationMethodVersion: row.calculation_method_version,
      provenanceHash: row.provenance_hash
    },
    verificationStatus: row.verification_status
  };
}

export class PostgresDataRepository implements DataRepository {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 15_000,
      idleTimeoutMillis: 10_000,
      max: 5
    });
    this.pool.on("error", (error) => {
      console.error("PostgreSQL idle connection failed.", error.message);
    });
  }

  async saveActions(actions: WalletAction[]): Promise<{ accepted: WalletAction[]; duplicateCount: number }> {
    if (actions.length === 0) {
      return { accepted: [], duplicateCount: 0 };
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const accepted: WalletAction[] = [];
      for (const action of actions) {
        await this.ensureToken(client, action);
        const result = await client.query<{ id: string }>(
          `INSERT INTO wallet_actions (
             id, chain_id, token_address, wallet_address, wallet_tag, action_type,
             occurred_at, transaction_hash, log_index, source
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (transaction_hash, log_index) DO NOTHING
           RETURNING id`,
          [
            action.id,
            action.chainId,
            action.tokenAddress,
            action.walletAddress,
            action.walletTag,
            action.action,
            action.occurredAt,
            action.transactionHash,
            action.logIndex,
            action.source
          ]
        );
        if (result.rowCount === 1) {
          accepted.push(action);
        }
      }
      await client.query("COMMIT");
      return { accepted, duplicateCount: actions.length - accepted.length };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listActions(): Promise<WalletAction[]> {
    const result = await this.pool.query<ActionRow>(
      `SELECT id, chain_id, token_address, wallet_address, wallet_tag, action_type,
              occurred_at, transaction_hash, log_index, source
       FROM wallet_actions
       ORDER BY occurred_at ASC, id ASC`
    );
    return result.rows.map(mapAction);
  }

  async saveSignals(signals: ConvergenceSignal[]): Promise<void> {
    if (signals.length === 0) {
      return;
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const signal of signals) {
        await client.query(
          `INSERT INTO cohort_snapshots (
             id, version, qualification_method, snapshot_at, snapshot_hash, members
           ) VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [
            signal.cohortSnapshot.id,
            signal.cohortSnapshot.version,
            signal.cohortSnapshot.qualificationMethod,
            signal.cohortSnapshot.snapshotAt,
            signal.cohortSnapshot.snapshotHash,
            JSON.stringify(signal.cohortSnapshot.members)
          ]
        );
        await client.query(
          `INSERT INTO signals (
             id, chain_id, token_address, buyer_count, window_start, window_end,
             verification_status, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            signal.id,
            signal.chainId,
            signal.tokenAddress,
            signal.buyerCount,
            signal.windowStart,
            signal.windowEnd,
            signal.verificationStatus,
            signal.createdAt
          ]
        );
        await client.query(
          `INSERT INTO signal_provenance (
             signal_id, cohort_snapshot_id, normalization_version, rule_version,
             dataset_version, calculation_method_version, provenance_hash
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (signal_id) DO NOTHING`,
          [
            signal.id,
            signal.cohortSnapshot.id,
            signal.provenance.normalizationVersion,
            signal.provenance.ruleVersion,
            signal.provenance.datasetVersion,
            signal.provenance.calculationMethodVersion,
            signal.provenance.provenanceHash
          ]
        );
        for (const actionId of signal.sourceActionIds) {
          await client.query(
            `INSERT INTO signal_wallet_actions (signal_id, wallet_action_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [signal.id, actionId]
          );
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listSignals(): Promise<ConvergenceSignal[]> {
    const result = await this.pool.query<SignalRow>(
      `SELECT
         signals.id,
         signals.chain_id,
         signals.token_address,
         signals.buyer_count,
         signals.window_start,
         signals.window_end,
         signals.created_at,
         signals.verification_status,
         signal_provenance.cohort_snapshot_id,
         cohort_snapshots.version AS cohort_version,
         cohort_snapshots.qualification_method,
         cohort_snapshots.snapshot_at,
         cohort_snapshots.snapshot_hash,
         cohort_snapshots.members AS cohort_members,
         signal_provenance.normalization_version,
         signal_provenance.rule_version,
         signal_provenance.dataset_version,
         signal_provenance.calculation_method_version,
         signal_provenance.provenance_hash,
         COALESCE(
           ARRAY_AGG(wallet_actions.wallet_address ORDER BY wallet_actions.wallet_address)
             FILTER (WHERE wallet_actions.wallet_address IS NOT NULL),
           ARRAY[]::text[]
         ) AS buyer_addresses,
         COALESCE(
           ARRAY_AGG(signal_wallet_actions.wallet_action_id ORDER BY signal_wallet_actions.wallet_action_id)
             FILTER (WHERE signal_wallet_actions.wallet_action_id IS NOT NULL),
           ARRAY[]::text[]
         ) AS source_action_ids
       FROM signals
       INNER JOIN signal_provenance ON signal_provenance.signal_id = signals.id
       INNER JOIN cohort_snapshots ON cohort_snapshots.id = signal_provenance.cohort_snapshot_id
       LEFT JOIN signal_wallet_actions ON signal_wallet_actions.signal_id = signals.id
       LEFT JOIN wallet_actions ON wallet_actions.id = signal_wallet_actions.wallet_action_id
       GROUP BY
         signals.id,
         signal_provenance.cohort_snapshot_id,
         cohort_snapshots.version,
         cohort_snapshots.qualification_method,
         cohort_snapshots.snapshot_at,
         cohort_snapshots.snapshot_hash,
         cohort_snapshots.members,
         signal_provenance.normalization_version,
         signal_provenance.rule_version,
         signal_provenance.dataset_version,
         signal_provenance.calculation_method_version,
         signal_provenance.provenance_hash
       ORDER BY signals.window_end DESC`
    );
    return result.rows.map(mapSignal);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async ensureToken(client: PoolClient, action: WalletAction): Promise<void> {
    await client.query(
      `INSERT INTO tokens (chain_id, address)
       VALUES ($1, $2)
       ON CONFLICT (chain_id, address) DO NOTHING`,
      [action.chainId, action.tokenAddress]
    );
  }
}
