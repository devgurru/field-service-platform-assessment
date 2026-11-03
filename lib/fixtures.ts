import type { PayrollRow } from "../supabase/functions/_shared/payroll.ts";

// Invented identifiers and amounts. No customer or employee data.
export const fixtureMonth = "2026-09";
export const payrollFixture: PayrollRow[] = [
  {
    employee_no: "E-103",
    employment_type: "employee",
    earning_month: "2026-09",
    booking_month: "2026-11",
    wage_cents: 210000,
    compensation_cents: 0,
    net_deduction_cents: 2000,
    bonus_cents: 10000,
    approval_state: "approved",
  },
  {
    employee_no: "E-101",
    employment_type: "employee",
    earning_month: "2026-09",
    booking_month: "2026-10",
    wage_cents: 320000,
    compensation_cents: 17500,
    net_deduction_cents: 7500,
    bonus_cents: -2500,
    approval_state: "approved",
  },
  {
    employee_no: "E-102",
    employment_type: "mini_job",
    earning_month: "2026-09",
    booking_month: "2026-10",
    wage_cents: 47500,
    compensation_cents: 0,
    net_deduction_cents: 0,
    bonus_cents: 0,
    approval_state: "approved",
  },
  {
    employee_no: "C-901",
    employment_type: "subcontractor",
    earning_month: "2026-09",
    booking_month: "2026-10",
    wage_cents: 90000,
    compensation_cents: 0,
    net_deduction_cents: 0,
    bonus_cents: 0,
    approval_state: "approved",
  },
  {
    employee_no: "E-104",
    employment_type: "employee",
    earning_month: "2026-09",
    booking_month: "2026-10",
    wage_cents: 120000,
    compensation_cents: 0,
    net_deduction_cents: 0,
    bonus_cents: 0,
    approval_state: "pending",
  },
  {
    employee_no: "E-105",
    employment_type: "employee",
    earning_month: "2026-08",
    booking_month: "2026-09",
    wage_cents: 180000,
    compensation_cents: 0,
    net_deduction_cents: 0,
    bonus_cents: 0,
    approval_state: "approved",
  },
];

export const roles = ["payroll", "admin", "dispatcher", "technician"] as const;
export type Role = typeof roles[number];
export const canExportPayroll = (role: Role) => role === "payroll" || role === "admin";

export const moduleEstimates = [
  {
    number: "01",
    name: "Payroll export fixes",
    low: 80,
    high: 120,
    lane: "Developer A + architect",
  },
  {
    number: "02",
    name: "Shared data model",
    low: 200,
    high: 300,
    lane: "Architect + both developers",
  },
  { number: "03", name: "Quotes & orders", low: 260, high: 400, lane: "Developer A" },
  {
    number: "04",
    name: "Dispatch & technician completion",
    low: 360,
    high: 520,
    lane: "Developer B",
  },
  {
    number: "05",
    name: "Office & billing preparation",
    low: 400,
    high: 560,
    lane: "Both developers",
  },
];
