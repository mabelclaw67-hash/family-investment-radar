import { NAV_ITEMS, SHEET_CONFIG } from "./config.js";
import { get } from "./data/dashboardMapper.js";
import { deriveActionLabel, displayMarketValue, displayValue, HOLDING_FILTERS } from "./data/holdingsMapper.js";

const MOBILE_TABS = [
  ["首页", "⌂", "dashboard"],
  ["持仓", "▣", "holdings"],
  ["简报", "▥", "daily-portfolio"],
  ["观察", "◇", "watchlist"],
  ["研究", "□", "research-packs"],
];

export function AppShell(content, currentPage = "dashboard") {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">◎</div>
        <div>
          <strong>家庭投资雷达</strong>
          <span>Family Investment Radar</span>
        </div>
      </div>
      <nav class="nav">${NAV_ITEMS.map((item) => navItem(item, currentPage)).join("")}</nav>
      <div class="sidebar-card">
        <strong>信息与监控工具</strong>
        <span>Information & Monitoring Tool</span>
        <small>不提供买卖建议 / No Buy/Sell Advice</small>
      </div>
      <div class="sidebar-card sync">
        <strong>数据源 / Data Source</strong>
        <span>${SHEET_CONFIG.spreadsheetTitle}</span>
        <button class="logout-btn" data-action="logout" type="button">退出 / Lock</button>
      </div>
    </aside>
    <main class="main">${content}</main>
    <nav class="mobile-bottom-nav" aria-label="主导航 / Main navigation">
      ${MOBILE_TABS.map(([zh, icon, page]) => `
        <a class="mbn-tab ${currentPage === page ? "active" : ""}" href="#/${page}" aria-label="${zh}">
          <span class="mbn-icon">${icon}</span>
          <span>${zh}</span>
        </a>
      `).join("")}
    </nav>
  `;
}

export function Header() {
  const today = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return `
    <header class="topbar">
      <div>
        <div class="title-row">
          <h1>家庭投资雷达 <span>/ Family Investment Radar</span></h1>
          <span class="live-pill"><i></i>实时更新 Live</span>
        </div>
      </div>
      <div class="header-actions">
        <div class="date-card">
          <span>今日日期 Today</span>
          <strong>${today}</strong>
        </div>
        <label class="search-box" aria-label="搜索">
          <input type="search" placeholder="搜索股票、新闻、主题..." />
          <span>⌕</span>
        </label>
      </div>
    </header>
  `;
}

export function KpiCards(kpis) {
  const cards = [
    ["今日风险等级", "Today Risk Level", kpis.riskLevel.zh, kpis.riskLevel.en, "shield", kpis.riskLevel.tone],
    ["需复核持仓", "Holdings Needing Review", kpis.reviewCount, "个持仓", "clipboard", "blue"],
    ["重点提醒", "Priority Alerts", kpis.priorityAlertCount, "项提醒", "bell", "orange"],
    ["今日更新数", "Latest Updates", kpis.latestUpdateCount, "条新闻", "news", "green"],
  ];

  return `<section class="kpi-grid">${cards.map(kpiCard).join("")}</section>`;
}

export function MarketSection(marketData) {
  const rows = Array.isArray(marketData) ? marketData : [];
  const bySymbol = {};
  rows.forEach((r) => { bySymbol[get(r, "代码 / Symbol")] = r; });

  const spy    = bySymbol["SPY"];
  const qqq    = bySymbol["QQQ"];
  const canada = bySymbol["XIC.TO"] || bySymbol["XIU.TO"];

  return `
    <section class="market-grid">
      <article class="market-card">
        <div class="panel-title compact">
          <h2>美股走势 <span>/ US Market</span></h2>
          <div class="news-refresh-row">
            <button id="btn-refresh-market" class="refresh-news-btn" type="button">刷新行情 / Refresh Market</button>
            <span id="market-refresh-status" class="news-refresh-status"></span>
          </div>
        </div>
        ${marketQuoteRows([spy, qqq])}
        <p class="market-proxy-note">代理ETF，仅供参考 · Proxy ETFs, not true indices · 不构成投资建议</p>
      </article>
      <article class="market-card">
        <div class="panel-title compact">
          <h2>加股走势 <span>/ Canada Market</span></h2>
        </div>
        ${marketQuoteRows([canada])}
        <p class="market-proxy-note">代理ETF，仅供参考 · Proxy ETF, not true index · 不构成投资建议</p>
      </article>
    </section>
  `;
}

function marketQuoteRows(rowList) {
  const valid = rowList.filter(Boolean);
  if (!valid.length) {
    return `<div class="market-empty">行情数据待更新 / Market data pending<br><small>Run marketDataFetchJob or click Refresh</small></div>`;
  }
  return `<div class="market-quotes">${valid.map(marketQuoteRow).join("")}</div>`;
}

function marketQuoteRow(row) {
  const symbol = get(row, "代码 / Symbol");
  const price  = get(row, "当前水平 / Current Level");
  const change = get(row, "日变动% / Daily Change %");
  const date   = get(row, "日期 / Date");
  const label  = get(row, "备注 / Notes") || symbol;

  const up   = change.startsWith("+");
  const down = change.startsWith("-");
  const arrow = up ? "▲" : down ? "▼" : "—";
  const tone  = up ? "up" : down ? "down" : "flat";

  return `
    <div class="market-quote-row tone-${tone}">
      <div class="mq-left">
        <strong class="mq-symbol">${escapeHtml(symbol)}</strong>
        <small class="mq-label">${escapeHtml(label)}</small>
      </div>
      <div class="mq-right">
        <span class="mq-price">$${escapeHtml(price)}</span>
        <span class="mq-change">${arrow} ${escapeHtml(change)}</span>
        <small class="mq-date">${escapeHtml(date)}</small>
      </div>
    </div>
  `;
}

export function LiveUpdatesPanel(news) {
  return `
    <section class="panel live-updates">
      <div class="panel-title">
        <h2>即时更新 <span>/ Live Updates</span></h2>
        <div class="news-refresh-row">
          <button id="btn-refresh-news" class="refresh-news-btn" type="button">刷新新闻 / Refresh News</button>
          <span id="news-refresh-status" class="news-refresh-status"></span>
        </div>
      </div>
      ${
        news.length
          ? `<div class="news-list">${news.map(newsItem).join("")}</div>`
          : EmptyState("06 Daily News Intelligence 目前没有新闻数据", "No daily news rows available yet")
      }
      <a class="panel-link" href="#" aria-disabled="true">查看全部新闻 ›</a>
    </section>
  `;
}

export function AlertsPanel(alerts) {
  return `
    <section class="panel alerts-panel">
      <div class="panel-title"><h2>重点提醒 <span>/ High Attention Alerts</span></h2></div>
      ${
        alerts.length
          ? `<div class="alert-list">${alerts.map(alertItem).join("")}</div>`
          : EmptyState("08 Priority Alert Watch 暂无高优先级提醒", "No high attention alerts")
      }
      <a class="panel-link" href="#" aria-disabled="true">查看全部提醒 ›</a>
    </section>
  `;
}

export function SummaryCards(summaries, marketData) {
  return `
    <section class="summary-grid">
      ${SummaryTable("家庭总览", "Family Summary", summaries.family)}
      ${SummaryList("Mabel 稳健投资", "Mabel Conservative View", summaries.mabel)}
      ${SummaryList("Victor 主动投资雷达", "Victor Investment Radar", summaries.victor)}
      ${MarketSummaryCard(marketData)}
      ${SummaryList("观察清单速览", "Watchlist Snapshot", summaries.watchlist)}
      ${SummaryList("决策提醒", "Decision Reminder", summaries.reminders)}
    </section>
  `;
}

export function LoadingState() {
  return AppShell(`
    ${Header()}
    <section class="state-card">
      <div class="spinner"></div>
      <h2>正在读取 Google Sheets...</h2>
      <p>Loading live Google Sheets data from ${SHEET_CONFIG.spreadsheetTitle}</p>
    </section>
  `);
}

export function ErrorState(error) {
  return AppShell(`
    ${Header()}
    <section class="state-card error">
      <h2>无法读取真实 Google Sheets 数据</h2>
      <p>${escapeHtml(error.message)}</p>
      <small>请确认 Apps Script Web App exec URL 已配置，且 endpoint 可返回 ok:true 的 JSON。</small>
    </section>
  `);
}

function navItem([zh, en, icon, page], currentPage) {
  return `
    <a class="nav-item ${currentPage === page ? "active" : ""}" href="#/${page}" data-page="${page}">
      <span class="icon icon-${icon}"></span>
      <span>${zh}<small>${en}</small></span>
    </a>
  `;
}

function kpiCard([zh, en, value, subvalue, icon, tone]) {
  return `
    <article class="kpi-card tone-${tone}">
      <div class="kpi-head">
        <span class="icon icon-${icon}"></span>
        <span>${zh}<small>${en}</small></span>
      </div>
      <strong>${value}</strong>
      <em>${subvalue}</em>
      <div class="sparkline" aria-hidden="true"></div>
    </article>
  `;
}

// MarketMiniChart removed — replaced by MarketSection(marketData) above

function newsItem(row) {
  // Time: extract HH:mm from ISO timestamp; fall back to date string or "--"
  const rawTime = get(row, "新闻时间 / News Time") || get(row, "日期 / Date") || "";
  const displayTime = formatNewsTime(rawTime) || "--";

  // Main: Chinese Title (translated by Apps Script LanguageApp)
  // Fallback chain: Chinese Title → Original Title → "(无标题)"
  const chineseTitle  = get(row, "新闻标题中文 / Chinese Title");
  const originalTitle = get(row, "原始标题 / Original Title");
  const sourceLink    = get(row, "来源链接 / Source Link");
  const mainText      = chineseTitle || originalTitle || "(无标题)";

  // Secondary: Original Title in small grey text, only when it differs from mainText
  // Linkified with source URL if available
  const showSecondary = originalTitle && originalTitle !== mainText;
  const secondaryHtml = showSecondary
    ? sourceLink
      ? `<small class="news-original"><a href="${escapeHtml(sourceLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(originalTitle)}</a></small>`
      : `<small class="news-original">${escapeHtml(originalTitle)}</small>`
    : "";

  return `
    <article class="news-row">
      <time>${escapeHtml(displayTime)}</time>
      <span class="tag">${escapeHtml(get(row, "类别 / Category") || "未分类")}</span>
      <div class="news-text">
        <strong>${escapeHtml(mainText)}</strong>
        ${secondaryHtml}
      </div>
    </article>
  `;
}

function formatNewsTime(raw) {
  if (!raw) return "";
  // ISO: 2026-04-27T23:30:45Z  or  2026-04-27T23:30:45+00:00
  const iso = raw.match(/T(\d{2}:\d{2})/);
  if (iso) return iso[1];
  // Already HH:mm or HH:mm:ss
  const hhmm = raw.match(/^(\d{2}:\d{2})/);
  if (hhmm) return hhmm[1];
  // Date-only string (2026-04-27) — return as-is, no time to extract
  return raw;
}

function alertItem(row) {
  const status = get(row, "人工处理状态 / Human Review Status") || get(row, "需要行动 / Action Needed") || "Review";
  const topic = get(row, "关注主题 / Watch Topic") || get(row, "提醒标题 / Alert Title") || get(row, "名称 / Name") || "";
  const owner = get(row, "所属人 / Owner");
  const ticker = get(row, "相关代码 / Related Ticker") || get(row, "代码 / Ticker");
  const watchId = get(row, "关联观察ID / Related Watch ID") || get(row, "观察ID / Watch ID");
  return `
    <article class="alert-row">
      <div class="alert-icon">!</div>
      <div>
        <strong>${escapeHtml(topic)}</strong>
        <p>${escapeHtml(get(row, "最新中文摘要 / Latest Chinese Summary") || get(row, "AI中文点评 / AI Chinese Comment") || "暂无最新摘要 / No latest summary")}</p>
      </div>
      <div class="alert-actions">
        <span class="status-pill">${escapeHtml(status)}</span>
        <button
          class="small-research-btn"
          type="button"
          data-alert-research="1"
          data-topic="${escapeHtml(topic)}"
          data-owner="${escapeHtml(owner)}"
          data-ticker="${escapeHtml(ticker)}"
          data-watch-id="${escapeHtml(watchId)}">
          生成研究包
        </button>
      </div>
    </article>
  `;
}

function SummaryTable(zh, en, rows) {
  return `
    <article class="summary-card">
      <h3>${zh}<span>${en}</span></h3>
      <div class="summary-table">
        ${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      </div>
    </article>
  `;
}

function SummaryList(zh, en, rows) {
  return `
    <article class="summary-card">
      <h3>${zh}<span>${en}</span></h3>
      ${
        rows.length
          ? `<div class="summary-list">${rows.map((row) => `<div><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.meta)}</span></div>`).join("")}</div>`
          : EmptyState("暂无数据", "No rows")
      }
    </article>
  `;
}

function MarketSummaryCard(marketData) {
  const rows = Array.isArray(marketData) ? marketData : [];
  const bySymbol = {};
  rows.forEach((r) => { bySymbol[get(r, "代码 / Symbol")] = r; });

  function fmt(sym) {
    const r = bySymbol[sym];
    if (!r) return "待更新";
    const price  = get(r, "当前水平 / Current Level");
    const change = get(r, "日变动% / Daily Change %");
    return price ? `$${escapeHtml(price)} (${escapeHtml(change)})` : "待更新";
  }

  const canada = bySymbol["XIC.TO"] ? "XIC.TO" : "XIU.TO";

  return `
    <article class="summary-card">
      <h3>市场雷达<span>Market Radar</span></h3>
      <div class="summary-table">
        <div><span>SPY (S&P 500)</span><strong>${fmt("SPY")}</strong></div>
        <div><span>QQQ (Nasdaq)</span><strong>${fmt("QQQ")}</strong></div>
        <div><span>${canada} (Canada)</span><strong>${fmt(canada)}</strong></div>
        <div><span>来源 / Source</span><strong>Alpha Vantage</strong></div>
      </div>
    </article>
  `;
}

export function HoldingsPage(model) {
  return `
    ${HoldingsHeader()}
    ${HoldingsSummaryCards(model.summary)}
    ${HoldingsFilters(model.filter)}
    ${
      model.holdings.length
        ? `<section class="holdings-layout">
            ${HoldingsTable(model.filteredHoldings, model.selectedHolding)}
            ${HoldingDetailPanel(model)}
          </section>`
        : `<section class="panel">${EmptyState("暂无持仓数据，请先在 01 Holdings Master 中添加记录。", "No holdings rows yet")}</section>`
    }
  `;
}

function HoldingsHeader() {
  return `
    <header class="page-header">
      <div>
        <h1>已持仓 <span>/ Holdings</span></h1>
        <p>家庭当前已持有的 ETF、基金、股票与现金类资产</p>
      </div>
      <span class="live-pill"><i></i>真实数据 / Real Data</span>
    </header>
  `;
}

function HoldingsSummaryCards(summary) {
  const cards = [
    ["总持仓数量", "Total Holdings", summary.total],
    ["Mabel 持仓", "Mabel Holdings", summary.mabel],
    ["Victor 持仓", "Victor Holdings", summary.victor],
    ["需复核", "Need Review", summary.needReview],
  ];

  return `
    <section class="holdings-summary-grid">
      ${cards
        .map(
          ([zh, en, value]) => `
            <article class="mini-stat-card">
              <span>${zh}<small>${en}</small></span>
              <strong>${value}</strong>
            </article>
          `
        )
        .join("")}
    </section>
  `;
}

function HoldingsFilters(activeFilter) {
  return `
    <section class="filter-bar" aria-label="Holdings filters">
      ${HOLDING_FILTERS.map(
        ([filter, label]) => `
          <button class="filter-chip ${activeFilter === filter ? "active" : ""}" data-filter="${filter}" type="button">${label}</button>
        `
      ).join("")}
    </section>
  `;
}

function HoldingsTable(rows, selectedHolding) {
  if (!rows.length) {
    return `<section class="panel holdings-table-panel">${EmptyState("当前筛选条件下暂无持仓。", "No holdings match this filter")}</section>`;
  }

  return `
    <section class="panel holdings-table-panel">
      <div class="holdings-table">
        <div class="holdings-table-head">
          <span>所属人 / Owner</span>
          <span>代码 / Ticker</span>
          <span>名称 / Name</span>
          <span>类型 / Type</span>
          <span>市场 / Market</span>
          <span>账户 / Account</span>
          <span>当前价格 / Price</span>
          <span>当前市值 / Value</span>
          <span>风险 / Risk</span>
          <span>状态 / Status</span>
          <span>行动 / Action</span>
        </div>
        ${rows.map((row) => holdingRow(row, selectedHolding)).join("")}
      </div>
      <div class="holding-cards-mobile">
        ${rows.map((row) => holdingCardMobile(row, selectedHolding)).join("")}
      </div>
    </section>
  `;
}

function holdingCardMobile(row, selectedHolding) {
  const id        = get(row, "持仓ID / Holding ID");
  const selectedId = selectedHolding ? get(selectedHolding, "持仓ID / Holding ID") : "";
  const action    = deriveActionLabel(row);
  const ticker    = displayValue(get(row, "代码 / Ticker"));
  const name      = displayValue(get(row, "名称 / Name"));
  const owner     = displayValue(get(row, "所属人 / Owner"));
  const account   = displayValue(get(row, "账户类型 / Account Type"));
  const value     = displayMarketValue(get(row, "当前市值 / Current Value"));
  const risk      = displayValue(get(row, "风险等级 / Risk Level"));
  const status    = displayValue(get(row, "状态 / Status"));

  return `
    <button class="holding-card-m ${id === selectedId ? "selected" : ""}" type="button" data-holding-id="${escapeHtml(id)}">
      <div class="hcm-top">
        <strong class="hcm-ticker">${escapeHtml(ticker)}</strong>
        <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
      </div>
      <div class="hcm-name-row">${escapeHtml(name)}</div>
      <div class="hcm-meta">
        <span>${escapeHtml(owner)}</span>
        <span>·</span>
        <span>${escapeHtml(account)}</span>
        <span>·</span>
        <span>${escapeHtml(risk)}</span>
      </div>
      <div class="hcm-bottom">
        <span class="hcm-value">${escapeHtml(value)}</span>
        <span class="hcm-status">${escapeHtml(status)}</span>
      </div>
    </button>
  `;
}

function holdingRow(row, selectedHolding) {
  const id = get(row, "持仓ID / Holding ID");
  const selectedId = selectedHolding ? get(selectedHolding, "持仓ID / Holding ID") : "";
  const action = deriveActionLabel(row);

  return `
    <button class="holding-row ${id === selectedId ? "selected" : ""}" type="button" data-holding-id="${escapeHtml(id)}">
      <span>${escapeHtml(displayValue(get(row, "所属人 / Owner")))}</span>
      <strong>${escapeHtml(displayValue(get(row, "代码 / Ticker")))}</strong>
      <span>${escapeHtml(displayValue(get(row, "名称 / Name")))}</span>
      <span>${escapeHtml(displayValue(get(row, "类型 / Type")))}</span>
      <span>${escapeHtml(displayValue(get(row, "市场 / Market")))}</span>
      <span>${escapeHtml(displayValue(get(row, "账户类型 / Account Type")))}</span>
      <span>${escapeHtml(displayMarketValue(get(row, "当前价格 / Current Price")))}</span>
      <span>${escapeHtml(displayMarketValue(get(row, "当前市值 / Current Value")))}</span>
      <span>${escapeHtml(displayValue(get(row, "风险等级 / Risk Level")))}</span>
      <span>${escapeHtml(displayValue(get(row, "状态 / Status")))}</span>
      <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
    </button>
  `;
}

function HoldingDetailPanel(model) {
  const holding = model.selectedHolding;
  if (!holding) {
    return `<aside class="panel holding-detail-panel">${EmptyState("请选择一个持仓。", "Select a holding")}</aside>`;
  }

  return `
    <aside class="panel holding-detail-panel">
      <div class="detail-title">
        <div>
          <h2>${escapeHtml(displayValue(get(holding, "代码 / Ticker")))} <span>/ ${escapeHtml(displayValue(get(holding, "类型 / Type")))}</span></h2>
          <p>${escapeHtml(displayValue(get(holding, "名称 / Name")))}</p>
        </div>
        <span class="status-pill action-${actionLabelClass(deriveActionLabel(holding))}">${escapeHtml(deriveActionLabel(holding))}</span>
      </div>
      ${OwnerContext(get(holding, "所属人 / Owner"))}
      ${HoldingFacts(holding)}
      ${ResearchPanel(model.selectedResearch, model.researchError)}
      ${RelatedNewsPanel(model.relatedNews)}
    </aside>
  `;
}

function OwnerContext(owner) {
  if (owner === "Mabel") {
    return `
      <div class="owner-context">
        <strong>Mabel 稳健投资视角 / Conservative View</strong>
        <p>重点看 ETF、基金、GIC、退休规划、风险比较。</p>
      </div>
    `;
  }
  if (owner === "Victor") {
    return `
      <div class="owner-context victor">
        <strong>Victor 主动投资雷达 / Active Radar</strong>
        <p>重点看股票、能源、油气、矿产、高波动复核。</p>
      </div>
    `;
  }
  return `
    <div class="owner-context">
      <strong>家庭共同视角 / Family View</strong>
      <p>仅做信息监控，不提供买卖建议。</p>
    </div>
  `;
}

function HoldingFacts(holding) {
  const facts = [
    ["所属人 / Owner", get(holding, "所属人 / Owner")],
    ["类型 / Type", get(holding, "类型 / Type")],
    ["板块 / Sector", get(holding, "板块 / Sector")],
    ["账户类型 / Account Type", get(holding, "账户类型 / Account Type")],
    ["当前价格 / Current Price", displayMarketValue(get(holding, "当前价格 / Current Price"))],
    ["当前市值 / Current Value", displayMarketValue(get(holding, "当前市值 / Current Value"))],
    ["风险等级 / Risk Level", get(holding, "风险等级 / Risk Level")],
    ["投资策略 / Strategy", get(holding, "投资策略 / Strategy")],
    ["状态 / Status", get(holding, "状态 / Status")],
    ["最后复核 / Last Reviewed", get(holding, "最后复核 / Last Reviewed")],
    ["数据来源 / Data Source", get(holding, "数据来源 / Data Source")],
    ["备注 / Notes", get(holding, "备注 / Notes")],
  ];

  return `
    <div class="detail-section">
      <h3>持仓详情 <span>/ Holding Detail</span></h3>
      <div class="detail-facts">
        ${facts.map(([label, value]) => `<div><span>${label}</span><strong>${escapeHtml(displayValue(value))}</strong></div>`).join("")}
      </div>
    </div>
  `;
}

function ResearchPanel(research, researchError) {
  if (researchError) {
    return `
      <div class="detail-section">
        <h3>研究资料 <span>/ Holding Research</span></h3>
        ${EmptyState("暂无研究资料", `03 Holding Research API 暂未开放：${researchError}`)}
      </div>
    `;
  }

  if (!research) {
    return `
      <div class="detail-section">
        <h3>研究资料 <span>/ Holding Research</span></h3>
        ${EmptyState("暂无研究资料 / No research record yet", "No matching ticker in 03 Holding Research")}
      </div>
    `;
  }

  const fields = [
    ["业务/基金简介 / Business or Fund Profile", get(research, "业务/基金简介 / Business or Fund Profile")],
    ["主要持仓/资产 / Top Holdings or Main Assets", get(research, "主要持仓/资产 / Top Holdings or Main Assets")],
    ["管理费率 / Expense Ratio", get(research, "管理费率 / Expense Ratio")],
    ["分红/收益率 / Dividend or Yield", get(research, "分红/收益率 / Dividend or Yield")],
    ["财务健康度 / Financial Health", get(research, "财务健康度 / Financial Health")],
    ["主要风险 / Main Risks", get(research, "主要风险 / Main Risks")],
    ["AI中文研究摘要 / AI Chinese Research Summary", get(research, "AI中文研究摘要 / AI Chinese Research Summary")],
    ["复核状态 / Review Status", get(research, "复核状态 / Review Status")],
  ];

  return `
    <div class="detail-section">
      <h3>研究资料 <span>/ Holding Research</span></h3>
      <div class="research-list">
        ${fields.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><p>${escapeHtml(displayValue(value))}</p></div>`).join("")}
      </div>
    </div>
  `;
}

function RelatedNewsPanel(newsRows) {
  return `
    <div class="detail-section">
      <h3>相关新闻 <span>/ Related News</span></h3>
      ${
        newsRows.length
          ? `<div class="related-news-list">${newsRows.map(relatedNewsItem).join("")}</div>`
          : EmptyState("暂无相关新闻 / No related news yet", "No matching rows in 06 Daily News Intelligence")
      }
    </div>
  `;
}

function relatedNewsItem(row) {
  return `
    <article class="related-news-row">
      <time>${escapeHtml(displayValue(get(row, "新闻时间 / News Time"), "--"))}</time>
      <span class="tag">${escapeHtml(displayValue(get(row, "类别 / Category"), "未分类"))}</span>
      <strong>${escapeHtml(displayValue(get(row, "新闻标题中文 / Chinese Title")))}</strong>
      <span>${escapeHtml(displayValue(get(row, "风险等级 / Risk Level")))}</span>
      <span class="status-pill action-${actionLabelClass(displayValue(get(row, "需要行动 / Action Needed"), "Review"))}">${escapeHtml(displayValue(get(row, "需要行动 / Action Needed"), "Review"))}</span>
    </article>
  `;
}

function actionLabelClass(action) {
  if (action === "High Attention") return "high";
  if (action === "Review") return "review";
  return "none";
}

function EmptyState(zh, en) {
  return `<div class="empty-state"><strong>${zh}</strong><span>${en}</span></div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Watchlist Page ───────────────────────────────────────────────────────────

export function WatchlistPage(model) {
  return `
    ${WatchlistPageHeader()}
    ${WatchlistSummaryCards(model.summary)}
    ${WatchlistAddForm()}
    ${
      model.watchlist.length
        ? `<section class="panel watchlist-table-panel">
            <div class="panel-title compact">
              <h2>观察列表 <span>/ Watchlist Items</span></h2>
              <small class="wl-hint">点击任意行查看快速研究 / Click any row to open Quick Research</small>
            </div>
            ${WatchlistTable(model.watchlist)}
           </section>`
        : `<section class="panel">${EmptyState(
            "暂无观察清单数据，请在 07 Watchlist Intelligence 中添加记录。",
            "No watchlist rows yet in 07 Watchlist Intelligence"
          )}</section>`
    }
  `;
}

function WatchlistPageHeader() {
  return `
    <header class="page-header">
      <div>
        <h1>观察清单 <span>/ Watchlist</span></h1>
        <p>未买入但正在观察的股票、ETF、基金和行业主题</p>
      </div>
      <span class="live-pill"><i></i>真实数据 / Real Data</span>
    </header>
  `;
}

function WatchlistSummaryCards(summary) {
  const cards = [
    ["观察项目总数", "Total Watchlist", summary.total],
    ["Mabel 观察", "Mabel Watching", summary.mabel],
    ["Victor 观察", "Victor Watching", summary.victor],
    ["高优先级", "High Priority", summary.highPriority],
  ];
  return `
    <section class="holdings-summary-grid">
      ${cards
        .map(
          ([zh, en, value]) => `
        <article class="mini-stat-card">
          <span>${zh}<small>${en}</small></span>
          <strong>${value}</strong>
        </article>
      `
        )
        .join("")}
    </section>
  `;
}

function WatchlistAddForm() {
  return `
    <section class="panel watchlist-add-panel">
      <div class="panel-title compact">
        <h2>加入观察清单 <span>/ Add to Watchlist</span></h2>
      </div>
      <form id="watchlist-add-form" class="watchlist-form" autocomplete="off">
        <div class="wf-row">
          <label class="wf-field">
            <span>代码 / Ticker</span>
            <input name="ticker" type="text" placeholder="e.g. AAPL" />
          </label>
          <label class="wf-field">
            <span>名称 / Name</span>
            <input name="name" type="text" placeholder="e.g. Apple Inc." />
          </label>
          <label class="wf-field">
            <span>所属人 / Owner</span>
            <select name="owner">
              <option value="">-- 请选择 --</option>
              <option value="Mabel">Mabel</option>
              <option value="Victor">Victor</option>
              <option value="Both">Both</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>类型 / Type</span>
            <select name="type">
              <option value="">-- 请选择 --</option>
              <option value="Stock">Stock</option>
              <option value="ETF">ETF</option>
              <option value="Mutual Fund">Mutual Fund</option>
              <option value="Keyword Watch">Keyword Watch</option>
            </select>
          </label>
          <label class="wf-field">
            <span>板块 / Sector</span>
            <input name="sector" type="text" placeholder="e.g. Technology" />
          </label>
          <label class="wf-field">
            <span>关注级别 / Watch Priority</span>
            <select name="priority">
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>观察原因 / Watch Reason</span>
            <textarea name="reason" rows="2" placeholder="简要说明关注原因 / Brief reason for watching"></textarea>
          </label>
        </div>
        <div class="wf-actions">
          <button type="submit" class="refresh-news-btn">加入观察清单 / Add to Watchlist</button>
          <span id="watchlist-add-status" class="news-refresh-status"></span>
        </div>
      </form>
    </section>
  `;
}

function WatchlistTable(rows) {
  return `
    <div class="watchlist-table-wrap">
      <div class="watchlist-table-head">
        <span>所属人 / Owner</span>
        <span>代码 / Ticker</span>
        <span>名称 / Name</span>
        <span>类型 / Type</span>
        <span>板块 / Sector</span>
        <span>优先级 / Priority</span>
        <span>需要行动 / Action</span>
        <span>状态 / Status</span>
      </div>
      ${rows.map(watchlistRow).join("")}
    </div>
    <div class="watchlist-cards-mobile">
      ${rows.map(watchlistCardMobile).join("")}
    </div>
  `;
}

function watchlistCardMobile(row) {
  const id       = get(row, "观察ID / Watch ID") || get(row, "代码 / Ticker");
  const ticker   = displayValue(get(row, "代码 / Ticker"));
  const name     = displayValue(get(row, "名称 / Name"));
  const owner    = displayValue(get(row, "所属人 / Owner"));
  const type     = displayValue(get(row, "类型 / Type"));
  const sector   = displayValue(get(row, "板块 / Sector"));
  const priority = get(row, "关注级别 / Watch Priority") || "";
  const action   = get(row, "需要行动 / Action Needed") || "Review";
  const status   = displayValue(get(row, "状态 / Status"));

  const pClass = priority.includes("High")
    ? "priority-high"
    : priority.includes("Low")
    ? "priority-low"
    : "priority-medium";

  return `
    <button class="wl-card-m" type="button" data-watch-id="${escapeHtml(id)}">
      <div class="wlcm-top">
        <strong class="wlcm-ticker">${escapeHtml(ticker)}</strong>
        <span class="priority-badge ${pClass}">${escapeHtml(priority || "Medium")}</span>
      </div>
      <div class="wlcm-name-row">${escapeHtml(name)}</div>
      <div class="wlcm-meta">
        <span>${escapeHtml(owner)}</span>
        <span>·</span>
        <span>${escapeHtml(type)}</span>
        ${sector ? `<span>·</span><span>${escapeHtml(sector)}</span>` : ""}
      </div>
      <div class="wlcm-bottom">
        <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
        <span class="wlcm-status">${escapeHtml(status)}</span>
      </div>
    </button>
  `;
}

function watchlistRow(row) {
  const id = get(row, "观察ID / Watch ID") || get(row, "代码 / Ticker");
  const action = get(row, "需要行动 / Action Needed") || "Review";
  const priority = get(row, "关注级别 / Watch Priority") || "";
  const pClass = priority.includes("High")
    ? "priority-high"
    : priority.includes("Low")
    ? "priority-low"
    : "priority-medium";

  return `
    <button class="watchlist-row" type="button" data-watch-id="${escapeHtml(id)}">
      <span>${escapeHtml(displayValue(get(row, "所属人 / Owner")))}</span>
      <strong class="wl-ticker">${escapeHtml(displayValue(get(row, "代码 / Ticker")))}</strong>
      <span>${escapeHtml(displayValue(get(row, "名称 / Name")))}</span>
      <span>${escapeHtml(displayValue(get(row, "类型 / Type")))}</span>
      <span>${escapeHtml(displayValue(get(row, "板块 / Sector")))}</span>
      <span class="priority-badge ${pClass}">${escapeHtml(displayValue(priority, "Medium"))}</span>
      <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
      <span>${escapeHtml(displayValue(get(row, "状态 / Status")))}</span>
    </button>
  `;
}

// ─── Watchlist Popup ──────────────────────────────────────────────────────────

export function WatchlistPopupHtml(popupData) {
  const { item, marketData, relatedNews, research } = popupData;
  const ticker   = get(item, "代码 / Ticker");
  const name     = get(item, "名称 / Name");
  const owner    = get(item, "所属人 / Owner");
  const type     = get(item, "类型 / Type");
  const sector   = get(item, "板块 / Sector");
  const status   = get(item, "状态 / Status");
  const priority = get(item, "关注级别 / Watch Priority");
  const action   = get(item, "需要行动 / Action Needed") || "Review";
  const pClass   = watchPriorityClass(priority);

  return `
    <div id="watchlist-popup-overlay" class="popup-overlay" role="dialog" aria-modal="true">
      <div class="popup-modal">
        <button class="popup-close" type="button" aria-label="Close">×</button>

        <div class="popup-header">
          <span class="popup-kicker">快速研究 / Quick Research</span>
          <div class="popup-title-row">
            <h2>${escapeHtml(ticker || "—")} <span>/ ${escapeHtml(name || "—")}</span></h2>
            <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
          </div>
          <div class="popup-meta-row">
            ${owner    ? `<span class="popup-meta-chip">${escapeHtml(owner)}</span>` : ""}
            ${type     ? `<span class="popup-meta-chip">${escapeHtml(type)}</span>` : ""}
            ${sector   ? `<span class="popup-meta-chip">${escapeHtml(sector)}</span>` : ""}
            ${status   ? `<span class="popup-meta-chip">${escapeHtml(status)}</span>` : ""}
            ${priority ? `<span class="popup-meta-chip priority-chip-${pClass}">${escapeHtml(priority)} 优先</span>` : ""}
          </div>
        </div>

        <div class="popup-section">
          <h3>行情快照 <span>/ Market Snapshot</span></h3>
          ${PopupMarketSnapshot(marketData)}
        </div>

        <div class="popup-section">
          <h3>相关新闻 <span>/ Related News</span></h3>
          ${PopupRelatedNews(relatedNews)}
        </div>

        <div class="popup-section">
          <h3>研究摘要 <span>/ Research Summary</span></h3>
          ${PopupResearch(research)}
        </div>

        <div class="popup-section">
          <h3>当前状态 <span>/ Current Action Status</span></h3>
          <div class="popup-action-display">
            <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
            <small class="popup-disclaimer">本平台仅做信息监控，不提供买卖建议 · No trading recommendation</small>
          </div>
        </div>

        <div class="popup-section popup-research-pack">
          <h3>研究包 <span>/ Research Pack</span></h3>
          <p class="research-pack-note">研究包用于整理资料和辅助分析，不构成投资建议。最终决策由用户自行判断。<br>Research packs organize information for review only and are not investment advice.</p>
          <div class="popup-decision-link">
            <button class="refresh-news-btn" type="button"
              id="btn-popup-generate-research-pack"
              data-topic="${escapeHtml(name || ticker || "")}"
              data-ticker="${escapeHtml(ticker || "")}"
              data-owner="${escapeHtml(owner || "")}"
              data-watch-id="${escapeHtml(get(item, "观察ID / Watch ID") || "")}"
              data-source-context="${escapeHtml(priority ? "Watchlist " + priority : "Watchlist Quick Research")}">
              生成研究包 / Generate Research Pack
            </button>
            <span id="research-pack-status" class="news-refresh-status"></span>
          </div>
          <div id="research-pack-result" class="research-pack-result" hidden></div>
        </div>

        <div class="popup-section popup-decision-link">
          <button class="refresh-news-btn" type="button"
            id="btn-popup-add-decision"
            data-ticker="${escapeHtml(ticker || "")}"
            data-name="${escapeHtml(name || "")}"
            data-owner="${escapeHtml(owner || "")}"
            data-type="${escapeHtml(type || "")}"
            data-watch-id="${escapeHtml(get(item, "观察ID / Watch ID") || "")}">
            记录决策 / Add Decision
          </button>
          <small class="popup-disclaimer">将跳转至决策记录页并预填信息 / Navigates to Decision Log with prefilled fields</small>
        </div>

      </div>
    </div>
  `;
}

export function ResearchPackResultHtml(result) {
  return `
    <div class="research-pack-success">
      <strong>Google Doc 已生成 / Research Pack created</strong>
      <div class="research-pack-actions">
        <a class="refresh-news-btn link-button" href="${escapeHtml(result.docUrl || "#")}" target="_blank" rel="noopener noreferrer">Open Research Pack</a>
        <a class="refresh-news-btn link-button subtle-link-button" href="#/research-packs?packId=${encodeURIComponent(result.packId || "")}" data-view-research-packs="1">查看研究包 / View Research Packs</a>
        <button class="refresh-news-btn secondary-btn" type="button" id="btn-copy-notebook-prompt">Copy NotebookLM Prompt</button>
      </div>
      <label class="wf-field wf-full">
        <span>NotebookLM Prompt</span>
        <textarea id="notebook-prompt-text" rows="5" readonly>${escapeHtml(result.notebookLmPrompt || "")}</textarea>
      </label>
      <div class="research-pack-analysis-form" data-pack-id="${escapeHtml(result.packId || "")}">
        <label class="wf-field wf-full">
          <span>粘贴 NotebookLM 分析结论 / Paste NotebookLM Analysis</span>
          <textarea id="notebook-analysis-text" rows="5" placeholder="从 NotebookLM 复制分析结论后粘贴到这里"></textarea>
        </label>
        <label class="wf-field wf-full">
          <span>投资步骤 / Investment Steps</span>
          <textarea id="notebook-steps-text" rows="3" placeholder="例如：继续观察、核实费用、比较同类基金"></textarea>
        </label>
        <div class="wf-row research-pack-form-row">
          <label class="wf-field">
            <span>Decision Status</span>
            <select id="notebook-decision-status">
              <option value="Review">Review</option>
              <option value="High Attention">High Attention</option>
              <option value="No Action">No Action</option>
            </select>
          </label>
          <label class="wf-field">
            <span>备注 / Notes</span>
            <input id="notebook-notes-text" type="text" placeholder="NotebookLM manual review" />
          </label>
        </div>
        <div class="popup-decision-link">
          <button class="refresh-news-btn" type="button" id="btn-save-notebook-analysis">保存分析 / Save Analysis</button>
          <span id="notebook-save-status" class="news-refresh-status"></span>
        </div>
      </div>
    </div>
  `;
}

function watchPriorityClass(priority) {
  if (!priority) return "medium";
  if (priority.includes("High")) return "high";
  if (priority.includes("Low")) return "low";
  return "medium";
}

function PopupMarketSnapshot(marketData) {
  if (!marketData) {
    return `
      <div class="popup-empty">
        <strong>暂无行情数据 / No market data yet</strong>
        <small>仅 SPY、QQQ、XIC.TO 有行情数据。Run marketDataFetchJob or click Refresh Market on Dashboard.</small>
      </div>
    `;
  }

  const price  = get(marketData, "当前水平 / Current Level");
  const change = get(marketData, "日变动% / Daily Change %");
  const trend  = get(marketData, "趋势 / Trend");
  const risk   = get(marketData, "风险信号 / Risk Signal");
  const source = get(marketData, "数据来源 / Data Source");
  const date   = get(marketData, "日期 / Date");

  const up    = change.startsWith("+");
  const down  = change.startsWith("-");
  const arrow = up ? "▲" : down ? "▼" : "—";
  const tone  = up ? "pms-up" : down ? "pms-down" : "";

  return `
    <div class="popup-market-snap">
      <div class="pms-price-block">
        <strong class="pms-price ${tone}">$${escapeHtml(price)}</strong>
        <span class="pms-change ${tone}">${arrow} ${escapeHtml(change)}</span>
      </div>
      <div class="pms-details">
        <div><span>趋势 / Trend</span><strong>${escapeHtml(trend || "—")}</strong></div>
        <div><span>风险信号 / Risk Signal</span><strong>${escapeHtml(risk || "—")}</strong></div>
        <div><span>最新日期 / Date</span><strong>${escapeHtml(date || "—")}</strong></div>
        <div><span>数据来源 / Source</span><strong>${escapeHtml(source || "Alpha Vantage")}</strong></div>
      </div>
    </div>
  `;
}

function PopupRelatedNews(newsRows) {
  if (!newsRows.length) {
    return `
      <div class="popup-empty">
        <strong>暂无相关新闻 / No related news yet</strong>
        <small>No matching rows in 06 Daily News Intelligence for this ticker</small>
      </div>
    `;
  }
  return `<div class="popup-news-list">${newsRows.map(popupNewsItem).join("")}</div>`;
}

function popupNewsItem(row) {
  const rawTime      = get(row, "新闻时间 / News Time") || get(row, "日期 / Date") || "";
  const displayTime  = formatNewsTime(rawTime) || "--";
  const chineseTitle = get(row, "新闻标题中文 / Chinese Title");
  const origTitle    = get(row, "原始标题 / Original Title");
  const sourceLink   = get(row, "来源链接 / Source Link");
  const action       = get(row, "需要行动 / Action Needed") || "Review";
  const risk         = get(row, "风险等级 / Risk Level");
  const category     = get(row, "类别 / Category");

  const showOrig = origTitle && origTitle !== chineseTitle;
  const origHtml = showOrig
    ? sourceLink
      ? `<small class="news-original"><a href="${escapeHtml(sourceLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(origTitle)}</a></small>`
      : `<small class="news-original">${escapeHtml(origTitle)}</small>`
    : "";

  return `
    <article class="popup-news-row">
      <time>${escapeHtml(displayTime)}</time>
      <div class="popup-news-body">
        <strong>${escapeHtml(chineseTitle || origTitle || "(无标题)")}</strong>
        ${origHtml}
      </div>
      <div class="popup-news-meta">
        ${category ? `<span class="tag">${escapeHtml(category)}</span>` : ""}
        ${risk ? `<span class="tag">${escapeHtml(risk)}</span>` : ""}
        <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
      </div>
    </article>
  `;
}

function PopupResearch(research) {
  if (!research) {
    return `
      <div class="popup-empty">
        <strong>暂无研究资料 / No research record yet</strong>
        <small>No matching ticker in 03 Holding Research</small>
      </div>
    `;
  }

  const fields = [
    ["业务/基金简介 / Business or Fund Profile",     get(research, "业务/基金简介 / Business or Fund Profile")],
    ["主要风险 / Main Risks",                        get(research, "主要风险 / Main Risks")],
    ["AI中文研究摘要 / AI Chinese Research Summary", get(research, "AI中文研究摘要 / AI Chinese Research Summary")],
    ["复核状态 / Review Status",                     get(research, "复核状态 / Review Status")],
  ];

  const populated = fields.filter(([, v]) => v && String(v).trim());

  if (!populated.length) {
    return `
      <div class="popup-empty">
        <strong>研究字段为空 / Research fields are empty</strong>
        <small>Matching row found in 03 Holding Research but all target fields are blank</small>
      </div>
    `;
  }

  return `
    <div class="popup-research-list">
      ${populated
        .map(
          ([label, value]) => `
        <div class="popup-research-item">
          <span>${escapeHtml(label)}</span>
          <p>${escapeHtml(displayValue(value))}</p>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

// ─── Daily Portfolio Intelligence Page ───────────────────────────────────────

export function DailyPortfolioIntelligencePage(model) {
  return `
    <header class="page-header">
      <div>
        <h1>每日持仓情报简报 <span>/ Daily Portfolio Intelligence</span></h1>
        <p>基于 01 Holdings Master 与 02 Daily Holding Intelligence 的每日持仓相关情报。</p>
      </div>
      <span class="live-pill"><i></i>真实数据 / Real Data</span>
    </header>
    <section class="holdings-summary-grid">
      <article class="mini-stat-card"><span>简报日期<small>Brief Date</small></span><strong>${escapeHtml(model.selectedDate || "—")}</strong></article>
      <article class="mini-stat-card"><span>活跃持仓<small>Active Holdings</small></span><strong>${escapeHtml(model.summary.activeHoldings)}</strong></article>
      <article class="mini-stat-card"><span>高风险<small>High Risk</small></span><strong>${escapeHtml(model.summary.highRisk)}</strong></article>
      <article class="mini-stat-card"><span>需行动<small>Action Needed</small></span><strong>${escapeHtml(model.summary.actionNeeded)}</strong></article>
    </section>
    ${
      model.hasAnyRows
        ? DailyPortfolioContent(model)
        : `<section class="panel">${EmptyState("今日持仓情报尚未生成", "No rows in 02 Daily Holding Intelligence")}</section>`
    }
  `;
}

function DailyPortfolioContent(model) {
  const mabelGroup = model.groupedByOwner.find((group) => group.owner === "Mabel");
  const victorGroup = model.groupedByOwner.find((group) => group.owner === "Victor");
  const otherGroups = model.groupedByOwner.filter((group) => group.owner !== "Mabel" && group.owner !== "Victor");
  return `
    ${!model.isToday ? `<div class="dpi-date-note">当天暂无数据，当前显示最近一次简报日期：${escapeHtml(model.selectedDate)}</div>` : ""}
    <section class="panel dpi-panel">
      <div class="panel-title compact">
        <h2>宏观市场判断 <span>/ Macro Market Judgment</span></h2>
      </div>
      ${
        model.macroImpacts.length
          ? `<div class="dpi-macro-list">${model.macroImpacts.map((impact) => `<p>${escapeHtml(impact)}</p>`).join("")}</div>`
          : EmptyState("暂无持仓相关宏观影响", "No holding-specific macro impact rows")
      }
    </section>
    <section class="panel dpi-panel">
      <div class="panel-title compact">
        <h2>行业趋势判断 <span>/ Sector Trend Judgment</span></h2>
      </div>
      ${
        model.sectorTrends.length
          ? `<div class="dpi-macro-list">${model.sectorTrends.map((trend) => `<p>${escapeHtml(trend)}</p>`).join("")}</div>`
          : EmptyState("暂无行业趋势判断", "No sector trend rows")
      }
    </section>
    ${mabelGroup ? DailyOwnerGroup(mabelGroup, "Mabel 持仓影响 / Mabel Holding Impact") : ""}
    ${victorGroup ? DailyOwnerGroup(victorGroup, "Victor 持仓影响 / Victor Holding Impact") : ""}
    ${otherGroups.map((group) => DailyOwnerGroup(group)).join("")}
    <section class="panel dpi-panel">
      <div class="panel-title compact">
        <h2>今日财报 / 重大公告 <span>/ Earnings & Announcements</span></h2>
      </div>
      ${
        model.earningsEvents.length
          ? `<div class="dpi-event-list">${model.earningsEvents.map(DailyEarningsItem).join("")}</div>`
          : EmptyState("暂无财报或重要公告", "No earnings event rows for selected brief date")
      }
    </section>
    <section class="panel dpi-panel">
      <div class="panel-title compact">
        <h2>风险提醒 <span>/ Risk Alerts</span></h2>
      </div>
      ${
        model.riskAlerts.length
          ? `<div class="dpi-risk-list">${model.riskAlerts.map(DailyRiskItem).join("")}</div>`
          : EmptyState("暂无风险提醒", "No risk alerts for selected brief date")
      }
    </section>
    <section class="panel dpi-panel">
      <div class="panel-title compact">
        <h2>明日关注 <span>/ Tomorrow Focus</span></h2>
      </div>
      ${
        model.tomorrowFocus.length
          ? `<div class="dpi-macro-list">${model.tomorrowFocus.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>`
          : EmptyState("暂无明日关注事项", "No tomorrow focus rows")
      }
    </section>
    <footer class="footer">
      本页面只整理持仓相关信息、宏观影响、来源链接和复核状态，不构成投资建议或买卖推荐。
    </footer>
  `;
}

function DailyOwnerGroup(group, title = "") {
  return `
    <section class="panel dpi-panel">
      <div class="panel-title compact">
        <h2>${title ? escapeHtml(title) : `${escapeHtml(group.owner)} 持仓影响 / Holding Impact`}</h2>
        <small class="wl-hint">仅展示持仓相关信息，不提供买卖建议。</small>
      </div>
      <div class="dpi-holding-list">
        ${group.items.map(DailyHoldingCard).join("")}
      </div>
    </section>
  `;
}

function DailyHoldingCard(item) {
  const hasIntelligence = Boolean(item.intelligence);
  return `
    <article class="dpi-holding-card ${hasIntelligence ? "" : "dpi-missing-intel"}">
      <div class="dpi-card-top">
        <div>
          <strong>${escapeHtml(displayValue(item.ticker, "—"))}</strong>
          <span>${escapeHtml(displayValue(item.name, "Unnamed holding"))}</span>
        </div>
        <span class="status-pill action-${actionLabelClass(item.actionNeeded)}">${escapeHtml(item.actionNeeded || "No Action")}</span>
      </div>
      <div class="dpi-meta">
        <span>${escapeHtml(displayValue(item.market, "Market N/A"))}</span>
        <span>${escapeHtml(displayValue(item.assetType, "Type N/A"))}</span>
        <span>${escapeHtml(displayValue(item.priceChange, "Price change N/A"))}</span>
        <span class="dpi-risk risk-${escapeHtml((item.riskLevel || "none").toLowerCase())}">${escapeHtml(displayValue(item.riskLevel, "Risk N/A"))}</span>
      </div>
      <div class="dpi-text-block">
        <span>中文新闻摘要 / Chinese News Summary</span>
        <p>${escapeHtml(hasIntelligence ? displayValue(item.chineseSummary, "暂无摘要") : "该持仓在当前简报日期没有匹配记录")}</p>
      </div>
      <div class="dpi-text-block">
        <span>AI中文点评 / AI Chinese Comment</span>
        <p>${escapeHtml(hasIntelligence ? displayValue(item.aiComment, "暂无点评") : "No daily intelligence row for this active holding")}</p>
      </div>
      ${DailySourceLinks(item)}
    </article>
  `;
}

function DailyRiskItem(item) {
  return `
    <article class="dpi-risk-item">
      <div>
        <strong>${escapeHtml(displayValue(item.ticker, "—"))} · ${escapeHtml(displayValue(item.name, "Unnamed holding"))}</strong>
        <p>${escapeHtml(displayValue(item.aiComment || item.chineseSummary, "暂无点评"))}</p>
      </div>
      <div class="dpi-risk-actions">
        <span class="tag">${escapeHtml(displayValue(item.riskLevel, "Risk N/A"))}</span>
        <span class="status-pill action-${actionLabelClass(item.actionNeeded)}">${escapeHtml(item.actionNeeded || "No Action")}</span>
      </div>
    </article>
  `;
}

function DailyEarningsItem(item) {
  return `
    <article class="dpi-event-item">
      <div>
        <strong>${escapeHtml(displayValue(item.ticker, "—"))} · ${escapeHtml(displayValue(item.name, "Unnamed holding"))}</strong>
        <p>${escapeHtml(displayValue(item.earningsEvent, "暂无财报事件"))}</p>
      </div>
      ${DailySourceLinks(item)}
    </article>
  `;
}

function DailySourceLinks(item) {
  const values = [item.sourceLink1, item.sourceLink2]
    .map((link) => String(link || "").trim())
    .filter(Boolean);
  const links = values.filter((link) => /^https?:\/\//i.test(link));
  const hasMissing = !values.length || values.some((link) => /source missing|来源缺失/i.test(link));
  if (!links.length && hasMissing) {
    return `<div class="dpi-sources missing">Source missing / 来源缺失</div>`;
  }
  return `
    <div class="dpi-sources">
      ${links.map((link, index) => `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Source ${index + 1}</a>`).join("")}
      ${hasMissing ? `<span class="dpi-source-missing">Source missing / 来源缺失</span>` : ""}
    </div>
  `;
}

// ─── Research Packs Page ─────────────────────────────────────────────────────

const NOTEBOOKLM_RESEARCH_PROMPT = [
  "请根据本研究包资料，分析该投资主题的主要机会与风险。",
  "请指出哪些信息已经确认，哪些仍需核实。",
  "请总结是否适合继续观察、进入 Review，或标记 High Attention。",
  "请生成一段可以写入 Decision Log 的中文复盘摘要。",
  "请不要生成直接买入或卖出建议。",
].join("\n");

export function ResearchPacksPage(rows, highlightedPackId = "") {
  const packs = (rows ?? [])
    .filter((row) => get(row, "研究包ID / Pack ID"))
    .sort((a, b) => {
      const av = get(a, "创建时间 / Created At") || get(a, "日期 / Date");
      const bv = get(b, "创建时间 / Created At") || get(b, "日期 / Date");
      return bv.localeCompare(av);
    });

  return `
    <header class="page-header">
      <div>
        <h1>研究包 <span>/ Research Packs</span></h1>
        <p>查看 Google Drive 研究包，手动导入 NotebookLM 后回填分析结果</p>
      </div>
      <span class="live-pill"><i></i>真实数据 / Real Data</span>
    </header>
    <section class="panel research-packs-panel">
      <div class="panel-title compact">
        <h2>研究包列表 <span>/ Research Pack Records</span></h2>
        <small class="wl-hint">研究包用于整理资料和辅助分析，不构成投资建议。</small>
      </div>
      ${
        packs.length
          ? `${ResearchPacksTable(packs, highlightedPackId)}${ResearchPackCards(packs, highlightedPackId)}`
          : `<div class="empty-state"><strong>暂无研究包 / No research packs yet</strong><span>从 Watchlist 或 Priority Alerts 生成第一份研究包</span></div>`
      }
    </section>
  `;
}

function ResearchPacksTable(rows, highlightedPackId) {
  return `
    <div class="rp-table-wrap">
      <div class="rp-table-head">
        <span>Pack ID</span>
        <span>Date</span>
        <span>Owner</span>
        <span>Research Topic</span>
        <span>Related Ticker</span>
        <span>Google Doc</span>
        <span>NotebookLM Status</span>
        <span>Decision Status</span>
        <span>Created At</span>
      </div>
      ${rows.map((row) => researchPackRow(row, highlightedPackId)).join("")}
    </div>
  `;
}

function researchPackRow(row, highlightedPackId) {
  const packId = get(row, "研究包ID / Pack ID");
  const docUrl = get(row, "Google Drive文件链接 / Drive File Link") || get(row, "来源链接 / Source Link");
  const highlighted = packId && packId === highlightedPackId;
  return `
    <article class="rp-record ${highlighted ? "rp-highlight" : ""}" data-rp-id="${escapeHtml(packId)}">
      <div class="rp-row">
        <strong class="dl-id">${escapeHtml(packId)}</strong>
        <span>${escapeHtml(get(row, "日期 / Date"))}</span>
        <span>${escapeHtml(get(row, "所属人 / Owner"))}</span>
        <span>${escapeHtml(get(row, "研究主题 / Research Topic"))}</span>
        <span>${escapeHtml(displayValue(get(row, "相关代码 / Related Ticker")))}</span>
        <span>${docUrl ? `<a href="${escapeHtml(docUrl)}" target="_blank" rel="noopener noreferrer">Open Research Pack</a>` : "—"}</span>
        <span>${escapeHtml(get(row, "NotebookLM状态 / NotebookLM Status"))}</span>
        <span class="status-pill action-${actionLabelClass(get(row, "决策建议状态 / Decision Status") || "Review")}">${escapeHtml(get(row, "决策建议状态 / Decision Status") || "Review")}</span>
        <span>${escapeHtml(get(row, "创建时间 / Created At"))}</span>
      </div>
      ${ResearchPackAnalysisForm(row)}
    </article>
  `;
}

function ResearchPackCards(rows, highlightedPackId) {
  return `
    <div class="rp-cards-mobile">
      ${rows.map((row) => {
        const packId = get(row, "研究包ID / Pack ID");
        const highlighted = packId && packId === highlightedPackId;
        return `
        <article class="rp-card-m ${highlighted ? "rp-highlight" : ""}" data-rp-id="${escapeHtml(packId)}">
          <div class="rp-card-top">
            <strong>${escapeHtml(packId)}</strong>
            <span class="status-pill action-${actionLabelClass(get(row, "决策建议状态 / Decision Status") || "Review")}">${escapeHtml(get(row, "决策建议状态 / Decision Status") || "Review")}</span>
          </div>
          <div class="rp-card-topic">${escapeHtml(get(row, "研究主题 / Research Topic"))}</div>
          <div class="rp-card-meta">
            <span>${escapeHtml(get(row, "日期 / Date"))}</span>
            <span>${escapeHtml(get(row, "所属人 / Owner"))}</span>
            <span>${escapeHtml(displayValue(get(row, "相关代码 / Related Ticker")))}</span>
          </div>
          <div class="rp-card-meta">
            <span>${escapeHtml(get(row, "NotebookLM状态 / NotebookLM Status"))}</span>
            <span>${escapeHtml(get(row, "创建时间 / Created At"))}</span>
          </div>
          ${ResearchPackAnalysisForm(row)}
        </article>
      `}).join("")}
    </div>
  `;
}

function ResearchPackAnalysisForm(row) {
  const packId = get(row, "研究包ID / Pack ID");
  const docUrl = get(row, "Google Drive文件链接 / Drive File Link") || get(row, "来源链接 / Source Link");
  const decisionStatus = get(row, "决策建议状态 / Decision Status") || "Review";
  return `
    <form class="rp-analysis-form" data-rp-form="1" data-pack-id="${escapeHtml(packId)}">
      <div class="rp-actions">
        ${docUrl ? `<a class="refresh-news-btn link-button" href="${escapeHtml(docUrl)}" target="_blank" rel="noopener noreferrer">Open Research Pack</a>` : ""}
        <button class="refresh-news-btn secondary-btn" type="button" data-copy-rp-prompt="1" data-prompt="${escapeHtml(NOTEBOOKLM_RESEARCH_PROMPT)}">Copy NotebookLM Prompt</button>
      </div>
      <div class="wf-row rp-form-grid">
        <label class="wf-field wf-full">
          <span>粘贴 / 更新 NotebookLM 分析结论</span>
          <textarea name="notebookLmConclusion" rows="3" placeholder="Paste NotebookLM Analysis">${escapeHtml(get(row, "NotebookLM结论 / NotebookLM Conclusion"))}</textarea>
        </label>
        <label class="wf-field wf-full">
          <span>投资步骤 / Investment Steps</span>
          <textarea name="investmentSteps" rows="2" placeholder="Review steps only, no trading recommendation">${escapeHtml(get(row, "投资步骤 / Investment Steps"))}</textarea>
        </label>
        <label class="wf-field">
          <span>Decision Status</span>
          <select name="decisionStatus">
            ${["Review", "High Attention", "No Action"].map((status) => `
              <option value="${escapeHtml(status)}" ${decisionStatus === status ? "selected" : ""}>${escapeHtml(status)}</option>
            `).join("")}
          </select>
        </label>
        <label class="wf-field">
          <span>备注 / Notes</span>
          <input name="notes" type="text" value="${escapeHtml(get(row, "备注 / Notes"))}" placeholder="Optional notes" />
        </label>
      </div>
      <div class="wf-actions">
        <button type="submit" class="refresh-news-btn">保存分析 / Save Analysis</button>
        <span class="news-refresh-status" data-rp-save-status></span>
      </div>
    </form>
  `;
}

// ─── Decision Log Page ────────────────────────────────────────────────────────

const DL_FILTERS = [
  ["all",       "全部 / All"],
  ["mabel",     "Mabel"],
  ["victor",    "Victor"],
  ["buy",       "Buy"],
  ["sell",      "Sell"],
  ["hold",      "Hold"],
  ["watch",     "Watch"],
  ["review",    "Review"],
  ["planned",   "Planned"],
  ["completed", "Completed"],
];

export function DecisionLogPage(model) {
  return `
    <header class="page-header">
      <div>
        <h1>决策记录 <span>/ Decision Log</span></h1>
        <p>记录买入、卖出、观察、持有和复盘理由</p>
      </div>
      <span class="live-pill"><i></i>真实数据 / Real Data</span>
    </header>
    ${DecisionLogSummaryCards(model.summary)}
    ${DecisionLogAddForm()}
    <section class="panel dl-table-panel">
      <div class="panel-title compact">
        <h2>决策记录列表 <span>/ Decision Records</span></h2>
      </div>
      <section class="filter-bar dl-filter-bar" aria-label="Decision log filters">
        ${DL_FILTERS.map(([f, label]) =>
          `<button class="filter-chip ${model.activeFilter === f ? "active" : ""}" data-dl-filter="${escapeHtml(f)}" type="button">${escapeHtml(label)}</button>`
        ).join("")}
      </section>
      ${
        model.filtered.length
          ? DecisionLogTable(model.filtered)
          : `<div class="empty-state"><strong>暂无决策记录 / No decision records yet</strong><span>添加第一条记录，或调整筛选条件</span></div>`
      }
    </section>
  `;
}

function DecisionLogSummaryCards(summary) {
  const cards = [
    ["总记录", "Total Decisions", summary.total],
    ["Mabel 记录", "Mabel Decisions", summary.mabel],
    ["Victor 记录", "Victor Decisions", summary.victor],
    ["待复核", "Needs Review", summary.needsReview],
  ];
  return `
    <section class="holdings-summary-grid">
      ${cards.map(([zh, en, value]) => `
        <article class="mini-stat-card">
          <span>${zh}<small>${en}</small></span>
          <strong>${value}</strong>
        </article>
      `).join("")}
    </section>
  `;
}

function DecisionLogAddForm() {
  return `
    <section class="panel watchlist-add-panel dl-add-panel">
      <div class="panel-title compact">
        <h2>新增决策记录 <span>/ Add Decision Log</span></h2>
      </div>
      <form id="dl-add-form" class="watchlist-form" autocomplete="off">
        <div class="wf-row">
          <label class="wf-field">
            <span>日期 / Date <em>*</em></span>
            <input name="date" type="date" required />
          </label>
          <label class="wf-field">
            <span>所属人 / Owner <em>*</em></span>
            <select name="owner" required>
              <option value="">-- 请选择 --</option>
              <option value="Mabel">Mabel</option>
              <option value="Victor">Victor</option>
              <option value="Both">Both</option>
            </select>
          </label>
          <label class="wf-field">
            <span>账户类型 / Account Type</span>
            <select name="accountType">
              <option value="">-- 请选择 --</option>
              <option value="TFSA">TFSA</option>
              <option value="RRSP">RRSP</option>
              <option value="Non-registered">Non-registered</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>代码 / Ticker</span>
            <input name="ticker" type="text" placeholder="e.g. AAPL" id="dl-ticker-input" />
          </label>
          <label class="wf-field">
            <span>名称 / Name</span>
            <input name="name" type="text" placeholder="e.g. Apple Inc." id="dl-name-input" />
          </label>
          <label class="wf-field">
            <span>资产类型 / Asset Type</span>
            <select name="assetType">
              <option value="">-- 请选择 --</option>
              <option value="Stock">Stock</option>
              <option value="ETF">ETF</option>
              <option value="Fund">Fund</option>
              <option value="GIC">GIC</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>操作类型 / Action Type <em>*</em></span>
            <select name="actionType" required>
              <option value="">-- 请选择 --</option>
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
              <option value="Hold">Hold</option>
              <option value="Watch">Watch</option>
              <option value="Review">Review</option>
              <option value="Dividend">Dividend</option>
              <option value="Contribution">Contribution</option>
              <option value="Withdrawal">Withdrawal</option>
            </select>
          </label>
          <label class="wf-field">
            <span>决策状态 / Decision Status</span>
            <select name="decisionStatus">
              <option value="Completed">Completed</option>
              <option value="Planned">Planned</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Review Later">Review Later</option>
            </select>
          </label>
          <label class="wf-field">
            <span>风险等级 / Risk Level</span>
            <select name="riskLevel">
              <option value="">-- 请选择 --</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>金额 / Amount</span>
            <input name="amount" type="number" step="0.01" min="0" placeholder="0.00" />
          </label>
          <label class="wf-field">
            <span>数量 / Quantity</span>
            <input name="quantity" type="number" step="0.0001" min="0" placeholder="0" />
          </label>
          <label class="wf-field">
            <span>单价 / Price</span>
            <input name="price" type="number" step="0.0001" min="0" placeholder="0.00" />
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>成本 / Cost (留空则自动计算 / Auto-calc if blank)</span>
            <input name="cost" type="number" step="0.01" min="0" placeholder="Auto" />
          </label>
          <label class="wf-field">
            <span>关联观察ID / Related Watch ID</span>
            <input name="relatedWatchId" type="text" placeholder="e.g. WAT-001" id="dl-watch-id-input" />
          </label>
          <label class="wf-field">
            <span>关联持仓ID / Related Holding ID</span>
            <input name="relatedHoldingId" type="text" placeholder="e.g. HOL-001" />
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>决策原因 / Decision Reason</span>
            <textarea name="decisionReason" rows="2" placeholder="简要说明决策原因 / Brief reason for this decision" id="dl-reason-input"></textarea>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>参考信息 / Reference Info</span>
            <textarea name="referenceInfo" rows="2" placeholder="e.g. From Watchlist Quick Research" id="dl-ref-input"></textarea>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>复盘备注 / Review Notes</span>
            <textarea name="reviewNotes" rows="2" placeholder="事后复盘填写 / Fill in after review"></textarea>
          </label>
        </div>
        <div class="wf-actions">
          <button type="submit" class="refresh-news-btn">新增决策记录 / Add Decision Log</button>
          <span id="dl-add-status" class="news-refresh-status"></span>
        </div>
      </form>
    </section>
  `;
}

function DecisionLogTable(rows) {
  return `
    <div class="dl-table-wrap">
      <div class="dl-table-head">
        <span>ID</span>
        <span>日期 / Date</span>
        <span>所属人</span>
        <span>代码 / Ticker</span>
        <span>名称 / Name</span>
        <span>操作 / Action</span>
        <span>金额 / Amount</span>
        <span>数量 / Qty</span>
        <span>单价 / Price</span>
        <span>成本 / Cost</span>
        <span>决策原因</span>
        <span>状态</span>
      </div>
      ${rows.map(decisionLogRow).join("")}
    </div>
    <div class="dl-cards-mobile">
      ${rows.map(decisionLogCardMobile).join("")}
    </div>
  `;
}

function decisionLogCardMobile(row) {
  const decisionId     = get(row, "决策ID / Decision ID");
  const date           = get(row, "日期 / Date");
  const owner          = get(row, "所属人 / Owner");
  const ticker         = get(row, "代码 / Ticker");
  const name           = get(row, "名称 / Name");
  const actionType     = get(row, "操作类型 / Action Type") || "";
  const amount         = get(row, "金额 / Amount");
  const decisionReason = get(row, "决策原因 / Decision Reason");
  const decisionStatus = get(row, "决策状态 / Decision Status") || "Active";

  const statusClass = decisionStatus.includes("Review") ? "review"
                    : decisionStatus === "Planned"       ? "none"
                    : decisionStatus === "Cancelled"     ? "high"
                    : "none";

  return `
    <div class="dl-card-m">
      <div class="dlcm-top">
        <strong class="wl-ticker">${escapeHtml(ticker || name || "—")}</strong>
        <span class="status-pill action-${actionLabelClass(actionType)}">${escapeHtml(actionType)}</span>
      </div>
      <div class="dlcm-meta">
        <span class="dl-id">${escapeHtml(decisionId)}</span>
        <span>·</span>
        <span>${escapeHtml(date)}</span>
        <span>·</span>
        <span>${escapeHtml(owner)}</span>
        ${amount ? `<span>·</span><span>$${escapeHtml(amount)}</span>` : ""}
      </div>
      ${name && ticker ? `<div class="dlcm-name">${escapeHtml(name)}</div>` : ""}
      ${decisionReason ? `<div class="dlcm-reason">${escapeHtml(decisionReason)}</div>` : ""}
      <div class="dlcm-footer">
        <span class="status-pill action-${statusClass}">${escapeHtml(decisionStatus)}</span>
      </div>
    </div>
  `;
}

function decisionLogRow(row) {
  const actionType     = get(row, "操作类型 / Action Type") || "";
  const decisionStatus = get(row, "决策状态 / Decision Status") || "";
  const statusClass    = decisionStatus.includes("Review") ? "review"
                       : decisionStatus === "Planned"      ? "none"
                       : decisionStatus === "Cancelled"    ? "high"
                       : "none";

  return `
    <div class="dl-row">
      <span class="dl-id">${escapeHtml(get(row, "决策ID / Decision ID"))}</span>
      <span>${escapeHtml(get(row, "日期 / Date"))}</span>
      <span>${escapeHtml(get(row, "所属人 / Owner"))}</span>
      <strong class="wl-ticker">${escapeHtml(get(row, "代码 / Ticker"))}</strong>
      <span>${escapeHtml(get(row, "名称 / Name"))}</span>
      <span class="status-pill action-${actionLabelClass(actionType)}">${escapeHtml(actionType)}</span>
      <span>${escapeHtml(get(row, "金额 / Amount"))}</span>
      <span>${escapeHtml(get(row, "数量 / Quantity"))}</span>
      <span>${escapeHtml(get(row, "单价 / Price"))}</span>
      <span>${escapeHtml(get(row, "成本 / Cost"))}</span>
      <span class="dl-reason">${escapeHtml(get(row, "决策原因 / Decision Reason"))}</span>
      <span class="status-pill action-${statusClass}">${escapeHtml(decisionStatus || "Active")}</span>
    </div>
  `;
}
