export interface AppConfig {
  dataSource: "fixture" | "live";
  ingestionIntervalMs: number;
  apiPort: number;
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

  const config: AppConfig = {
    dataSource,
    ingestionIntervalMs: readPositiveInteger(environment.INGESTION_INTERVAL_MS, 300000),
    apiPort: readPositiveInteger(environment.API_PORT, 3000)
  };

  if (dataSource === "live") {
    if (
      !environment.OKX_API_KEY ||
      !environment.OKX_SECRET_KEY ||
      !environment.OKX_PASSPHRASE ||
      !environment.OKX_ONCHAINOS_BASE_URL
    ) {
      throw new Error("Live data requires OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, and OKX_ONCHAINOS_BASE_URL.");
    }

    return {
      ...config,
      okxApiKey: environment.OKX_API_KEY,
      okxSecretKey: environment.OKX_SECRET_KEY,
      okxPassphrase: environment.OKX_PASSPHRASE,
      onchainOsBaseUrl: environment.OKX_ONCHAINOS_BASE_URL
    };
  }

  return config;
}
