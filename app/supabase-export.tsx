"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";

type Props = { onDownload(csv: string, name: string): void };
// Created only on explicit sign-in; the hosted demo has no Supabase configuration.
function evaluationClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Configure an empty evaluation project in .env.local, then rebuild. See docs/running.md.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function SupabaseExport({ onDownload }: Props) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [month, setMonth] = useState("2026-09");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = evaluationClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Sign-in failed. Check your evaluation account.");
      setPassword("");
      setClient(supabase);
      setMessage(
        "Signed in. Organization membership and permissions will be checked by the database.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in unavailable.");
    } finally {
      setBusy(false);
    }
  }

  async function exportLive(event: React.FormEvent) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await client.functions.invoke("payroll-export", {
        body: { organization_id: organization, earning_month: month },
      });
      if (error) {
        throw new Error(
          "Export denied or unavailable. Check membership, Edge Function configuration and the response status in your developer tools.",
        );
      }
      // Supabase returns a Blob for CSV content types, rather than JSON.
      const csv = data instanceof Blob ? await data.text() : typeof data === "string" ? data : null;
      if (csv === null) throw new Error("Unexpected export response.");
      onDownload(csv, `payroll-${month}.csv`);
      setMessage("Evaluation export downloaded from Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Optional live evaluation</h2>
          <p>
            The public fixture demo needs no account. This adapter uses your own separately
            configured evaluation project.
          </p>
        </div>
        <span className="tag">OPT-IN</span>
      </div>
      <div className="connection-content">
        {!client
          ? (
            <form onSubmit={signIn} className="connection-form">
              <label>
                Evaluation email<input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Password<input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <button className="primary-button" disabled={busy}>
                {busy ? "Signing in…" : "Sign in to evaluation project"}
              </button>
            </form>
          )
          : (
            <form onSubmit={exportLive} className="connection-form">
              <label>
                Organization UUID<input
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  pattern="[0-9a-fA-F-]{36}"
                  required
                />
              </label>
              <label>
                Earning month<input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </label>
              <button className="primary-button" disabled={busy}>
                {busy ? "Exporting…" : "Export via Edge Function"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={async () => {
                  await client.auth.signOut({ scope: "local" });
                  setClient(null);
                  setMessage("Signed out.");
                }}
              >
                Sign out
              </button>
            </form>
          )}
        <p role="status" className="connection-message">{message}</p>
        <p className="muted">
          Sessions stay in memory. The role preview elsewhere on this page cannot grant database
          access.
        </p>
      </div>
    </section>
  );
}
