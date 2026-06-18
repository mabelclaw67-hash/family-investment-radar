const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

const SOURCES = [
  "https://www.bankofcanada.ca/",
  "https://www.cnbc.com/markets/",
  "https://www.reuters.com/markets/",
];

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Use POST." });
  }

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const openaiKey = getOpenAiKey();

  if (!firecrawlKey) {
    return jsonResponse(500, { ok: false, error: "FIRECRAWL_API_KEY is not configured." });
  }

  if (!openaiKey) {
    return jsonResponse(500, { ok: false, error: "OPENAI_API_KEY is not configured." });
  }

  const sourceResults = await Promise.all(SOURCES.map((url) => scrapeSource(url, firecrawlKey)));
  const successfulSources = sourceResults.filter((item) => item.ok && item.markdown);

  if (!successfulSources.length) {
    return jsonResponse(502, {
      ok: false,
      error: "No market sources could be scraped.",
      sources: sourceResults.map(redactSourceResult),
    });
  }

  try {
    const summary = await generateSummary(successfulSources, openaiKey);
    return jsonResponse(200, {
      ok: true,
      summary: {
        ...summary,
        updatedAt: summary.updatedAt || new Date().toISOString(),
      },
      sources: sourceResults.map(redactSourceResult),
    });
  } catch (error) {
    return jsonResponse(502, {
      ok: false,
      error: error.message || "OpenAI summary failed.",
      sources: sourceResults.map(redactSourceResult),
    });
  }
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
      markdown: String(data.markdown || "").slice(0, 12000),
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
      max_output_tokens: 1200,
      reasoning: {
        effort: "low",
      },
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "你是一个保守、谨慎的公开市场信息分析助手。",
                "只总结公开市场趋势，不提供买入、卖出、持有建议。",
                "不要编造数据；如果来源内容不足，请明确说明不确定。",
                "输出必须是中文 JSON，严格符合 schema。",
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
        format: {
          type: "json_schema",
          name: "market_trend_summary",
          strict: true,
          schema: summarySchema(),
        },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI returned HTTP ${response.status}`);
  }

  const outputText = payload.output_text || extractOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI returned no summary text.");
  }

  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }
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
    "请根据以下公开来源生成今日市场趋势摘要。",
    "要求：",
    "1. 只做信息摘要，不提供投资建议。",
    "2. direction 用简短中文，例如：偏强、震荡、偏弱、不确定。",
    "3. drivers / leadingSectors / riskSignals / watchItems 都用简短中文项目。",
    "4. 如果无法判断 leadingSectors，可以返回空数组。",
    "5. updatedAt 使用当前 ISO 时间。",
    "",
    sourceText,
  ].join("\n");
}

function summarySchema() {
  const marketBlock = {
    type: "object",
    additionalProperties: false,
    required: ["direction", "summary", "drivers", "leadingSectors", "riskSignals"],
    properties: {
      direction: { type: "string" },
      summary: { type: "string" },
      drivers: { type: "array", items: { type: "string" } },
      leadingSectors: { type: "array", items: { type: "string" } },
      riskSignals: { type: "array", items: { type: "string" } },
    },
  };

  return {
    type: "object",
    additionalProperties: false,
    required: ["usMarket", "canadaMarket", "watchItems", "updatedAt"],
    properties: {
      usMarket: marketBlock,
      canadaMarket: marketBlock,
      watchItems: { type: "array", items: { type: "string" } },
      updatedAt: { type: "string" },
    },
  };
}

function extractOutputText(payload) {
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n");
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

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
