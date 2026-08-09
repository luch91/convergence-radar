import { createHmac } from "node:crypto";

export interface OkxCredentials {
  apiKey: string;
  secretKey: string;
  passphrase: string;
}

interface OkxEnvelope<T> {
  code: string;
  msg: string;
  data: T;
}

export function createOkxHeaders(
  credentials: OkxCredentials,
  method: "GET" | "POST",
  requestPath: string,
  body = "",
  timestamp = new Date().toISOString()
): Headers {
  const prehash = `${timestamp}${method}${requestPath}${body}`;
  const signature = createHmac("sha256", credentials.secretKey).update(prehash).digest("base64");

  return new Headers({
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": credentials.apiKey,
    "OK-ACCESS-PASSPHRASE": credentials.passphrase,
    "OK-ACCESS-SIGN": signature,
    "OK-ACCESS-TIMESTAMP": timestamp
  });
}

export class OkxClient {
  private readonly baseUrl: URL;

  constructor(
    baseUrl: string,
    private readonly credentials: OkxCredentials
  ) {
    this.baseUrl = new URL(baseUrl);
  }

  async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
    const requestPath = `${url.pathname}${url.search}`;
    const response = await fetch(url, {
      method: "GET",
      headers: createOkxHeaders(this.credentials, "GET", requestPath)
    });
    if (!response.ok) {
      throw new Error(`OKX request failed with status ${response.status}.`);
    }

    const envelope = (await response.json()) as OkxEnvelope<T>;
    if (envelope.code !== "0") {
      throw new Error(`OKX request failed: ${envelope.msg || envelope.code}.`);
    }

    return envelope.data;
  }
}
