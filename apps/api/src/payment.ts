import type { NextFunction, Request, RequestHandler, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      paymentState?: "absent" | "simulated";
    }
  }
}

export type PaymentMode = "disabled" | "demo";

export function requirePayment(paymentMode: PaymentMode, priceUsdt: string): RequestHandler {
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
