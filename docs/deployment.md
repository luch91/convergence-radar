# Deployment

## Status

The API can be deployed as a public web service for health checks and deployment validation. Protected endpoints must remain disabled until real x402 payment verification is enabled.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL. |
| `DATA_SOURCE` | Set to `fixture` until live data access is approved. |
| `PAYMENT_MODE` | Set to `disabled` before real payment verification is ready. |
| `PAY_TO_ADDRESS` | Public X Layer address that receives x402 payments. Required only when payment mode is `okx`. |
| `OKX_API_KEY` | OKX API key for payment verification and settlement. Required only when payment mode is `okx`. |
| `OKX_SECRET_KEY` | Secret key for the OKX API key. Required only when payment mode is `okx`. |
| `OKX_PASSPHRASE` | Passphrase for the OKX API key. Required only when payment mode is `okx`. |

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

## x402 activation

The service uses the official OKX x402 Express SDK. It protects `GET /v1/crossings` and `GET /v1/token` with an exact payment of 0.5 USDT0 on X Layer.

Keep `PAYMENT_MODE=disabled` until the application code is deployed and a controlled buyer test is planned. To enable payment settlement, set `PAYMENT_MODE=okx` in Render and deploy the current release. This change can settle valid buyer authorizations. Verify the recipient address before you enable it.

## Controlled payment test

Use a separate buyer wallet. Fund it with at least 0.5 USDT0 on X Layer. Do not use the recipient wallet as the buyer wallet.

Set `BUYER_PRIVATE_KEY` and `CONFIRM_LIVE_PAYMENT=yes` in the local `.env` file. Do not commit this file or send the private key to another person. Run `pnpm --filter @convergence-radar/api test:x402` from the repository root. The command sends one live payment of 0.5 USDT0 to the configured recipient.
