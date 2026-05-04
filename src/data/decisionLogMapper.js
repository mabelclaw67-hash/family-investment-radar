import { get } from "./dashboardMapper.js";

export function buildDecisionLogModel(source, activeFilter = "all") {
  const all = (source.decisions ?? []).filter(
    (row) => get(row, "决策ID / Decision ID") || get(row, "代码 / Ticker")
  );

  // Hide archived rows by default
  const visible = all.filter(
    (row) => (get(row, "状态 / Status") || "").toLowerCase() !== "archived"
  );

  const summary = {
    total: visible.length,
    mabel: visible.filter((r) => get(r, "所属人 / Owner") === "Mabel").length,
    victor: visible.filter((r) => get(r, "所属人 / Owner") === "Victor").length,
    needsReview: visible.filter((r) =>
      (get(r, "决策状态 / Decision Status") || "").includes("Review")
    ).length,
  };

  const FILTER_MAP = {
    all:       () => true,
    mabel:     (r) => get(r, "所属人 / Owner") === "Mabel",
    victor:    (r) => get(r, "所属人 / Owner") === "Victor",
    buy:       (r) => get(r, "操作类型 / Action Type") === "Buy",
    sell:      (r) => get(r, "操作类型 / Action Type") === "Sell",
    hold:      (r) => get(r, "操作类型 / Action Type") === "Hold",
    watch:     (r) => get(r, "操作类型 / Action Type") === "Watch",
    review:    (r) => get(r, "操作类型 / Action Type") === "Review",
    planned:   (r) => get(r, "决策状态 / Decision Status") === "Planned",
    completed: (r) => get(r, "决策状态 / Decision Status") === "Completed",
  };

  const filterFn = FILTER_MAP[activeFilter] ?? FILTER_MAP.all;
  const filtered = visible.filter(filterFn);

  return { all: visible, filtered, summary, activeFilter };
}

export function mapDecisionRow(row) {
  return {
    decisionId:      get(row, "决策ID / Decision ID"),
    date:            get(row, "日期 / Date"),
    owner:           get(row, "所属人 / Owner"),
    accountType:     get(row, "账户类型 / Account Type"),
    ticker:          get(row, "代码 / Ticker"),
    name:            get(row, "名称 / Name"),
    assetType:       get(row, "资产类型 / Asset Type"),
    actionType:      get(row, "操作类型 / Action Type"),
    decisionStatus:  get(row, "决策状态 / Decision Status"),
    amount:          get(row, "金额 / Amount"),
    quantity:        get(row, "数量 / Quantity"),
    price:           get(row, "单价 / Price"),
    cost:            get(row, "成本 / Cost"),
    exitAmount:      get(row, "卖出/赎回金额 / Exit Amount"),
    realizedGainLoss:get(row, "实现盈亏 / Realized Gain Loss"),
    returnPct:       get(row, "收益率 / Return %"),
    decisionReason:  get(row, "决策原因 / Decision Reason"),
    referenceInfo:   get(row, "参考信息 / Reference Info"),
    riskLevel:       get(row, "风险等级 / Risk Level"),
    relatedNews:     get(row, "关联新闻 / Related News"),
    relatedWatchId:  get(row, "关联观察ID / Related Watch ID"),
    relatedHoldingId:get(row, "关联持仓ID / Related Holding ID"),
    aiChineseSummary:get(row, "AI中文摘要 / AI Chinese Summary"),
    reviewNotes:     get(row, "复盘备注 / Review Notes"),
    createdAt:       get(row, "创建时间 / Created At"),
    updatedAt:       get(row, "更新时间 / Updated At"),
    status:          get(row, "状态 / Status"),
  };
}
