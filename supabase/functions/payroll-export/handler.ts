import { buildPayrollCsv, validMonth } from "../_shared/payroll.ts";

export class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export interface Dependencies {
  authenticate(token: string): Promise<boolean>;
  // The database RPC checks current organization membership and payroll role.
  loadRows(token: string, organization: string, month: string): Promise<unknown>;
  allowedOrigins: ReadonlySet<string>;
}

async function readJson(request: Request): Promise<unknown> {
  if (!request.body) throw new HttpError(400, "invalid_json");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        throw new HttpError(413, "body_too_large");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

export function createHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff",
    });
    const fail = (status: number, code: string) =>
      Response.json({ error: code }, { status, headers });
    if (origin && !deps.allowedOrigins.has(origin)) return fail(403, "origin_not_allowed");
    if (origin) headers.set("Access-Control-Allow-Origin", origin);
    headers.set(
      "Access-Control-Allow-Headers",
      "authorization, apikey, content-type, x-client-info",
    );
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") {
      headers.set("Allow", "POST, OPTIONS");
      return fail(405, "method_not_allowed");
    }
    const authorization = request.headers.get("authorization");
    if (!authorization || !/^Bearer \S+$/i.test(authorization)) return fail(401, "unauthorized");
    try {
      const token = authorization.slice(7);
      if (!(await deps.authenticate(token))) return fail(401, "unauthorized");
      if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
        return fail(415, "json_required");
      }
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return fail(400, "invalid_request");
      }
      const input = body as Record<string, unknown>;
      if (
        Object.keys(input).some((key) => !["organization_id", "earning_month"].includes(key)) ||
        typeof input.organization_id !== "string" ||
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.organization_id) ||
        !validMonth(input.earning_month)
      ) return fail(400, "invalid_request");
      const rows = await deps.loadRows(token, input.organization_id, input.earning_month);
      let csv: string;
      try {
        csv = buildPayrollCsv(rows, input.earning_month);
      } catch {
        return fail(422, "invalid_export_data");
      }
      headers.set("Content-Type", "text/csv; charset=utf-8");
      headers.set(
        "Content-Disposition",
        `attachment; filename="payroll-${input.earning_month}.csv"`,
      );
      headers.set("Access-Control-Expose-Headers", "Content-Disposition");
      return new Response(csv, { status: 200, headers });
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.code);
      // No raw upstream messages, tokens, employee data, or amounts in responses/logs.
      return fail(503, "temporarily_unavailable");
    }
  };
}
