import { get } from "./dashboardMapper.js";

const ACTIVE_STATUS_BLOCKLIST = /archived|closed|sold|inactive|已卖出|归档|关闭|不活跃/i;
const EMPTY_EVENT = /^(n\/a|na|no|none|无|否|-|—)$/i;
const RISK_ORDER = { High: 0, Medium: 1, Low: 2 };
const ACTION_ORDER = { "High Attention": 0, Review: 1, Watch: 2, "No action": 3, "No Action": 3 };

export function buildDailyPortfolioIntelligenceModel(source) {
  const holdings = (source.holdings ?? []).filter(isActiveHolding);
  const rows = (source.dailyHoldingIntelligence ?? []).filter((row) => get(row, "日期 / Date"));
  const selectedDate = pickBriefDate(rows);
  const briefRows = selectedDate
    ? rows.filter((row) => normalizeDateKey(get(row, "日期 / Date")) === selectedDate.key)
    : [];
  const byTicker = new Map();
  briefRows.forEach((row) => {
    const ticker = normalizeTicker(get(row, "代码 / Ticker"));
    if (ticker && !byTicker.has(ticker)) byTicker.set(ticker, row);
  });

  const mergedHoldings = holdings.map((holding) => {
    const ticker = normalizeTicker(get(holding, "代码 / Ticker"));
    const intelligence = byTicker.get(ticker) || null;
    return {
      holding,
      intelligence,
      owner: get(holding, "所属人 / Owner") || get(intelligence, "所属人 / Owner") || "Unassigned",
      ticker: get(holding, "代码 / Ticker") || get(intelligence, "代码 / Ticker"),
      name: get(holding, "名称 / Name") || get(intelligence, "名称 / Name"),
      market: get(holding, "市场 / Market") || get(intelligence, "市场 / Market"),
      assetType: get(holding, "类型 / Type") || get(intelligence, "资产类型 / Asset Type"),
      priceChange: get(intelligence, "价格变动% / Price Change %"),
      macroImpact: get(intelligence, "宏观影响 / Macro Impact"),
      newsEvent: get(intelligence, "新闻事件 / News Event"),
      earningsEvent: get(intelligence, "财报事件 / Earnings Event"),
      chineseSummary: get(intelligence, "中文新闻摘要 / Chinese News Summary"),
      aiComment: get(intelligence, "AI中文点评 / AI Chinese Comment"),
      riskLevel: normalizeRisk(get(intelligence, "风险等级 / Risk Level") || get(holding, "风险等级 / Risk Level")),
      actionNeeded: normalizeAction(get(intelligence, "需要行动 / Action Needed") || get(holding, "需要行动 / Action Needed")),
      sourceLink1: get(intelligence, "来源链接1 / Source Link 1"),
      sourceLink2: get(intelligence, "来源链接2 / Source Link 2"),
      dataSource: get(intelligence, "数据来源 / Data Source"),
      reviewStatus: get(intelligence, "复核状态 / Review Status"),
      generatedAt: get(intelligence, "生成时间 / Generated At"),
      notes: get(intelligence, "备注 / Notes"),
      sectorTrend: extractNotePart(get(intelligence, "备注 / Notes"), "行业趋势"),
      tomorrowFocus: extractNotePart(get(intelligence, "备注 / Notes"), "明日关注"),
    };
  });

  const macroImpacts = uniqueNonEmpty(briefRows.map((row) => get(row, "宏观影响 / Macro Impact")));
  const sectorTrends = uniqueNonEmpty(mergedHoldings.map((item) => item.sectorTrend));
  const tomorrowFocus = uniqueNonEmpty(mergedHoldings.map((item) => item.tomorrowFocus));
  const groupedByOwner = groupByOwner(mergedHoldings);
  const earningsEvents = mergedHoldings
    .filter((item) => hasRealEvent(item.earningsEvent))
    .sort(comparePriority);
  const riskAlerts = mergedHoldings
    .filter((item) => item.riskLevel || isActionPriority(item.actionNeeded))
    .sort(comparePriority);

  return {
    hasAnyRows: rows.length > 0,
    selectedDate: selectedDate?.display || "",
    isToday: Boolean(selectedDate?.isToday),
    holdings,
    briefRows,
    macroImpacts,
    sectorTrends,
    tomorrowFocus,
    groupedByOwner,
    earningsEvents,
    riskAlerts,
    summary: {
      activeHoldings: holdings.length,
      briefRows: briefRows.length,
      highRisk: mergedHoldings.filter((item) => item.riskLevel === "High").length,
      actionNeeded: mergedHoldings.filter((item) => isActionPriority(item.actionNeeded)).length,
    },
  };
}

function extractNotePart(notes, label) {
  const text = String(notes || "").trim();
  if (!text) return "";
  const pattern = new RegExp(`${escapeRegex(label)}\\s*:\\s*([^|]+)`, "i");
  const match = text.match(pattern);
  return match ? match[1].trim() : "";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isActiveHolding(row) {
  const hasId = get(row, "持仓ID / Holding ID") || get(row, "代码 / Ticker");
  if (!hasId) return false;
  const status = get(row, "状态 / Status");
  return !ACTIVE_STATUS_BLOCKLIST.test(status);
}

function pickBriefDate(rows) {
  if (!rows.length) return null;
  const today = localDateKey();
  const mapped = rows
    .map((row) => {
      const raw = get(row, "日期 / Date");
      const key = normalizeDateKey(raw);
      return key ? { key, display: raw || key, isToday: key === today } : null;
    })
    .filter(Boolean);
  const todayRecord = mapped.find((item) => item.key === today);
  if (todayRecord) return todayRecord;
  return mapped.sort((a, b) => b.key.localeCompare(a.key))[0] || null;
}

function normalizeDateKey(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const mdy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdy) {
    const year = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return `${year}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  }
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return raw;
}

function localDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function groupByOwner(items) {
  return ["Mabel", "Victor", "Both", "Unassigned"].map((owner) => ({
    owner,
    items: items.filter((item) => item.owner === owner),
  })).filter((group) => group.items.length);
}

function uniqueNonEmpty(values) {
  const seen = new Set();
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function hasRealEvent(value) {
  const text = String(value || "").trim();
  return Boolean(text) && !EMPTY_EVENT.test(text);
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeRisk(value) {
  const text = String(value || "").trim();
  if (/high|高/i.test(text)) return "High";
  if (/medium|中/i.test(text)) return "Medium";
  if (/low|低/i.test(text)) return "Low";
  return text;
}

function normalizeAction(value) {
  const text = String(value || "").trim();
  if (/high attention|高/i.test(text)) return "High Attention";
  if (/review|复核|检查/i.test(text)) return "Review";
  if (/watch|观察/i.test(text)) return "Watch";
  if (/no action|none|无需|无/i.test(text)) return "No Action";
  return text || "No Action";
}

function comparePriority(a, b) {
  const risk = (RISK_ORDER[a.riskLevel] ?? 9) - (RISK_ORDER[b.riskLevel] ?? 9);
  if (risk !== 0) return risk;
  return (ACTION_ORDER[a.actionNeeded] ?? 9) - (ACTION_ORDER[b.actionNeeded] ?? 9);
}

function isActionPriority(action) {
  return action === "Review" || action === "High Attention";
}
