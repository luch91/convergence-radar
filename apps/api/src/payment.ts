import { OKXFacilitatorClient } from "@okxweb3/x402-core";
import { ExactEvmScheme } from "@okxweb3/x402-evm/exact/server";
import { paymentMiddleware, x402ResourceServer } from "@okxweb3/x402-express";
import type { NextFunction, Request, RequestHandler, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      paymentState?: "absent" | "simulated";
    }
  }
}

export type PaymentMode = "disabled" | "demo" | "okx";

export interface OkxPaymentConfig {
  apiKey: string;
  secretKey: string;
  passphrase: string;
  payToAddress: string;
}

export function requirePayment(
  paymentMode: PaymentMode,
  priceUsdt: string,
  okxConfig?: OkxPaymentConfig
): RequestHandler {
  if (paymentMode === "okx") {
    if (okxConfig === undefined) {
      throw new Error("OKX payment mode requires payment configuration.");
    }

    const facilitator = new OKXFacilitatorClient({
      apiKey: okxConfig.apiKey,
      secretKey: okxConfig.secretKey,
      passphrase: okxConfig.passphrase,
      syncSettle: true
    });
    void facilitator.getSupported().then((supported) => {
      const capabilities = supported.kinds
        .map((kind) => `${kind.x402Version}:${kind.scheme}:${kind.network}`)
        .join(", ");
      console.info(`OKX x402 supported payment capabilities: ${capabilities}`);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`OKX x402 capability check failed: ${message}`);
    });
    const resourceServer = new x402ResourceServer(facilitator)
      .register("eip155:196", new ExactEvmScheme());

    return paymentMiddleware({
      "GET /v1/crossings": {
        accepts: {
          scheme: "exact",
          network: "eip155:196",
          payTo: okxConfig.payToAddress,
          price: `$${priceUsdt}`,
          maxTimeoutSeconds: 60
        },
        description: "Access active convergence signals.",
        mimeType: "application/json"
      },
      "GET /v1/token": {
        accepts: {
          scheme: "exact",
          network: "eip155:196",
          payTo: okxConfig.payToAddress,
          price: `$${priceUsdt}`,
          maxTimeoutSeconds: 60
        },
        description: "Access a token convergence signal.",
        mimeType: "application/json"
      }
    }, resourceServer, undefined, undefined, true);
  }

  return (request: Request, response: Response, next: NextFunction): void => {
    if (paymentMode === "disabled") {
      request.paymentState = "absent";
      response.status(503).json({
        error: {
          code: "payment_not_configured",
          message: "Payment verification is not configured for this service."
        }
      });
      return;
    }

    const signature = request.header("payment-signature");
    if (signature === undefined || signature.trim() === "") {
      request.paymentState = "absent";
      response.status(402).json({
        error: {
          code: "payment_required",
          message: "Payment authorization is required for this request."
        },
        payment: {
          mode: "demo",
          amount: priceUsdt,
          currency: "USDT",
          header: "PAYMENT-SIGNATURE"
        }
      });
      return;
    }

    request.paymentState = "simulated";
    next();
  };
}
