// Shared helpers for the public forum ("大家在关注") Netlify functions.
import { createHash } from "node:crypto";

export const APPS_SCRIPT_URL =
  process.env.FAMILY_INVESTMENT_API_URL ||
  process.env.VITE_FAMILY_INVESTMENT_API_URL ||
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

// Fixed anti-bot math answer for v1 ("2 + 3 = ?"). Can be randomized later.
export const ANTI_BOT_ANSWER = "5";

// Simple profanity / spam blacklist (v1).
const BLOCKLIST = [
  "赌博", "贷款", "色情", "加微信", "加群", "荐股群", "保证收益", "保本",
  "稳赚", "内幕消息", "杀猪盘", "crypto scam", "free money", "guaranteed return",
];

export const MESSAGES = {
  honeypot: "提交失败。",
  antiBot: "防机器人验证未通过，请重新作答。",
  rateLimit: "提交过于频繁，请稍后再试。",
  blocked: "内容可能包含广告或风险信息，请修改后再提交。",
  invalid: "提交内容不符合要求，请检查后再提交。",
};

export function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}

export function clientIp(event) {
  const h = event.headers || {};
  return (
    h["x-nf-client-connection-ip"] ||
    (h["x-forwarded-for"] || "").split(",")[0].trim() ||
    h["client-ip"] ||
    "unknown"
  );
}

export function hashIp(ip) {
  const salt = process.env.ADMIN_PASSWORD || "family-investment-forum";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function shortUserAgent(event) {
  const ua = (event.headers && (event.headers["user-agent"] || event.headers["User-Agent"])) || "";
  return String(ua).slice(0, 120);
}

export function containsBlocked(...texts) {
  const haystack = texts.join(" ").toLowerCase();
  return BLOCKLIST.some((word) => haystack.includes(word.toLowerCase()));
}

export function passesAntiBot(body) {
  // Honeypot must be empty; math answer must match.
  if (String(body.honeypot || "").trim() !== "") return { ok: false, reason: "honeypot" };
  if (String(body.antiBotAnswer || "").trim() !== ANTI_BOT_ANSWER) return { ok: false, reason: "antiBot" };
  return { ok: true };
}

export function lenInRange(value, min, max) {
  const n = [...String(value || "").trim()].length;
  return n >= min && n <= max;
}

// ── Best-effort in-memory IP rate limiter ───────────────────────────────────
// Netlify function instances are ephemeral and not shared, so this is a
// best-effort guard (resets on cold start). No external store, per spec.
const RATE_STORE = new Map(); // ipHash -> number[] (timestamps ms)
const WINDOWS = [
  { ms: 60 * 1000, max: 1 },
  { ms: 60 * 60 * 1000, max: 5 },
  { ms: 24 * 60 * 60 * 1000, max: 20 },
];

export function checkRateLimit(ipHash) {
  const now = Date.now();
  const longest = WINDOWS[WINDOWS.length - 1].ms;
  const hits = (RATE_STORE.get(ipHash) || []).filter((t) => now - t < longest);
  for (const w of WINDOWS) {
    const count = hits.filter((t) => now - t < w.ms).length;
    if (count >= w.max) return { ok: false };
  }
  hits.push(now);
  RATE_STORE.set(ipHash, hits);
  return { ok: true };
}

export async function appsScriptGet(action, params = {}) {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("_", String(Date.now()));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  const response = await fetch(url, { method: "GET", redirect: "follow" });
  const text = await response.text();
  if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
  const payload = JSON.parse(text);
  if (!payload.ok) throw new Error(payload.error || "Apps Script returned an error.");
  return payload.data;
}

export async function appsScriptPost(payload) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    redirect: "follow",
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
  const parsed = JSON.parse(text);
  if (!parsed.ok) throw new Error(parsed.error || "Apps Script write failed.");
  return parsed.data;
}
