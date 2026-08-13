# Deployment

## Current deployments

| Service | URL | Current purpose |
| --- | --- | --- |
| API | `https://convergence-radar.onrender.com` | Health endpoint and protected API routes. |
| Dashboard | `https://convergence-radar-dashboard.onrender.com` | Public project dashboard. |

The API currently uses fixture data and disabled public payment processing. The dashboard shows a disabled, payment-required, or unavailable feed state when protected API data is not available.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL. |
| `DATA_SOURCE` | Use `fixture` until live ingestion is implemented. |
| `PAYMENT_MODE` | Use `disabled` for the public deployment. |
| `API_BASE_URL` | API address used by the dashboard service. |
| `PAY_TO_ADDRESS` | Public X Layer payment recipient. Required only in `okx` mode. |
| `OKX_API_KEY` | OKX API key. Required only in `okx` mode or live-source work. |
| `OKX_SECRET_KEY` | Secret key for the OKX API key. Required only in `okx` mode or live-source work. |
| `OKX_PASSPHRASE` | Passphrase for the OKX API key. Required only in `okx` mode or live-source work. |

Do not set `PORT`. Render supplies it.

## API Render configuration

| Field | Value |
| --- | --- |
| Runtime | Node |
| Node version | `22.22.2` |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @convergence-radar/api build` |
| Start command | `pnpm --filter @convergence-radar/api start` |
| Health check path | `/health` |

## Dashboard Render configuration

| Field | Value |
| --- | --- |
| Runtime | Node |
| Node version | `22.22.2` |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter @convergence-radar/web build` |
| Start command | `pnpm --filter @convergence-radar/web start` |
| Environment | `API_BASE_URL=https://convergence-radar.onrender.com` |

## Verification

Request the API `/health` endpoint. It must return HTTP 200. When payment mode is disabled, protected endpoints must return HTTP 503.

## x402 payment status

The code supports an exact 0.5 USDT0 payment on X Layer when `PAYMENT_MODE=okx`. The HTTP 402 challenge was verified. The project has not completed a funded mainnet buyer payment test.

Do not enable `okx` mode in a public service unless you intend to accept signed payment authorizations.
