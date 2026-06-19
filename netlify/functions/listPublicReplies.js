import { jsonResponse, appsScriptGet } from "./_publicForumShared.js";

// Public replies for a topic (Status = Published, oldest to newest).
export async function handler(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  let topicId = "";
  if (event.httpMethod === "GET") {
    topicId = String((event.queryStringParameters || {}).topicId || "").trim();
  } else {
    try {
      topicId = String(JSON.parse(event.body || "{}").topicId || "").trim();
    } catch {
      return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
    }
  }
  if (!topicId) return jsonResponse(400, { ok: false, error: "Missing topicId." });

  try {
    const rows = await appsScriptGet("listPublicReplies", { topicId });
    const replies = (Array.isArray(rows) ? rows : []).map((r) => ({
      id: r.ID || "",
      topicId: r.TopicID || "",
      createdAt: r.CreatedAt || "",
      nickname: r.Nickname || "",
      content: r.Content || "",
    }));
    return jsonResponse(200, { ok: true, replies });
  } catch (error) {
    return jsonResponse(502, { ok: false, error: error.message || "Failed to load replies." });
  }
}
