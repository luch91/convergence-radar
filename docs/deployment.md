# Deployment

## Status

The API can be deployed as a public web service for health checks and deployment validation. Protected endpoints must remain disabled until real x402 payment verification is enabled.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL. |
| `DATA_SOURCE` | Set to `fixture` until live data access is approved. |
| `PAYMENT_MODE` | Set to `disabled` before real payment verification is ready. |

Do not set `PORT`. The hosting provider supplies it.

## Render configuration

| Field | Value |
| --- | --- |
| Runtime | Node |
| Node version | `22.22.2` |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm --filter @convergence-radar/api start` |
| Health check path | `/health` |

## Deployment verification

Request the public `/health` endpoint. It must return HTTP 200. Confirm that a protected endpoint returns HTTP 503 while payment mode is disabled.
