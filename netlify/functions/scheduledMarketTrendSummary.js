import { generateAndSaveMarketTrendSummary } from "./marketTrendSummaryGenerator.js";

export const config = {
  // Netlify cron uses UTC. 15:00 UTC is about 8:00 AM in Vancouver/Nanaimo during daylight saving time.
  // In winter standard time it runs a little earlier locally, which is acceptable for this first version.
  schedule: "0 15 * * *",
};

export default async function scheduledMarketTrendSummary() {
  try {
    const payload = await generateAndSaveMarketTrendSummary("scheduled");
    return jsonResponse(200, {
      ok: true,
      saved: payload.saved,
      savedAt: payload.savedAt,
      sourceCount: payload.sourceCount,
      generatedBy: payload.generatedBy,
      sources: payload.sources,
      saveWarning: payload.saveWarning,
    });
  } catch (error) {
    return jsonResponse(error.statusCode || 502, {
      ok: false,
      error: error.message || "Scheduled market trend summary failed.",
      sources: Array.isArray(error.sources) ? error.sources : [],
    });
  }
}

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
