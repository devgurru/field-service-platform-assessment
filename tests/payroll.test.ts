import { buildPayrollCsv, euro, validMonth } from "../supabase/functions/_shared/payroll.ts";
import { fixtureMonth, payrollFixture } from "../lib/fixtures.ts";
import { equal, throws } from "./assert.ts";

Deno.test("reference month matches independently written CSV byte for byte, including CRLF", async () => {
  const actual = new TextEncoder().encode(buildPayrollCsv(payrollFixture, fixtureMonth));
  const expected = await Deno.readFile("tests/fixtures/reference-2026-09.csv");
  equal([...actual], [...expected]);
});
Deno.test("ordering is deterministic and caller data is not mutated", () => {
  const input = structuredClone(payrollFixture);
  const before = JSON.stringify(input);
  equal(buildPayrollCsv([...input].reverse(), fixtureMonth), buildPayrollCsv(input, fixtureMonth));
  equal(JSON.stringify(input), before);
});
Deno.test("compensation is exported separately and positive net deductions become negative", () => {
  const csv = buildPayrollCsv(payrollFixture, fixtureMonth);
  equal(csv.includes("E-101;2026-09;2026-10;3200,00;175,00;-75,00;-25,00\r\n"), true);
});
Deno.test("mini-job amount comes from approved source data without a hard-coded legal cap", () => {
  equal(
    buildPayrollCsv(payrollFixture, fixtureMonth).includes(
      "E-102;2026-09;2026-10;475,00;0,00;0,00;0,00",
    ),
    true,
  );
});
Deno.test("earning period and booking month remain separate", () => {
  const csv = buildPayrollCsv(payrollFixture, fixtureMonth);
  equal(csv.includes("E-103;2026-09;2026-11;"), true);
  equal(csv.includes("E-105"), false);
});
Deno.test("pending rows and subcontractors are excluded", () => {
  const csv = buildPayrollCsv(payrollFixture, fixtureMonth);
  equal(csv.includes("C-901"), false);
  equal(csv.includes("E-104"), false);
});
Deno.test("no approved rows returns only a header and line terminator", () => {
  equal(buildPayrollCsv([], fixtureMonth).split("\r\n").length, 2);
});
Deno.test("month validation rejects timestamps, month zero and month thirteen", () => {
  for (const bad of ["2026-00", "2026-13", "2026-1", "2026-09-01", "2026-09\n", null]) {
    equal(validMonth(bad), false);
  }
});
Deno.test("invalid monetary values and invalid data shape fail closed", () => {
  for (const value of [NaN, Infinity, 1.5, -1, 1_000_000_001]) {
    throws(() => buildPayrollCsv([{ ...payrollFixture[0], wage_cents: value }], fixtureMonth));
  }
  for (const rows of [null, {}, [null], [{ ...payrollFixture[0], employment_type: "unknown" }]]) {
    throws(() => buildPayrollCsv(rows, fixtureMonth));
  }
});
Deno.test("spreadsheet formulas, newlines and delimiters cannot enter personnel identifiers", () => {
  for (const employee_no of ["=1+1", "+123", "@SUM(A1)", "A;B", "A\nB", "-1+2", "-1-2"]) {
    throws(() => buildPayrollCsv([{ ...payrollFixture[0], employee_no }], fixtureMonth));
  }
});
Deno.test("duplicate personnel numbers and over-limit data cannot produce a partial export", () => {
  throws(() => buildPayrollCsv([payrollFixture[0], payrollFixture[0]], fixtureMonth));
  throws(() => buildPayrollCsv(Array(1001).fill(payrollFixture[0]), fixtureMonth));
});
Deno.test("money formatting preserves signed cents and zero without floating point multiplication", () => {
  equal([euro(-1), euro(0), euro(1), euro(105), euro(1_000_000_000)], [
    "-0,01",
    "0,00",
    "0,01",
    "1,05",
    "10000000,00",
  ]);
});
