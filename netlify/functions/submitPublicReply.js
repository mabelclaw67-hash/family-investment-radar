import {
  jsonResponse, clientIp, hashIp, shortUserAgent, containsBlocked,
  passesAntiBot, lenInRange, checkRateLimit, appsScriptPost, MESSAGES,
} from "./_publicForumShared.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
  }

  const bot = passesAntiBot(body);
  if (!bot.ok) {
    return jsonResponse(400, { ok: false, error: bot.reason === "honeypot" ? MESSAGES.honeypot : MESSAGES.antiBot });
  }

  const topicId = String(body.topicId || "").trim();
  const nickname = String(body.nickname || "").trim();
  const content = String(body.content || "").trim();

  if (!topicId) {
    return jsonResponse(400, { ok: false, error: MESSAGES.invalid });
  }
  if (!lenInRange(nickname, 2, 20) || !lenInRange(content, 2, 1000)) {
    return jsonResponse(400, { ok: false, error: MESSAGES.invalid });
  }
  if (containsBlocked(nickname, content)) {
    return jsonResponse(400, { ok: false, error: MESSAGES.blocked });
  }

  const ipHash = hashIp(clientIp(event));
  if (!checkRateLimit(ipHash).ok) {
    return jsonResponse(429, { ok: false, error: MESSAGES.rateLimit });
  }

  try {
    const data = await appsScriptPost({
      action: "addPublicReply",
      topicId, nickname, content,
      status: "Published",
      createdAt: new Date().toISOString(),
      ipHash,
      userAgent: shortUserAgent(event),
    });
    return jsonResponse(200, { ok: true, id: data.id });
  } catch (error) {
    return jsonResponse(502, { ok: false, error: error.message || "Submit failed." });
  }
}
