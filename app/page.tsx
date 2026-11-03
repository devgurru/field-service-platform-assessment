"use client";

import { useState } from "react";
import { buildPayrollCsv, euro } from "../supabase/functions/_shared/payroll";
import {
  canExportPayroll,
  fixtureMonth,
  moduleEstimates,
  payrollFixture,
  type Role,
  roles,
} from "../lib/fixtures";
import { SupabaseExport } from "./supabase-export";

const repo = "https://github.com/devgurru/field-service-platform-assessment";
const labels: Record<Role, string> = {
  payroll: "Payroll officer",
  admin: "Administrator",
  dispatcher: "Dispatcher",
  technician: "Technician",
};

function download(content: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Page() {
  const [role, setRole] = useState<Role>("payroll");
  const [tab, setTab] = useState<"payroll" | "assessment" | "connect">("payroll");
  const [status, setStatus] = useState("");
  const allowed = canExportPayroll(role);
  const visible = payrollFixture.filter((row) => row.earning_month === fixtureMonth);

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">f.</span> fieldnotes
        </a>
        <div className="workspace">
          <span className="workspace-icon">FS</span>
          <div>
            Field service platform<small>Technical assessment</small>
          </div>
          <span className="muted">⌄</span>
        </div>
        <p className="nav-label">EVALUATION WORKSPACE</p>
        <nav aria-label="Assessment navigation">
          <button
            className={tab === "payroll" ? "nav-item selected" : "nav-item"}
            onClick={() => {
              setTab("payroll");
              setStatus("");
            }}
          >
            <span aria-hidden="true">▤</span> Payroll export <span className="nav-count">01</span>
          </button>
          <button
            className={tab === "assessment" ? "nav-item selected" : "nav-item"}
            onClick={() => setTab("assessment")}
          >
            <span aria-hidden="true">◫</span> Delivery assessment
          </button>
          <button
            className={tab === "connect" ? "nav-item selected" : "nav-item"}
            onClick={() => setTab("connect")}
          >
            <span aria-hidden="true">⌁</span> Supabase connection
          </button>
        </nav>
        <div className="sidebar-note">
          <span className="small-dot" /> Original evaluation sample<p>
            React + Next.js + Supabase.<br />All records are synthetic.
          </p>
          <a href={repo} target="_blank" rel="noreferrer">Review the source ↗</a>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">DG</span>
          <div>
            devgurru<small>Engineering assessment</small>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            Workspace <span>/</span>{" "}
            <strong>
              {tab === "payroll"
                ? "Payroll export"
                : tab === "assessment"
                ? "Delivery assessment"
                : "Supabase connection"}
            </strong>
          </div>
          <span className="pill">Synthetic demo</span>
        </header>
        <div className="content">
          <div className="eyebrow">
            REACT / NEXT.JS + SUPABASE <span>•</span> EVALUATION 01
          </div>
          <div className="page-heading">
            <div>
              <h1>
                {tab === "payroll"
                  ? "Every line, accounted for."
                  : tab === "assessment"
                  ? "One platform. Clear boundaries."
                  : "From fixture to database."}
              </h1>
              <p>
                {tab === "payroll"
                  ? "A reproducible payroll export, with permissions checked at the database."
                  : tab === "assessment"
                  ? "A proposed delivery approach for a modular field-service business platform."
                  : "Use your own empty evaluation project to exercise the real Edge Function."}
              </p>
            </div>
            <a
              className="text-link"
              href={`${repo}/blob/main/docs/assessment.md`}
              target="_blank"
              rel="noreferrer"
            >
              Read assessment ↗
            </a>
          </div>
          {tab === "payroll" && (
            <>
              <div className="callout">
                <span className="callout-icon">i</span>
                <div>
                  <strong>Made for review. Built from scratch.</strong>
                  <p>
                    This is an original sample with invented records and an illustrative CSV format.
                    The role switch previews UI behavior; live authorization is enforced by Supabase
                    RLS and the export RPC.
                  </p>
                </div>
              </div>
              <section className="stats" aria-label="Export overview">
                <div className="stat">
                  <p>REFERENCE PERIOD</p>
                  <strong>September 2026</strong>
                  <small>Earning month, independent of booking month</small>
                </div>
                <div className="stat">
                  <p>INCLUDED RECORDS</p>
                  <strong>
                    03 <span>of 05 in period</span>
                  </strong>
                  <small>Approved employees and mini-jobs</small>
                </div>
                <div className="stat">
                  <p>ACCEPTANCE METHOD</p>
                  <strong>
                    <span className="small-dot" /> Exact file match
                  </strong>
                  <small>Golden CSV fixture · UTF-8 · CRLF</small>
                </div>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Payroll export review</h2>
                    <p>Approved source amounts stay intact. Exclusions stay visible.</p>
                  </div>
                  <span className="tag">MODULE 01</span>
                </div>
                <div className="toolbar">
                  <label className="role-label" htmlFor="role">
                    Preview as<select
                      id="role"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value as Role);
                        setStatus("");
                      }}
                    >
                      {roles.map((r) => <option key={r} value={r}>{labels[r]}</option>)}
                    </select>
                  </label>
                  <button
                    className="primary-button"
                    disabled={!allowed}
                    onClick={() => {
                      download(
                        buildPayrollCsv(payrollFixture, fixtureMonth),
                        "payroll-2026-09.csv",
                      );
                      setStatus(
                        "Synthetic CSV downloaded. The automated test compares these bytes with the reference fixture.",
                      );
                    }}
                  >
                    ↓ Download fixture CSV
                  </button>
                </div>
                {allowed
                  ? (
                    <div className="table-wrap">
                      <table>
                        <caption className="sr-only">
                          Synthetic payroll review for September 2026
                        </caption>
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Type</th>
                            <th>Wage</th>
                            <th>Compensation</th>
                            <th>Deduction</th>
                            <th>Bonus</th>
                            <th>Booking</th>
                            <th>Export</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((row) => (
                            <tr
                              key={row.employee_no}
                              className={row.employment_type === "subcontractor" ||
                                  row.approval_state !== "approved"
                                ? "excluded-row"
                                : ""}
                            >
                              <td className="employee-cell">
                                <span className="employee-avatar">
                                  {row.employee_no.startsWith("C")
                                    ? "C"
                                    : row.employee_no.slice(-2)}
                                </span>
                                {row.employee_no}
                              </td>
                              <td>
                                {row.employment_type === "mini_job"
                                  ? "Mini-job"
                                  : row.employment_type === "subcontractor"
                                  ? "Subcontractor"
                                  : "Employee"}
                              </td>
                              <td>{euro(row.wage_cents)}</td>
                              <td>{euro(row.compensation_cents)}</td>
                              <td className={row.net_deduction_cents ? "negative" : ""}>
                                {euro(-row.net_deduction_cents)}
                              </td>
                              <td className={row.bonus_cents < 0 ? "negative" : ""}>
                                {euro(row.bonus_cents)}
                              </td>
                              <td>{row.booking_month}</td>
                              <td>
                                <span
                                  className={row.employment_type === "subcontractor" ||
                                      row.approval_state !== "approved"
                                    ? "status-badge excluded"
                                    : "status-badge included"}
                                >
                                  {row.employment_type === "subcontractor"
                                    ? "Separate AP"
                                    : row.approval_state === "approved"
                                    ? "Included"
                                    : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                  : (
                    <div className="denied" role="status">
                      <span aria-hidden="true">⊘</span>
                      <h3>Payroll access is restricted</h3>
                      <p>
                        {labels[role]}{" "}
                        can’t view or export payroll. The database tests verify this denial
                        independently of the UI.
                      </p>
                    </div>
                  )}
                <div className="table-footer">
                  <span>All amounts in EUR · invented data</span>
                  <span>Prior-month record excluded before export</span>
                </div>
              </section>
              <p className="download-status" role="status">{status}</p>
              <div className="two-columns">
                <section className="info-panel">
                  <span className="section-number">01 / BUSINESS LOGIC</span>
                  <h3>Small rules. Explicit tests.</h3>
                  <ul>
                    <li>Negative bonuses keep their sign.</li>
                    <li>Deductions export as negative values.</li>
                    <li>Booking month is never inferred from the clock.</li>
                    <li>Subcontractors and pending rows are excluded.</li>
                  </ul>
                  <a
                    href={`${repo}/blob/main/tests/payroll.test.ts`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inspect the fixture tests ↗
                  </a>
                </section>
                <section className="info-panel">
                  <span className="section-number">02 / AUTHORIZATION</span>
                  <h3>Permissions below the UI.</h3>
                  <ul>
                    <li>Current membership decides access.</li>
                    <li>RLS isolates organization data.</li>
                    <li>Browser roles cannot promote themselves.</li>
                    <li>The export uses the caller’s access token.</li>
                  </ul>
                  <a
                    href={`${repo}/blob/main/supabase/migrations/202611030001_payroll_evaluation.sql`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Inspect the migration & policies ↗
                  </a>
                </section>
              </div>
            </>
          )}
          {tab === "assessment" && (
            <>
              <section className="panel architecture">
                <div className="panel-heading">
                  <div>
                    <h2>Proposed ownership boundaries</h2>
                    <p>Supabase leads the operational process up to “ready to invoice”.</p>
                  </div>
                  <span className="tag">PROPOSAL</span>
                </div>
                <div className="flow">
                  <div>
                    <small>USER WORKFLOWS</small>
                    <strong>Office + technician app</strong>
                    <span>React / Next.js / TypeScript</span>
                  </div>
                  <span className="flow-arrow" aria-hidden="true">→</span>
                  <div className="flow-core">
                    <small>OPERATIONAL SOURCE</small>
                    <strong>Supabase</strong>
                    <span>Auth · PostgreSQL · RLS · functions</span>
                  </div>
                  <span className="flow-arrow" aria-hidden="true">→</span>
                  <div>
                    <small>ACCOUNTING BOUNDARY</small>
                    <strong>ERPNext</strong>
                    <span>Accepted invoice handoff</span>
                  </div>
                </div>
                <p className="flow-note">
                  Sales CRM and n8n integrate through versioned interfaces. Legacy ERP data remains
                  a read-only source. This integration architecture is proposed, not implemented by
                  this sample.
                </p>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Module effort envelope</h2>
                    <p>
                      Engineering hours include architecture, implementation, review and
                      verification.
                    </p>
                  </div>
                  <span className="tag">1,300–1,900 H</span>
                </div>
                <div className="estimates">
                  {moduleEstimates.map((m) => (
                    <div className="estimate" key={m.number}>
                      <span className="estimate-number">{m.number}</span>
                      <div className="estimate-name">
                        <strong>{m.name}</strong>
                        <small>{m.lane}</small>
                      </div>
                      <div className="range-track" aria-hidden="true">
                        <span
                          style={{
                            left: `${m.low / 560 * 100}%`,
                            width: `${(m.high - m.low) / 560 * 100}%`,
                          }}
                        />
                      </div>
                      <strong className="range-label">{m.low}–{m.high} h</strong>
                    </div>
                  ))}
                </div>
                <div className="table-footer">
                  <span>
                    Planning assumption: architect 10–12 h/week + two developers 32–36 h/week each.
                  </span>
                  <span>Not a staffing commitment or fixed-price offer.</span>
                </div>
              </section>
              <div className="two-columns">
                <section className="info-panel">
                  <span className="section-number">DELIVERY RHYTHM</span>
                  <h3>Reviewable, every day.</h3>
                  <p>
                    Written acceptance criteria before pricing. Small pull requests reviewed by the
                    architect. Versioned migrations and business-rule tests. Daily area updates and
                    a weekly written status.
                  </p>
                </section>
                <section className="info-panel">
                  <span className="section-number">FIRST ACCEPTANCE GATE</span>
                  <h3>Zero manual correction.</h3>
                  <p>
                    Once the actual specification is supplied, the reference-month export must match
                    the client’s corrected file exactly. Every specified defect becomes a regression
                    test.
                  </p>
                </section>
              </div>
            </>
          )}
          {tab === "connect" && <SupabaseExport onDownload={download} />}
          <footer className="page-footer">
            <span>devgurru / Engineering evaluation</span>
            <span>Original code · Synthetic data · No production connection</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
