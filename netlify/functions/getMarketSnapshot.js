// Lightweight, READ-ONLY market snapshot for the homepage cards.
//
// This is the "Homepage Market Snapshot" data path — deliberately separate from
// the daily DSA analysis chain. It:
//   - fetches ONLY the homepage tickers the frontend asks for (validated, capped)
//   - does NOT touch the Google Sheet, latest.json, news, fundamentals, or AI
//   - needs no API key (Yahoo Finance public chart endpoint, server-side)
//   - caches for 60s, isolates per-ticker failures, returns per-ticker status
//
// Response shape (section 六 of the Phase 5C spec).

const CACHE_TTL_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_SYMBOLS = 15;
// Only these characters are allowed in a symbol (indices ^, FX =X, futures =F,
// class/exchange . -). Anything else is rejected to prevent abuse.
const SYMBOL_RE = /^[A-Z0-9.^=-]{1,12}$/;

const cache = globalThis.__familyMarketSnapshotCache || new Map();
globalThis.__familyMarketSnapshotCache = cache;

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed." });
  }

  const requested = String((event.queryStringParameters || {}).symbols || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const symbols = [...new Set(requested)].filter((s) => SYMBOL_RE.test(s)).slice(0, MAX_SYMBOLS);
  if (!symbols.length) {
    return json(400, { error: "No valid symbols requested." });
  }

  const now = Date.now();
  const quotes = {};
  const toFetch = [];

  // Serve fresh-enough cached quotes; fetch the rest.
  for (const symbol of symbols) {
    const cached = cache.get(symbol);
    if (cached && now - cached.savedAt < CACHE_TTL_MS) {
      quotes[symbol] = cached.quote;
    } else {
      toFetch.push(symbol);
    }
  }

  const results = await Promise.allSettled(toFetch.map((s) => fetchYahooQuote(s)));
  results.forEach((res, i) => {
    const symbol = toFetch[i];
    if (res.status === "fulfilled" && res.value) {
      quotes[symbol] = res.value;
      cache.set(symbol, { quote: res.value, savedAt: now });
    } else {
      const reason = res.status === "rejected" ? String(res.reason?.message || res.reason) : "no data";
      // Prefer last-known-good over a hole; mark it stale rather than dropping it.
      const cached = cache.get(symbol);
      quotes[symbol] = cached
        ? { ...cached.quote, status: "stale", statusDetail: reason }
        : { symbol, price: null, change: null, changePercent: null, currency: null, marketDate: null, quoteTime: null, status: "unavailable", statusDetail: reason };
    }
  });

  const values = symbols.map((s) => quotes[s]);
  const successful = values.filter((q) => q.status === "ok").length;
  const failed = values.filter((q) => q.status === "unavailable").length;

  return json(200, {
    generatedAt: new Date(now).toISOString(),
    timezone: "America/Vancouver",
    successful,
    failed,
    quotes,
  });
}

async function fetchYahooQuote(symbol) {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
    "?range=1d&interval=1d";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let payload;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (FamilyInvestmentRadar market snapshot)" },
    });
    if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
    payload = await res.json();
  } finally {
    clearTimeout(timer);
  }

  const meta = payload?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") {
    throw new Error("no price in Yahoo response");
  }

  const price = meta.regularMarketPrice;
  const prev =
    typeof meta.chartPreviousClose === "number"
      ? meta.chartPreviousClose
      : typeof meta.previousClose === "number"
        ? meta.previousClose
        : null;
  const change = prev != null ? price - prev : null;
  const changePercent = prev ? (change / prev) * 100 : null;
  const quoteTime = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : null;

  return {
    symbol,
    price,
    change,
    changePercent,
    currency: meta.currency || null,
    marketDate: quoteTime ? quoteTime.toISOString().slice(0, 10) : null,
    quoteTime: quoteTime ? quoteTime.toISOString() : null,
    status: "ok",
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
    },
    body: JSON.stringify(body),
  };
}
