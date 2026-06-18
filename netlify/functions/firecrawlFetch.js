const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Use POST." });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { ok: false, error: "FIRECRAWL_API_KEY is not configured." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
  }

  const url = String(body.url || "").trim();
  const parsedUrl = parseAllowedUrl(url);
  if (!parsedUrl) {
    return jsonResponse(400, { ok: false, error: "Missing or invalid url." });
  }

  try {
    const firecrawlResponse = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: parsedUrl.toString(),
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const payload = await firecrawlResponse.json();
    if (!firecrawlResponse.ok || payload.success === false) {
      return jsonResponse(firecrawlResponse.status || 502, {
        ok: false,
        error: payload.error || "Firecrawl scrape failed.",
      });
    }

    const data = payload.data || {};
    const metadata = data.metadata || {};

    return jsonResponse(200, {
      ok: true,
      markdown: data.markdown || "",
      title: metadata.title || "",
      sourceUrl: metadata.sourceURL || metadata.url || parsedUrl.toString(),
    });
  } catch (error) {
    return jsonResponse(502, {
      ok: false,
      error: error.message || "Firecrawl request failed.",
    });
  }
}

function parseAllowedUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
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
