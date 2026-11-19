import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export function createAdminToken() {
  if (!process.env.ADMIN_PASSWORD) return "";
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ role: "admin", expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(authHeader = "") {
  if (!process.env.ADMIN_PASSWORD) return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.role === "admin" && Number(data.expiresAt) > Date.now();
  } catch {
    return false;
  }
}

function sign(payload) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "").update(payload).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

// ── Apps Script access key (added 2026-11-18) ──────────────────────────────
// The Apps Script Web App rejects private reads and all writes unless the
// request carries this server-side key. It lives only in the Netlify env var
// APPS_SCRIPT_ACCESS_KEY and must never be sent to the browser.
export function withAccessKey(target) {
  const key = process.env.APPS_SCRIPT_ACCESS_KEY || "";
  if (!key) return target;
  if (target instanceof URL) {
    target.searchParams.set("key", key);
    return target;
  }
  return { ...(target || {}), key };
}
