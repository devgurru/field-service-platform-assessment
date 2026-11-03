import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";

// Audit the files Git would publish, including new files before their first commit.
const files = [
  ...new Set(
    execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
      encoding: "utf8",
    }).split("\0").filter(Boolean),
  ),
];
const topFiles = new Set([
  "README.md",
  "LICENSE",
  ".gitignore",
  ".gitattributes",
  ".env.example",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next-env.d.ts",
  "next.config.ts",
  "deno.json",
  "deno.lock",
  "playwright.config.ts",
]);
const directories = new Set([
  "app",
  "lib",
  "supabase",
  "tests",
  "scripts",
  "docs",
  "api",
  "public",
  ".github",
]);
const patterns = [
  [/https:\/\/[a-z0-9]{20}\.supabase\.co/i, "real Supabase project URL"],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, "GitHub credential"],
  [/\bsb_secret_[A-Za-z0-9_-]{12,}/, "Supabase secret key"],
  [/\bsk_(live|test)_[A-Za-z0-9]{12,}/, "payment secret key"],
  [/\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/, "JWT"],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
];
const problems = [];
for (const file of files) {
  const parts = file.split("/");
  if (!(parts.length === 1 ? topFiles.has(file) : directories.has(parts[0]))) {
    problems.push(`${file}: outside publication allowlist`);
  }
  if (parts.some((part) => part.startsWith(".env") && part !== ".env.example")) {
    problems.push(`${file}: environment file`);
  }
  const stat = lstatSync(file);
  if (stat.isSymbolicLink()) {
    problems.push(`${file}: symlink`);
    continue;
  }
  if (stat.size > 2_000_000) problems.push(`${file}: unexpected large artifact`);
  if (/\.(?:png|webp|jpg)$/.test(file)) continue;
  const content = readFileSync(file, "utf8");
  for (const [pattern, description] of patterns) {
    if (pattern.test(content)) problems.push(`${file}: ${description}`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(
  `PASS: ${files.length} publishable files checked for allowed paths and common secret patterns`,
);
console.log(
  "Pattern scanning supplements manual provenance review; it is not a guarantee that arbitrary secrets can be detected.",
);
