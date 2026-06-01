import { NAV_ITEMS, SHEET_CONFIG } from "./config.js";
import { t, getLang, formatHeaderDate } from "./i18n.js";
import { get } from "./data/dashboardMapper.js";
import { deriveActionLabel, displayMarketValue, displayValue, HOLDING_FILTERS } from "./data/holdingsMapper.js";

// Mobile tab definitions: [i18n-key, icon, page-id]
const MOBILE_TABS = [
  ["mtab_dashboard", "⌂", "dashboard"],
  ["mtab_holdings",  "▣", "holdings"],
  ["mtab_watchlist", "◇", "watchlist"],
  ["mtab_decisions", "□", "decisions"],
];

// ─── App Shell ────────────────────────────────────────────────────────────────

export function AppShell(content, currentPage = "dashboard") {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">◎</div>
        <div>
          <strong>${t("brand_name")}</strong>
        </div>
      </div>
      <nav class="nav">${NAV_ITEMS.map((item) => navItem(item, currentPage)).join("")}</nav>
      <div class="sidebar-card">
        <strong>${t("sidebar_tagline")}</strong>
        <small>${t("sidebar_no_advice")}</small>
      </div>
      <div class="sidebar-card sync">
        <strong>${t("sidebar_data_source")}</strong>
        <span>${SHEET_CONFIG.spreadsheetTitle}</span>
        <div class="sidebar-footer-actions">
          <button class="logout-btn" data-action="logout" type="button">${t("btn_lock")}</button>
        </div>
      </div>
    </aside>
    <main class="main">${content}</main>
    <nav class="mobile-bottom-nav" aria-label="${t("brand_name")}">
      ${MOBILE_TABS.map(([key, icon, page]) => `
        <a class="mbn-tab ${currentPage === page ? "active" : ""}" href="#/${page}" aria-label="${t(key)}">
          <span class="mbn-icon">${icon}</span>
          <span>${t(key)}</span>
        </a>
      `).join("")}
    </nav>
    <div class="lang-float" role="group" aria-label="Language / 语言">
      <button class="lang-float-btn${getLang() === "en" ? " active" : ""}" data-action="setLang" data-lang="en" type="button">EN</button>
      <button class="lang-float-btn${getLang() === "zh" ? " active" : ""}" data-action="setLang" data-lang="zh" type="button">中文</button>
    </div>
  `;
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const today = formatHeaderDate();

  return `
    <header class="topbar">
      <div>
        <div class="title-row">
          <h1>${t("header_title")}</h1>
          <span class="live-pill"><i></i>${t("header_live")}</span>
        </div>
      </div>
      <div class="header-actions">
        <div class="date-card">
          <span>${t("header_today")}</span>
          <strong>${today}</strong>
        </div>
        <label class="search-box" aria-label="${t("header_search_ph")}">
          <input type="search" placeholder="${t("header_search_ph")}" />
          <span>⌕</span>
        </label>
      </div>
    </header>
  `;
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

export function KpiCards(kpis) {
  const lang = getLang();
  const cards = [
    [t("kpi_risk_level"),   lang === "zh" ? kpis.riskLevel.zh : kpis.riskLevel.en, "",                    "shield",    kpis.riskLevel.tone],
    [t("kpi_review_count"), kpis.reviewCount,        t("kpi_holdings_unit"), "clipboard", "blue"],
    [t("kpi_alerts"),       kpis.priorityAlertCount, t("kpi_alerts_unit"),   "bell",      "orange"],
    [t("kpi_updates"),      kpis.latestUpdateCount,  t("kpi_news_unit"),     "news",      "green"],
  ];

  return `<section class="kpi-grid">${cards.map(kpiCard).join("")}</section>`;
}

// ─── Market Section ───────────────────────────────────────────────────────────

export function MarketSection(marketData) {
  const rows = Array.isArray(marketData) ? marketData : [];
  const bySymbol = {};
  rows.forEach((r) => { bySymbol[get(r, "代码 / Symbol")] = r; });

  const dow    = buildIndexDisplayItem(bySymbol, "^DJI",    "Dow Jones");
  const nasdaq = buildIndexDisplayItem(bySymbol, "^IXIC",   "Nasdaq");
  const sp500  = buildIndexDisplayItem(bySymbol, "^GSPC",   "S&P 500");
  const nvda   = buildIndexDisplayItem(bySymbol, "NVDA",    "NVIDIA");
  const googl  = buildIndexDisplayItem(bySymbol, "GOOGL",   "Alphabet (Google)");
  const tsx    = buildIndexDisplayItem(bySymbol, "^GSPTSE", "S&P/TSX Composite");
  const cadusd = buildIndexDisplayItem(bySymbol, "CADUSD=X",         "CAD/USD");
  const gold   = buildIndexDisplayItem(bySymbol, "GC=F",             "Gold (USD/oz)");
  const oil    = buildIndexDisplayItem(bySymbol, "USO",              "Oil ETF Proxy (USO)");
  const ca10y  = buildIndexDisplayItem(bySymbol, "XBB.TO",          "Canada Bond ETF (XBB.TO)");

  return `
    <section class="market-grid">
      <article class="market-card">
        <div class="panel-title compact">
          <h2>${t("market_us_title")}</h2>
          <div class="news-refresh-row">
            <button id="btn-refresh-market" class="refresh-news-btn" type="button">${t("btn_refresh_market")}</button>
            <span id="market-refresh-status" class="news-refresh-status"></span>
          </div>
        </div>
        ${marketQuoteRows([dow, nasdaq, sp500, nvda, googl])}
        <p class="market-proxy-note">${t("market_proxy_note_us")}</p>
      </article>
      <article class="market-card">
        <div class="panel-title compact">
          <h2>${t("market_canada_title")}</h2>
        </div>
        ${marketQuoteRows([tsx, cadusd, gold, oil, ca10y])}
        <p class="market-proxy-note">${t("market_proxy_note_ca")}</p>
      </article>
    </section>
  `;
}

function marketQuoteRows(rowList) {
  const valid = rowList.filter(Boolean);
  if (!valid.length) {
    return `<div class="market-empty">${t("market_empty")}<br><small>${t("market_empty_sub")}</small></div>`;
  }
  return `<div class="market-quotes">${valid.map(marketQuoteRow).join("")}</div>`;
}

function marketQuoteRow(row) {
  const symbol = row.symbol || "—";
  const price  = row.value  || "—";
  const change = row.change || "—";
  const date   = row.date   || "—";
  const label  = row.label  || symbol;

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
        <span class="mq-price">${escapeHtml(price)}</span>
        <span class="mq-change">${arrow} ${escapeHtml(change)}</span>
        <small class="mq-date">${escapeHtml(date)}</small>
      </div>
    </div>
  `;
}

// ─── Live Updates (News) Panel ────────────────────────────────────────────────

export function LiveUpdatesPanel(news) {
  return `
    <section class="panel live-updates">
      <div class="panel-title">
        <h2>${t("news_panel_title")}</h2>
        <div class="news-refresh-row">
          <button id="btn-refresh-news" class="refresh-news-btn" type="button">${t("btn_refresh_news")}</button>
          <span id="news-refresh-status" class="news-refresh-status"></span>
        </div>
      </div>
      ${
        news.length
          ? `<div class="news-list">${news.map(newsItem).join("")}</div>`
          : EmptyState(t("news_no_data_main"), t("news_no_data_sub"))
      }
      <a class="panel-link" href="#" aria-disabled="true">${t("news_view_all")}</a>
    </section>
  `;
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────

export function AlertsPanel({ alerts, holdingStatuses }) {
  const holdingsSection = Array.isArray(holdingStatuses) && holdingStatuses.length
    ? holdingsNeedingReviewSection(holdingStatuses)
    : "";

  return `
    <section class="panel alerts-panel">
      <div class="panel-title"><h2>${t("alerts_panel_title")}</h2></div>
      ${holdingsSection}
      ${
        alerts.length
          ? `<div class="alert-list">${alerts.map(alertItem).join("")}</div>`
          : EmptyState(t("alerts_empty_main"), t("alerts_empty_sub"))
      }
      <a class="panel-link" href="#" aria-disabled="true">${t("alerts_view_all")}</a>
    </section>
  `;
}

// --- Morning Brief Panel -----------------------------------------------------

export function MorningBriefPanel(items) {
  const visibleItems = filterMorningBriefByLanguage(items).slice(0, 1);
  return `
    <section class="panel morning-brief-panel">
      <div class="panel-title"><h2>${t("morning_brief_title")}</h2></div>
      ${
        visibleItems.length
          ? `<div class="morning-brief-list">${visibleItems.map(morningBriefItem).join("")}</div>`
          : EmptyState(t("morning_brief_empty"), "")
      }
    </section>
  `;
}

function filterMorningBriefByLanguage(items) {
  const lang = getLang();
  return items.filter((row) => {
    if (row?.summary3Lines) return true;

    const language = String(get(row, "语言 / Language")).trim().toLowerCase();
    if (!language) return true;
    if (lang === "zh") return language === "zh" || language === "chinese" || language === "中文";
    return language === "en" || language === "english" || language === "英文";
  });
}

function hasMostlyChineseBriefContent(row) {
  const text = `${get(row, "_docContent")} ${get(row, "摘要 / Summary")}`.trim();
  if (!text) return false;

  const chineseChars = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  return chineseChars >= 20;
}

function morningBriefItem(row) {
  const date = row.reportDate || get(row, "日期 / Date");
  const title = row.title || get(row, "标题 / Title") || t("morning_brief_no_title");
  const rawSummary = row.summary3Lines || get(row, "_docContent") || get(row, "摘要 / Summary");
  const summary = getLang() === "en" && hasMostlyChineseBriefContent(row) ? "" : rawSummary;
  const docLink = row.sourceDocUrl || get(row, "Google Doc Link");

  return `
    <article class="morning-brief-row">
      <time>${escapeHtml(formatBriefDate(date))}</time>
      <div class="morning-brief-body">
        <strong>${escapeHtml(title)}</strong>
        ${summary ? renderBriefContent(summary) : ""}
        ${
          docLink
            ? `<a class="morning-brief-link" href="${escapeHtml(docLink)}" target="_blank" rel="noopener noreferrer">${t("morning_brief_open_doc")}</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderBriefContent(summary) {
  const lines = String(summary)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return `<p>${escapeHtml(summary)}</p>`;
  }

  return `
    <div class="morning-brief-content">
      ${lines.map((line) => {
        if (/^═+$/.test(line)) return `<hr />`;
        return `<p>${escapeHtml(line)}</p>`;
      }).join("")}
    </div>
  `;
}

function formatBriefDate(value) {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString(getLang() === "zh" ? "zh-CN" : "en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleDateString(getLang() === "zh" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function holdingsNeedingReviewSection(holdingStatuses) {
  function statusClass(s) {
    if (s === "High Attention") return "high";
    if (s === "Review")         return "review";
    return "none";
  }
  function statusLabel(s) {
    if (s === "High Attention") return t("alerts_status_high");
    if (s === "Review")         return t("alerts_status_review");
    return t("alerts_status_normal");
  }
  function statusIcon(s) {
    if (s === "High Attention") return "▲";
    if (s === "Review")         return "◎";
    return "✓";
  }

  const rows = holdingStatuses.map((h) => `
    <div class="hsr-row">
      <span class="hsr-ticker">${escapeHtml(h.ticker)}</span>
      <span class="hsr-news-count">${h.newsCount > 0 ? h.newsCount + t("alerts_news_count_suffix") : ""}</span>
      <span class="status-pill action-${statusClass(h.status)}">
        <em class="hsr-icon">${statusIcon(h.status)}</em>${escapeHtml(statusLabel(h.status))}
      </span>
    </div>
  `).join("");

  return `
    <div class="holdings-status-mini">
      <div class="hsr-header">
        <strong class="hsr-title">${t("alerts_holdings_status")}</strong>
        <small class="hsr-note">${t("alerts_informational")}</small>
      </div>
      <div class="hsr-list">${rows}</div>
    </div>
  `;
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

export function SummaryCards(summaries) {
  return `
    <section class="summary-grid">
      ${SummaryTable(t("summary_family"),    summaries.family)}
      ${SummaryList(t("summary_mabel"),      summaries.mabel)}
      ${SummaryList(t("summary_victor"),     summaries.victor)}
      ${SummaryList(t("summary_watchlist"),  summaries.watchlist)}
      ${SummaryList(t("summary_reminders"),  summaries.reminders)}
    </section>
  `;
}

// ─── Loading / Error States ───────────────────────────────────────────────────

export function LoadingState() {
  return AppShell(`
    ${Header()}
    <section class="state-card">
      <div class="spinner"></div>
      <h2>${t("loading_text")}</h2>
      <p>${t("loading_subtitle")} ${SHEET_CONFIG.spreadsheetTitle}</p>
    </section>
  `);
}

export function ErrorState(error) {
  return AppShell(`
    ${Header()}
    <section class="state-card error">
      <h2>${t("error_title")}</h2>
      <p>${escapeHtml(error.message)}</p>
      <small>${t("error_hint")}</small>
    </section>
  `);
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function navItem([key, icon, page], currentPage) {
  return `
    <a class="nav-item ${currentPage === page ? "active" : ""}" href="#/${page}" data-page="${page}">
      <span class="icon icon-${icon}"></span>
      <span>${t(key)}</span>
    </a>
  `;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function kpiCard([label, value, subvalue, icon, tone]) {
  return `
    <article class="kpi-card tone-${tone}">
      <div class="kpi-head">
        <span class="icon icon-${icon}"></span>
        <span>${label}</span>
      </div>
      <strong>${value}</strong>
      ${subvalue ? `<em>${subvalue}</em>` : ""}
      <div class="sparkline" aria-hidden="true"></div>
    </article>
  `;
}

// ─── News item ────────────────────────────────────────────────────────────────

function newsItem(row) {
  const rawTime = get(row, "新闻时间 / News Time") || get(row, "日期 / Date") || "";
  const displayTime = formatNewsTime(rawTime) || "--";

  const chineseTitle  = get(row, "新闻标题中文 / Chinese Title");
  const originalTitle = get(row, "原始标题 / Original Title");
  const sourceLink    = get(row, "来源链接 / Source Link");

  // In EN mode show original title when available, fall back to Chinese title
  // In ZH mode show Chinese title when available, fall back to original
  const lang = getLang();
  let mainText;
  if (lang === "zh") {
    mainText = chineseTitle || originalTitle || t("news_no_title");
  } else {
    mainText = originalTitle || chineseTitle || t("news_no_title");
  }

  // Secondary line: show the other version if it differs
  const secondary = lang === "zh" ? originalTitle : chineseTitle;
  const showSecondary = secondary && secondary !== mainText;
  const secondaryHtml = showSecondary
    ? sourceLink
      ? `<small class="news-original"><a href="${escapeHtml(sourceLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(secondary)}</a></small>`
      : `<small class="news-original">${escapeHtml(secondary)}</small>`
    : "";

  return `
    <article class="news-row">
      <time>${escapeHtml(displayTime)}</time>
      <span class="tag">${escapeHtml(get(row, "类别 / Category") || t("news_uncategorized"))}</span>
      <div class="news-text">
        <strong>${escapeHtml(mainText)}</strong>
        ${secondaryHtml}
      </div>
    </article>
  `;
}

function formatNewsTime(raw) {
  if (!raw) return "";
  const iso  = raw.match(/T(\d{2}:\d{2})/);
  if (iso) return iso[1];
  const hhmm = raw.match(/^(\d{2}:\d{2})/);
  if (hhmm) return hhmm[1];
  return raw;
}

// ─── Alert item ───────────────────────────────────────────────────────────────

function alertItem(row) {
  const status = get(row, "人工处理状态 / Human Review Status") || get(row, "需要行动 / Action Needed") || "Review";
  const pillClass = status === "High Attention" ? "action-high"
                  : status === "Review"         ? "action-review"
                  : status === "Watch"          ? "action-watch"
                  : "action-none";
  const iconClass = status === "High Attention" ? "alert-icon alert-icon-high"
                  : status === "Watch"          ? "alert-icon alert-icon-watch"
                  : "alert-icon";
  const iconGlyph = status === "High Attention" ? "!!" : status === "Watch" ? "⌁" : "!";

  const summary = get(row, "最新中文摘要 / Latest Chinese Summary")
               || get(row, "AI中文点评 / AI Chinese Comment")
               || t("alerts_no_summary");

  return `
    <article class="alert-row">
      <div class="${iconClass}">${iconGlyph}</div>
      <div>
        <strong>${escapeHtml(get(row, "关注主题 / Watch Topic"))}</strong>
        <p>${escapeHtml(summary)}</p>
      </div>
      <span class="status-pill ${pillClass}">${escapeHtml(status)}</span>
    </article>
  `;
}

// ─── Summary table / list ─────────────────────────────────────────────────────

function SummaryTable(title, rows) {
  return `
    <article class="summary-card">
      <h3>${title}</h3>
      <div class="summary-table">
        ${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      </div>
    </article>
  `;
}

function SummaryList(title, rows) {
  return `
    <article class="summary-card">
      <h3>${title}</h3>
      ${
        rows.length
          ? `<div class="summary-list">${rows.map((row) => `<div><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.meta)}</span></div>`).join("")}</div>`
          : EmptyState(t("summary_empty"), "")
      }
    </article>
  `;
}

// ─── Holdings Page ────────────────────────────────────────────────────────────

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
        : `<section class="panel">${EmptyState(t("holdings_empty"), "")}</section>`
    }
  `;
}

function HoldingsHeader() {
  return `
    <header class="page-header">
      <div>
        <h1>${t("holdings_page_title")}</h1>
        <p>${t("holdings_page_subtitle")}</p>
      </div>
      <span class="live-pill"><i></i>${t("live_pill_real")}</span>
    </header>
  `;
}

function HoldingsSummaryCards(summary) {
  const cards = [
    [t("holdings_total"),       summary.total],
    [t("holdings_mabel"),       summary.mabel],
    [t("holdings_victor"),      summary.victor],
    [t("holdings_need_review"), summary.needReview],
  ];

  return `
    <section class="holdings-summary-grid">
      ${cards.map(([label, value]) => `
        <article class="mini-stat-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `).join("")}
    </section>
  `;
}

function HoldingsFilters(activeFilter) {
  const filterLabelMap = {
    all:      t("filter_all"),
    Mabel:    t("filter_mabel"),
    Victor:   t("filter_victor"),
    ETF:      t("filter_etf"),
    Stock:    t("filter_stock"),
    highRisk: t("filter_high_risk"),
    review:   t("filter_review"),
  };

  return `
    <section class="filter-bar" aria-label="${t("holdings_page_title")}">
      ${HOLDING_FILTERS.map(
        (filter) => `
          <button class="filter-chip ${activeFilter === filter ? "active" : ""}" data-filter="${filter}" type="button">${filterLabelMap[filter] || filter}</button>
        `
      ).join("")}
    </section>
  `;
}

function HoldingsTable(rows, selectedHolding) {
  if (!rows.length) {
    return `<section class="panel holdings-table-panel">${EmptyState(t("holdings_filter_empty"), "")}</section>`;
  }

  return `
    <section class="panel holdings-table-panel">
      <div class="holdings-table">
        <div class="holdings-table-head">
          <span>${t("col_owner")}</span>
          <span>${t("col_ticker")}</span>
          <span>${t("col_name")}</span>
          <span>${t("col_type")}</span>
          <span>${t("col_market")}</span>
          <span>${t("col_account")}</span>
          <span>${t("col_price")}</span>
          <span>${t("col_value")}</span>
          <span>${t("col_risk")}</span>
          <span>${t("col_status")}</span>
          <span>${t("col_action")}</span>
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
    return `<aside class="panel holding-detail-panel">${EmptyState(t("holdings_select_prompt"), "")}</aside>`;
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
        <strong>${t("holding_owner_mabel_title")}</strong>
        <p>${t("holding_owner_mabel_desc")}</p>
      </div>
    `;
  }
  if (owner === "Victor") {
    return `
      <div class="owner-context victor">
        <strong>${t("holding_owner_victor_title")}</strong>
        <p>${t("holding_owner_victor_desc")}</p>
      </div>
    `;
  }
  return `
    <div class="owner-context">
      <strong>${t("holding_owner_family_title")}</strong>
      <p>${t("holding_owner_family_desc")}</p>
    </div>
  `;
}

function HoldingFacts(holding) {
  // Labels come from the Google Sheet column name (bilingual by design).
  // We display them as-is (they are data field labels, not UI copy).
  const facts = [
    ["所属人 / Owner",               get(holding, "所属人 / Owner")],
    ["类型 / Type",                  get(holding, "类型 / Type")],
    ["板块 / Sector",                get(holding, "板块 / Sector")],
    ["账户类型 / Account Type",       get(holding, "账户类型 / Account Type")],
    ["当前价格 / Current Price",      displayMarketValue(get(holding, "当前价格 / Current Price"))],
    ["当前市值 / Current Value",      displayMarketValue(get(holding, "当前市值 / Current Value"))],
    ["风险等级 / Risk Level",         get(holding, "风险等级 / Risk Level")],
    ["投资策略 / Strategy",           get(holding, "投资策略 / Strategy")],
    ["状态 / Status",                get(holding, "状态 / Status")],
    ["最后复核 / Last Reviewed",      get(holding, "最后复核 / Last Reviewed")],
    ["数据来源 / Data Source",        get(holding, "数据来源 / Data Source")],
    ["备注 / Notes",                 get(holding, "备注 / Notes")],
  ];

  return `
    <div class="detail-section">
      <h3>${t("holding_detail_title")}</h3>
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
        <h3>${t("holding_research_title")}</h3>
        ${EmptyState(t("holding_no_research"), `03 Holding Research API: ${researchError}`)}
      </div>
    `;
  }

  if (!research) {
    return `
      <div class="detail-section">
        <h3>${t("holding_research_title")}</h3>
        ${EmptyState(t("holding_no_research"), t("holding_no_research_sub"))}
      </div>
    `;
  }

  const fields = [
    ["业务/基金简介 / Business or Fund Profile",          get(research, "业务/基金简介 / Business or Fund Profile")],
    ["主要持仓/资产 / Top Holdings or Main Assets",       get(research, "主要持仓/资产 / Top Holdings or Main Assets")],
    ["管理费率 / Expense Ratio",                          get(research, "管理费率 / Expense Ratio")],
    ["分红/收益率 / Dividend or Yield",                   get(research, "分红/收益率 / Dividend or Yield")],
    ["财务健康度 / Financial Health",                     get(research, "财务健康度 / Financial Health")],
    ["主要风险 / Main Risks",                             get(research, "主要风险 / Main Risks")],
    ["AI中文研究摘要 / AI Chinese Research Summary",      get(research, "AI中文研究摘要 / AI Chinese Research Summary")],
    ["复核状态 / Review Status",                          get(research, "复核状态 / Review Status")],
  ];

  return `
    <div class="detail-section">
      <h3>${t("holding_research_title")}</h3>
      <div class="research-list">
        ${fields.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><p>${escapeHtml(displayValue(value))}</p></div>`).join("")}
      </div>
    </div>
  `;
}

function RelatedNewsPanel(newsRows) {
  return `
    <div class="detail-section">
      <h3>${t("holding_related_news_title")}</h3>
      ${
        newsRows.length
          ? `<div class="related-news-list">${newsRows.map(relatedNewsItem).join("")}</div>`
          : EmptyState(t("holding_no_related_news"), t("holding_no_related_news_sub"))
      }
    </div>
  `;
}

function relatedNewsItem(row) {
  return `
    <article class="related-news-row">
      <time>${escapeHtml(displayValue(get(row, "新闻时间 / News Time"), "--"))}</time>
      <span class="tag">${escapeHtml(displayValue(get(row, "类别 / Category"), t("news_uncategorized")))}</span>
      <strong>${escapeHtml(displayValue(get(row, "新闻标题中文 / Chinese Title")))}</strong>
      <span>${escapeHtml(displayValue(get(row, "风险等级 / Risk Level")))}</span>
      <span class="status-pill action-${actionLabelClass(displayValue(get(row, "需要行动 / Action Needed"), "Review"))}">${escapeHtml(displayValue(get(row, "需要行动 / Action Needed"), "Review"))}</span>
    </article>
  `;
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
              <h2>${t("watchlist_table_title")}</h2>
              <small class="wl-hint">${t("watchlist_click_hint")}</small>
            </div>
            ${WatchlistTable(model.watchlist)}
           </section>`
        : `<section class="panel">${EmptyState(t("watchlist_empty"), "")}</section>`
    }
  `;
}

function WatchlistPageHeader() {
  return `
    <header class="page-header">
      <div>
        <h1>${t("watchlist_page_title")}</h1>
        <p>${t("watchlist_page_subtitle")}</p>
      </div>
      <span class="live-pill"><i></i>${t("live_pill_real")}</span>
    </header>
  `;
}

function WatchlistSummaryCards(summary) {
  const cards = [
    [t("watchlist_total"),         summary.total],
    [t("watchlist_mabel"),         summary.mabel],
    [t("watchlist_victor"),        summary.victor],
    [t("watchlist_high_priority"), summary.highPriority],
  ];
  return `
    <section class="holdings-summary-grid">
      ${cards.map(([label, value]) => `
        <article class="mini-stat-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `).join("")}
    </section>
  `;
}

function WatchlistAddForm() {
  const sp = t("form_select_ph");
  return `
    <section class="panel watchlist-add-panel">
      <div class="panel-title compact">
        <h2>${t("watchlist_add_title")}</h2>
      </div>
      <form id="watchlist-add-form" class="watchlist-form" autocomplete="off">
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("col_ticker")}</span>
            <input name="ticker" type="text" placeholder="${t("form_ticker_ph")}" />
          </label>
          <label class="wf-field">
            <span>${t("col_name")}</span>
            <input name="name" type="text" placeholder="${t("form_name_ph")}" />
          </label>
          <label class="wf-field">
            <span>${t("col_owner")}</span>
            <select name="owner">
              <option value="">${sp}</option>
              <option value="Mabel">Mabel</option>
              <option value="Victor">Victor</option>
              <option value="Both">Both</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("col_type")}</span>
            <select name="type">
              <option value="">${sp}</option>
              <option value="Stock">Stock</option>
              <option value="ETF">ETF</option>
              <option value="Mutual Fund">Mutual Fund</option>
              <option value="Keyword Watch">Keyword Watch</option>
            </select>
          </label>
          <label class="wf-field">
            <span>${t("col_sector")}</span>
            <input name="sector" type="text" placeholder="${t("form_sector_ph")}" />
          </label>
          <label class="wf-field">
            <span>${t("form_watch_priority")}</span>
            <select name="priority">
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>${t("form_reason")}</span>
            <textarea name="reason" rows="2" placeholder="${t("form_reason_ph")}"></textarea>
          </label>
        </div>
        <div class="wf-actions">
          <button type="submit" class="refresh-news-btn">${t("btn_add_watchlist")}</button>
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
        <span>${t("col_owner")}</span>
        <span>${t("col_ticker")}</span>
        <span>${t("col_name")}</span>
        <span>${t("col_type")}</span>
        <span>${t("col_sector")}</span>
        <span>${t("col_priority")}</span>
        <span>${t("col_action")}</span>
        <span>${t("col_status")}</span>
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

  const pClass = priority.includes("High") ? "priority-high"
               : priority.includes("Low")  ? "priority-low"
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
  const action   = get(row, "需要行动 / Action Needed") || "Review";
  const priority = get(row, "关注级别 / Watch Priority") || "";
  const pClass   = priority.includes("High") ? "priority-high"
                 : priority.includes("Low")  ? "priority-low"
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
          <span class="popup-kicker">${t("popup_quick_research")}</span>
          <div class="popup-title-row">
            <h2>${escapeHtml(ticker || "—")} <span>/ ${escapeHtml(name || "—")}</span></h2>
            <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
          </div>
          <div class="popup-meta-row">
            ${owner    ? `<span class="popup-meta-chip">${escapeHtml(owner)}</span>` : ""}
            ${type     ? `<span class="popup-meta-chip">${escapeHtml(type)}</span>` : ""}
            ${sector   ? `<span class="popup-meta-chip">${escapeHtml(sector)}</span>` : ""}
            ${status   ? `<span class="popup-meta-chip">${escapeHtml(status)}</span>` : ""}
            ${priority ? `<span class="popup-meta-chip priority-chip-${pClass}">${escapeHtml(priority)} ${t("popup_priority_suffix")}</span>` : ""}
          </div>
        </div>

        <div class="popup-section">
          <h3>${t("popup_market_snapshot")}</h3>
          ${PopupMarketSnapshot(marketData)}
        </div>

        <div class="popup-section">
          <h3>${t("popup_related_news")}</h3>
          ${PopupRelatedNews(relatedNews)}
        </div>

        <div class="popup-section">
          <h3>${t("popup_research_summary")}</h3>
          ${PopupResearch(research)}
        </div>

        <div class="popup-section">
          <h3>${t("popup_current_status")}</h3>
          <div class="popup-action-display">
            <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
            <small class="popup-disclaimer">${t("popup_disclaimer")}</small>
          </div>
        </div>

        <div class="popup-section popup-decision-link">
          <button class="refresh-news-btn" type="button"
            id="btn-popup-add-decision"
            data-ticker="${escapeHtml(ticker || "")}"
            data-name="${escapeHtml(name || "")}"
            data-owner="${escapeHtml(owner || "")}"
            data-type="${escapeHtml(type || "")}"
            data-watch-id="${escapeHtml(get(item, "观察ID / Watch ID") || "")}">
            ${t("btn_add_decision")}
          </button>
          <small class="popup-disclaimer">${t("popup_decision_hint")}</small>
        </div>

      </div>
    </div>
  `;
}

function watchPriorityClass(priority) {
  if (!priority) return "medium";
  if (priority.includes("High")) return "high";
  if (priority.includes("Low"))  return "low";
  return "medium";
}

function PopupMarketSnapshot(marketData) {
  if (!marketData) {
    return `
      <div class="popup-empty">
        <strong>${t("popup_no_market_main")}</strong>
        <small>${t("popup_no_market_hint")}</small>
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
        <div><span>${t("popup_trend")}</span><strong>${escapeHtml(trend || "—")}</strong></div>
        <div><span>${t("popup_risk_signal")}</span><strong>${escapeHtml(risk || "—")}</strong></div>
        <div><span>${t("popup_date")}</span><strong>${escapeHtml(date || "—")}</strong></div>
        <div><span>${t("popup_source")}</span><strong>${escapeHtml(source || "Alpha Vantage")}</strong></div>
      </div>
    </div>
  `;
}

function PopupRelatedNews(newsRows) {
  if (!newsRows.length) {
    return `
      <div class="popup-empty">
        <strong>${t("popup_no_news_main")}</strong>
        <small>${t("popup_no_news_sub")}</small>
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

  const lang = getLang();
  const mainText = lang === "zh"
    ? (chineseTitle || origTitle || t("news_no_title"))
    : (origTitle || chineseTitle || t("news_no_title"));

  const secondary = lang === "zh" ? origTitle : chineseTitle;
  const showOrig  = secondary && secondary !== mainText;
  const origHtml  = showOrig
    ? sourceLink
      ? `<small class="news-original"><a href="${escapeHtml(sourceLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(secondary)}</a></small>`
      : `<small class="news-original">${escapeHtml(secondary)}</small>`
    : "";

  return `
    <article class="popup-news-row">
      <time>${escapeHtml(displayTime)}</time>
      <div class="popup-news-body">
        <strong>${escapeHtml(mainText)}</strong>
        ${origHtml}
      </div>
      <div class="popup-news-meta">
        ${category ? `<span class="tag">${escapeHtml(category)}</span>` : ""}
        ${risk     ? `<span class="tag">${escapeHtml(risk)}</span>` : ""}
        <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(action)}</span>
      </div>
    </article>
  `;
}

function PopupResearch(research) {
  if (!research) {
    return `
      <div class="popup-empty">
        <strong>${t("popup_no_research_main")}</strong>
        <small>${t("popup_no_research_sub")}</small>
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
        <strong>${t("popup_research_empty_main")}</strong>
        <small>${t("popup_research_empty_sub")}</small>
      </div>
    `;
  }

  return `
    <div class="popup-research-list">
      ${populated.map(([label, value]) => `
        <div class="popup-research-item">
          <span>${escapeHtml(label)}</span>
          <p>${escapeHtml(displayValue(value))}</p>
        </div>
      `).join("")}
    </div>
  `;
}

// ─── Decision Log Page ────────────────────────────────────────────────────────

// Filter entries: [filter-id, label-or-key]
// Static labels (mabel/victor/buy/sell/hold/watch/review) are the same in both langs
const DL_FILTERS = [
  ["all",       "dl_filter_all"],     // → t("dl_filter_all")
  ["mabel",     "Mabel"],
  ["victor",    "Victor"],
  ["buy",       "Buy"],
  ["sell",      "Sell"],
  ["hold",      "Hold"],
  ["watch",     "Watch"],
  ["review",    "Review"],
  ["planned",   "dl_filter_planned"],
  ["completed", "dl_filter_completed"],
];

function dlFilterLabel(key) {
  // If key starts with "dl_filter_" treat as i18n key, else render as-is
  return key.startsWith("dl_filter_") ? t(key) : key;
}

export function DecisionLogPage(model) {
  return `
    <header class="page-header">
      <div>
        <h1>${t("decisions_page_title")}</h1>
        <p>${t("decisions_page_subtitle")}</p>
      </div>
      <span class="live-pill"><i></i>${t("live_pill_real")}</span>
    </header>
    ${DecisionLogSummaryCards(model.summary)}
    ${DecisionLogAddForm()}
    <section class="panel dl-table-panel">
      <div class="panel-title compact">
        <h2>${t("decisions_list_title")}</h2>
      </div>
      <section class="filter-bar dl-filter-bar" aria-label="${t("decisions_list_title")}">
        ${DL_FILTERS.map(([f, labelKey]) =>
          `<button class="filter-chip ${model.activeFilter === f ? "active" : ""}" data-dl-filter="${escapeHtml(f)}" type="button">${escapeHtml(dlFilterLabel(labelKey))}</button>`
        ).join("")}
      </section>
      ${
        model.filtered.length
          ? DecisionLogTable(model.filtered)
          : `<div class="empty-state"><strong>${t("decisions_empty_main")}</strong><span>${t("decisions_empty_hint")}</span></div>`
      }
    </section>
  `;
}

function DecisionLogSummaryCards(summary) {
  const cards = [
    [t("decisions_total"),        summary.total],
    [t("decisions_mabel"),        summary.mabel],
    [t("decisions_victor"),       summary.victor],
    [t("decisions_needs_review"), summary.needsReview],
  ];
  return `
    <section class="holdings-summary-grid">
      ${cards.map(([label, value]) => `
        <article class="mini-stat-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `).join("")}
    </section>
  `;
}

function DecisionLogAddForm() {
  const sp = t("form_select_ph");
  const req = t("form_required_mark");

  return `
    <section class="panel watchlist-add-panel dl-add-panel">
      <div class="panel-title compact">
        <h2>${t("decisions_add_title")}</h2>
      </div>
      <form id="dl-add-form" class="watchlist-form" autocomplete="off">
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("dl_form_date")} <em>${req}</em></span>
            <input name="date" type="date" required />
          </label>
          <label class="wf-field">
            <span>${t("dl_form_owner")} <em>${req}</em></span>
            <select name="owner" required>
              <option value="">${sp}</option>
              <option value="Mabel">Mabel</option>
              <option value="Victor">Victor</option>
              <option value="Both">Both</option>
            </select>
          </label>
          <label class="wf-field">
            <span>${t("dl_form_account_type")}</span>
            <select name="accountType">
              <option value="">${sp}</option>
              <option value="TFSA">TFSA</option>
              <option value="RRSP">RRSP</option>
              <option value="Non-registered">Non-registered</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("dl_form_ticker")}</span>
            <input name="ticker" type="text" placeholder="e.g. AAPL" id="dl-ticker-input" />
          </label>
          <label class="wf-field">
            <span>${t("dl_form_name")}</span>
            <input name="name" type="text" placeholder="e.g. Apple Inc." id="dl-name-input" />
          </label>
          <label class="wf-field">
            <span>${t("dl_form_asset_type")}</span>
            <select name="assetType">
              <option value="">${sp}</option>
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
            <span>${t("dl_form_action_type")} <em>${req}</em></span>
            <select name="actionType" required>
              <option value="">${sp}</option>
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
            <span>${t("dl_form_decision_status")}</span>
            <select name="decisionStatus">
              <option value="Completed">Completed</option>
              <option value="Planned">Planned</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Review Later">Review Later</option>
            </select>
          </label>
          <label class="wf-field">
            <span>${t("dl_form_risk_level")}</span>
            <select name="riskLevel">
              <option value="">${sp}</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("dl_form_amount")}</span>
            <input name="amount" type="number" step="0.01" min="0" placeholder="0.00" />
          </label>
          <label class="wf-field">
            <span>${t("dl_form_quantity")}</span>
            <input name="quantity" type="number" step="0.0001" min="0" placeholder="0" />
          </label>
          <label class="wf-field">
            <span>${t("dl_form_price")}</span>
            <input name="price" type="number" step="0.0001" min="0" placeholder="0.00" />
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("dl_form_cost")}</span>
            <input name="cost" type="number" step="0.01" min="0" placeholder="Auto" />
          </label>
          <label class="wf-field">
            <span>${t("dl_form_related_watch_id")}</span>
            <input name="relatedWatchId" type="text" placeholder="e.g. WAT-001" id="dl-watch-id-input" />
          </label>
          <label class="wf-field">
            <span>${t("dl_form_related_holding_id")}</span>
            <input name="relatedHoldingId" type="text" placeholder="e.g. HOL-001" />
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>${t("dl_form_decision_reason")}</span>
            <textarea name="decisionReason" rows="2" placeholder="${t("dl_form_reason_ph")}" id="dl-reason-input"></textarea>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>${t("dl_form_reference")}</span>
            <textarea name="referenceInfo" rows="2" placeholder="e.g. From Watchlist Quick Research" id="dl-ref-input"></textarea>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field wf-full">
            <span>${t("dl_form_review_notes")}</span>
            <textarea name="reviewNotes" rows="2" placeholder="${t("dl_form_review_ph")}"></textarea>
          </label>
        </div>
        <div class="wf-actions">
          <button type="submit" class="refresh-news-btn">${t("btn_add_decision_log")}</button>
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
        <span>${t("dl_form_date")}</span>
        <span>${t("col_owner")}</span>
        <span>${t("col_ticker")}</span>
        <span>${t("col_name")}</span>
        <span>${t("col_action")}</span>
        <span>${t("dl_form_amount")}</span>
        <span>${t("dl_form_quantity")}</span>
        <span>${t("dl_form_price")}</span>
        <span>${t("dl_form_cost")}</span>
        <span>${t("dl_col_reason")}</span>
        <span>${t("col_status")}</span>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function actionLabelClass(action) {
  if (action === "High Attention") return "high";
  if (action === "Review")         return "review";
  return "none";
}

function EmptyState(main, sub) {
  return `<div class="empty-state"><strong>${main}</strong>${sub ? `<span>${sub}</span>` : ""}</div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildIndexDisplayItem(bySymbol, symbol, label) {
  const row = bySymbol[symbol] || null;
  const hasValue = row && hasUsableValue(get(row, "当前水平 / Current Level"));
  return {
    symbol,
    label,
    value:  hasValue ? formatIndexDisplayValue(get(row, "当前水平 / Current Level")) : "—",
    change: hasValue ? formatChangeValue(get(row, "日变动% / Daily Change %"))      : "—",
    date:   hasValue ? formatTextValue(get(row, "日期 / Date"))                     : "—",
  };
}

function hasUsableValue(value) {
  const text = String(value || "").trim();
  return text && !/pending|待更新/i.test(text);
}

function formatIndexDisplayValue(value) {
  return hasUsableValue(value) ? String(value).trim() : "—";
}

function formatChangeValue(value) {
  return hasUsableValue(value) ? String(value).trim() : "—";
}

function formatTextValue(value) {
  return hasUsableValue(value) ? String(value).trim() : "—";
}
