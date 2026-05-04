import { get } from "./dashboardMapper.js";

export function buildWatchlistModel(source, selectedId = "") {
  const watchlist = (source.watchlist ?? []).filter(
    (row) => get(row, "观察ID / Watch ID") || get(row, "代码 / Ticker")
  );
  const dailyNews = source.dailyNews ?? [];
  const marketRadar = source.marketRadar ?? [];
  const holdingResearch = source.holdingResearch ?? [];

  const summary = {
    total: watchlist.length,
    mabel: watchlist.filter((r) => get(r, "所属人 / Owner") === "Mabel").length,
    victor: watchlist.filter((r) => get(r, "所属人 / Owner") === "Victor").length,
    highPriority: watchlist.filter((r) =>
      (get(r, "关注级别 / Watch Priority") || "").includes("High")
    ).length,
  };

  let popupData = null;
  if (selectedId) {
    const item = watchlist.find(
      (r) =>
        (get(r, "观察ID / Watch ID") || get(r, "代码 / Ticker")) === selectedId
    );
    if (item) {
      const ticker = get(item, "代码 / Ticker");
      popupData = {
        item,
        marketData: findMarketData(ticker, marketRadar),
        relatedNews: findRelatedNewsForWatchItem(item, dailyNews).slice(0, 5),
        research: findResearch(ticker, holdingResearch),
      };
    }
  }

  return { watchlist, summary, popupData };
}

function findMarketData(ticker, marketRows) {
  if (!ticker) return null;
  const upper = ticker.toUpperCase();
  return (
    marketRows.find(
      (r) => (get(r, "代码 / Symbol") || "").toUpperCase() === upper
    ) || null
  );
}

export function findRelatedNews(ticker, newsRows) {
  if (!ticker) return [];
  const upper = ticker.toUpperCase();
  return newsRows
    .filter((row) => {
      const haystack = [
        get(row, "相关代码 / Related Ticker"),
        get(row, "新闻标题中文 / Chinese Title"),
        get(row, "新闻摘要中文 / Chinese Summary"),
        get(row, "原始标题 / Original Title"),
        get(row, "抓取关键词 / Search Keyword"),
      ]
        .join(" ")
        .toUpperCase();
      return haystack.includes(upper);
    })
    .sort((a, b) => {
      const va = `${get(a, "日期 / Date")} ${get(a, "新闻时间 / News Time")}`;
      const vb = `${get(b, "日期 / Date")} ${get(b, "新闻时间 / News Time")}`;
      return vb.localeCompare(va);
    });
}

export function findRelatedNewsForWatchItem(item, newsRows) {
  const ticker = get(item, "代码 / Ticker");
  const name = get(item, "名称 / Name");
  const reason = get(item, "观察原因 / Watch Reason");
  const sector = get(item, "板块 / Sector");
  const keyQuestion = get(item, "目标问题 / Key Question");

  const terms = buildSearchTerms([ticker, name, reason, sector, keyQuestion]);
  if (!terms.length) return [];

  return newsRows
    .filter((row) => {
      const haystack = [
        get(row, "相关代码 / Related Ticker"),
        get(row, "新闻标题中文 / Chinese Title"),
        get(row, "新闻摘要中文 / Chinese Summary"),
        get(row, "AI中文点评 / AI Chinese Comment"),
        get(row, "原始标题 / Original Title"),
        get(row, "抓取关键词 / Search Keyword"),
      ]
        .join(" ")
        .toUpperCase();
      return terms.some((term) => haystack.includes(term));
    })
    .sort((a, b) => {
      const va = `${get(a, "日期 / Date")} ${get(a, "新闻时间 / News Time")}`;
      const vb = `${get(b, "日期 / Date")} ${get(b, "新闻时间 / News Time")}`;
      return vb.localeCompare(va);
    });
}

function buildSearchTerms(values) {
  const stopWords = new Set([
    "KEYWORD",
    "WATCH",
    "STOCK",
    "STOCKS",
    "NEW",
    "IDEA",
    "INDUSTRY",
    "ACTIVE",
    "REVIEW",
    "PENDING",
    "TEST",
    "DISPLAY",
    "DATA",
    "ITEM",
    "ONLY",
    "N/A",
  ]);

  const terms = new Set();
  values
    .filter(Boolean)
    .join(" ")
    .split(/[^A-Za-z0-9.]+/)
    .map((term) => term.trim().toUpperCase())
    .filter((term) => term.length >= 3 && !stopWords.has(term))
    .forEach((term) => terms.add(term));

  return [...terms];
}

export function findResearch(ticker, researchRows) {
  if (!ticker) return null;
  const upper = ticker.toUpperCase();
  return (
    researchRows.find(
      (r) => (get(r, "代码 / Ticker") || "").toUpperCase() === upper
    ) || null
  );
}
