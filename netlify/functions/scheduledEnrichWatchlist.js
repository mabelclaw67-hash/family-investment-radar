import { runEnrichment } from "./enrichWatchlist.js";

// Scheduled enrichment of 07 Watchlist columns L/M/N/O.
// Runs every 6 hours (UTC). Each run processes only rows that are still
// pending/empty, bounded by a time budget so it never overruns the function
// timeout. Over a few runs the backlog clears, then it idles until new rows
// appear or existing summaries are reset to Pending.
export const config = {
  schedule: "0 */6 * * *",
};

export default async function scheduledEnrichWatchlist() {
  try {
    const result = await runEnrichment({ max: 6, force: false, timeBudgetMs: 8000 });
    return jsonResponse(200, result);
  } catch (error) {
    return jsonResponse(502, {
      ok: false,
      error: error.message || "Scheduled watchlist enrichment failed.",
    });
  }
}

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}
