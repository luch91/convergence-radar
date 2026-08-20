CREATE TABLE cohort_snapshots (
  id CHAR(64) PRIMARY KEY,
  version TEXT NOT NULL,
  qualification_method TEXT NOT NULL,
  snapshot_at TIMESTAMPTZ NOT NULL,
  snapshot_hash CHAR(64) NOT NULL UNIQUE,
  members JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE signal_provenance (
  signal_id CHAR(64) PRIMARY KEY REFERENCES signals (id) ON DELETE RESTRICT,
  cohort_snapshot_id CHAR(64) NOT NULL REFERENCES cohort_snapshots (id) ON DELETE RESTRICT,
  normalization_version TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  calculation_method_version TEXT NOT NULL,
  provenance_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX signal_provenance_cohort_index
  ON signal_provenance (cohort_snapshot_id);
