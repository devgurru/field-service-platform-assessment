import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("fixture download matches the reference file", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Every line, accounted for." })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("desktop.png"), fullPage: true });
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download fixture CSV" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("payroll-2026-09.csv");
  expect(await readFile((await download.path())!)).toEqual(
    await readFile("tests/fixtures/reference-2026-09.csv"),
  );
});

test("role preview denies restricted roles and restores the payroll view", async ({ page }) => {
  await page.goto("/");
  for (const role of ["dispatcher", "technician"]) {
    await page.getByLabel("Preview as").selectOption(role);
    await expect(page.getByRole("heading", { name: "Payroll access is restricted" })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Download fixture CSV" })).toBeDisabled();
  }
  await page.getByLabel("Preview as").selectOption("admin");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download fixture CSV" })).toBeEnabled();
});

test("assessment and optional connection views are usable", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Delivery assessment" }).click();
  await expect(page.getByRole("heading", { name: "Module effort envelope" })).toBeVisible();
  await expect(page.getByText("1,300–1,900 H", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Supabase connection" }).click();
  await page.getByLabel("Evaluation email").fill("reviewer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("synthetic-evaluation-input");
  await page.getByRole("button", { name: "Sign in to evaluation project" }).click();
  await expect(page.getByRole("status")).toContainText("Configure an empty evaluation project");
});

test(
  "mobile layout confines wide data tables to their scrolling region",
  async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.screenshot({ path: testInfo.outputPath("mobile.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(
        true,
      );
    await page.getByRole("button", { name: "Delivery assessment" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(
        true,
      );
  },
);
