import { randomUUID } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import type { AuditSink } from "./audit.js";
import { requireDemoPayment } from "./payment.js";
import { createRateLimit } from "./rate-limit.js";
import type { DataRepository } from "./repository.js";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export interface ApiDependencies {
  repository: DataRepository;
  auditSink: AuditSink;
  now?: () => Date;
}

async function latestSignalForAddress(repository: DataRepository, address: string) {
  return (await repository.listSignals())
    .filter((signal) => signal.tokenAddress === address)
    .sort((left, right) => right.windowEnd.getTime() - left.windowEnd.getTime())[0];
}

export function createApi(dependencies: ApiDependencies) {
  const app = express();
  const now = dependencies.now ?? (() => new Date());

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use(createRateLimit(60, 60_000));
  app.use((request: Request, response: Response, next: NextFunction): void => {
    const requestId = request.header("x-request-id") ?? randomUUID();
    const startedAt = Date.now();
    response.setHeader("X-Request-Id", requestId);
    response.on("finish", () => {
      dependencies.auditSink.write({
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
        paymentState: request.paymentState ?? "not_applicable",
        occurredAt: now()
      });
    });
    next();
  });

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/v1/crossings", requireDemoPayment("0.5"), async (_request, response) => {
    const signals = (await dependencies.repository.listSignals())
      .sort((left, right) => right.windowEnd.getTime() - left.windowEnd.getTime())
      .slice(0, 10)
      .map((signal) => ({
        token: signal.tokenAddress,
        chainId: signal.chainId,
        buyerCount: signal.buyerCount,
        windowStart: signal.windowStart.toISOString(),
        windowEnd: signal.windowEnd.toISOString(),
        verificationStatus: signal.verificationStatus
      }));
    response.status(200).json({
      paymentStatus: "simulated",
      source: "fixture",
      data: signals
    });
  });

  app.get("/v1/token", requireDemoPayment("0.5"), async (request, response) => {
    const address = request.query.address;
    if (typeof address !== "string" || !ADDRESS_PATTERN.test(address)) {
      response.status(400).json({
        error: {
          code: "invalid_token_address",
          message: "address must be a 20-byte hexadecimal address."
        }
      });
      return;
    }

    const signal = await latestSignalForAddress(dependencies.repository, address.toLowerCase());
    if (signal === undefined) {
      response.status(404).json({
        error: {
          code: "signal_not_found",
          message: "No active convergence signal exists for this token."
        }
      });
      return;
    }

    response.status(200).json({
      paymentStatus: "simulated",
      source: "fixture",
      data: {
        token: signal.tokenAddress,
        chainId: signal.chainId,
        convergenceCount: signal.buyerCount,
        firstBuy: signal.windowStart.toISOString(),
        buyers: signal.buyerAddresses,
        verificationStatus: signal.verificationStatus
      }
    });
  });

  app.use((_request, response) => {
    response.status(404).json({
      error: {
        code: "not_found",
        message: "The requested endpoint does not exist."
      }
    });
  });

  return app;
}
