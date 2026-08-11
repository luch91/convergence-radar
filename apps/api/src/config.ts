import type { OkxPaymentConfig, PaymentMode } from "./payment.js";

export interface AppConfig {
  dataSource: "fixture" | "live";
  ingestionIntervalMs: number;
  apiPort: number;
  databaseUrl?: string;
  redisUrl?: string;
  paymentMode: PaymentMode;
  okxPaymentConfig?: OkxPaymentConfig;
  okxApiKey?: string;
  okxSecretKey?: string;
  okxPassphrase?: string;
  onchainOsBaseUrl?: string;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("INGESTION_INTERVAL_MS must be a positive integer.");
  }

  return parsed;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const dataSource = environment.DATA_SOURCE ?? "fixture";
  if (dataSource !== "fixture" && dataSource !== "live") {
    throw new Error("DATA_SOURCE must be fixture or live.");
  }

  const paymentMode = environment.PAYMENT_MODE ?? "disabled";
  if (paymentMode !== "disabled" && paymentMode !== "demo" && paymentMode !== "okx") {
    throw new Error("PAYMENT_MODE must be disabled, demo, or okx.");
  }

  const config: AppConfig = {
    dataSource,
    ingestionIntervalMs: readPositiveInteger(environment.INGESTION_INTERVAL_MS, 300000),
    apiPort: readPositiveInteger(environment.PORT ?? environment.API_PORT, 3000),
    paymentMode,
    ...(environment.DATABASE_URL === undefined || environment.DATABASE_URL === ""
      ? {}
      : { databaseUrl: environment.DATABASE_URL }),
    ...(environment.REDIS_URL === undefined || environment.REDIS_URL === ""
      ? {}
      : { redisUrl: environment.REDIS_URL })
  };

  if (dataSource === "live" || paymentMode === "okx") {
    if (
      !environment.OKX_API_KEY ||
      !environment.OKX_SECRET_KEY ||
      !environment.OKX_PASSPHRASE ||
      (dataSource === "live" && !environment.OKX_ONCHAINOS_BASE_URL)
    ) {
      throw new Error("OKX configuration requires API credentials and an OnchainOS base URL for live data.");
    }

    if (paymentMode === "okx") {
      const payToAddress = environment.PAY_TO_ADDRESS;
      if (payToAddress === undefined || !/^0x[a-fA-F0-9]{40}$/.test(payToAddress)) {
        throw new Error("OKX payment mode requires a valid PAY_TO_ADDRESS.");
      }

      config.okxPaymentConfig = {
        apiKey: environment.OKX_API_KEY,
        secretKey: environment.OKX_SECRET_KEY,
        passphrase: environment.OKX_PASSPHRASE,
        payToAddress
      };
    }

    if (dataSource === "live") {
      return {
        ...config,
        okxApiKey: environment.OKX_API_KEY,
        okxSecretKey: environment.OKX_SECRET_KEY,
        okxPassphrase: environment.OKX_PASSPHRASE,
        onchainOsBaseUrl: environment.OKX_ONCHAINOS_BASE_URL!
      };
    }
  }

  return config;
}
