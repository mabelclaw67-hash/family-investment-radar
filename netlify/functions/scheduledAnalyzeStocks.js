// Scheduled smart-batch refresh for "11 Stock Analysis".
//
// Calls the SAME Apps Script action (`analyze_stocks`) the manual "刷新股票分析"
// button uses, with the same max=5 cap. All the "which 5 stocks most need
// updating" logic lives in Apps Script's analyzeStocks_ (missing/blank fields
// first, then newly added tickers, then oldest 更新时间; recent valid rows are
// skipped). This function does not duplicate that logic or keep any state —
// it is a thin, stateless trigger, so manual clicks and scheduled runs never
// conflict with each other.
//
// DISABLED as a scheduler (2026-07): superseded by the GitHub Actions workflow
// "Family Investment Stock Refresh" (.github/workflows/stock-data-refresh.yml),
// which is now the project's single stock-data scheduler. The `schedule` in the
// config below is commented out so Netlify no longer registers this as a
// scheduled function. The function body is kept intact for manual invocation
// and easy rollback — to re-enable, restore the `schedule` line.
//
// Previously ran 3x/day (15/19/23 UTC), triggering Apps Script `analyze_stocks`
// to write price / Forward P/E / Beta / scores into the "11 Stock Analysis" tab.
const CURRENT_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";
const OLD_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzdSdpB1ZZp8XZPIESgl6jQNc83GrvY5LM-kWYPLxWRjsGkLaJEIrxI-CBlsOIp_HWDXg/exec";
const configuredAppsScriptUrl =
  process.env.FAMILY_INVESTMENT_API_URL ||
  process.env.VITE_FAMILY_INVESTMENT_API_URL ||
  CURRENT_APPS_SCRIPT_URL;
// Never call the old deployment, even if a stale env var points to it (mirrors enrichWatchlist.js).
const APPS_SCRIPT_URL =
  configuredAppsScriptUrl === OLD_APPS_SCRIPT_URL ? CURRENT_APPS_SCRIPT_URL : configuredAppsScriptUrl;

export const config = {
  // schedule: "0 15,19,23 * * *", // DISABLED — replaced by GitHub Actions "Family Investment Stock Refresh"
};

export default async function scheduledAnalyzeStocks() {
  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set("action", "analyze_stocks");
    url.searchParams.set("industry", "all");
    url.searchParams.set("max", "5");
    url.searchParams.set("_", String(Date.now()));

    const response = await fetch(url, { method: "GET" });
    const text = await response.text();

    if (!response.ok) {
      return jsonResponse(502, { ok: false, error: `Apps Script HTTP ${response.status}` });
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return jsonResponse(502, { ok: false, error: "Apps Script did not return JSON." });
    }

    return jsonResponse(payload.ok ? 200 : 502, payload);
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error.message || "Scheduled stock analysis failed.",
    });
  }
}

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}
