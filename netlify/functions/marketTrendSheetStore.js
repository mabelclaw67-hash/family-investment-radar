const DEFAULT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

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

  const result = await response.json();
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
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Apps Script returned HTTP ${response.status}`);
  }

  return result.data || null;
}

function getAppsScriptUrl() {
  return process.env.FAMILY_INVESTMENT_API_URL
    || process.env.VITE_FAMILY_INVESTMENT_API_URL
    || DEFAULT_APPS_SCRIPT_URL;
}
