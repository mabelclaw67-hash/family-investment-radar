import { appendMarketTrendRecord } from "./marketTrendSheetStore.js";

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";
const SOURCE_MARKDOWN_LIMIT = 6000;

const SOURCES = [
  "https://www.bankofcanada.ca/",
  "https://www.cnbc.com/markets/",
  "https://www.reuters.com/markets/",
];

export async function generateAndSaveMarketTrendSummary(generatedBy = "manual") {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const openaiKey = getOpenAiKey();

  if (!firecrawlKey) {
    throw statusError(500, "FIRECRAWL_API_KEY is not configured.");
  }

  if (!openaiKey) {
    throw statusError(500, "OPENAI_API_KEY is not configured.");
  }

  const sourceResults = await Promise.all(SOURCES.map((url) => scrapeSource(url, firecrawlKey)));
  const successfulSources = sourceResults.filter((item) => item.ok && item.markdown);

  if (!successfulSources.length) {
    throw statusError(502, "No market sources could be scraped.", {
      sources: sourceResults.map(redactSourceResult),
    });
  }

  const openAiResult = await generateSummary(successfulSources, openaiKey);
  const sources = sourceResults.map(redactSourceResult);

  if (!openAiResult.text) {
    const errorSummary = normalizeSummary({}, successfulSources.length);
    const errorRecord = buildSheetRecord({
      summary: errorSummary,
      rawSummary: { error: "No assistant text extracted" },
      sources,
      sourceCount: successfulSources.length,
      generatedBy,
      status: "ERROR",
      notes: "No assistant text extracted",
    });
    await appendMarketTrendRecord(errorRecord);
    throw statusError(502, "No assistant text extracted", { sources });
  }

  let rawSummary;
  try {
    rawSummary = parseOpenAiSummaryText(openAiResult.text);
  } catch (error) {
    const errorSummary = normalizeSummary({}, successfulSources.length);
    const errorRecord = buildSheetRecord({
      summary: errorSummary,
      rawSummary: { error: error.message || "AI JSON parse failed", assistantText: openAiResult.text },
      sources,
      sourceCount: successfulSources.length,
      generatedBy,
      status: "ERROR",
      notes: error.message || "AI JSON parse failed",
    });
    await appendMarketTrendRecord(errorRecord);
    throw statusError(502, error.message || "AI JSON parse failed", { sources });
  }

  const summary = normalizeSummary(rawSummary, successfulSources.length);
  const sheetRecord = buildSheetRecord({
    summary,
    rawSummary,
    sources,
    sourceCount: successfulSources.length,
    generatedBy,
  });

  const appendResult = await appendMarketTrendRecord(sheetRecord);
  const payload = {
    summary,
    sources,
    updatedAt: summary.updatedAt,
    savedAt: summary.updatedAt,
    sourceCount: successfulSources.length,
    generatedBy,
    recordId: appendResult.recordId || sheetRecord.record_id,
  };

  return {
    ...payload,
    saved: true,
    saveWarning: "",
    saveWarningZh: "",
  };
}

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || process.env.HEALTH_PASSPORT_OPENAI_API_KEY || "";
}

async function scrapeSource(url, apiKey) {
  try {
    const response = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      }),
    });

    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      return {
        ok: false,
        url,
        error: payload.error || `Firecrawl returned HTTP ${response.status}`,
      };
    }

    const data = payload.data || {};
    const metadata = data.metadata || {};
    return {
      ok: true,
      url,
      title: metadata.title || "",
      sourceUrl: metadata.sourceURL || metadata.url || url,
      markdown: String(data.markdown || "").slice(0, SOURCE_MARKDOWN_LIMIT),
    };
  } catch (error) {
    return {
      ok: false,
      url,
      error: error.message || "Firecrawl request failed.",
    };
  }
}

async function generateSummary(sources, apiKey) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_output_tokens: 12000,
      reasoning: {
        effort: "minimal",
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "你是一个面向华人投资者的每日公开市场趋势分析助手。",
                "你的风格要清晰、谨慎、有解释力，适合首页阅读。",
                "只分析公开市场信息，不提供具体买入、卖出、持有建议。",
                "必须区分事实观察、趋势判断、风险提示。",
                "每条都要说明原因或影响路径，不要只写涨跌，但句子要短。",
                "不要编造来源没有支持的信息；信息不足时写明不确定。",
                "必须只输出严格 JSON 对象。",
                "不要输出 markdown。",
                "不要输出代码块。",
                "不要输出解释文字。",
                "不要在 JSON 前后添加任何字符。",
                "输出必须是自然中文 JSON；如果信息不足，可以留空数组。",
              ].join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(sources),
            },
          ],
        },
      ],
      text: {
        format: { type: "json_object" },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI returned HTTP ${response.status}`);
  }

  return {
    text: extractOpenAIText(payload),
    responseId: payload.id || "",
  };
}

function buildPrompt(sources) {
  const sourceText = sources.map((source, index) => {
    return [
      `SOURCE ${index + 1}`,
      `Title: ${source.title || "Untitled"}`,
      `URL: ${source.sourceUrl || source.url}`,
      "Markdown:",
      source.markdown,
    ].join("\n");
  }).join("\n\n---\n\n");

  return [
    "请根据以下公开来源生成一份每日投资趋势分析报告。",
    "要求：",
    "1. 只做市场信息分析，不提供买卖建议，不使用“应该买入/卖出”。",
    "2. 尽量为每个板块输出 facts、trendJudgment、riskNotes 三组。",
    "3. 每组最多 3 条；每条不超过 32 个中文汉字。信息不足可返回空数组。",
    "4. marketOverview 给出今日市场总判断，兼顾美国、加拿大和宏观情绪。",
    "5. usMarket 分析美股指数、科技股、利率预期、盈利预期或资金情绪。",
    "6. canadaMarket 分析加拿大利率、银行、能源、资源股、加元或本地市场情绪。",
    "7. macroPolicy 分析央行、通胀、就业、债券收益率、汇率等影响。",
    "8. sectorRotation 分析行业板块强弱变化和资金偏好。",
    "9. keyMovers 提及公开来源中出现的重点股票、ETF 或资产类别异动；不确定时说明来源不足。",
    "10. riskSignals 聚焦可能影响未来几天市场的风险。",
    "11. conservativeInvestorNotes 用保守投资者能理解的语言提醒如何看待波动，但不提出交易动作。",
    "12. watchNext 写未来 24-72 小时需要关注的信息点。",
    "13. 不需要输出 updatedAt，服务端会统一补充时间。",
    "14. 严格按这个 JSON 结构输出，不要增加外层包装：",
    JSON.stringify({
      marketOverview: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      usMarket: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      canadaMarket: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      macroPolicy: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      sectorRotation: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      keyMovers: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      riskSignals: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      conservativeInvestorNotes: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
      watchNext: { summary: "", facts: [], trendJudgment: [], riskNotes: [] },
    }),
    "",
    sourceText,
  ].join("\n");
}

export function extractOpenAIText(responseJson) {
  if (!responseJson || typeof responseJson !== "object") return "";
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  for (const item of output) {
    if (!item || item.type !== "message" || item.role !== "assistant") continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      if (part.type === "output_text" && typeof part.text === "string") {
        return part.text.trim();
      }
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
}

function parseOpenAiSummaryText(text) {
  const jsonText = extractJsonObjectText(text);
  return parseLooseJson(jsonText);
}

export function normalizeSummary(rawSummary, sourceCount = 0) {
  const source = rawSummary && typeof rawSummary === "object" ? rawSummary : {};
  return {
    marketOverview: normalizeSection(source.marketOverview),
    usMarket: normalizeSection(source.usMarket),
    canadaMarket: normalizeSection(source.canadaMarket),
    macroPolicy: normalizeSection(source.macroPolicy),
    sectorRotation: normalizeSection(source.sectorRotation),
    keyMovers: normalizeSection(source.keyMovers),
    riskSignals: normalizeSection(source.riskSignals),
    conservativeInvestorNotes: normalizeSection(source.conservativeInvestorNotes),
    watchNext: normalizeSection(source.watchNext),
    updatedAt: new Date().toISOString(),
    sourceCount,
  };
}

function buildSheetRecord({
  summary,
  rawSummary,
  sources,
  sourceCount,
  generatedBy,
  status = "PUBLISHED",
  notes = "Generated by Family Investment Radar AI market trend function.",
}) {
  return {
    record_id: `AIT-${summary.updatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    report_date: summary.updatedAt.slice(0, 10),
    updated_at: summary.updatedAt,
    generated_by: generatedBy,
    status,
    language: "zh",
    market_overview: sectionToText(summary.marketOverview),
    us_market: sectionToText(summary.usMarket),
    canada_market: sectionToText(summary.canadaMarket),
    macro_policy: sectionToText(summary.macroPolicy),
    sector_rotation: sectionToText(summary.sectorRotation),
    key_movers: sectionToText(summary.keyMovers),
    risk_signals: sectionToText(summary.riskSignals),
    conservative_notes: sectionToText(summary.conservativeInvestorNotes),
    watch_next: sectionToText(summary.watchNext),
    sources_count: String(sourceCount),
    sources: sources.map((source) => source.sourceUrl || source.url).filter(Boolean).join("\n"),
    raw_json: JSON.stringify(rawSummary || summary),
    public_visible: "TRUE",
    notes,
  };
}

function sectionToText(section = {}) {
  const lines = [];
  if (section.summary) lines.push(section.summary);
  appendTextGroup(lines, "事实观察", section.facts);
  appendTextGroup(lines, "趋势判断", section.trendJudgment);
  appendTextGroup(lines, "风险提示", section.riskNotes);
  return lines.join("\n");
}

function appendTextGroup(lines, label, items = []) {
  if (!items.length) return;
  lines.push(`${label}:`);
  items.forEach((item) => lines.push(`- ${item}`));
}

function normalizeSection(section) {
  const source = section && typeof section === "object" ? section : {};
  const trendItems = firstArray(source.trendJudgment, source.trends, source.drivers);
  const riskItems = firstArray(source.riskNotes, source.risks, source.notes);

  return {
    summary: typeof source.summary === "string" ? source.summary : "",
    facts: normalizeArray(source.facts),
    trendJudgment: normalizeArray(trendItems),
    riskNotes: normalizeArray(riskItems),
    trends: normalizeArray(source.trends),
    risks: normalizeArray(source.risks),
    drivers: normalizeArray(source.drivers),
    sectors: normalizeArray(source.sectors),
    notes: normalizeArray(source.notes),
  };
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function extractJsonObjectText(text) {
  const trimmed = String(text || "").trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) return fencedMatch[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function parseLooseJson(text) {
  const source = String(text || "").trim();
  try {
    return JSON.parse(source);
  } catch {
    const repaired = source
      .replace(/^\uFEFF/, "")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();
    return JSON.parse(repaired);
  }
}

function redactSourceResult(result) {
  return {
    ok: Boolean(result.ok),
    url: result.url,
    title: result.title || "",
    sourceUrl: result.sourceUrl || result.url,
    error: result.error || "",
  };
}

function statusError(statusCode, message, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
}
