import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { createHandler, HttpError } from "./handler.ts";

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_ANON_KEY");
const origins = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000").split(",").map((x) =>
  x.trim()
).filter(Boolean);

// Each request gets a caller-scoped client. A service-role key is never used.
function caller(token: string) {
  if (!url || !key) throw new HttpError(503, "configuration_unavailable");
  return createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }),
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

Deno.serve(createHandler({
  allowedOrigins: new Set(origins),
  async authenticate(token) {
    const { data, error } = await caller(token).auth.getUser(token);
    if (error && (error.status === undefined || error.status >= 500)) {
      throw new HttpError(503, "auth_unavailable");
    }
    return !error && Boolean(data.user);
  },
  async loadRows(token, organization, month) {
    const { data, error } = await caller(token).rpc("payroll_export_rows", {
      p_organization_id: organization,
      p_earning_month: month,
    });
    if (error?.code === "42501") throw new HttpError(403, "forbidden");
    if (error) throw new HttpError(503, "database_unavailable");
    if (!data || !Array.isArray(data.rows)) throw new HttpError(503, "database_unavailable");
    return data.rows;
  },
}));
