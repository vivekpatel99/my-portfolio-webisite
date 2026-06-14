#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const originalEnvKeys = new Set(Object.keys(process.env));

function parseEnvValue(rawValue) {
  const value = rawValue.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = parseEnvValue(trimmed.slice(separatorIndex + 1));
    if (key && !originalEnvKeys.has(key)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const convexUrl = process.env.VITE_CONVEX_URL;

if (!convexUrl || !/^https?:\/\//.test(convexUrl)) {
  console.error(
    "Missing VITE_CONVEX_URL. Set it in the environment or .env.local before running this smoke test.",
  );
  process.exit(1);
}

const now = new Date();
const timestamp = now.toISOString();
const emailSafeTimestamp = timestamp.replace(/[^0-9]/g, "");
const testLead = {
  name: "Convex Smoke Test",
  email: `convex-smoke-test+${emailSafeTimestamp}@example.com`,
  budget: "< \u20ac5k",
  description: [
    "Automated Convex smoke test lead.",
    `Created at: ${timestamp}`,
    "This row verifies that the public contact-form mutation can write to Convex.",
  ].join("\n"),
};

console.log(`Submitting smoke lead to ${convexUrl}`);
console.log(
  "Note: this uses the production contact mutation, so it may trigger a test email if Resend is configured.",
);

try {
  const [{ ConvexHttpClient }, { api }] = await Promise.all([
    import("convex/browser"),
    import("../convex/_generated/api.js"),
  ]);
  const client = new ConvexHttpClient(convexUrl);
  const result = await client.mutation(api.leads.submitLead, testLead);
  console.log("Convex mutation result:", JSON.stringify(result));
  console.log("Smoke lead email:", testLead.email);
} catch (error) {
  console.error("Convex smoke test failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
