import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { wrapFetchWithPayment, x402Client } from "@okxweb3/x402-fetch";
import { toClientEvmSigner } from "@okxweb3/x402-evm";
import { registerExactEvmScheme } from "@okxweb3/x402-evm/exact/client";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xLayer } from "viem/chains";

loadDotenv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const apiUrl = process.env.X402_TEST_API_URL ?? "https://convergence-radar.onrender.com/v1/crossings";
const privateKey = process.env.BUYER_PRIVATE_KEY;
const rpcUrl = process.env.X_LAYER_RPC_URL;

if (process.env.CONFIRM_LIVE_PAYMENT !== "yes") {
  throw new Error("Set CONFIRM_LIVE_PAYMENT=yes before you run a live payment test.");
}

if (privateKey === undefined || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
  throw new Error("BUYER_PRIVATE_KEY must be a valid 32-byte private key.");
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
const publicClient = createPublicClient({
  chain: xLayer,
  transport: http(rpcUrl === undefined || rpcUrl === "" ? undefined : rpcUrl)
});
const client = new x402Client();
registerExactEvmScheme(client, {
  signer: toClientEvmSigner(account, publicClient),
  networks: ["eip155:196"]
});
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment(apiUrl);
const body = await response.text();

if (!response.ok) {
  throw new Error(`x402 payment test failed with HTTP ${response.status}: ${body}`);
}

console.log(`x402 payment test completed with HTTP ${response.status}.`);
console.log(body);
