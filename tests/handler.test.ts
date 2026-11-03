import { createHandler, HttpError } from "../supabase/functions/payroll-export/handler.ts";
import { payrollFixture } from "../lib/fixtures.ts";
import { equal } from "./assert.ts";

const organization = "20000000-0000-0000-0000-000000000001";
const body = { organization_id: organization, earning_month: "2026-09" };
const origins = new Set(["https://evaluation.example"]);
function request(data: unknown = body, overrides: RequestInit = {}) {
  return new Request("https://evaluation.example/functions/v1/payroll-export", {
    method: "POST",
    headers: {
      Authorization: "Bearer evaluation-token",
      "Content-Type": "application/json",
      Origin: "https://evaluation.example",
    },
    body: JSON.stringify(data),
    ...overrides,
  });
}
function handler(overrides = {}) {
  return createHandler({
    authenticate: async () => true,
    loadRows: async () => payrollFixture,
    allowedOrigins: origins,
    ...overrides,
  });
}

Deno.test("authorized request produces a private CSV download with the correct filename", async () => {
  const response = await handler()(request());
  equal(response.status, 200);
  equal(response.headers.get("cache-control"), "no-store");
  equal(response.headers.get("content-disposition"), 'attachment; filename="payroll-2026-09.csv"');
  equal(response.headers.get("access-control-allow-origin"), "https://evaluation.example");
  equal((await response.text()).includes("E-101"), true);
});
Deno.test("missing and malformed bearer tokens cannot reach the database", async () => {
  let reads = 0;
  const h = handler({
    loadRows: async () => {
      reads++;
      return [];
    },
  });
  for (const authorization of ["", "Basic evaluation", "Bearer a b"]) {
    equal((await h(request(body, { headers: { authorization } }))).status, 401);
  }
  equal(reads, 0);
});
Deno.test("rejected token cannot reach the database", async () => {
  let reads = 0;
  const h = handler({
    authenticate: async () => false,
    loadRows: async () => {
      reads++;
      return [];
    },
  });
  equal((await h(request())).status, 401);
  equal(reads, 0);
});
Deno.test("database membership denial stays a 403 even for valid authentication", async () => {
  const response = await handler({
    loadRows: async () => {
      throw new HttpError(403, "forbidden");
    },
  })(request());
  equal(response.status, 403);
  equal(await response.json(), { error: "forbidden" });
});
Deno.test("the original bearer token and validated scope are forwarded to the repository", async () => {
  let received: unknown;
  await handler({
    loadRows: async (...args: unknown[]) => {
      received = args;
      return [];
    },
  })(request());
  equal(received, ["evaluation-token", organization, "2026-09"]);
});
Deno.test("a caller cannot inject a role, alternate period or unknown request fields", async () => {
  for (
    const data of [
      { ...body, role: "admin" },
      { ...body, earning_month: "2026-13" },
      { ...body, organization_id: "invalid" },
      [],
      null,
    ]
  ) {
    equal((await handler()(request(data))).status, 400);
  }
});
Deno.test("malformed JSON, content type, and oversized bodies are rejected", async () => {
  equal((await handler()(request(body, { body: "{" }))).status, 400);
  equal(
    (await handler()(request(body, { headers: { authorization: "Bearer evaluation-token" } })))
      .status,
    415,
  );
  equal((await handler()(request({ ...body, padding: "x".repeat(5000) }))).status, 413);
});
Deno.test("invalid repository data is not returned as an empty successful export", async () => {
  for (
    const data of [
      null,
      [{ ...payrollFixture[0], wage_cents: 0.1 }],
      Array(1001).fill(payrollFixture[0]),
    ]
  ) {
    equal((await handler({ loadRows: async () => data })(request())).status, 422);
  }
});
Deno.test("upstream failure returns a retryable error without leaking upstream details", async () => {
  const response = await handler({
    loadRows: async () => {
      throw new Error("private upstream detail");
    },
  })(request());
  equal(response.status, 503);
  equal(await response.json(), { error: "temporarily_unavailable" });
});
Deno.test("CORS preflight is limited to explicit origins and performs no auth or data reads", async () => {
  let calls = 0;
  const h = handler({
    authenticate: async () => {
      calls++;
      return true;
    },
  });
  const allowed = await h(
    new Request("https://evaluation.example", {
      method: "OPTIONS",
      headers: { origin: "https://evaluation.example" },
    }),
  );
  equal(allowed.status, 204);
  const denied = await h(
    new Request("https://evaluation.example", {
      method: "OPTIONS",
      headers: { origin: "https://untrusted.example" },
    }),
  );
  equal(denied.status, 403);
  equal(denied.headers.get("access-control-allow-origin"), null);
  equal(calls, 0);
});
Deno.test("unsupported HTTP methods return Allow without performing a data operation", async () => {
  const response = await handler()(new Request("https://evaluation.example", { method: "GET" }));
  equal(response.status, 405);
  equal(response.headers.get("allow"), "POST, OPTIONS");
});
