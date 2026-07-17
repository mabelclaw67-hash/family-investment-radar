// Homepage Market Snapshot — frontend data layer.
//
// Calls the read-only Netlify function getMarketSnapshot (which fetches only the
// homepage tickers, no sheet write, no AI) and converts the result into the same
// row shape MarketSection already renders, so no component rewrite is needed.

import { HOMEPAGE_MARKET_TICKERS } from "./marketSymbols.js";

const SNAPSHOT_URL = "/.netlify/functions/getMarketSnapshot";
const REQUEST_TIMEOUT_MS = 12000;

export async function fetchMarketSnapshot(symbols = HOMEPAGE_MARKET_TICKERS) {
  const url = `${SNAPSHOT_URL}?symbols=${encodeURIComponent(symbols.join(","))}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) throw new Error(`Market snapshot HTTP ${res.status}`);
    const payload = await res.json();
    if (!payload || !payload.quotes) throw new Error("Malformed snapshot response");
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

// Converts snapshot quotes into MarketSection-shaped rows. Only emits a row when
// the quote has a usable price, so a failed ticker never blanks the card — the
// caller keeps the previous row for anything missing here.
export function snapshotToMarketRows(quotes) {
  const rows = [];
  for (const q of Object.values(quotes || {})) {
    if (q && typeof q.price === "number" && Number.isFinite(q.price)) {
      rows.push({
        "代码 / Symbol": q.symbol,
        "当前水平 / Current Level": formatPrice(q.price),
        "日变动% / Daily Change %": formatChangePercent(q.changePercent),
        "日期 / Date": q.marketDate || todayISO(),
        __snapshotStatus: q.status || "ok",
      });
    }
  }
  return rows;
}

function formatPrice(n) {
  const decimals = Math.abs(n) < 10 ? 4 : 2;
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatChangePercent(pct) {
  if (typeof pct !== "number" || !Number.isFinite(pct)) return "—";
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── Trading-hours logic, always computed in America/Vancouver ────────────────
// Regular session used here: weekdays 06:30–13:15 America/Vancouver (covers the
// US and Canadian cash sessions). Never uses the browser's local timezone.

const VANCOUVER_OPEN_MIN = 6 * 60 + 30; // 06:30
const VANCOUVER_CLOSE_MIN = 13 * 60 + 15; // 13:15

export function vancouverParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Vancouver",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  const weekday = get("weekday"); // Mon..Sun
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some engines emit "24" at midnight
  const minute = parseInt(get("minute"), 10);
  return { weekday, hour, minute, minutesOfDay: hour * 60 + minute };
}

export function isVancouverWeekend(date = new Date()) {
  const { weekday } = vancouverParts(date);
  return weekday === "Sat" || weekday === "Sun";
}

// "open" during regular session, "premarket" before open on a weekday,
// "closed" after close or on weekends.
export function vancouverMarketStatus(date = new Date()) {
  if (isVancouverWeekend(date)) return "closed";
  const { minutesOfDay } = vancouverParts(date);
  if (minutesOfDay < VANCOUVER_OPEN_MIN) return "premarket";
  if (minutesOfDay >= VANCOUVER_OPEN_MIN && minutesOfDay < VANCOUVER_CLOSE_MIN) return "open";
  return "closed";
}

export function isVancouverTradingHours(date = new Date()) {
  return vancouverMarketStatus(date) === "open";
}
