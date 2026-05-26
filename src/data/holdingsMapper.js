import { get } from "./dashboardMapper.js";

// Labels are resolved via i18n in components.js using t('filter_' + id)
export const HOLDING_FILTERS = [
  "all",
  "Mabel",
  "Victor",
  "ETF",
  "Stock",
  "highRisk",
  "review",
];

export function buildHoldingsModel(source, filter = "all", selectedId = "") {
  const holdings = (source.holdings ?? []).filter((row) =>
    get(row, "持仓ID / Holding ID")
  );
  const holdingResearch = source.holdingResearch ?? [];
  const dailyNews = source.dailyNews ?? [];
  const filteredHoldings = filterHoldings(holdings, filter);
  const selectedHolding =
    filteredHoldings.find((row) => get(row, "持仓ID / Holding ID") === selectedId) ||
    filteredHoldings[0] ||
    holdings[0] ||
    null;

  return {
    filter,
    holdings,
    filteredHoldings,
    selectedHolding,
    researchError: source.researchError || "",
    summary: {
      total: holdings.length,
      mabel: holdings.filter((row) => get(row, "所属人 / Owner") === "Mabel").length,
      victor: holdings.filter((row) => get(row, "所属人 / Owner") === "Victor").length,
      needReview: holdings.filter(needsReview).length,
    },
    selectedResearch: selectedHolding
      ? findResearch(selectedHolding, holdingResearch)
      : null,
    relatedNews: selectedHolding
      ? findRelatedNews(selectedHolding, dailyNews).slice(0, 5)
      : [],
  };
}

export function filterHoldings(holdings, filter) {
  if (filter === "all") return holdings;

  return holdings.filter((row) => {
    const owner = get(row, "所属人 / Owner");
    const type = get(row, "类型 / Type");
    const risk = get(row, "风险等级 / Risk Level");

    if (["Mabel", "Victor"].includes(filter)) return owner === filter;
    if (["ETF", "Stock"].includes(filter)) return type === filter;
    if (filter === "highRisk") return risk.includes("High");
    if (filter === "review") return needsReview(row);
    return true;
  });
}

export function needsReview(row) {
  const action = deriveActionLabel(row);
  return action === "Review" || action === "High Attention";
}

export function deriveActionLabel(row) {
  const explicit = get(row, "需要行动 / Action Needed");
  if (["No Action", "Review", "High Attention"].includes(explicit)) return explicit;

  const risk = get(row, "风险等级 / Risk Level");
  const status = get(row, "状态 / Status");
  if (risk.includes("High")) return "High Attention";
  if (/review|watch|confirm|pending|待|复核|确认/i.test(status)) return "Review";
  return "No Action";
}

export function displayValue(value, fallback = "—") {
  return value && String(value).trim() ? value : fallback;
}

export function displayMarketValue(value) {
  return value && String(value).trim() ? value : "—";
}

function findResearch(holding, researchRows) {
  const ticker = get(holding, "代码 / Ticker").toUpperCase();
  return researchRows.find(
    (row) => get(row, "代码 / Ticker").toUpperCase() === ticker
  );
}

function findRelatedNews(holding, newsRows) {
  const ticker = get(holding, "代码 / Ticker");
  if (!ticker) return [];

  return newsRows
    .filter((row) => {
      const haystack = [
        get(row, "相关代码 / Related Ticker"),
        get(row, "新闻摘要中文 / Chinese Summary"),
        get(row, "AI中文点评 / AI Chinese Comment"),
      ].join(" ");
      return haystack.toUpperCase().includes(ticker.toUpperCase());
    })
    .sort((a, b) => {
      const valueA = `${get(a, "日期 / Date")} ${get(a, "新闻时间 / News Time")}`;
      const valueB = `${get(b, "日期 / Date")} ${get(b, "新闻时间 / News Time")}`;
      return valueB.localeCompare(valueA);
    });
}
