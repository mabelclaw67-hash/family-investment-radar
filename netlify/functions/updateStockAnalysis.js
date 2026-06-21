import { verifyAdminToken } from "./adminAuth.js";

const APPS_SCRIPT_URL =
  process.env.FAMILY_INVESTMENT_API_URL ||
  process.env.VITE_FAMILY_INVESTMENT_API_URL ||
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

const ALLOWED_ACTIONS = new Set(["analyze_stocks", "update_stock_fundamentals"]);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  if (!verifyAdminToken(event.headers.authorization || event.headers.Authorization || "")) {
    return jsonResponse(401, { ok: false, error: "Admin authorization required." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
  }

  const action = String(body.action || "analyze_stocks");
  if (!ALLOWED_ACTIONS.has(action)) {
    return jsonResponse(400, { ok: false, error: "Unsupported stock update action." });
  }

  try {
    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("_", String(Date.now()));
    if (action === "analyze_stocks") {
      url.searchParams.set("industry", "all");
      url.searchParams.set("max", String(Math.max(1, Math.min(Number(body.max || 5), 8))));
    }
    if (action === "update_stock_fundamentals") {
      url.searchParams.set("max", String(Math.max(1, Math.min(Number(body.max || 5), 10))));
    }

    const response = await fetch(url, { method: "GET" });
    const text = await response.text();

    if (!response.ok) {
      return jsonResponse(502, { ok: false, error: `Apps Script returned HTTP ${response.status}.` });
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return jsonResponse(502, {
        ok: false,
        error: "Update failed: Apps Script did not return JSON.",
      });
    }

    if (!payload.ok) {
      return jsonResponse(502, {
        ok: false,
        error: payload.error || "Apps Script update failed.",
      });
    }

    const data = payload.data;
    const updatedRows = Number(payload.updatedRows || payload.count || data?.updatedRows || data?.count || (Array.isArray(data) ? data.length : 0));
    const updatedAt = payload.updatedAt || data?.updatedAt || new Date().toISOString();

    if (!updatedRows) {
      return jsonResponse(502, {
        ok: false,
        error: "更新失败：股票分析更新接口尚未真正写入数据表。",
      });
    }

    return jsonResponse(200, {
      ok: true,
      action,
      updatedRows,
      updatedAt,
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error.message || "Stock update failed.",
    });
  }
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
