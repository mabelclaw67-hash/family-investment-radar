import { jsonResponse, appsScriptGet } from "./_publicForumShared.js";

// Public list of topics (Status = Published, newest first).
// Strips internal fields (IPHash, UserAgent, AdminNote) before returning.
export async function handler(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }
  try {
    const rows = await appsScriptGet("listPublicTopics");
    const topics = (Array.isArray(rows) ? rows : []).map((r) => ({
      id: r.ID || "",
      createdAt: r.CreatedAt || "",
      nickname: r.Nickname || "",
      ticker: r.Ticker || "",
      title: r.Title || "",
      content: r.Content || "",
    }));
    return jsonResponse(200, { ok: true, topics });
  } catch (error) {
    return jsonResponse(502, { ok: false, error: error.message || "Failed to load topics." });
  }
}
