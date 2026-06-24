const APPS_SCRIPT_URL =
  process.env.FAMILY_INVESTMENT_API_URL ||
  process.env.VITE_FAMILY_INVESTMENT_API_URL ||
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

const CACHE_TTL_MS = 10 * 60 * 1000;
const READ_ACTIONS = new Set(["dashboard", "tab", "decisionLog"]);
const memoryCache = globalThis.__familyInvestmentSheetCache || new Map();
globalThis.__familyInvestmentSheetCache = memoryCache;

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  const params = event.queryStringParameters || {};
  const action = String(params.action || "dashboard");
  const force = params.force === "1" || params.force === "true";
  const bypassCache = shouldBypassCache(params);
  const cacheKey = buildCacheKey(params);
  const cached = memoryCache.get(cacheKey);
  const now = Date.now();

  if (READ_ACTIONS.has(action) && !force && !bypassCache && cached && now - cached.savedAt < CACHE_TTL_MS) {
    return jsonResponse(200, {
      ...cached.payload,
      cache: { hit: true, stale: false, savedAt: cached.savedAt, ttlSeconds: Math.round(CACHE_TTL_MS / 1000) },
    });
  }

  try {
    const payload = await fetchAppsScript(params);
    if (!payload.ok) {
      throw new Error(payload.error || "Apps Script returned ok:false");
    }

    logMarketBriefRows(params, payload);

    if (READ_ACTIONS.has(action) && !bypassCache) {
      memoryCache.set(cacheKey, { payload, savedAt: now });
    } else {
      memoryCache.clear();
    }

    return jsonResponse(200, {
      ...payload,
      cache: { hit: false, stale: false, savedAt: now, ttlSeconds: Math.round(CACHE_TTL_MS / 1000) },
    });
  } catch (error) {
    if (READ_ACTIONS.has(action) && cached) {
      return jsonResponse(200, {
        ...cached.payload,
        stale: true,
        warning: "Apps Script is temporarily unavailable. Showing cached data.",
        cache: {
          hit: true,
          stale: true,
          savedAt: cached.savedAt,
          error: error.message || "Apps Script request failed.",
        },
      });
    }

    return jsonResponse(502, {
      ok: false,
      error: error.message || "Apps Script request failed.",
    });
  }
}

function shouldBypassCache(params) {
  return String(params.action || "dashboard") === "tab"
    && String(params.name || "").trim() === "17 Stock Market Brief";
}

function logMarketBriefRows(params, payload) {
  if (!shouldBypassCache(params)) return;
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  console.log(`[readSheetData] 17 Stock Market Brief rows loaded: ${rows.length}`);
}

async function fetchAppsScript(params) {
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (key !== "force") url.searchParams.set(key, value);
  });
  url.searchParams.set("_", String(Date.now()));

  const response = await fetch(url, { method: "GET", redirect: "follow" });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Apps Script returned HTTP ${response.status}.`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Apps Script did not return JSON.");
  }
}

function buildCacheKey(params) {
  const clean = new URLSearchParams();
  Object.entries(params)
    .filter(([key]) => key !== "_" && key !== "force")
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => clean.set(key, value));
  return clean.toString() || "action=dashboard";
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}
