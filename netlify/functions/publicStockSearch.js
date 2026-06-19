// Public "查一只股票 / Look up a stock" endpoint.
//
// - No admin auth (public feature). Stores NO user identity / IP / personal data.
// - Quote results are cached centrally in 16 Public Stock Cache (NOT 11 Stock
//   Analysis, which stays the curated watchlist). 24h TTL; "refresh" bypasses it.
// - Provider is configurable. Set STOCK_API_PROVIDER to "fmp" or "twelvedata",
//   or just provide one of the keys and it auto-selects:
//     FMP_API_KEY          -> Financial Modeling Prep (richer: sector/industry/desc)
//     TWELVE_DATA_API_KEY  -> Twelve Data (quotes; fewer profile fields)
//
// Request (POST JSON):
//   { "action": "search", "query": "apple" }                 -> candidate list
//   { "action": "quote",  "symbol": "AAPL", "lang": "zh",
//     "refresh": false }                                      -> cached detail
//
// Unified detail fields: symbol, name, exchange, country, currency, price,
// change, changePercent, marketCap, sector, industry, descriptionEN,
// descriptionZH, description (lang-resolved), source, dataUpdatedAt.

import { appsScriptGet, appsScriptPost } from "./_publicForumShared.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

// Exchanges we prioritise: US (NASDAQ/NYSE/AMEX) + Canada (TSX/TSXV), plus ETFs.
const PREFERRED_EXCHANGES = new Set([
  "NASDAQ", "NYSE", "AMEX", "NYSE AMERICAN", "NYSEARCA", "BATS",
  "TSX", "TSXV", "TSX VENTURE", "TORONTO", "TORONTO STOCK EXCHANGE",
]);
const PREFERRED_COUNTRIES = new Set(["US", "USA", "UNITED STATES", "CA", "CAN", "CANADA"]);

// Well-known private / not-publicly-traded companies.
const PRIVATE_COMPANIES = [
  "spacex", "space x", "openai", "open ai", "anthropic", "stripe", "bytedance",
  "tiktok", "databricks", "epic games", "valve", "discord", "revolut", "canva",
  "fanatics", "chime", "plaid", "instacart x", "shein", "x corp", "twitter x",
  "deel", "notion", "figma", "miro", "grammarly", "automattic", "cargill",
  "koch industries", "mars inc", "ikea", "bosch", "huawei", "ant group",
];

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
  }

  const provider = pickProvider();
  if (!provider) {
    return jsonResponse(500, {
      ok: false,
      error: "Stock API key not configured. Set FMP_API_KEY or TWELVE_DATA_API_KEY.",
    });
  }

  const action = String(body.action || "search").trim();

  try {
    if (action === "quote") {
      const symbol = String(body.symbol || "").trim().toUpperCase();
      if (!symbol) return jsonResponse(400, { ok: false, error: "Missing symbol." });
      const lang = body.lang === "zh" ? "zh" : "en";
      const refresh = body.refresh === true;
      const data = await resolveQuote(provider, symbol, lang, refresh);
      if (!data) return jsonResponse(200, { ok: true, type: "none" });
      return jsonResponse(200, { ok: true, type: "detail", data });
    }

    // default: search
    const query = String(body.query || "").trim();
    if (!query) return jsonResponse(400, { ok: false, error: "Missing query." });

    if (isPrivateCompany(query)) {
      return jsonResponse(200, { ok: true, type: "private" });
    }

    const candidates = await provider.search(query);
    if (!candidates.length) {
      return jsonResponse(200, { ok: true, type: "none" });
    }
    return jsonResponse(200, { ok: true, type: "candidates", candidates });
  } catch (error) {
    return jsonResponse(502, { ok: false, error: error.message || "Stock lookup failed." });
  }
}

// ── Quote resolution with 16 Public Stock Cache ─────────────────────────────

async function resolveQuote(provider, symbol, lang, refresh) {
  const openaiKey = process.env.OPENAI_API_KEY || process.env.HEALTH_PASSPORT_OPENAI_API_KEY || "";

  // 1. Look up the central cache.
  let cached = null;
  try {
    cached = await appsScriptGet("getPublicStockCache", { symbol });
  } catch {
    cached = null;
  }
  const fresh = cached && cached.LastFetchedAt && withinTtl(cached.LastFetchedAt);

  // 2. Cache hit (and not a forced refresh): serve from cache, bump counters.
  if (cached && fresh && !refresh) {
    await appsScriptPost({ action: "touchPublicStockCache", symbol }).catch(() => null);
    return buildFromCache(cached, lang, symbol, openaiKey);
  }

  // 3. Miss / stale / refresh: fetch live from the provider.
  let live = null;
  try {
    live = await provider.quote(symbol);
  } catch {
    live = null;
  }

  // Provider failed — fall back to stale cache if we have one.
  if (!live) {
    if (cached) {
      await appsScriptPost({ action: "touchPublicStockCache", symbol }).catch(() => null);
      return buildFromCache(cached, lang, symbol, openaiKey);
    }
    return null;
  }

  const descriptionEN = String(live.description || (cached && cached.DescriptionEN) || "").trim();
  let descriptionZH = String((cached && cached.DescriptionZH) || "").trim();

  // Generate Chinese only when needed (zh view, no cached translation yet).
  if (lang === "zh" && !descriptionZH && descriptionEN && openaiKey) {
    descriptionZH = await translateToZh(live.name, descriptionEN, openaiKey).catch(() => "");
  }

  // 4. Upsert into the cache (also increments SearchCount + sets timestamps).
  let lastFetchedAt = new Date().toISOString();
  try {
    const res = await appsScriptPost({
      action: "upsertPublicStockCache",
      symbol,
      name: live.name, exchange: live.exchange, country: live.country, currency: live.currency,
      price: live.price, change: live.change, changePercent: live.changePercent, marketCap: live.marketCap,
      sector: live.sector, industry: live.industry,
      descriptionEN, descriptionZH, source: live.source,
    });
    if (res && res.lastFetchedAt) lastFetchedAt = res.lastFetchedAt;
  } catch {
    // Cache write failed — still return live data so the user sees a result.
  }

  return {
    symbol: live.symbol, name: live.name, exchange: live.exchange, country: live.country,
    currency: live.currency, price: live.price, change: live.change, changePercent: live.changePercent,
    marketCap: live.marketCap, sector: live.sector, industry: live.industry,
    descriptionEN, descriptionZH,
    description: lang === "zh" ? (descriptionZH || descriptionEN) : (descriptionEN || descriptionZH),
    source: live.source, dataUpdatedAt: lastFetchedAt,
  };
}

async function buildFromCache(cached, lang, symbol, openaiKey) {
  const descriptionEN = String(cached.DescriptionEN || "").trim();
  let descriptionZH = String(cached.DescriptionZH || "").trim();

  // Lazily generate + persist the Chinese description on first zh view.
  if (lang === "zh" && !descriptionZH && descriptionEN && openaiKey) {
    descriptionZH = await translateToZh(cached.Name, descriptionEN, openaiKey).catch(() => "");
    if (descriptionZH) {
      appsScriptPost({ action: "setPublicStockCacheZh", symbol, descriptionZH }).catch(() => {});
    }
  }

  return {
    symbol: cached.Symbol || symbol,
    name: cached.Name || "",
    exchange: cached.Exchange || "",
    country: cached.Country || "",
    currency: cached.Currency || "",
    price: numOrNull(cached.Price),
    change: numOrNull(cached.Change),
    changePercent: numOrNull(cached.ChangePercent),
    marketCap: numOrNull(cached.MarketCap),
    sector: cached.Sector || "",
    industry: cached.Industry || "",
    descriptionEN, descriptionZH,
    description: lang === "zh" ? (descriptionZH || descriptionEN) : (descriptionEN || descriptionZH),
    source: cached.Source || "",
    dataUpdatedAt: cached.LastFetchedAt || "",
  };
}

function withinTtl(iso) {
  const t = Date.parse(iso);
  return Number.isFinite(t) && (Date.now() - t) < CACHE_TTL_MS;
}

async function translateToZh(name, textEN, apiKey) {
  const input = String(textEN || "").slice(0, 1500);
  if (!input) return "";
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_output_tokens: 600,
      reasoning: { effort: "minimal" },
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: "你是金融信息翻译助手。把公司英文简介改写成简洁、客观的中文简介，不超过120个汉字，不加入评价或买卖建议，只输出中文正文。" }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: `公司：${name || ""}\n英文简介：${input}` }],
        },
      ],
    }),
  });
  const payload = await response.json();
  if (!response.ok) return "";
  return extractOpenAIText(payload);
}

function extractOpenAIText(responseJson) {
  if (!responseJson || typeof responseJson !== "object") return "";
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }
  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  for (const item of output) {
    if (!item || item.type !== "message") continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part && typeof part.text === "string" && part.text.trim()) return part.text.trim();
    }
  }
  return "";
}

// ── Provider selection ──────────────────────────────────────────────────────

function pickProvider() {
  const forced = String(process.env.STOCK_API_PROVIDER || "").toLowerCase();
  const fmpKey = process.env.FMP_API_KEY;
  const tdKey = process.env.TWELVE_DATA_API_KEY;

  if (forced === "fmp" && fmpKey) return fmpProvider(fmpKey);
  if (forced === "twelvedata" && tdKey) return twelveDataProvider(tdKey);
  if (fmpKey) return fmpProvider(fmpKey);
  if (tdKey) return twelveDataProvider(tdKey);
  return null;
}

// ── Financial Modeling Prep ─────────────────────────────────────────────────

function fmpProvider(apiKey) {
  // FMP free tier uses the "stable" API; legacy /api/v3 endpoints return 403.
  const base = "https://financialmodelingprep.com/stable";

  const mapCandidate = (r) => ({
    symbol: String(r.symbol || "").toUpperCase(),
    name: r.name || r.companyName || "",
    exchange: r.exchange || r.exchangeShortName || r.stockExchange || "",
    country: r.country || "",
    currency: r.currency || "",
  });

  return {
    async search(query) {
      // Search by ticker and by company name, then merge + de-dupe by symbol.
      const [bySymbol, byName] = await Promise.all([
        getJson(`${base}/search-symbol?query=${encodeURIComponent(query)}&limit=15&apikey=${apiKey}`).catch(() => []),
        getJson(`${base}/search-name?query=${encodeURIComponent(query)}&limit=15&apikey=${apiKey}`).catch(() => []),
      ]);
      const seen = new Set();
      const merged = [];
      [...(Array.isArray(bySymbol) ? bySymbol : []), ...(Array.isArray(byName) ? byName : [])]
        .map(mapCandidate)
        .filter((c) => c.symbol)
        .forEach((c) => {
          if (seen.has(c.symbol)) return;
          seen.add(c.symbol);
          merged.push(c);
        });
      return sortCandidates(merged).slice(0, 10);
    },

    async quote(symbol) {
      const [quoteArr, profileArr] = await Promise.all([
        getJson(`${base}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`).catch(() => []),
        getJson(`${base}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`).catch(() => []),
      ]);
      const q = Array.isArray(quoteArr) && quoteArr[0] ? quoteArr[0] : null;
      const p = Array.isArray(profileArr) && profileArr[0] ? profileArr[0] : null;
      if (!q && !p) return null;

      return {
        symbol: String((q && q.symbol) || (p && p.symbol) || symbol).toUpperCase(),
        name: (p && p.companyName) || (q && q.name) || "",
        exchange: (p && (p.exchange || p.exchangeShortName)) || (q && q.exchange) || "",
        country: (p && p.country) || "",
        currency: (p && p.currency) || "",
        price: numOrNull(q ? q.price : p ? p.price : null),
        // stable uses change/changePercentage; legacy used changes/changesPercentage.
        change: numOrNull(q ? (q.change ?? q.changes) : (p ? (p.change ?? p.changes) : null)),
        changePercent: numOrNull(q ? (q.changePercentage ?? q.changesPercentage) : null),
        marketCap: numOrNull(q ? (q.marketCap ?? q.mktCap) : (p ? (p.marketCap ?? p.mktCap) : null)),
        sector: (p && p.sector) || "",
        industry: (p && p.industry) || "",
        description: (p && p.description) || "",
        source: "Financial Modeling Prep",
      };
    },
  };
}

// ── Twelve Data ─────────────────────────────────────────────────────────────

function twelveDataProvider(apiKey) {
  const base = "https://api.twelvedata.com";

  return {
    async search(query) {
      const url = `${base}/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=20&apikey=${apiKey}`;
      const res = await getJson(url);
      const list = Array.isArray(res && res.data) ? res.data : [];
      return sortCandidates(list.map((r) => ({
        symbol: String(r.symbol || "").toUpperCase(),
        name: r.instrument_name || "",
        exchange: r.exchange || "",
        country: r.country || "",
        currency: r.currency || "",
      })).filter((c) => c.symbol)).slice(0, 10);
    },

    async quote(symbol) {
      const q = await getJson(`${base}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`);
      if (!q || q.status === "error" || !q.symbol) return null;
      return {
        symbol: String(q.symbol || symbol).toUpperCase(),
        name: q.name || "",
        exchange: q.exchange || "",
        country: "",
        currency: q.currency || "",
        price: numOrNull(q.close),
        change: numOrNull(q.change),
        changePercent: numOrNull(q.percent_change),
        marketCap: null,
        sector: "",
        industry: "",
        description: "",
        source: "Twelve Data",
      };
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sortCandidates(list) {
  // Preferred US/Canada exchanges first, then everything else; stable otherwise.
  const score = (c) => {
    const ex = String(c.exchange || "").toUpperCase();
    const co = String(c.country || "").toUpperCase();
    if (PREFERRED_EXCHANGES.has(ex) || PREFERRED_COUNTRIES.has(co)) return 0;
    return 1;
  };
  return [...list].sort((a, b) => score(a) - score(b));
}

function isPrivateCompany(query) {
  const q = query.toLowerCase().replace(/[.,]/g, "").trim();
  return PRIVATE_COMPANIES.some((name) => q === name || q.includes(name));
}

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Provider returned HTTP ${response.status}: ${text.slice(0, 160)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Provider returned non-JSON response.");
  }
}

function numOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[%,$]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}
