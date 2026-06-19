import { verifyAdminToken } from "./adminAuth.js";
import { jsonResponse, appsScriptGet, appsScriptPost } from "./_publicForumShared.js";

// Admin management for the public forum. Requires a valid admin token.
// Actions:
//   { action: "listTopics" }                       -> all topics (any status)
//   { action: "listReplies", topicId? }            -> all replies (any status)
//   { action: "updateTopicStatus", id, status }    -> Published | Hidden | Deleted
//   { action: "updateReplyStatus", id, status }    -> Published | Hidden | Deleted
const ALLOWED_STATUS = new Set(["Published", "Hidden", "Deleted"]);

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

  const action = String(body.action || "").trim();

  try {
    if (action === "listTopics") {
      const rows = await appsScriptGet("listAllPublicTopics");
      return jsonResponse(200, { ok: true, topics: normalizeTopics(rows) });
    }

    if (action === "listReplies") {
      const rows = await appsScriptGet("listAllPublicReplies", { topicId: body.topicId || "" });
      return jsonResponse(200, { ok: true, replies: normalizeReplies(rows) });
    }

    if (action === "updateTopicStatus" || action === "updateReplyStatus") {
      const id = String(body.id || "").trim();
      const status = String(body.status || "").trim();
      if (!id) return jsonResponse(400, { ok: false, error: "Missing record id." });
      if (!ALLOWED_STATUS.has(status)) return jsonResponse(400, { ok: false, error: "Unsupported status." });
      const appsAction = action === "updateTopicStatus" ? "updatePublicTopicStatus" : "updatePublicReplyStatus";
      const data = await appsScriptPost({ action: appsAction, id, status });
      return jsonResponse(200, { ok: true, id: data.id, status: data.status });
    }

    return jsonResponse(400, { ok: false, error: "Unsupported action." });
  } catch (error) {
    return jsonResponse(502, { ok: false, error: error.message || "Admin action failed." });
  }
}

function normalizeTopics(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.ID || "",
    createdAt: r.CreatedAt || "",
    nickname: r.Nickname || "",
    ticker: r.Ticker || "",
    title: r.Title || "",
    content: r.Content || "",
    status: r.Status || "",
  }));
}

function normalizeReplies(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.ID || "",
    topicId: r.TopicID || "",
    createdAt: r.CreatedAt || "",
    nickname: r.Nickname || "",
    content: r.Content || "",
    status: r.Status || "",
  }));
}
