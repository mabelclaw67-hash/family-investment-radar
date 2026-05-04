const STATUS_REVIEW = /review|confirm|pending|watch|复核|待|确认/i;
const ACTIVE_STATUS = /active|watch|template|正在|重点|监控/i;

export function buildDashboardModel(source) {
  const holdings = source.holdings ?? [];
  const dailyNews = source.dailyNews ?? [];
  const watchlist = source.watchlist ?? [];
  const priorityAlerts = source.priorityAlerts ?? [];
  const settings = source.settings ?? [];
  const marketRadar = source.marketRadar ?? [];

  const activeHoldings = holdings.filter((row) => get(row, "持仓ID / Holding ID"));
  const activeWatchlist = watchlist.filter((row) => get(row, "观察ID / Watch ID"));
  const activeAlerts = priorityAlerts.filter((row) => get(row, "提醒ID / Alert ID"));

  const highPriorityAlerts = activeAlerts.filter((row) => {
    const priority = get(row, "提醒级别 / Alert Priority");
    const status = get(row, "状态 / Status");
    return priority.includes("High") && (!status || ACTIVE_STATUS.test(status));
  });

  const reviewHoldings = activeHoldings.filter((row) => {
    return STATUS_REVIEW.test(get(row, "状态 / Status")) || !get(row, "最后复核 / Last Reviewed");
  });

  const latestNews = dailyNews
    .filter((row) => get(row, "新闻标题中文 / Chinese Title"))
    .sort((a, b) => sortByDateTime(b, a))
    .slice(0, 10);

  return {
    source,
    kpis: {
      riskLevel: getTodayRiskLevel(activeHoldings, highPriorityAlerts),
      reviewCount: reviewHoldings.length,
      priorityAlertCount: highPriorityAlerts.length,
      latestUpdateCount: latestNews.length,
    },
    holdings: activeHoldings,
    news: latestNews,
    watchlist: activeWatchlist,
    alerts: highPriorityAlerts,
    settings,
    marketData: marketRadar,
    summaries: buildSummaries(activeHoldings, activeWatchlist, highPriorityAlerts, settings),
  };
}

export function get(row, key) {
  return row?.[key] ?? "";
}

function getTodayRiskLevel(holdings, alerts) {
  const highHoldings = holdings.some((row) => get(row, "风险等级 / Risk Level").includes("High"));
  const highAlerts = alerts.some((row) => get(row, "提醒级别 / Alert Priority").includes("High"));
  if (highHoldings || highAlerts) return { zh: "高", en: "High", tone: "high" };

  const mediumHoldings = holdings.some((row) => get(row, "风险等级 / Risk Level").includes("Medium"));
  if (mediumHoldings) return { zh: "中等", en: "Medium", tone: "medium" };

  if (holdings.length) return { zh: "低", en: "Low", tone: "low" };
  return { zh: "暂无数据", en: "No Data", tone: "empty" };
}

function buildSummaries(holdings, watchlist, alerts, settings) {
  const mabelHoldings = holdings.filter((row) => get(row, "所属人 / Owner") === "Mabel");
  const victorHoldings = holdings.filter((row) => get(row, "所属人 / Owner") === "Victor");
  const watchReview = watchlist.filter((row) => STATUS_REVIEW.test(get(row, "需要行动 / Action Needed")));
  const noAutoRule = settings.find((row) => get(row, "值 / Value") === "No Auto Trading");

  return {
    family: [
      ["持仓数量 / Holdings", holdings.length],
      ["观察项目 / Watchlist", watchlist.length],
      ["重点提醒 / Priority Alerts", alerts.length],
      ["风险原则 / Rule", noAutoRule ? "只提醒，不自动交易" : "从 Settings 读取中"],
    ],
    mabel: mabelHoldings.slice(0, 5).map((row) => ({
      title: get(row, "代码 / Ticker") || get(row, "名称 / Name"),
      meta: get(row, "风险等级 / Risk Level") || get(row, "状态 / Status") || "No Data",
    })),
    victor: [...victorHoldings, ...watchlist.filter((row) => get(row, "所属人 / Owner") === "Victor")]
      .slice(0, 6)
      .map((row) => ({
        title: get(row, "代码 / Ticker") || get(row, "名称 / Name"),
        meta: get(row, "需要行动 / Action Needed") || get(row, "状态 / Status") || get(row, "风险等级 / Risk Level"),
      })),
    watchlist: watchlist.slice(0, 5).map((row) => ({
      title: get(row, "代码 / Ticker") || get(row, "名称 / Name"),
      meta: get(row, "需要行动 / Action Needed") || get(row, "关注级别 / Watch Priority"),
    })),
    reminders: [...alerts, ...watchReview].slice(0, 5).map((row) => ({
      title: get(row, "关注主题 / Watch Topic") || get(row, "名称 / Name"),
      meta: get(row, "人工处理状态 / Human Review Status") || get(row, "需要行动 / Action Needed") || "Review",
    })),
  };
}

function sortByDateTime(a, b) {
  const valueA = `${get(a, "日期 / Date")} ${get(a, "新闻时间 / News Time")}`;
  const valueB = `${get(b, "日期 / Date")} ${get(b, "新闻时间 / News Time")}`;
  return valueA.localeCompare(valueB);
}
