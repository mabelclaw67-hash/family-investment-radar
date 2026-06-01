const STATUS_REVIEW = /review|confirm|pending|watch|复核|待|确认/i;
const ACTIVE_STATUS  = /active|watch|template|正在|重点|监控/i;

// ── Alert severity tiers ──────────────────────────────────────────────────────
// HIGH ATTENTION — genuine shocks that warrant immediate awareness
const HIGH_ATTENTION_KEYWORDS =
  /\b(war|warfare|armed.?conflict|nuclear|military.?strike|sanction|banking.?crisis|bank.?run|bank.?collapse|market.?crash|circuit.?breaker|emergency.?cut|emergency.?hike|Fed.?emergency|debt.?default|sovereign.?default|trade.?war|tariff.?war|recession.?official|hyperinflation|OPEC.?cut|oil.?shock|geopolitical.?escalation|collapse)\b/i;

// REVIEW — significant macro events worth tracking
const REVIEW_KEYWORDS =
  /\b(Fed|Federal Reserve|interest.?rate|rate.?hike|rate.?cut|inflation|CPI|PCE|GDP|unemployment|jobs.?report|tariff|oil|gold|Bank.?of.?Canada|BoC|TSX|S&P|Nasdaq|bear.?market|credit.?rating|bond.?yield|Treasury|fiscal.?policy)\b/i;

// WATCH — general financial mentions (catch-all after above)
const WATCH_KEYWORDS =
  /\b(AI|Nvidia|OpenAI|tech|housing|tax|Canada.?policy|currency|commodity|lithium|mining|energy|EV|earnings|dividend|ETF|stock|equity|market)\b/i;

// ── Holdings sensitivity ──────────────────────────────────────────────────────
const TRACKED_HOLDINGS = ["VCNS", "VFV", "XUS"];

const HOLDING_KEYWORDS = {
  VCNS: /bond|interest.?rate|inflation|fixed.?income|rate.?hike|rate.?cut|yield|Fed|BoC|Bank.?of.?Canada|recession|credit|固收|债券|利率|通胀|衰退/i,
  VFV:  /S&P.?500|SP500|US.?market|equity|tech|AI|Nvidia|recession|bear|tariff|美股|科技|衰退|关税|贸易战/i,
  XUS:  /S&P.?500|SP500|US.?market|equity|tech|AI|Nvidia|recession|bear|tariff|hedge|美股|科技|衰退/i,
};

const MS_24H = 24 * 60 * 60 * 1000;
const MS_48H = 48 * 60 * 60 * 1000;
const MS_72H = 72 * 60 * 60 * 1000;

// ── Main model builder ────────────────────────────────────────────────────────

export function buildDashboardModel(source) {
  const holdings       = source.holdings       ?? [];
  const dailyNews      = source.dailyNews      ?? [];
  const watchlist      = source.watchlist      ?? [];
  const priorityAlerts = source.priorityAlerts ?? [];
  const settings       = source.settings       ?? [];
  const marketRadar    = source.marketRadar    ?? [];
  const morningBrief   = source.morningBrief   ?? null;

  const activeHoldings  = holdings.filter((row) => get(row, "持仓ID / Holding ID"));
  const activeWatchlist = watchlist.filter((row) => get(row, "观察ID / Watch ID"));

  // Sheet-based high-priority alerts (tab 08, non-pending rows)
  const sheetAlerts = priorityAlerts.filter((row) => {
    const priority = get(row, "提醒级别 / Alert Priority");
    const status   = get(row, "状态 / Status");
    const triggered = String(get(row, "是否已触发 / Triggered")).toLowerCase() === "yes";
    const reviewStatus = get(row, "人工处理状态 / Human Review Status");
    return (
      priority.includes("High") &&
      (!status || ACTIVE_STATUS.test(status)) &&
      (triggered || /review|high attention|已触发|触发/i.test(reviewStatus))
    );
  });

  // News-derived alerts with severity classification
  const newsAlerts = buildNewsAlerts(dailyNews);

  // Merged alerts: news-derived first, sheet alerts appended — cap at 10
  const mergedAlerts = [...newsAlerts, ...sheetAlerts].slice(0, 10);

  // Per-holding review status for VCNS / VFV / XUS
  const holdingStatuses = buildHoldingStatuses(dailyNews, marketRadar);
  const reviewCount = holdingStatuses.filter((h) => h.status !== "No Action").length;

  // Latest news for live panel (sorted newest-first, cap 20)
  const latestNews = dailyNews
    .filter((row) => get(row, "新闻标题中文 / Chinese Title"))
    .sort((a, b) => sortByDateTime(b, a))
    .slice(0, 20);

  // ── Latest Updates: count only last-24h news + active alerts + holdings updates
  const recent24hCount = countRecentNews(dailyNews);
  const latestUpdateCount = Math.min(20, recent24hCount) + sheetAlerts.length + reviewCount;
  const priorityAlertCount = mergedAlerts.filter(isPriorityAlert).length;

  return {
    source,
    kpis: {
      riskLevel:          getTodayRiskLevel(mergedAlerts, marketRadar, holdingStatuses),
      reviewCount,
      priorityAlertCount,
      latestUpdateCount,
    },
    holdings:       activeHoldings,
    news:           latestNews,
    watchlist:      activeWatchlist,
    alerts:         mergedAlerts,
    holdingStatuses,
    morningBrief: buildMorningBrief(morningBrief),
    settings,
    marketData:     marketRadar,
    summaries: buildSummaries(activeHoldings, activeWatchlist, mergedAlerts, settings),
  };
}

export function get(row, key) {
  return row?.[key] ?? "";
}

function buildMorningBrief(rows) {
  if (!rows) return [];

  if (!Array.isArray(rows)) {
    return rows.summary3Lines ? [rows] : [];
  }

  return rows
    .filter((row) => /^active$/i.test(String(get(row, "状态 / Status")).trim()))
    .filter(isMorningBriefType)
    .sort((a, b) => sortByBriefDate(b, a))
    .slice(0, 1);
}

function sortByBriefDate(a, b) {
  return parseBriefDate(get(a, "日期 / Date")) - parseBriefDate(get(b, "日期 / Date"));
}

function isMorningBriefType(row) {
  const type = String(get(row, "类型 / Type")).trim().toLowerCase();
  return !type || type === "morning brief" || type === "早晨晨报" || type === "早晨简报";
}

function isTodayMorningBrief(row) {
  return formatBriefDateKey(get(row, "日期 / Date")) === formatBriefDateKey(new Date());
}

function formatBriefDateKey(value) {
  const time = parseBriefDate(value);
  if (!time) return "";

  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseBriefDate(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();

  const text = String(value).trim();
  const match = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
  }

  const time = Date.parse(text);
  if (!Number.isNaN(time)) return time;

  return 0;
}

// ── Latest updates counter (last 24 hours) ────────────────────────────────────

function countRecentNews(dailyNews) {
  return dailyNews.filter((row) => {
    if (!get(row, "新闻标题中文 / Chinese Title")) return false;
    return isRecentNewsRow(row, MS_24H, MS_48H);
  }).length;
}

// ── News-derived alert builder ────────────────────────────────────────────────

function buildNewsAlerts(dailyNews) {
  const withTitle = dailyNews.filter(
    (row) =>
      (get(row, "新闻标题中文 / Chinese Title") || get(row, "原始标题 / Original Title")) &&
      isRecentNewsRow(row, MS_24H, MS_48H)
  );

  const matched = withTitle.filter((row) => {
    const text = (get(row, "新闻标题中文 / Chinese Title") || get(row, "原始标题 / Original Title"))
               + " " + get(row, "类别 / Category");
    return HIGH_ATTENTION_KEYWORDS.test(text) || REVIEW_KEYWORDS.test(text) || WATCH_KEYWORDS.test(text);
  });

  return matched
    .sort((a, b) => sortByDateTime(b, a))
    .slice(0, 8)
    .map((row) => {
      const title    = get(row, "新闻标题中文 / Chinese Title") || get(row, "原始标题 / Original Title");
      const category = get(row, "类别 / Category") || "新闻";
      const time     = formatAlertTime(get(row, "新闻时间 / News Time") || get(row, "日期 / Date"));
      const text     = title + " " + category;

      // Classify severity
      const severity = HIGH_ATTENTION_KEYWORDS.test(text)
        ? "High Attention"
        : REVIEW_KEYWORDS.test(text)
          ? "Review"
          : "Watch";

      return {
        "关注主题 / Watch Topic":               title,
        "最新中文摘要 / Latest Chinese Summary": `${category} · ${time}`,
        "人工处理状态 / Human Review Status":    severity,
        "提醒级别 / Alert Priority":             severity === "High Attention" ? "High" : "Medium",
        "状态 / Status":                        "Active",
        _source: "news",
        _severity: severity,
      };
    });
}

// ── Per-holding status builder ────────────────────────────────────────────────

function buildHoldingStatuses(dailyNews, marketRadar) {
  // Parse daily changes
  const marketMoves = {};
  marketRadar.forEach((row) => {
    const symbol = get(row, "代码 / Symbol");
    const change = parseFloat(get(row, "日变动% / Daily Change %"));
    if (symbol && !isNaN(change)) marketMoves[symbol] = change;
  });

  // Major US market drop (≥ 2%) escalates equity ETFs
  const usBigDrop = ["^DJI", "^IXIC", "^GSPC"].some(
    (sym) => (marketMoves[sym] ?? 0) <= -2.0
  );

  return TRACKED_HOLDINGS.map((ticker) => {
    const kw = HOLDING_KEYWORDS[ticker];
    const matchingNews = kw
      ? dailyNews.filter((row) => {
          const title = get(row, "新闻标题中文 / Chinese Title") || get(row, "原始标题 / Original Title");
          return kw.test(title) && isRecentNewsRow(row, MS_24H, MS_72H);
        })
      : [];

    const hasHighRisk = matchingNews.some((row) => /high|高/i.test(get(row, "风险等级 / Risk Level")));
    const hasCrisisNews = matchingNews.some((row) => {
      const title = get(row, "新闻标题中文 / Chinese Title") || get(row, "原始标题 / Original Title");
      return HIGH_ATTENTION_KEYWORDS.test(title);
    });

    const equityBigDrop = usBigDrop && (ticker === "VFV" || ticker === "XUS");

    let status = "No Action";
    if (hasCrisisNews || equityBigDrop || hasHighRisk) {
      status = "High Attention";
    } else if (matchingNews.length > 0) {
      status = "Review";
    }

    return { ticker, status, newsCount: matchingNews.length };
  });
}

// ── Risk level calculator ─────────────────────────────────────────────────────

function getTodayRiskLevel(alerts, marketRadar, holdingStatuses) {
  // Parse index moves
  const indexSymbols = ["^DJI", "^IXIC", "^GSPC", "^GSPTSE"];
  const marketMoves  = {};
  marketRadar.forEach((row) => {
    const symbol = get(row, "代码 / Symbol");
    const change = parseFloat(get(row, "日变动% / Daily Change %"));
    if (symbol && !isNaN(change)) marketMoves[symbol] = change;
  });

  const hasMarketData   = Object.keys(marketMoves).length > 0;
  // Severe drop: any major index down ≥ 2.5%
  const severeDrop      = indexSymbols.some((sym) => (marketMoves[sym] ?? 0) <= -2.5);
  // Moderate drop: any major index down ≥ 1.5%
  const moderateDrop    = indexSymbols.some((sym) => (marketMoves[sym] ?? 0) <= -1.5);

  // Alert severity breakdown
  const highAttentionAlerts = alerts.filter(
    (a) => get(a, "_severity") === "High Attention" ||
           get(a, "人工处理状态 / Human Review Status") === "High Attention"
  );
  const reviewAlerts = alerts.filter(
    (a) => get(a, "_severity") === "Review" ||
           get(a, "人工处理状态 / Human Review Status") === "Review"
  );
  const highAttentionHoldings = holdingStatuses.filter((h) => h.status === "High Attention");
  const reviewHoldings = holdingStatuses.filter((h) => h.status === "Review");

  // ── HIGH: real shock conditions only ──────────────────────────────────────
  if (
    severeDrop ||
    highAttentionAlerts.length >= 2 ||
    highAttentionHoldings.length >= 2 ||
    ((highAttentionAlerts.length >= 1 || highAttentionHoldings.length >= 1) && moderateDrop)
  ) {
    return { zh: "高", en: "High", tone: "high" };
  }

  // ── MEDIUM: notable but not alarming ─────────────────────────────────────
  if (
    moderateDrop ||
    highAttentionAlerts.length >= 1 ||
    highAttentionHoldings.length >= 1 ||
    reviewAlerts.length >= 3 ||
    reviewHoldings.length >= 2
  ) {
    return { zh: "中等", en: "Medium", tone: "medium" };
  }

  // ── LOW: stable conditions ────────────────────────────────────────────────
  if (holdingStatuses.length || hasMarketData) {
    return { zh: "低", en: "Low", tone: "low" };
  }

  return { zh: "暂无数据", en: "No Data", tone: "empty" };
}

// ── Summaries builder ─────────────────────────────────────────────────────────

function buildSummaries(holdings, watchlist, alerts, settings) {
  const mabelHoldings  = holdings.filter((row) => get(row, "所属人 / Owner") === "Mabel");
  const victorHoldings = holdings.filter((row) => get(row, "所属人 / Owner") === "Victor");
  const watchReview    = watchlist.filter((row) => STATUS_REVIEW.test(get(row, "需要行动 / Action Needed")));
  const noAutoRule     = settings.find((row) => get(row, "值 / Value") === "No Auto Trading");

  return {
    family: [
      ["持仓数量 / Holdings",        holdings.length],
      ["观察项目 / Watchlist",       watchlist.length],
      ["重点提醒 / Priority Alerts", alerts.length],
      ["风险原则 / Rule",            noAutoRule ? "只提醒，不自动交易" : "从 Settings 读取中"],
    ],
    mabel: mabelHoldings.slice(0, 5).map((row) => ({
      title: get(row, "代码 / Ticker") || get(row, "名称 / Name"),
      meta:  get(row, "风险等级 / Risk Level") || get(row, "状态 / Status") || "No Data",
    })),
    victor: [...victorHoldings, ...watchlist.filter((row) => get(row, "所属人 / Owner") === "Victor")]
      .slice(0, 6)
      .map((row) => ({
        title: get(row, "代码 / Ticker") || get(row, "名称 / Name"),
        meta:  get(row, "需要行动 / Action Needed") || get(row, "状态 / Status") || get(row, "风险等级 / Risk Level"),
      })),
    watchlist: watchlist.slice(0, 5).map((row) => ({
      title: get(row, "代码 / Ticker") || get(row, "名称 / Name"),
      meta:  get(row, "需要行动 / Action Needed") || get(row, "关注级别 / Watch Priority"),
    })),
    reminders: [...alerts, ...watchReview].slice(0, 5).map((row) => ({
      title: get(row, "关注主题 / Watch Topic") || get(row, "名称 / Name"),
      meta:  get(row, "人工处理状态 / Human Review Status") || get(row, "需要行动 / Action Needed") || "Review",
    })),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAlertTime(raw) {
  if (!raw) return "—";
  const iso = raw.match(/T(\d{2}:\d{2})/);
  if (iso) return iso[1];
  const hhmm = raw.match(/^(\d{2}:\d{2})/);
  if (hhmm) return hhmm[1];
  return String(raw).slice(0, 10) || "—";
}

function isRecentNewsRow(row, isoThresholdMs, dateOnlyThresholdMs) {
  const now = Date.now();
  const createdAt = get(row, "创建时间 / Created At");
  if (createdAt) {
    const ts = Date.parse(createdAt);
    if (!isNaN(ts)) return (now - ts) <= isoThresholdMs;
  }

  const timeRaw = get(row, "新闻时间 / News Time");
  if (timeRaw) {
    const ts = Date.parse(timeRaw);
    if (!isNaN(ts)) return (now - ts) <= isoThresholdMs;
  }

  const dateRaw = get(row, "日期 / Date");
  if (dateRaw) {
    const m = String(dateRaw).match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) {
      const ts = Date.parse(m[1]);
      if (!isNaN(ts)) return (now - ts) <= dateOnlyThresholdMs;
    }
  }

  return false;
}

function isHighAttentionAlert(alert) {
  return get(alert, "_severity") === "High Attention" ||
    get(alert, "人工处理状态 / Human Review Status") === "High Attention";
}

function isPriorityAlert(alert) {
  return isHighAttentionAlert(alert) ||
    get(alert, "_severity") === "Review" ||
    get(alert, "人工处理状态 / Human Review Status") === "Review";
}

function sortByDateTime(a, b) {
  const valueA = `${get(a, "日期 / Date")} ${get(a, "新闻时间 / News Time")}`;
  const valueB = `${get(b, "日期 / Date")} ${get(b, "新闻时间 / News Time")}`;
  return valueA.localeCompare(valueB);
}
