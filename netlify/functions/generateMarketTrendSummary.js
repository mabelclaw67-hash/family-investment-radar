import { verifyAdminToken } from "./adminAuth.js";
import { generateAndSaveMarketTrendSummary } from "./marketTrendSummaryGenerator.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Use POST." });
  }

  if (!verifyAdminToken(event.headers.authorization || event.headers.Authorization || "")) {
    return jsonResponse(401, { ok: false, error: "Admin authorization required." });
  }

  try {
    const payload = await generateAndSaveMarketTrendSummary("manual");
    return jsonResponse(200, {
      ok: true,
      ...payload,
    });
  } catch (error) {
    return jsonResponse(error.statusCode || 502, {
      ok: false,
      error: error.message || "OpenAI summary failed.",
      sources: Array.isArray(error.sources) ? error.sources : [],
    });
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
