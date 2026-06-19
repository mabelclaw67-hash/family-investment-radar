import { verifyAdminToken } from "./adminAuth.js";

// Enrichment pipeline for 07 Watchlist Intelligence:
//   Watchlist rows  ->  Firecrawl news search  ->  OpenAI Chinese analysis
//                   ->  write back to columns:
//                       L = Latest Chinese News Summary (最新中文新闻摘要)
//                       M = Earnings / Filing Summary  (财报/公告摘要)
//                       N = Main Risks                 (主要风险)
//                       O = AI Chinese Comment         (AI中文点评)
//
// Runs a small batch per invocation (default 3 rows) to stay within the
// Netlify function timeout and avoid Firecrawl / OpenAI rate limits.

const APPS_SCRIPT_URL =
  process.env.FAMILY_INVESTMENT_API_URL ||
  process.env.VITE_FAMILY_INVESTMENT_API_URL ||
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

const FIRECRAWL_SEARCH_URL = "https://api.firecrawl.dev/v2/search";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

const PENDING_RE = /pending|待抓取|待更新|待分析|^n\/?a$|^—$|^-$/i;
const MAX_BATCH = 10;
const SOURCE_MARKDOWN_LIMIT = 4000;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  if (!verifyAdminToken(event.headers.authorization || event.headers.Authorization || "")) {
    return jsonResponse(401, { ok: false, error: "Admin authorization required." });
  }

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlKey) {
    return jsonResponse(500, { ok: false, error: "FIRECRAWL_API_KEY is not configured." });
  }
  const openaiKey = process.env.OPENAI_API_KEY || process.env.HEALTH_PASSPORT_OPENAI_API_KEY || "";
  if (!openaiKey) {
    return jsonResponse(500, { ok: false, error: "OPENAI_API_KEY is not configured." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
  }

  const max = Math.max(1, Math.min(Number(body.max || 3), MAX_BATCH));
  const force = body.force === true; // re-enrich even rows that already have summaries

  let watchlist;
  try {
    watchlist = await fetchWatchlist();
  } catch (error) {
    return jsonResponse(502, { ok: false, error: `Failed to read watchlist: ${error.message}` });
  }

  // Pick rows that still need enrichment (column L is Pending/empty), unless force.
  const candidates = watchlist
    .filter((row) => {
      const status = String(field(row, ["状态 / Status"]) || "").toLowerCase();
      if (status === "archived") return false;
      if (force) return true;
      // Enrich the row if ANY of the four target columns (L/M/N/O) is still pending/empty.
      const targets = [
        field(row, ["最新中文新闻摘要 / Latest Chinese News Summary"]),
        field(row, ["财报/公告摘要 / Earnings or Filing Summary"]),
        field(row, ["主要风险 / Main Risks"]),
        field(row, ["AI中文点评 / AI Chinese Comment"]),
      ].map((v) => String(v || "").trim());
      return targets.some((v) => !v || PENDING_RE.test(v));
    })
    .slice(0, max);

  if (!candidates.length) {
    return jsonResponse(200, {
      ok: true,
      updatedRows: 0,
      processed: 0,
      message: "No watchlist rows pending enrichment.",
      updatedAt: new Date().toISOString(),
    });
  }

  const results = [];
  const errors = [];

  for (const row of candidates) {
    const watchId = String(field(row, ["观察ID / Watch ID"]) || "").trim();
    if (!watchId) continue;

    try {
      const query = buildQuery(row);
      const sources = await firecrawlSearch(query, firecrawlKey);
      const summary = await summarize(row, sources, openaiKey);
      results.push({
        watchId,
        newsSummary: summary.newsSummary,
        earningsSummary: summary.earningsSummary,
        mainRisks: summary.mainRisks,
        aiComment: summary.aiComment,
      });
    } catch (error) {
      errors.push({ watchId, error: error.message });
    }
  }

  let updatedRows = 0;
  if (results.length) {
    try {
      const writeback = await writeBack(results);
      updatedRows = Number(writeback.updatedRows || 0);
    } catch (error) {
      return jsonResponse(502, {
        ok: false,
        error: `Enrichment generated but write-back failed: ${error.message}`,
        processed: candidates.length,
        errors,
      });
    }
  }

  return jsonResponse(200, {
    ok: true,
    updatedRows,
    processed: candidates.length,
    errors,
    updatedAt: new Date().toISOString(),
  });
}

// ── Watchlist read ──────────────────────────────────────────────────────────

async function fetchWatchlist() {
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set("action", "dashboard");
  url.searchParams.set("_", String(Date.now()));

  const response = await fetch(url, { method: "GET", redirect: "follow" });
  const text = await response.text();
  if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Apps Script did not return JSON.");
  }
  if (!payload.ok) throw new Error(payload.error || "Apps Script returned an error.");

  const data = payload.data || {};
  return Array.isArray(data.watchlist) ? data.watchlist : [];
}

// ── Firecrawl news search ───────────────────────────────────────────────────

function buildQuery(row) {
  const ticker = String(field(row, ["代码 / Ticker"]) || "").trim();
  const name = String(field(row, ["名称 / Name"]) || "").trim();
  const sector = String(field(row, ["板块 / Sector"]) || "").trim();
  const isKeyword = /keyword/i.test(ticker) || /keyword/i.test(String(field(row, ["类型 / Type"]) || ""));

  const subject = isKeyword ? (name || sector) : (ticker && ticker !== "Keyword" ? `${name} ${ticker}` : name);
  return `${subject} latest news earnings`.replace(/\s+/g, " ").trim();
}

async function firecrawlSearch(query, apiKey) {
  const response = await fetch(FIRECRAWL_SEARCH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 5,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Firecrawl search HTTP ${response.status}`);
  }

  const data = payload.data || {};
  // v2 search may return { data: { web: [...] } } or { data: [...] }
  const items = Array.isArray(data) ? data : (Array.isArray(data.web) ? data.web : []);
  return items.slice(0, 5).map((item) => ({
    title: item.title || item.metadata?.title || "",
    url: item.url || item.metadata?.sourceURL || "",
    snippet: item.description || item.snippet || "",
    markdown: String(item.markdown || "").slice(0, SOURCE_MARKDOWN_LIMIT),
  }));
}

// ── OpenAI summary ──────────────────────────────────────────────────────────

async function summarize(row, sources, apiKey) {
  const ticker = String(field(row, ["代码 / Ticker"]) || "").trim();
  const name = String(field(row, ["名称 / Name"]) || "").trim();
  const reason = String(field(row, ["观察原因 / Watch Reason"]) || "").trim();

  if (!sources.length) {
    return {
      newsSummary: "暂无可用新闻来源 / No recent sources found",
      earningsSummary: "暂无财报或公告信息",
      mainRisks: "暂无足够信息评估风险",
      aiComment: "来源信息不足，建议人工复核。",
    };
  }

  const sourceText = sources.map((s, i) => [
    `SOURCE ${i + 1}`,
    `Title: ${s.title || "Untitled"}`,
    `URL: ${s.url}`,
    s.snippet ? `Snippet: ${s.snippet}` : "",
    s.markdown ? `Content:\n${s.markdown}` : "",
  ].filter(Boolean).join("\n")).join("\n\n---\n\n");

  const prompt = [
    `观察对象 / Subject: ${name}${ticker && ticker !== "Keyword" ? ` (${ticker})` : ""}`,
    reason ? `观察原因 / Reason: ${reason}` : "",
    "",
    "以下是公开来源资料：",
    sourceText,
    "",
    "请输出严格 JSON 对象，仅包含以下四个字段：",
    '{"newsSummary": "...", "earningsSummary": "...", "mainRisks": "...", "aiComment": "..."}',
    "要求：",
    "1. newsSummary：用中文概括最近最重要的新闻动态，2-3 句，说明事件与可能影响，不提供买卖建议。",
    "2. earningsSummary：用中文概括最近的财报、业绩指引或重要公告；如来源中没有财报/公告信息，则填写 \"暂无财报或公告信息\"。",
    "3. mainRisks：用中文列出该观察对象当前主要风险点，1-3 条，简明扼要。",
    "4. aiComment：用中文给出一句总体点评，谨慎、有解释力，区分事实与判断，不提供买卖建议。",
    "5. 每个字段不超过 120 个汉字；只依据来源信息，不要编造；信息不足时写明不确定。",
    "6. 只输出 JSON，不要 markdown，不要代码块，不要多余文字。",
  ].filter(Boolean).join("\n");

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_output_tokens: 2000,
      reasoning: { effort: "minimal" },
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: "你是面向华人投资者的观察清单摘要助手。风格清晰、谨慎。只分析公开信息，不提供买卖建议。必须只输出严格 JSON 对象。",
          }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
      text: { format: { type: "json_object" } },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI HTTP ${response.status}`);
  }

  const parsed = parseJsonObject(extractOpenAIText(payload));
  const newsSummary = String(parsed.newsSummary || "").trim() || "暂无摘要 / No summary";
  const earningsSummary = String(parsed.earningsSummary || "").trim() || "暂无财报或公告信息";
  const mainRisks = String(parsed.mainRisks || "").trim() || "暂无足够信息评估风险";
  const aiComment = String(parsed.aiComment || "").trim() || "来源信息不足，建议人工复核。";
  return { newsSummary, earningsSummary, mainRisks, aiComment };
}

// ── Write-back to Apps Script ───────────────────────────────────────────────

async function writeBack(rows) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "updateWatchlistEnrichment", rows }),
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Apps Script write-back did not return JSON.");
  }
  if (!payload.ok) throw new Error(payload.error || "Apps Script write-back failed.");
  return payload;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function field(row, keys) {
  for (const key of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, key) && row[key] != null) {
      return row[key];
    }
  }
  return "";
}

function extractOpenAIText(responseJson) {
  if (!responseJson || typeof responseJson !== "object") return "";
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }
  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  for (const item of output) {
    if (!item || item.type !== "message") continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part && typeof part.text === "string" && part.text.trim()) return part.text.trim();
    }
  }
  return "";
}

function parseJsonObject(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return {};
      }
    }
    return {};
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}
