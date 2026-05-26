import { FAMILY_INVESTMENT_API_URL, SHEET_CONFIG } from "../config.js";

export async function loadSheetTab(sheetName) {
  const url = buildApiUrl("tab", { name: sheetName });
  const payload = await fetchJson(url);
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function loadDashboardSource() {
  const url = buildApiUrl("dashboard");
  const payload = await fetchJson(url);
  const dashboardData = payload.data ?? {};
  const morningBrief = Array.isArray(dashboardData.morningBrief) && dashboardData.morningBrief.length
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
  const researchResult = await Promise.allSettled([
    loadSheetTab(SHEET_CONFIG.tabs.holdingResearch),
  ]);

  return {
    watchlist: dashboardSource.watchlist,
    dailyNews: dashboardSource.dailyNews,
    marketRadar: dashboardSource.marketRadar,
    holdingResearch:
      researchResult[0].status === "fulfilled" ? researchResult[0].value : [],
  };
}

export async function refreshNews() {
  const url = buildApiUrl("refreshNews");
  return await fetchJson(url);
}

export async function refreshMarketData() {
  const url = buildApiUrl("refreshMarketData");
  return await fetchJson(url);
}

export async function addWatchItem(payload) {
  const url = buildApiUrl("addWatchItem", payload);
  return await fetchJson(url);
}

export async function loadDecisionLogPageSource() {
  const url = buildApiUrl("decisionLog");
  const payload = await fetchJson(url);
  return {
    decisions: Array.isArray(payload.data) ? payload.data : [],
  };
}

export async function addDecisionLog(payload) {
  const url = buildApiUrl("addDecisionLog", payload);
  return await fetchJson(url);
}

function buildApiUrl(action, params = {}) {
  if (!FAMILY_INVESTMENT_API_URL) {
    throw new Error(
      "Missing API URL. Set VITE_FAMILY_INVESTMENT_API_URL or window.FAMILY_INVESTMENT_API_URL to the Apps Script Web App exec URL."
    );
  }

  const url = new URL(FAMILY_INVESTMENT_API_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("_", String(Date.now()));
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
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

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error || "Apps Script API returned ok:false");
  }
  return payload;
}
