#!/usr/bin/env node
// Validates data/stock-analysis/latest.json (the DSA Adapter output cache).
// Zero-dependency: run with `npm run validate:stock-data`.
//
// Checks: JSON shape, ticker uniqueness/key consistency, required fields,
// timestamp freshness, numeric sanity, and reports failed tickers.
// Exit code 0 = pass, 1 = validation errors.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = resolve(repoRoot, "data/stock-analysis/latest.json");

const MAX_AGE_HOURS = 36; // generatedAt older than this = stale warning
const errors = [];
const warnings = [];

let doc;
try {
  doc = JSON.parse(readFileSync(dataPath, "utf8"));
} catch (e) {
  console.error(`FAIL: cannot read/parse ${dataPath}: ${e.message}`);
  process.exit(1);
}

// --- top-level shape ---
for (const key of ["generatedAt", "marketDate", "totalSymbols", "successful", "failed", "stocks"]) {
  if (!(key in doc)) errors.push(`missing top-level field: ${key}`);
}
const stocks = doc.stocks ?? {};
const tickers = Object.keys(stocks);

// --- freshness ---
const generated = Date.parse(doc.generatedAt ?? "");
if (Number.isNaN(generated)) {
  errors.push(`generatedAt is not a valid timestamp: ${doc.generatedAt}`);
} else {
  const ageHours = (Date.now() - generated) / 3.6e6;
  if (ageHours > MAX_AGE_HOURS) warnings.push(`data is ${ageHours.toFixed(1)}h old (> ${MAX_AGE_HOURS}h)`);
}

// --- per-stock checks ---
const seen = new Set();
let okCount = 0, staleCount = 0, failedCount = 0, placeholderCount = 0, partialCount = 0;
const failedTickers = [];

for (const [key, s] of Object.entries(stocks)) {
  if (seen.has(key)) errors.push(`duplicate ticker key: ${key}`);
  seen.add(key);

  if (s.symbol !== key) errors.push(`${key}: symbol field "${s.symbol}" does not match its key`);
  if (!s.status) errors.push(`${key}: missing status`);

  switch (s.status) {
    case "ok": okCount++; break;
    case "partial": partialCount++; break;
    case "stale": staleCount++; break;
    case "placeholder": placeholderCount++; continue; // no market-data checks
    default: failedCount++; failedTickers.push(key); continue;
  }

  // Required fields for any row that claims ok/partial/stale
  for (const f of ["name", "currency", "quoteUpdatedAt", "dataSources"]) {
    if (s[f] == null || (Array.isArray(s[f]) && s[f].length === 0)) {
      errors.push(`${key}: missing required field ${f}`);
    }
  }

  // Numeric sanity
  if (typeof s.price !== "number" || !(s.price > 0)) {
    errors.push(`${key}: price is not a positive number (${s.price})`);
  }
  if (s.week52High != null && s.week52Low != null && s.week52High < s.week52Low) {
    errors.push(`${key}: week52High < week52Low`);
  }
  if (s.week52PositionPercent != null && (s.week52PositionPercent < -20 || s.week52PositionPercent > 120)) {
    warnings.push(`${key}: unusual week52PositionPercent ${s.week52PositionPercent}`);
  }
  if (s.changePercent != null && Math.abs(s.changePercent) > 40) {
    warnings.push(`${key}: daily change ${s.changePercent}% looks abnormal`);
  }

  // Currency sanity for Canadian tickers
  if (/\.(TO|V)$/i.test(key) && s.currency !== "CAD") {
    errors.push(`${key}: Canadian ticker but currency is ${s.currency}`);
  }
}

// --- counts consistency ---
if (doc.runScope === "full" && typeof doc.totalSymbols === "number" && tickers.length < doc.totalSymbols) {
  errors.push(`full run but stocks has ${tickers.length} of ${doc.totalSymbols} sheet tickers`);
}

// --- report ---
console.log(`latest.json — generated ${doc.generatedAt}, scope=${doc.runScope ?? "?"}`);
console.log(`  tickers in file : ${tickers.length} (sheet total: ${doc.totalSymbols})`);
console.log(`  ok=${okCount} partial=${partialCount} stale=${staleCount} failed=${failedCount} placeholder=${placeholderCount}`);
if (failedTickers.length) console.log(`  failed tickers  : ${failedTickers.join(", ")}`);
for (const w of warnings) console.log(`  WARN: ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);

if (errors.length) {
  console.log(`\nFAIL: ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`\nPASS${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
