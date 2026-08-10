# API Service

## Status

The API uses fixture data and a demo payment challenge. It does not settle a payment. Do not use it for production payment processing.

## Run the service

```text
pnpm install
pnpm dev
```

The service listens on `http://localhost:3000` by default. Set `API_PORT` in `.env` to use a different port.

Set `DATABASE_URL` in `.env` to use PostgreSQL. Run `pnpm db:migrate` before starting the API. Without `DATABASE_URL`, the service uses in-memory storage for tests and local fixtures.

## Endpoints

### `GET /health`

Returns service health. Payment is not required.

### `GET /v1/crossings`

Returns up to ten stored convergence signals.

Without the `PAYMENT-SIGNATURE` request header, the service returns HTTP 402 and a demo payment challenge.

### `GET /v1/token?address=0x...`

Returns the newest stored signal for one token address.

The address must be a 20-byte hexadecimal address. The endpoint returns HTTP 400 for an invalid address and HTTP 404 when no signal exists.

## Response rules

- Every response includes an `X-Request-Id` header.
- The service limits one client address to 60 requests per minute.
- Audit records store the method, path, result code, duration, payment state, and time.
- Audit records do not store payment headers or credentials.
