# API Service

## Current state

The API uses fixture data. The deployed public service uses `PAYMENT_MODE=disabled`. In this mode, protected endpoints return HTTP 503 and do not return signal data.

The code also supports `demo` mode for local testing and `okx` mode for the OKX x402 flow. The project verified an unpaid HTTP 402 challenge in `okx` mode. It has not completed a funded mainnet settlement test.

Do not use fixture data or the current API for trading decisions.

## Run the service

```text
pnpm install
pnpm dev
```

The service listens on `http://localhost:3000` by default. Set `API_PORT` in `.env` to use a different port. The service uses `PORT` when a hosting provider supplies it.

Set `DATABASE_URL` in `.env` to use PostgreSQL. Run `pnpm db:migrate` before you start the API. Without `DATABASE_URL`, the service uses in-memory storage for tests and local fixtures.

Set `REDIS_URL` in `.env` to use Redis. The API uses an in-memory cache when the value is absent or Redis is unavailable. Cached successful signal responses expire after 60 seconds. The `X-Cache` response header is `MISS` for a new cache entry and `HIT` for a cached response.

## Endpoints

### `GET /health`

Returns service health. Payment is not required.

### `GET /v1/crossings`

Returns up to ten stored convergence signals after payment processing succeeds.

### `GET /v1/token?address=0x...`

Returns the newest stored signal for one token address after payment processing succeeds. The address must be a 20-byte hexadecimal address. The endpoint returns HTTP 400 for an invalid address and HTTP 404 when no signal exists.

## Payment modes

| Mode | Intended use | Protected-route behavior |
| --- | --- | --- |
| `disabled` | Public safe deployment | HTTP 503. |
| `demo` | Local testing only | HTTP 402 without `PAYMENT-SIGNATURE`. A non-empty header simulates payment. |
| `okx` | Controlled x402 use | HTTP 402 with an X Layer payment challenge. A valid signed authorization can settle a payment. |

## Response rules

- Every response includes an `X-Request-Id` header.
- The service limits one client address to 60 requests per minute.
- Audit records store the method, path, result code, duration, payment state, and time.
- Audit records do not store payment headers or credentials.
- Every current signal has `verificationStatus: "unverified"`.
