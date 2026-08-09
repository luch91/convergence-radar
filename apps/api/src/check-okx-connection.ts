import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config.js";
import { OkxClient } from "./okx-client.js";

loadDotenv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const config = loadConfig({ ...process.env, DATA_SOURCE: "live" });
const client = new OkxClient(config.onchainOsBaseUrl!, {
  apiKey: config.okxApiKey!,
  secretKey: config.okxSecretKey!,
  passphrase: config.okxPassphrase!
});

try {
  const chains = await client.get<Array<{ chainIndex: string }>>("/api/v6/dex/balance/supported/chain");
  console.log(`OKX connection verified. Received ${chains.length} supported chains.`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown connection error.";
  const cause = error instanceof Error ? error.cause : undefined;
  const causeMessage = cause instanceof Error ? cause.message : "";
  const causeCode = typeof cause === "object" && cause !== null && "code" in cause
    ? String(cause.code)
    : "";
  const detail = [message, causeCode, causeMessage].filter(Boolean).join(" | ");
  console.error(`OKX connection check failed: ${detail}`);
  process.exitCode = 1;
}
