import { loadConfig } from "./config.js";
import type { WalletActivitySource } from "./data-source.js";
import { FixtureWalletActivitySource } from "./fixture-source.js";
import { IngestionService } from "./ingestion-service.js";
import { LiveWalletActivitySource } from "./live-source.js";
import { InMemoryDataRepository } from "./repository.js";
import { startIngestionSchedule } from "./scheduler.js";

const config = loadConfig();
const source: WalletActivitySource = config.dataSource === "fixture"
  ? new FixtureWalletActivitySource(new URL("../fixtures/wallet-actions.json", import.meta.url))
  : new LiveWalletActivitySource(config.onchainOsBaseUrl!, config.onchainOsApiKey!);

const service = new IngestionService(source, new InMemoryDataRepository());
startIngestionSchedule(service, config.ingestionIntervalMs);
