import { getLatestMarketTrendRecord } from "./marketTrendSheetStore.js";
import { normalizeSummary } from "./marketTrendSummaryGenerator.js";

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { ok: false, error: "Use GET." });
  }

  try {
    const record = await getLatestMarketTrendRecord();
    if (!record) {
      return jsonResponse(200, {
        ok: true,
        summary: null,
        sources: [],
        updatedAt: "",
        savedAt: "",
        sourceCount: 0,
        generatedBy: "",
      });
    }

    const sourceCount = Number(record.sources_count || 0) || 0;
    const summary = normalizeSummary(parseRawJson(record.raw_json) || recordToSummary(record), sourceCount);
    summary.updatedAt = record.updated_at || summary.updatedAt;
    summary.sourceCount = sourceCount;

    return jsonResponse(200, {
      ok: true,
      summary,
      sources: parseSources(record.sources),
      updatedAt: record.updated_at || summary.updatedAt,
      savedAt: record.updated_at || summary.updatedAt,
      sourceCount,
      generatedBy: record.generated_by || "",
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error.message || "Unable to read saved market trend summary.",
    });
  }
}

function parseRawJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function recordToSummary(record) {
  return {
    marketOverview: textToSection(record.market_overview),
    usMarket: textToSection(record.us_market),
    canadaMarket: textToSection(record.canada_market),
    macroPolicy: textToSection(record.macro_policy),
    sectorRotation: textToSection(record.sector_rotation),
    keyMovers: textToSection(record.key_movers),
    riskSignals: textToSection(record.risk_signals),
    conservativeInvestorNotes: textToSection(record.conservative_notes),
    watchNext: textToSection(record.watch_next),
  };
}

function textToSection(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    summary: lines[0] || "",
    facts: [],
    trendJudgment: [],
    riskNotes: [],
  };
}

function parseSources(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => ({
      ok: true,
      url,
      sourceUrl: url,
      title: "",
      error: "",
    }));
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
