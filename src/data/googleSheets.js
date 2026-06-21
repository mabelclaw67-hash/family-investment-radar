import { FAMILY_INVESTMENT_API_URL, SHEET_CONFIG } from "../config.js";

const MORNING_BRIEF_API_URL =
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

export async function loadSheetTab(sheetName) {
  const url = buildApiUrl("tab", { name: sheetName });
  const payload = await fetchJson(url);
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function loadDashboardSource(options = {}) {
  const url = buildApiUrl("dashboard", {}, options);
  const payload = await fetchJson(url);
  const dashboardData = payload.data ?? {};
  const morningBrief = dashboardData.morningBrief
    ? dashboardData.morningBrief
    : await loadMorningBriefFallback();

  return {
    holdings: dashboardData.holdings ?? [],
    dailyNews: dashboardData.dailyNews ?? [],
    watchlist: dashboardData.watchlist ?? [],
    priorityAlerts: dashboardData.priorityAlerts ?? [],
    settings: dashboardData.settings ?? [],
    marketRadar: dashboardData.marketRadar ?? [],
    morningBrief,
  };
}

async function loadMorningBriefFallback() {
  try {
    return await loadSheetTab(SHEET_CONFIG.tabs.morningBrief);
  } catch (error) {
    console.warn("Morning brief fallback unavailable:", error.message);
    return await loadMorningBriefFromCurrentApi();
  }
}

async function loadMorningBriefFromCurrentApi() {
  if (FAMILY_INVESTMENT_API_URL === MORNING_BRIEF_API_URL) return [];

  try {
    const url = buildApiUrl("dashboard", {}, MORNING_BRIEF_API_URL);
    const payload = await fetchJson(url);
    return Array.isArray(payload.data?.morningBrief) ? payload.data.morningBrief : [];
  } catch (error) {
    console.warn("Morning brief current API unavailable:", error.message);
    return [];
  }
}

export async function loadHoldingsPageSource() {
  const dashboardSource = await loadDashboardSource();
  const researchResult = await Promise.allSettled([
    loadSheetTab(SHEET_CONFIG.tabs.holdingResearch),
  ]);

  return {
    holdings: dashboardSource.holdings,
    dailyNews: dashboardSource.dailyNews,
    holdingResearch:
      researchResult[0].status === "fulfilled" ? researchResult[0].value : [],
    researchError:
      researchResult[0].status === "rejected" ? researchResult[0].reason.message : "",
  };
}

export async function loadWatchlistPageSource() {
  const dashboardSource = await loadDashboardSource();
  const [watchlistResult, researchResult] = await Promise.allSettled([
    loadSheetTab(SHEET_CONFIG.tabs.watchlist),
    loadSheetTab(SHEET_CONFIG.tabs.holdingResearch),
  ]);

  return {
    watchlist:
      watchlistResult.status === "fulfilled"
        ? watchlistResult.value
        : dashboardSource.watchlist,
    dailyNews: dashboardSource.dailyNews,
    marketRadar: dashboardSource.marketRadar,
    holdingResearch:
      researchResult.status === "fulfilled" ? researchResult.value : [],
  };
}

export async function refreshNews() {
  const url = buildApiUrl("refreshNews", {}, { force: true });
  return await fetchJson(url);
}

export async function syncNewsFromSheet() {
  const url = buildApiUrl("syncNewsFromSheet", {}, { force: true });
  return await fetchJson(url);
}

export async function refreshMarketData() {
  const url = buildApiUrl("refreshMarketData", {}, { force: true });
  return await fetchJson(url);
}

export async function syncMorningBrief() {
  const url = buildApiUrl("syncMorningBrief", {}, { force: true });
  return await fetchJson(url);
}

export async function addWatchItem(payload) {
  const url = buildApiUrl("addWatchItem", payload);
  return await fetchJson(url);
}

export async function updateWatchItem(payload) {
  const url = buildApiUrl("updateWatchItem", payload);
  return await fetchJson(url);
}

export async function archiveWatchItem(watchId) {
  const url = buildApiUrl("archiveWatchItem", { watchId });
  return await fetchJson(url);
}

export async function loadDecisionLogPageSource() {
  const url = buildApiUrl("decisionLog");
  const payload = await fetchJson(url);
  const rows = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.rows)
      ? payload.rows
      : [];

  return {
    decisions: rows,
  };
}

export async function addDecisionLog(payload) {
  const url = buildApiUrl("addDecisionLog", payload);
  return await fetchJson(url);
}

export async function updateDecisionLog(payload) {
  const url = buildApiUrl("updateDecisionLog", payload);
  return await fetchJson(url);
}

export async function archiveDecisionLog(decisionId) {
  const url = buildApiUrl("archiveDecisionLog", { decisionId });
  return await fetchJson(url);
}

export async function loadStockAnalysisPageSource(options = {}) {
  return await loadSheetTabWithOptions(SHEET_CONFIG.tabs.stockAnalysis, options);
}

export async function refreshStockAnalysis(adminToken = "") {
  const response = await fetch("/.netlify/functions/updateStockAnalysis", {
    method: "POST",
    headers: {
      "Authorization": adminToken ? `Bearer ${adminToken}` : "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "analyze_stocks" }),
  });

  return await parseBackendJson(response);
}

function buildApiUrl(action, params = {}, options = {}) {
  if (typeof options === "string") {
    options = { apiUrl: options };
  }
  const apiUrl = options.apiUrl || FAMILY_INVESTMENT_API_URL;
  if (!apiUrl) {
    throw new Error(
      "Missing API URL. Set VITE_FAMILY_INVESTMENT_API_URL or window.FAMILY_INVESTMENT_API_URL to the Apps Script Web App exec URL."
    );
  }

  const url = new URL("/.netlify/functions/readSheetData", window.location.origin);
  url.searchParams.set("action", action);
  if (options.force) url.searchParams.set("force", "1");
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
}

async function loadSheetTabWithOptions(sheetName, options = {}) {
  const url = buildApiUrl("tab", { name: sheetName }, options);
  const payload = await fetchJson(url);
  return Array.isArray(payload.data) ? payload.data : [];
}

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url.toString(), { cache: "no-store" });
  } catch (error) {
    throw new Error(`Apps Script API request failed: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Apps Script API returned HTTP ${response.status}`);
  }

  const payload = await readJsonResponse(response, "Apps Script API");
  if (!payload.ok) {
    throw new Error(payload.error || "Apps Script API returned ok:false");
  }
  notifyStaleCache(payload);
  return payload;
}

function notifyStaleCache(payload) {
  if (!payload?.cache?.stale || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("family-investment-cache-stale", {
    detail: { message: payload.warning || "Showing cached data." },
  }));
}

async function parseBackendJson(response) {
  let payload;
  try {
    payload = await readJsonResponse(response, "Stock update API");
  } catch {
    throw new Error("Update failed: backend did not return JSON.");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Update failed.");
  }

  return payload;
}

async function readJsonResponse(response, label) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`${label} did not return JSON.`);
  }
  return await response.json();
}
