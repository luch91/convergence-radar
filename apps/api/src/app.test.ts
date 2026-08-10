import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApi } from "./app.js";
import { InMemoryAuditSink } from "./audit.js";
import type { ConvergenceSignal } from "./domain.js";
import { InMemoryDataRepository } from "./repository.js";

const servers: Server[] = [];

async function request(app: ReturnType<typeof createApi>, path: string, headers: Record<string, string> = {}) {
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Test server did not provide a network address.");
  }
  return fetch(`http://127.0.0.1:${address.port}${path}`, { headers });
}

afterEach(async () => {
  const closingServers = servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error === undefined ? resolve() : reject(error));
  }));
  await Promise.all(closingServers);
});

function saveSignal(repository: InMemoryDataRepository): void {
  const signal: ConvergenceSignal = {
    id: "a".repeat(64),
    chainId: 196,
    tokenAddress: "0x1111111111111111111111111111111111111111",
    buyerAddresses: [
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "0xcccccccccccccccccccccccccccccccccccccccc",
      "0xdddddddddddddddddddddddddddddddddddddddd"
    ],
    buyerCount: 4,
    windowStart: new Date("2026-08-09T00:00:00.000Z"),
    windowEnd: new Date("2026-08-09T01:00:00.000Z"),
    createdAt: new Date("2026-08-09T01:00:00.000Z"),
    sourceActionIds: ["one", "two", "three", "four"],
    verificationStatus: "unverified"
  };
  repository.saveSignals([signal]);
}

describe("API service", () => {
  it("returns a payment challenge for an unpaid request", async () => {
    const repository = new InMemoryDataRepository();
    const response = await request(createApi({ repository, auditSink: new InMemoryAuditSink() }), "/v1/crossings");

    expect(response.status).toBe(402);
    expect(await response.json()).toMatchObject({
      error: { code: "payment_required" },
      payment: { mode: "demo", amount: "0.5", currency: "USDT" }
    });
  });

  it("returns a simulated paid token result", async () => {
    const repository = new InMemoryDataRepository();
    saveSignal(repository);
    const response = await request(
      createApi({ repository, auditSink: new InMemoryAuditSink() }),
      "/v1/token?address=0x1111111111111111111111111111111111111111",
      { "payment-signature": "demo-authorization" }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      paymentStatus: "simulated",
      data: { convergenceCount: 4, verificationStatus: "unverified" }
    });
  });

  it("rejects an invalid token address after payment", async () => {
    const response = await request(
      createApi({ repository: new InMemoryDataRepository(), auditSink: new InMemoryAuditSink() }),
      "/v1/token?address=invalid",
      { "payment-signature": "demo-authorization" }
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "invalid_token_address" } });
  });
});
