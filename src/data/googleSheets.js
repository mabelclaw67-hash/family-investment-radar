import { FAMILY_INVESTMENT_API_URL, SHEET_CONFIG } from "../config.js";

const MORNING_BRIEF_API_URL =
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

export async function loadSheetTab(sheetName, options = {}) {
  const url = buildApiUrl("tab", { name: sheetName }, options);
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

// Classifies a raw 类型/Type cell value into 'opening', 'closing', or null.
// Handles: "Opening Brief", "opening brief", "Opening", "open",
//          "US Market Opening Brief", "Closing Brief", "closing", "close", etc.
// Intentionally returns null for "Morning Brief" and any other types.
function classifyMarketBriefType(val) {
  const t = String(val || '').trim().toLowerCase();
  // Must not match "morning brief" or standalone "morning"
  if (t === 'morning brief' || t === 'morning') return null;
  if (t.includes('opening') || t === 'open') return 'opening';
  if (t.includes('closing') || t === 'close') return 'closing';
  return null;
}

// Treats 'active', 'true', 'yes' (case-insensitive) as active.
function isMarketBriefActive(val) {
  const s = String(val || '').trim().toLowerCase();
  return s === 'active' || s === 'true' || s === 'yes';
}

function getMarketBriefValue(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export async function loadMarketBriefs() {
  try {
    // Reads from "17 Stock Market Brief" only. Does NOT touch "10 Morning Brief".
    const rows = await loadSheetTab(SHEET_CONFIG.tabs.stockMarketBrief, { force: true });
    const filteredRows = rows.filter((row) => {
      const category = classifyMarketBriefType(getMarketBriefValue(row, ["类型 / Type", "Type"]));
      const active = isMarketBriefActive(getMarketBriefValue(row, ["状态 / Status", "Status"]));
      return active && category !== null;
    });
    console.log(`[Market Brief] loaded ${filteredRows.length} active market brief rows`);
    return filteredRows;
  } catch (e) {
    console.warn('Market briefs unavailable:', e.message);
    return [];
  }
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

// Read-only cache produced by the DSA Adapter (analysis-engine/dsa_adapter.py),
// served as a static asset. Fresh market/valuation/fundamental values are
// overlaid onto the Google Sheet rows here; the sheet stays the source of truth
// for the watchlist and all human-maintained columns.
const STOCK_ANALYSIS_JSON_URL = "/data/stock-analysis/latest.json";

export async function loadStockAnalysisPageSource(options = {}) {
  const rows = await loadSheetTabWithOptions(SHEET_CONFIG.tabs.stockAnalysis, options);

  // Fetch the DSA cache. On ANY failure, fall back to the plain sheet rows so
  // the page never blanks out.
  let cache = null;
  try {
    const response = await fetch(`${STOCK_ANALYSIS_JSON_URL}?_=${Date.now()}`, { cache: "no-store" });
    if (response.ok) {
      cache = await response.json();
    } else {
      console.warn(`[stock-analysis] latest.json HTTP ${response.status}; showing sheet data only.`);
    }
  } catch (error) {
    console.warn("[stock-analysis] latest.json unavailable; showing sheet data only:", error.message);
  }

  if (!cache || !cache.stocks) {
    return rows;
  }

  const merged = rows.map((row) => overlayStockAnalysis(row, cache.stocks));
  merged.analysisMeta = {
    generatedAt: cache.generatedAt || "",
    marketDate: cache.marketDate || "",
    totalSymbols: cache.totalSymbols ?? rows.length,
    successful: cache.successful ?? 0,
    placeholders: cache.placeholders ?? 0,
    // "failed or unavailable" combined, per the status strip spec.
    failedOrUnavailable: (cache.failed ?? 0) + (cache.unavailable ?? 0),
  };
  return merged;
}

// Overlays DSA cache values onto one sheet row, matched by Ticker. Only writes
// a field when the cache has a real value for it — never overwrites a
// human-maintained column, and never blanks an existing value with null.
function overlayStockAnalysis(row, stocks) {
  const ticker = String(row.Ticker ?? row.ticker ?? "").trim().toUpperCase();
  const s = ticker ? stocks[ticker] : null;
  if (!s) return row; // no cache record → keep the sheet row exactly as-is

  const out = { ...row };
  const setNum = (key, value, fmt) => {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = fmt(value);
  };
  const pct = (n) => `${n >= 0 ? "" : ""}${n.toFixed(2)}%`;

  setNum("当前价格", s.price, (n) => n.toFixed(2));
  setNum("日变动%", s.changePercent, (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`);
  setNum("成交量 / Volume", s.volume, (n) => Math.round(n).toLocaleString("en-US"));
  if (typeof s.currency === "string" && s.currency) out["币种 / Currency"] = s.currency;
  setNum("市值 Market Cap", s.marketCap, (n) => n);
  setNum("P/E 市盈率", s.pe, (n) => n.toFixed(2));
  setNum("Forward P/E 预期市盈率", s.forwardPe, (n) => n.toFixed(2));
  setNum("Forward P/E", s.forwardPe, (n) => n.toFixed(2));
  setNum("PEG", s.peg, (n) => n.toFixed(2));
  setNum("股息率 Dividend Yield", s.dividendYield, pct);
  setNum("Profit Margin 净利率", s.profitMargin, pct);
  setNum("Operating Margin 营业利润率", s.operatingMargin, pct);
  setNum("ROE 净资产收益率", s.roe, pct);
  setNum("Revenue TTM 过去12月营收", s.revenue, (n) => n);
  setNum("Revenue Growth 营收增长", s.revenueGrowth, pct);
  setNum("EPS 每股收益", s.eps, (n) => n.toFixed(2));
  setNum("52周高点", s.week52High, (n) => n.toFixed(2));
  setNum("52周低点", s.week52Low, (n) => n.toFixed(2));
  setNum("52周位置% / 52W Position", s.week52PositionPercent, (n) => `${n.toFixed(1)}%`);

  if (s.quoteUpdatedAt) out["更新时间"] = s.quoteUpdatedAt;
  if (s.fundamentalsUpdatedAt) out["财务数据更新时间"] = s.fundamentalsUpdatedAt;
  if (Array.isArray(s.dataSources) && s.dataSources.length) {
    out["基本面数据来源"] = s.dataSources.join(", ");
  }
  // Machine-readable status for the badge/foot. Sheet has no such column, so
  // this is additive and never clobbers human content.
  out.__dsaStatus = s.status || "";
  out.__dsaQuoteUpdatedAt = s.quoteUpdatedAt || "";
  out.__dsaFundamentalsUpdatedAt = s.fundamentalsUpdatedAt || "";
  out.__dsaSources = Array.isArray(s.dataSources) ? s.dataSources.join(", ") : "";
  return out;
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
