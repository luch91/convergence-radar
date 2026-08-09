import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import type { WalletActivitySource } from "./data-source.js";
import { FixtureWalletActivitySource } from "./fixture-source.js";
import { IngestionService } from "./ingestion-service.js";
import { LiveWalletActivitySource } from "./live-source.js";
import { OkxClient } from "./okx-client.js";
import { InMemoryDataRepository } from "./repository.js";
import { startIngestionSchedule } from "./scheduler.js";

loadDotenv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const config = loadConfig();
const source: WalletActivitySource = config.dataSource === "fixture"
  ? new FixtureWalletActivitySource(new URL("../fixtures/wallet-actions.json", import.meta.url))
  : new LiveWalletActivitySource(new OkxClient(config.onchainOsBaseUrl!, {
    apiKey: config.okxApiKey!,
    secretKey: config.okxSecretKey!,
    passphrase: config.okxPassphrase!
  }));

const service = new IngestionService(source, new InMemoryDataRepository());
startIngestionSchedule(service, config.ingestionIntervalMs);
