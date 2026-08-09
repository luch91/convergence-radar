CREATE TABLE tokens (
  chain_id INTEGER NOT NULL,
  address CHAR(42) NOT NULL,
  symbol TEXT,
  name TEXT,
  decimals SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chain_id, address)
);

CREATE TABLE wallet_actions (
  id TEXT PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  token_address CHAR(42) NOT NULL,
  wallet_address CHAR(42) NOT NULL,
  wallet_tag TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('buy', 'sell')),
  occurred_at TIMESTAMPTZ NOT NULL,
  transaction_hash CHAR(66) NOT NULL,
  log_index INTEGER NOT NULL CHECK (log_index >= 0),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (transaction_hash, log_index),
  FOREIGN KEY (chain_id, token_address) REFERENCES tokens (chain_id, address)
);

CREATE INDEX wallet_actions_token_time_index
  ON wallet_actions (chain_id, token_address, occurred_at DESC);

CREATE INDEX wallet_actions_wallet_time_index
  ON wallet_actions (wallet_address, occurred_at DESC);

CREATE TABLE signals (
  id CHAR(64) PRIMARY KEY,
  chain_id INTEGER NOT NULL,
  token_address CHAR(42) NOT NULL,
  buyer_count INTEGER NOT NULL CHECK (buyer_count >= 4),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (chain_id, token_address) REFERENCES tokens (chain_id, address)
);

CREATE TABLE signal_wallet_actions (
  signal_id CHAR(64) NOT NULL REFERENCES signals (id) ON DELETE CASCADE,
  wallet_action_id TEXT NOT NULL REFERENCES wallet_actions (id),
  PRIMARY KEY (signal_id, wallet_action_id)
);

CREATE TABLE performance_metrics (
  signal_id CHAR(64) PRIMARY KEY REFERENCES signals (id) ON DELETE CASCADE,
  entry_price NUMERIC,
  peak_price NUMERIC,
  price_after_24h NUMERIC,
  maximum_drawdown_percent NUMERIC,
  measured_at TIMESTAMPTZ,
  calculation_version TEXT NOT NULL
);
