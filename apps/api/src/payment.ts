import type { NextFunction, Request, RequestHandler, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      paymentState?: "absent" | "simulated";
    }
  }
}

export function requireDemoPayment(priceUsdt: string): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
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
