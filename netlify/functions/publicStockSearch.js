// Public "查一只股票 / Look up a stock" endpoint.
//
// - No admin auth (public feature).
// - Never writes to Google Sheet; purely reads from an external market-data API.
// - Provider is configurable. Set STOCK_API_PROVIDER to "fmp" or "twelvedata",
//   or just provide one of the keys and it auto-selects:
//     FMP_API_KEY          -> Financial Modeling Prep (richer: sector/industry/desc)
//     TWELVE_DATA_API_KEY  -> Twelve Data (quotes; fewer profile fields)
//
// Request (POST JSON):
//   { "action": "search", "query": "apple" }   -> candidate list (or private/none)
//   { "action": "quote",  "symbol": "AAPL" }    -> unified detail card
//
// Unified detail fields: symbol, name, exchange, country, currency, price,
// change, changePercent, marketCap, sector, industry, description, source.

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
      const data = await provider.quote(symbol);
      if (!data) {
        return jsonResponse(200, { ok: true, type: "none" });
      }
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
