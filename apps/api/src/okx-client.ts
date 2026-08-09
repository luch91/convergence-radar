import { createHmac } from "node:crypto";
import { request } from "node:https";

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
    const headers = createOkxHeaders(this.credentials, "GET", requestPath);
    const envelope = await this.readGetResponse<T>(url, headers);
    if (envelope.code !== "0") {
      throw new Error(`OKX request failed: ${envelope.msg || envelope.code}.`);
    }

    return envelope.data;
  }

  private readGetResponse<T>(url: URL, headers: Headers): Promise<OkxEnvelope<T>> {
    return new Promise((resolve, reject) => {
      const requestHeaders = Object.fromEntries(headers.entries());
      const clientRequest = request(url, {
        method: "GET",
        headers: requestHeaders,
        family: 4,
        timeout: 30000
      }, (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("error", reject);
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (response.statusCode === undefined || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(this.createHttpError(response.statusCode, body)));
            return;
          }
          try {
            resolve(JSON.parse(body) as OkxEnvelope<T>);
          } catch {
            reject(new Error("OKX returned an invalid JSON response."));
          }
        });
      });
      clientRequest.on("error", reject);
      clientRequest.on("timeout", () => {
        clientRequest.destroy(new Error("OKX request timed out after 30 seconds."));
      });
      clientRequest.end();
    });
  }

  private createHttpError(statusCode: number | undefined, body: string): string {
    let message = "";
    try {
      const response = JSON.parse(body) as { code?: unknown; msg?: unknown; message?: unknown };
      const value = response.msg ?? response.message ?? response.code;
      message = typeof value === "string" ? value : "";
    } catch {
      message = body.replace(/\s+/g, " ").slice(0, 300);
    }

    const suffix = message === "" ? "" : `: ${message}`;
    return `OKX request failed with status ${statusCode ?? "unknown"}${suffix}.`;
  }
}
