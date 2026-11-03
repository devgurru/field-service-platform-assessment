/** Original evaluation rules, not a statutory payroll calculation or a vendor format. */
export interface PayrollRow {
  employee_no: string;
  employment_type: "employee" | "mini_job" | "subcontractor";
  earning_month: string;
  booking_month: string;
  wage_cents: number;
  compensation_cents: number;
  net_deduction_cents: number;
  bonus_cents: number;
  approval_state: "pending" | "approved";
}

export function validMonth(value: unknown): value is string {
  return typeof value === "string" && /^20\d{2}-(0[1-9]|1[0-2])$/.test(value);
}

function cents(value: unknown, signed = false): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) &&
    Math.abs(value) <= 1_000_000_000 && (signed || value >= 0);
}

function validRow(value: unknown): value is PayrollRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.employee_no === "string" && /^[A-Z0-9][A-Z0-9-]{0,23}$/.test(row.employee_no) &&
    ["employee", "mini_job", "subcontractor"].includes(String(row.employment_type)) &&
    ["pending", "approved"].includes(String(row.approval_state)) &&
    validMonth(row.earning_month) && validMonth(row.booking_month) &&
    cents(row.wage_cents) && cents(row.compensation_cents) &&
    cents(row.net_deduction_cents) && cents(row.bonus_cents, true);
}

export function euro(value: number): string {
  if (!cents(value, true)) throw new Error("Invalid monetary value");
  const amount = Math.abs(value);
  return `${value < 0 ? "-" : ""}${Math.floor(amount / 100)},${
    String(amount % 100).padStart(2, "0")
  }`;
}

export function buildPayrollCsv(input: unknown, month: string): string {
  if (!validMonth(month)) throw new Error("Invalid earning month");
  if (!Array.isArray(input) || input.length > 1000 || !input.every(validRow)) {
    throw new Error("Invalid export data");
  }
  const rows = input.filter((row) =>
    row.earning_month === month && row.approval_state === "approved" &&
    row.employment_type !== "subcontractor"
  ).sort((a, b) => a.employee_no < b.employee_no ? -1 : a.employee_no > b.employee_no ? 1 : 0);
  const seen = new Set<string>();
  const records = rows.map((row) => {
    if (seen.has(row.employee_no)) throw new Error("Duplicate employee in export period");
    seen.add(row.employee_no);
    return [
      row.employee_no,
      row.earning_month,
      row.booking_month,
      euro(row.wage_cents),
      euro(row.compensation_cents),
      euro(-row.net_deduction_cents),
      euro(row.bonus_cents),
    ].join(";");
  });
  return [
    "employee_no;earning_month;booking_month;wage_eur;compensation_eur;net_deduction_eur;bonus_eur",
    ...records,
  ].join("\r\n") + "\r\n";
}
