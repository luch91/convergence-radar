# Database

## Connection

Set `DATABASE_URL` in `.env`. Use a PostgreSQL connection URL with SSL enabled when the provider requires it.

The application uses PostgreSQL automatically when `DATABASE_URL` is set. It uses in-memory storage when the value is absent.

## Migrations

Run this command before starting the API:

```text
pnpm db:migrate
```

The command records each completed migration in `schema_migrations`. It does not repeat an applied migration.

## Stored data

- `tokens` stores token identifiers and metadata.
- `wallet_actions` stores normalized wallet activity.
- `signals` stores detected convergence results.
- `signal_wallet_actions` links a signal to its source actions.
- `cohort_snapshots` stores immutable point-in-time wallet membership and qualification data.
- `signal_provenance` links a signal to its cohort snapshot, method versions, and provenance hash.
- `performance_metrics` reserves storage for measured price outcomes. The application does not calculate or publish these outcomes yet.

Migration `002_add_signal_provenance` adds the cohort and provenance tables. The migration runner applies ordered SQL migration files once and records each applied name in `schema_migrations`.

## Local safety

Do not commit `.env`. Do not display the connection URL in logs, tests, issue reports, or screenshots.
