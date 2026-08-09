import { describe, expect, it } from "vitest";
import { createOkxHeaders } from "./okx-client.js";

describe("createOkxHeaders", () => {
  it("creates the documented signed headers", () => {
    const headers = createOkxHeaders(
      { apiKey: "api-key", secretKey: "secret-key", passphrase: "passphrase" },
      "GET",
      "/api/v6/dex/balance/supported/chain",
      "",
      "2026-08-09T00:00:00.000Z"
    );

    expect(headers.get("OK-ACCESS-KEY")).toBe("api-key");
    expect(headers.get("OK-ACCESS-PASSPHRASE")).toBe("passphrase");
    expect(headers.get("OK-ACCESS-TIMESTAMP")).toBe("2026-08-09T00:00:00.000Z");
    expect(headers.get("OK-ACCESS-SIGN")).toBe("4Y2DuPOM4QF2RrIm2J9EQB2Q6MYE5vd/ONR+uSVvfvk=");
  });
});
