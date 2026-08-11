import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { createApi } from "./app.js";
import { InMemoryAuditSink } from "./audit.js";
import { createCacheStore } from "./cache.js";
import { loadConfig } from "./config.js";
import type { WalletActivitySource } from "./data-source.js";
import { FixtureWalletActivitySource } from "./fixture-source.js";
import { IngestionService } from "./ingestion-service.js";
import { LiveWalletActivitySource } from "./live-source.js";
import { OkxClient } from "./okx-client.js";
import { createOkxPaymentMiddleware } from "./payment.js";
import { InMemoryDataRepository, PostgresDataRepository } from "./repository.js";
import { startIngestionSchedule } from "./scheduler.js";

loadDotenv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const config = loadConfig();
const source: WalletActivitySource = config.dataSource === "fixture"
  ? new FixtureWalletActivitySource(new URL("../src/fixtures/wallet-actions.json", import.meta.url))
  : new LiveWalletActivitySource(new OkxClient(config.onchainOsBaseUrl!, {
    apiKey: config.okxApiKey!,
    secretKey: config.okxSecretKey!,
    passphrase: config.okxPassphrase!
  }));

const repository = config.databaseUrl === undefined
  ? new InMemoryDataRepository()
  : new PostgresDataRepository(config.databaseUrl);
const service = new IngestionService(source, repository);
await service.run();
startIngestionSchedule(service, config.ingestionIntervalMs, false);

const cache = await createCacheStore(config.redisUrl);
const paymentMiddleware = config.paymentMode === "okx"
  ? await createOkxPaymentMiddleware(config.okxPaymentConfig!, "0.5")
  : undefined;
const api = createApi({
  repository,
  auditSink: new InMemoryAuditSink(),
  cache,
  paymentMode: config.paymentMode,
  ...(paymentMiddleware === undefined ? {} : { paymentMiddleware })
});
api.listen(config.apiPort, "0.0.0.0", () => {
  console.log(`API service listening on port ${config.apiPort}.`);
});
