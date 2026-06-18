const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";
const AI_MARKET_TREND_TAB = "13 AI Market Trend";

export async function appendMarketTrendRecord(payload) {
  const response = await fetch(getAppsScriptUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "appendAiMarketTrend",
      record: payload,
    }),
  });

  const result = await readJsonResponse(response, "append AI market trend");
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Apps Script returned HTTP ${response.status}`);
  }

  return result.data || {};
}

export async function getLatestMarketTrendRecord() {
  const url = new URL(getAppsScriptUrl());
  url.searchParams.set("action", "latestAiMarketTrend");
  url.searchParams.set("_", String(Date.now()));

  const response = await fetch(url.toString(), { cache: "no-store" });
  const result = await readJsonResponse(response, "read latest AI market trend");
  if (!response.ok || !result.ok) {
    if (String(result.error || "").includes("Unsupported action")) {
      return await getLatestMarketTrendRecordFromTab();
    }
    throw new Error(result.error || `Apps Script returned HTTP ${response.status}`);
  }

  return result.data || null;
}

async function getLatestMarketTrendRecordFromTab() {
  const url = new URL(getAppsScriptUrl());
  url.searchParams.set("action", "tab");
  url.searchParams.set("name", AI_MARKET_TREND_TAB);
  url.searchParams.set("_", String(Date.now()));

  const response = await fetch(url.toString(), { cache: "no-store" });
  const result = await readJsonResponse(response, "read AI market trend tab");
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Apps Script returned HTTP ${response.status}`);
  }

  const rows = Array.isArray(result.data) ? result.data : [];
  return rows
    .filter((row) => String(row.status || "").trim().toUpperCase() === "PUBLISHED")
    .filter((row) => String(row.public_visible || "").trim().toUpperCase() === "TRUE")
    .sort((a, b) => Date.parse(String(b.updated_at || "")) - Date.parse(String(a.updated_at || "")))[0] || null;
}

async function readJsonResponse(response, label) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Apps Script ${label} response was not JSON.`);
  }
  return await response.json();
}

function getAppsScriptUrl() {
  return process.env.FAMILY_INVESTMENT_API_URL
    || process.env.VITE_FAMILY_INVESTMENT_API_URL
    || DEFAULT_APPS_SCRIPT_URL;
}
