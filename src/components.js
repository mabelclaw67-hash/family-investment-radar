import { NAV_ITEMS, SHEET_CONFIG } from "./config.js";
import { t, getLang, formatHeaderDate } from "./i18n.js";
import { get } from "./data/dashboardMapper.js";
import { deriveActionLabel, displayMarketValue, displayValue, HOLDING_FILTERS } from "./data/holdingsMapper.js";

// Mobile tab definitions: [i18n-key, icon, page-id]
const MOBILE_TABS = [
  ["mtab_dashboard", "⌂", "dashboard"],
  ["mtab_stock_lookup", "⌕", "stock-lookup"],
  ["mtab_stock_analysis", "↗", "stock-analysis"],
  ["mtab_market", "◎", "market"],
  ["mtab_alerts", "!", "alerts"],
  ["mtab_news", "▤", "news"],
  ["mtab_forum", "❝", "forum"],
  ["mtab_share", "□", "share"],
];

// ─── App Shell ────────────────────────────────────────────────────────────────

export function AppShell(content, currentPage = "dashboard", isAdmin = false) {
  const navItems = NAV_ITEMS.filter((item) => item[3] !== "admin" || isAdmin);
  const adminNavItems = NAV_ITEMS.filter((item) => item[3] === "admin");
  const mobileTabs = MOBILE_TABS.filter((item) => item[3] !== "admin" || isAdmin);
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">◎</div>
        <div>
          <strong>${t("brand_name")}</strong>
        </div>
      </div>
      <nav class="nav">${navItems.map((item) => navItem(item, currentPage)).join("")}</nav>
      <div class="sidebar-card">
        <strong>${t("sidebar_tagline")}</strong>
        <small>${t("sidebar_no_advice")}</small>
      </div>
      <div class="sidebar-card sync">
        <strong>${t("sidebar_data_source")}</strong>
        <span>${SHEET_CONFIG.spreadsheetTitle}</span>
        <div class="sidebar-footer-actions">
          <button class="logout-btn" data-action="${isAdmin ? "logout" : "adminLogin"}" type="button">${t(isAdmin ? "btn_logout" : "btn_admin_login")}</button>
        </div>
      </div>
    </aside>
    <main class="main">${content}</main>
    ${isAdmin ? `
      <nav class="mobile-admin-nav" aria-label="${t("btn_admin_login")}">
        ${adminNavItems.map(([key, , page]) => `
          <a class="mobile-admin-link ${currentPage === page ? "active" : ""}" href="#/${page}">
            ${t(key)}
          </a>
        `).join("")}
      </nav>
    ` : ""}
    <nav class="mobile-bottom-nav" aria-label="${t("brand_name")}">
      ${mobileTabs.map(([key, icon, page]) => `
        <a class="mbn-tab ${currentPage === page ? "active" : ""}" href="#/${page}" aria-label="${t(key)}">
          <span class="mbn-icon">${icon}</span>
          <span>${t(key)}</span>
        </a>
      `).join("")}
      <button class="mbn-tab mbn-admin-tab" data-action="${isAdmin ? "logout" : "adminLogin"}" type="button" aria-label="${t(isAdmin ? "btn_logout" : "btn_admin_login")}">
        <span class="mbn-icon">${isAdmin ? "⎋" : "◇"}</span>
        <span>${t(isAdmin ? "mtab_admin_logout" : "mtab_admin_login")}</span>
      </button>
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

export function BuffettMottoBanner() {
  return `
    <section class="buffett-motto-banner" aria-label="Warren Buffett investment motto">
      <img
        class="buffett-motto-image"
        src="/buffett-motto-banner.png"
        alt=""
        aria-hidden="true"
      />
      <span class="buffett-motto-sr">
        家庭投资趋势分析 · Family Investment Radar.
        Be fearful when others are greedy, and be greedy only when others are fearful.
        别人贪婪时保持谨慎；只有在别人恐惧时，才考虑勇敢。
        Warren Buffett.
      </span>
    </section>
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
      <div class="panel-title">
        <h2>${t("morning_brief_title")}</h2>
        <div class="news-refresh-row">
          <button id="btn-sync-morning-brief" class="refresh-news-btn" type="button">${t("btn_sync_morning_brief")}</button>
          <span id="morning-brief-sync-status" class="news-refresh-status"></span>
        </div>
      </div>
      ${
        visibleItems.length
          ? `<div class="morning-brief-list">${visibleItems.map(morningBriefItem).join("")}</div>`
          : EmptyState(t("morning_brief_empty"), "")
      }
    </section>
  `;
}

export function StockRadarHomeEntry() {
  return `
    <a class="stock-radar-home-entry" href="#/stock-analysis">
      <div>
        <span>${t("stock_home_entry_label")}</span>
        <h2>${escapeHtml(t("stock_home_entry_title"))}</h2>
        <p>${escapeHtml(t("stock_home_entry_desc"))}</p>
      </div>
      <span class="stock-radar-home-link">${escapeHtml(t("stock_home_entry_cta"))}</span>
    </a>
  `;
}

export function AiMarketRadarPanel(summary = null, sources = [], isAdmin = false) {
  return `
    <section class="panel ai-market-radar-panel">
      <div class="panel-title">
        <h2>${t("ai_radar_title")}</h2>
        ${
          isAdmin
            ? `<div class="news-refresh-row">
                <button id="btn-update-ai-market-trend" class="refresh-news-btn" type="button">${escapeHtml(t("btn_update_ai_trend"))}</button>
                <span id="ai-market-trend-status" class="news-refresh-status"></span>
              </div>`
            : ""
        }
      </div>
      <div id="ai-market-trend-result">
        ${
          summary
            ? ""
            : `<div class="ai-market-radar-list">
                <article class="ai-market-radar-item ai-market-radar-empty">
                  <p>${escapeHtml(t("ai_radar_no_saved_summary"))}</p>
                </article>
              </div>`
        }
      </div>
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
  const rawSummary = row.fullContent || get(row, "_docContent") || row.summary3Lines || get(row, "摘要 / Summary");
  const summary = getLang() === "en" && hasMostlyChineseBriefContent(row) ? "" : rawSummary;

  return `
    <article class="morning-brief-row">
      <time>${escapeHtml(formatBriefDate(date))}</time>
      <div class="morning-brief-body">
        <strong>${escapeHtml(title)}</strong>
        ${summary ? renderBriefContent(summary) : ""}
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

export function LoadingState(isAdmin = false) {
  return AppShell(`
    ${Header()}
    <section class="state-card">
      <div class="spinner"></div>
      <h2>${t("loading_text")}</h2>
      <p>${t("loading_subtitle")} ${SHEET_CONFIG.spreadsheetTitle}</p>
    </section>
  `, "dashboard", isAdmin);
}

export function ErrorState(error, isAdmin = false) {
  return AppShell(`
    ${Header()}
    <section class="state-card error">
      <h2>${t("error_title")}</h2>
      <p>${escapeHtml(error.message)}</p>
      <small>${t("error_hint")}</small>
    </section>
  `, "dashboard", isAdmin);
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
  const sourceLink    = publicSourceLink(get(row, "来源链接 / Source Link"));

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
  const sourceLink = publicSourceLink(get(row, "来源链接 / Source Link"));
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
        ${sourceLink ? `<a class="alert-source-link" href="${escapeHtml(sourceLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("alerts_source_link"))}</a>` : ""}
      </div>
      <span class="status-pill ${pillClass}">${escapeHtml(alertStatusLabel(status))}</span>
    </article>
  `;
}

function alertStatusLabel(status) {
  if (status === "High Attention") return t("alerts_status_high");
  if (status === "Review") return t("alerts_status_review");
  if (status === "Watch") return t("alerts_status_watch");
  return status;
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
    ${WatchlistAddForm()}
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
              <option value="Mabel">${localizedValue("Mabel")}</option>
              <option value="Victor">${localizedValue("Victor")}</option>
              <option value="Both">${localizedValue("Both")}</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("col_type")}</span>
            <select name="type">
              <option value="">${sp}</option>
              <option value="Stock">${localizedValue("Stock")}</option>
              <option value="ETF">${localizedValue("ETF")}</option>
              <option value="Mutual Fund">${localizedValue("Mutual Fund")}</option>
              <option value="Keyword Watch">${localizedValue("Keyword Watch")}</option>
            </select>
          </label>
          <label class="wf-field">
            <span>${t("col_sector")}</span>
            <input name="sector" type="text" placeholder="${t("form_sector_ph")}" />
          </label>
          <label class="wf-field">
            <span>${t("form_watch_priority")}</span>
            <select name="priority">
              <option value="Medium">${localizedValue("Medium")}</option>
              <option value="High">${localizedValue("High")}</option>
              <option value="Low">${localizedValue("Low")}</option>
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
          <button type="button" class="secondary-action-btn" id="watchlist-edit-cancel" hidden>${t("btn_cancel_edit")}</button>
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
        <span>${t("col_manage")}</span>
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
  const owner    = localizedValue(get(row, "所属人 / Owner"));
  const type     = localizedValue(get(row, "类型 / Type"));
  const sector   = localizedValue(get(row, "板块 / Sector"));
  const priority = get(row, "关注级别 / Watch Priority") || "";
  const action   = get(row, "需要行动 / Action Needed") || "Review";
  const status   = localizedValue(get(row, "状态 / Status"));

  const pClass = priority.includes("High") ? "priority-high"
               : priority.includes("Low")  ? "priority-low"
               : "priority-medium";

  return `
    <article class="wl-card-m" role="button" tabindex="0" data-watch-id="${escapeHtml(id)}">
      <div class="wlcm-top">
        <strong class="wlcm-ticker">${escapeHtml(ticker)}</strong>
        <span class="priority-badge ${pClass}">${escapeHtml(localizedValue(priority || "Medium"))}</span>
      </div>
      <div class="wlcm-name-row">${escapeHtml(name)}</div>
      <div class="wlcm-meta">
        <span>${escapeHtml(owner)}</span>
        <span>·</span>
        <span>${escapeHtml(type)}</span>
        ${sector ? `<span>·</span><span>${escapeHtml(sector)}</span>` : ""}
      </div>
      <div class="wlcm-bottom">
        <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(localizedValue(action))}</span>
        <span class="wlcm-status">${escapeHtml(status)}</span>
      </div>
      <div class="row-actions">
        <button type="button" class="mini-action-btn" data-watch-edit="${escapeHtml(id)}">${t("btn_edit")}</button>
        <button type="button" class="mini-action-btn danger" data-watch-delete="${escapeHtml(id)}">${t("btn_delete")}</button>
      </div>
    </article>
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
    <div class="watchlist-row" role="button" tabindex="0" data-watch-id="${escapeHtml(id)}">
      <span>${escapeHtml(localizedValue(get(row, "所属人 / Owner")))}</span>
      <strong class="wl-ticker">${escapeHtml(displayValue(get(row, "代码 / Ticker")))}</strong>
      <span>${escapeHtml(displayValue(get(row, "名称 / Name")))}</span>
      <span>${escapeHtml(localizedValue(get(row, "类型 / Type")))}</span>
      <span>${escapeHtml(localizedValue(get(row, "板块 / Sector")))}</span>
      <span class="priority-badge ${pClass}">${escapeHtml(localizedValue(priority || "Medium"))}</span>
      <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(localizedValue(action))}</span>
      <span>${escapeHtml(localizedValue(get(row, "状态 / Status")))}</span>
      <span class="row-actions">
        <button type="button" class="mini-action-btn" data-watch-edit="${escapeHtml(id)}">${t("btn_edit")}</button>
        <button type="button" class="mini-action-btn danger" data-watch-delete="${escapeHtml(id)}">${t("btn_delete")}</button>
      </span>
    </div>
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

  const newsSummary     = get(item, "最新中文新闻摘要 / Latest Chinese News Summary");
  const earningsSummary = get(item, "财报/公告摘要 / Earnings or Filing Summary");
  const mainRisks       = get(item, "主要风险 / Main Risks");
  const aiComment       = get(item, "AI中文点评 / AI Chinese Comment");

  return `
    <div id="watchlist-popup-overlay" class="popup-overlay" role="dialog" aria-modal="true">
      <div class="popup-modal">
        <button class="popup-close" type="button" aria-label="Close">×</button>

        <div class="popup-header">
          <span class="popup-kicker">${t("popup_quick_research")}</span>
          <div class="popup-title-row">
            <h2>${escapeHtml(ticker || "—")} <span>/ ${escapeHtml(name || "—")}</span></h2>
            <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(localizedValue(action))}</span>
          </div>
          <div class="popup-meta-row">
            ${owner    ? `<span class="popup-meta-chip">${escapeHtml(localizedValue(owner))}</span>` : ""}
            ${type     ? `<span class="popup-meta-chip">${escapeHtml(localizedValue(type))}</span>` : ""}
            ${sector   ? `<span class="popup-meta-chip">${escapeHtml(localizedValue(sector))}</span>` : ""}
            ${status   ? `<span class="popup-meta-chip">${escapeHtml(localizedValue(status))}</span>` : ""}
            ${priority ? `<span class="popup-meta-chip priority-chip-${pClass}">${escapeHtml(localizedValue(priority))} ${t("popup_priority_suffix")}</span>` : ""}
          </div>
        </div>

        <div class="popup-section">
          <h3>${t("popup_market_snapshot")}</h3>
          ${PopupMarketSnapshot(marketData)}
        </div>

        <div class="popup-section">
          <h3>${t("popup_ai_analysis")}</h3>
          ${PopupAiAnalysis({ newsSummary, earningsSummary, mainRisks, aiComment })}
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
            <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(localizedValue(action))}</span>
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

function PopupAiAnalysis({ newsSummary, earningsSummary, mainRisks, aiComment }) {
  // Treat still-pending / empty values as "no content yet".
  const clean = (v) => {
    const s = String(v || "").trim();
    return !s || /pending|待抓取|待分析/i.test(s) ? "" : s;
  };

  const rows = [
    [t("popup_ai_news"),     clean(newsSummary)],
    [t("popup_ai_earnings"), clean(earningsSummary)],
    [t("popup_ai_risks"),    clean(mainRisks)],
    [t("popup_ai_comment"),  clean(aiComment)],
  ].filter(([, value]) => value);

  if (!rows.length) {
    return `
      <div class="popup-empty">
        <strong>${t("popup_ai_empty_main")}</strong>
        <small>${t("popup_ai_empty_sub")}</small>
      </div>
    `;
  }

  return `
    <div class="popup-ai-list">
      ${rows.map(([label, value]) => `
        <div class="popup-ai-item">
          <span class="popup-ai-label">${escapeHtml(label)}</span>
          <p class="popup-ai-text">${escapeHtml(value)}</p>
        </div>
      `).join("")}
    </div>
  `;
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
  const sourceLink   = publicSourceLink(get(row, "来源链接 / Source Link"));
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
        ${category ? `<span class="tag">${escapeHtml(localizedValue(category))}</span>` : ""}
        ${risk     ? `<span class="tag">${escapeHtml(localizedValue(risk))}</span>` : ""}
        <span class="status-pill action-${actionLabelClass(action)}">${escapeHtml(localizedValue(action))}</span>
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
// Static labels (portfolio-a/portfolio-b/buy/sell/hold/watch/review) are the same in both langs
const DL_FILTERS = [
  ["all",       "dl_filter_all"],     // → t("dl_filter_all")
  ["mabel",     "Portfolio A"],
  ["victor",    "Portfolio B"],
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
    ${DecisionLogAddForm()}
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
              <option value="Mabel">${localizedValue("Mabel")}</option>
              <option value="Victor">${localizedValue("Victor")}</option>
              <option value="Both">${localizedValue("Both")}</option>
            </select>
          </label>
          <label class="wf-field">
            <span>${t("dl_form_account_type")}</span>
            <select name="accountType">
              <option value="">${sp}</option>
              <option value="TFSA">TFSA</option>
              <option value="RRSP">RRSP</option>
              <option value="Non-registered">${localizedValue("Non-registered")}</option>
              <option value="Other">${localizedValue("Other")}</option>
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
              <option value="Stock">${localizedValue("Stock")}</option>
              <option value="ETF">ETF</option>
              <option value="Fund">${localizedValue("Fund")}</option>
              <option value="GIC">GIC</option>
              <option value="Cash">${localizedValue("Cash")}</option>
              <option value="Other">${localizedValue("Other")}</option>
            </select>
          </label>
        </div>
        <div class="wf-row">
          <label class="wf-field">
            <span>${t("dl_form_action_type")} <em>${req}</em></span>
            <select name="actionType" required>
              <option value="">${sp}</option>
              <option value="Buy">${localizedValue("Buy")}</option>
              <option value="Sell">${localizedValue("Sell")}</option>
              <option value="Hold">${localizedValue("Hold")}</option>
              <option value="Watch">${localizedValue("Watch")}</option>
              <option value="Review">${localizedValue("Review")}</option>
              <option value="Dividend">${localizedValue("Dividend")}</option>
              <option value="Contribution">${localizedValue("Contribution")}</option>
              <option value="Withdrawal">${localizedValue("Withdrawal")}</option>
            </select>
          </label>
          <label class="wf-field">
            <span>${t("dl_form_decision_status")}</span>
            <select name="decisionStatus">
              <option value="Completed">${localizedValue("Completed")}</option>
              <option value="Planned">${localizedValue("Planned")}</option>
              <option value="Cancelled">${localizedValue("Cancelled")}</option>
              <option value="Review Later">${localizedValue("Review Later")}</option>
            </select>
          </label>
          <label class="wf-field">
            <span>${t("dl_form_risk_level")}</span>
            <select name="riskLevel">
              <option value="">${sp}</option>
              <option value="Low">${localizedValue("Low")}</option>
              <option value="Medium">${localizedValue("Medium")}</option>
              <option value="High">${localizedValue("High")}</option>
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
          <button type="button" class="secondary-action-btn" id="dl-edit-cancel" hidden>${t("btn_cancel_edit")}</button>
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
        <span>${t("col_manage")}</span>
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
        <span class="status-pill action-${actionLabelClass(actionType)}">${escapeHtml(localizedValue(actionType))}</span>
      </div>
      <div class="dlcm-meta">
        <span class="dl-id">${escapeHtml(decisionId)}</span>
        <span>·</span>
        <span>${escapeHtml(date)}</span>
        <span>·</span>
        <span>${escapeHtml(localizedValue(owner))}</span>
        ${amount ? `<span>·</span><span>$${escapeHtml(amount)}</span>` : ""}
      </div>
      ${name && ticker ? `<div class="dlcm-name">${escapeHtml(name)}</div>` : ""}
      ${decisionReason ? `<div class="dlcm-reason">${escapeHtml(decisionReason)}</div>` : ""}
      <div class="dlcm-footer">
        <span class="status-pill action-${statusClass}">${escapeHtml(localizedValue(decisionStatus))}</span>
      </div>
      <div class="row-actions">
        <button type="button" class="mini-action-btn" data-dl-edit="${escapeHtml(decisionId)}">${t("btn_edit")}</button>
        <button type="button" class="mini-action-btn danger" data-dl-delete="${escapeHtml(decisionId)}">${t("btn_delete")}</button>
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
      <span>${escapeHtml(localizedValue(get(row, "所属人 / Owner")))}</span>
      <strong class="wl-ticker">${escapeHtml(get(row, "代码 / Ticker"))}</strong>
      <span>${escapeHtml(get(row, "名称 / Name"))}</span>
      <span class="status-pill action-${actionLabelClass(actionType)}">${escapeHtml(localizedValue(actionType))}</span>
      <span>${escapeHtml(get(row, "金额 / Amount"))}</span>
      <span>${escapeHtml(get(row, "数量 / Quantity"))}</span>
      <span>${escapeHtml(get(row, "单价 / Price"))}</span>
      <span>${escapeHtml(get(row, "成本 / Cost"))}</span>
      <span class="dl-reason">${escapeHtml(get(row, "决策原因 / Decision Reason"))}</span>
      <span class="status-pill action-${statusClass}">${escapeHtml(localizedValue(decisionStatus || "Active"))}</span>
      <span class="row-actions">
        <button type="button" class="mini-action-btn" data-dl-edit="${escapeHtml(get(row, "决策ID / Decision ID"))}">${t("btn_edit")}</button>
        <button type="button" class="mini-action-btn danger" data-dl-delete="${escapeHtml(get(row, "决策ID / Decision ID"))}">${t("btn_delete")}</button>
      </span>
    </div>
  `;
}

// ─── Stock Analysis Page ─────────────────────────────────────────────────────

export function StockAnalysisPage(rows = [], isAdmin = false) {
  const allItems = Array.isArray(rows) ? rows : [];
  const lang = getLang();
  const selectedTheme = currentStockTheme();
  const filters = stockThemeFilters(lang);
  const activeFilter = filters.find((filter) => filter.key === selectedTheme) || filters[0];
  const items = selectedTheme === "all"
    ? allItems
    : allItems.filter((row) => matchesStockTheme(row, selectedTheme));
  const title = t("stock_analysis_page_title");
  const subtitle = t("stock_analysis_page_subtitle");
  const refreshed = latestStockUpdate(allItems);
  const themeSummary = stockThemeSummary(allItems, selectedTheme, lang);

  return `
    <header class="page-header">
      <div>
        <h1>📈 ${title}</h1>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      ${isAdmin ? `
        <div class="stock-actions">
          <button id="btn-refresh-stock-analysis" class="refresh-news-btn" type="button">
            ${t("btn_refresh_stock_analysis")}
          </button>
          <button id="btn-update-stock-fundamentals" class="refresh-news-btn" type="button">
            ${t("btn_update_fundamentals")}
          </button>
          <span id="stock-refresh-status" class="news-refresh-status"></span>
          <span id="stock-fundamentals-status" class="news-refresh-status"></span>
        </div>
      ` : ""}
    </header>

    <section class="stock-theme-panel">
      <div class="stock-theme-heading">
        <div>
          <strong>${lang === "zh" ? "主题筛选" : "Theme Filter"}</strong>
          <span>${escapeHtml(themeSummary)}</span>
        </div>
        <small>${lang === "zh" ? "当前显示" : "Showing"}: ${escapeHtml(activeFilter.label)}</small>
      </div>
      <div class="stock-theme-tabs" role="list">
        ${filters.map((filter) => {
          const count = filter.key === "all"
            ? allItems.length
            : allItems.filter((row) => matchesStockTheme(row, filter.key)).length;
          const active = filter.key === selectedTheme ? " active" : "";
          return `<a class="stock-theme-tab${active}" href="#/stock-analysis?theme=${encodeURIComponent(filter.key)}" role="listitem">${escapeHtml(filter.label)} <span>${count}</span></a>`;
        }).join("")}
      </div>
    </section>

    <section class="stock-summary-grid">
      <article class="mini-stat-card"><span>${lang === "zh" ? "当前显示" : "Showing"}</span><strong>${items.length}</strong></article>
      <article class="mini-stat-card"><span>${lang === "zh" ? "全部股票" : "All Stocks"}</span><strong>${allItems.length}</strong></article>
      <article class="mini-stat-card"><span>${lang === "zh" ? "加拿大" : "Canada"}</span><strong>${items.filter((r) => String(get(r, "Ticker")).includes(".TO")).length}</strong></article>
      <article class="mini-stat-card"><span>${lang === "zh" ? "最新更新时间" : "Latest Update"}</span><small>${escapeHtml(refreshed || "—")}</small></article>
    </section>

    <section class="panel stock-table-panel">
      ${items.length ? stockAnalysisTable(items, lang) : EmptyState(lang === "zh" ? "这个主题下暂无股票" : "No stocks in this theme yet", lang === "zh" ? "可以切换到“全部”，或稍后在表格里增加更多股票。" : "Switch to All, or add more tickers to this theme later.")}
    </section>
  `;
}

// ─── Public Stock Lookup ─────────────────────────────────────────────────────

export function StockLookupPage() {
  return `
    <header class="page-header">
      <div>
        <h1>${escapeHtml(t("stock_lookup_title"))}</h1>
        <p>${escapeHtml(t("stock_lookup_subtitle"))}</p>
      </div>
    </header>

    <section class="panel stock-lookup-panel">
      <form id="stock-lookup-form" class="stock-lookup-form" autocomplete="off">
        <input
          id="stock-lookup-input"
          type="text"
          placeholder="${escapeHtml(t("stock_lookup_placeholder"))}"
          aria-label="${escapeHtml(t("stock_lookup_title"))}"
        />
        <button type="submit" class="refresh-news-btn">${escapeHtml(t("stock_lookup_button"))}</button>
      </form>
      <span id="stock-lookup-status" class="news-refresh-status"></span>
      <small class="stock-lookup-hint">${escapeHtml(t("stock_lookup_scope"))}</small>
      <div id="stock-lookup-result" class="stock-lookup-result"></div>
    </section>
  `;
}

export function StockCandidateList(candidates) {
  return `
    <div class="stock-candidates">
      <p class="stock-candidates-hint">${escapeHtml(t("stock_lookup_pick"))}</p>
      ${candidates.map((c) => `
        <button type="button" class="stock-candidate" data-symbol="${escapeHtml(c.symbol)}">
          <span class="stock-candidate-symbol">${escapeHtml(c.symbol)}</span>
          <span class="stock-candidate-name">${escapeHtml(c.name || "—")}</span>
          <span class="stock-candidate-ex">${escapeHtml([c.exchange, c.country, c.currency].filter(Boolean).join(" · ") || "—")}</span>
        </button>
      `).join("")}
    </div>
  `;
}

export function StockDetailCard(d) {
  const pct = Number(d.changePercent);
  const chg = Number(d.change);
  const tone = Number.isFinite(pct) ? (pct > 0 ? "up" : pct < 0 ? "down" : "") : "";
  const arrow = tone === "up" ? "▲" : tone === "down" ? "▼" : "—";
  const cur = d.currency || "";

  const rows = [
    [t("stock_f_exchange"),  d.exchange],
    [t("stock_f_country"),   d.country],
    [t("stock_f_currency"),  d.currency],
    [t("stock_f_marketcap"), formatMarketCap(d.marketCap, cur)],
    [t("stock_f_sector"),    d.sector],
    [t("stock_f_industry"),  d.industry],
  ].filter(([, v]) => String(v ?? "").trim());

  return `
    <article class="stock-detail-card">
      <div class="sdc-head">
        <div class="sdc-id">
          <strong class="sdc-symbol">${escapeHtml(d.symbol || "—")}</strong>
          <span class="sdc-name">${escapeHtml(d.name || "—")}</span>
        </div>
        <div class="sdc-price-block">
          <strong class="sdc-price ${tone}">${formatPrice(d.price, cur)}</strong>
          ${Number.isFinite(chg) || Number.isFinite(pct) ? `
            <span class="sdc-change ${tone}">
              ${arrow} ${Number.isFinite(chg) ? formatSigned(chg) : "—"}
              ${Number.isFinite(pct) ? `(${formatSigned(pct)}%)` : ""}
            </span>` : ""}
        </div>
      </div>

      <div class="sdc-grid">
        ${rows.map(([label, value]) => `
          <div class="sdc-cell">
            <span class="sdc-label">${escapeHtml(label)}</span>
            <strong class="sdc-value">${escapeHtml(String(value))}</strong>
          </div>
        `).join("")}
      </div>

      ${String(d.description || "").trim() ? `
        <div class="sdc-desc">
          <span class="sdc-label">${escapeHtml(t("stock_f_description"))}</span>
          <p>${escapeHtml(d.description)}</p>
        </div>` : ""}

      <div class="sdc-foot">
        <small>${escapeHtml(t("stock_f_source"))}: ${escapeHtml(d.source || "—")}</small>
        <small class="popup-disclaimer">${escapeHtml(t("stock_lookup_disclaimer"))}</small>
      </div>
    </article>
  `;
}

function formatPrice(value, currency) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${currency ? currency + " " : ""}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatSigned(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const s = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n > 0 ? `+${s}` : s;
}

function formatMarketCap(value, currency) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  const prefix = currency ? currency + " " : "";
  if (n >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)} 万亿`;
  if (n >= 1e8)  return `${prefix}${(n / 1e8).toFixed(2)} 亿`;
  return `${prefix}${n.toLocaleString("en-US")}`;
}

// ─── Public Forum ("大家在关注") ──────────────────────────────────────────────

function ForumAntiBotFields() {
  return `
    <div class="forum-field">
      <label>${escapeHtml(t("forum_antibot_label"))}</label>
      <input type="text" class="forum-antibot" inputmode="numeric" autocomplete="off" required />
    </div>
    <input type="text" class="forum-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" />
  `;
}

export function ForumPage() {
  return `
    <header class="page-header">
      <div>
        <h1>${escapeHtml(t("forum_title"))}</h1>
        <p>${escapeHtml(t("forum_subtitle"))}</p>
      </div>
    </header>

    <section class="panel forum-disclaimer-card">
      <strong>${escapeHtml(t("forum_disclaimer"))}</strong>
    </section>

    <section class="panel forum-new-panel">
      <div class="panel-title"><h2>${escapeHtml(t("forum_new_topic"))}</h2></div>
      <p class="forum-warn">${escapeHtml(t("forum_post_warning"))}</p>
      <form id="forum-topic-form" class="forum-form" autocomplete="off">
        <div class="forum-row-2">
          <div class="forum-field">
            <label>${escapeHtml(t("forum_f_nickname"))}</label>
            <input type="text" name="nickname" maxlength="20" required />
          </div>
          <div class="forum-field">
            <label>${escapeHtml(t("forum_f_ticker"))}</label>
            <input type="text" name="ticker" maxlength="20" placeholder="${escapeHtml(t("forum_f_ticker_ph"))}" />
          </div>
        </div>
        <div class="forum-field">
          <label>${escapeHtml(t("forum_f_title"))}</label>
          <input type="text" name="title" maxlength="80" required />
        </div>
        <div class="forum-field">
          <label>${escapeHtml(t("forum_f_content"))}</label>
          <textarea name="content" rows="4" maxlength="1000" required></textarea>
        </div>
        ${ForumAntiBotFields()}
        <div class="forum-actions">
          <button type="submit" class="refresh-news-btn">${escapeHtml(t("forum_btn_post"))}</button>
          <span id="forum-topic-status" class="news-refresh-status"></span>
        </div>
      </form>
    </section>

    <section class="panel forum-list-panel">
      <div class="panel-title"><h2>${escapeHtml(t("forum_recent"))}</h2></div>
      <div id="forum-root"><div class="forum-loading">${escapeHtml(t("forum_loading"))}</div></div>
    </section>
  `;
}

export function ForumTopicList(topics) {
  if (!topics.length) {
    return `<div class="popup-empty"><strong>${escapeHtml(t("forum_empty"))}</strong></div>`;
  }
  return `
    <div class="forum-topic-list">
      ${topics.map((tp) => `
        <button type="button" class="forum-topic-card" data-topic-id="${escapeHtml(tp.id)}">
          <div class="ftc-head">
            <strong class="ftc-title">${escapeHtml(tp.title)}</strong>
            ${tp.ticker ? `<span class="ftc-ticker">${escapeHtml(tp.ticker)}</span>` : ""}
          </div>
          <p class="ftc-snippet">${escapeHtml(truncate(tp.content, 90))}</p>
          <div class="ftc-meta">
            <span>${escapeHtml(tp.nickname || "—")}</span>
            <span>·</span>
            <span>${escapeHtml(formatForumTime(tp.createdAt))}</span>
          </div>
        </button>
      `).join("")}
    </div>
  `;
}

export function ForumTopicDetail(topic, replies) {
  return `
    <div class="forum-detail">
      <button type="button" id="forum-back" class="forum-back-btn">← ${escapeHtml(t("forum_back"))}</button>
      <article class="forum-detail-card">
        <div class="fdc-head">
          <h3>${escapeHtml(topic.title)}</h3>
          ${topic.ticker ? `<span class="ftc-ticker">${escapeHtml(topic.ticker)}</span>` : ""}
        </div>
        <div class="ftc-meta">
          <span>${escapeHtml(topic.nickname || "—")}</span>
          <span>·</span>
          <span>${escapeHtml(formatForumTime(topic.createdAt))}</span>
        </div>
        <p class="fdc-content">${escapeHtml(topic.content)}</p>
      </article>

      <div class="forum-replies">
        <h4>${escapeHtml(t("forum_replies"))} (${replies.length})</h4>
        ${replies.length ? replies.map((r) => `
          <div class="forum-reply">
            <div class="ftc-meta">
              <strong>${escapeHtml(r.nickname || "—")}</strong>
              <span>·</span>
              <span>${escapeHtml(formatForumTime(r.createdAt))}</span>
            </div>
            <p>${escapeHtml(r.content)}</p>
          </div>
        `).join("") : `<div class="popup-empty"><small>${escapeHtml(t("forum_no_replies"))}</small></div>`}
      </div>

      <form id="forum-reply-form" class="forum-form" autocomplete="off" data-topic-id="${escapeHtml(topic.id)}">
        <div class="panel-title"><h4>${escapeHtml(t("forum_reply_title"))}</h4></div>
        <div class="forum-field">
          <label>${escapeHtml(t("forum_f_nickname"))}</label>
          <input type="text" name="nickname" maxlength="20" required />
        </div>
        <div class="forum-field">
          <label>${escapeHtml(t("forum_f_reply"))}</label>
          <textarea name="content" rows="3" maxlength="1000" required></textarea>
        </div>
        ${ForumAntiBotFields()}
        <div class="forum-actions">
          <button type="submit" class="refresh-news-btn">${escapeHtml(t("forum_btn_reply"))}</button>
          <span id="forum-reply-status" class="news-refresh-status"></span>
        </div>
      </form>
    </div>
  `;
}

export function ForumAdminPage() {
  return `
    <header class="page-header">
      <div>
        <h1>${escapeHtml(t("forum_admin_title"))}</h1>
        <p>${escapeHtml(t("forum_admin_subtitle"))}</p>
      </div>
    </header>
    <section class="panel">
      <div class="panel-title"><h2>${escapeHtml(t("forum_admin_topics"))}</h2></div>
      <div id="forum-admin-topics"><div class="forum-loading">${escapeHtml(t("forum_loading"))}</div></div>
    </section>
    <section class="panel">
      <div class="panel-title"><h2>${escapeHtml(t("forum_admin_replies"))}</h2></div>
      <div id="forum-admin-replies"><div class="forum-loading">${escapeHtml(t("forum_loading"))}</div></div>
    </section>
  `;
}

export function ForumAdminTopicRows(topics) {
  if (!topics.length) return `<div class="popup-empty"><small>${escapeHtml(t("forum_empty"))}</small></div>`;
  return `<div class="forum-admin-list">${topics.map((tp) => `
    <div class="forum-admin-item">
      <div class="fai-main">
        <div class="fai-top">
          <strong>${escapeHtml(tp.title)}</strong>
          <span class="forum-status forum-status-${escapeHtml((tp.status || "").toLowerCase())}">${escapeHtml(tp.status || "—")}</span>
        </div>
        <p class="fai-snippet">${escapeHtml(truncate(tp.content, 120))}</p>
        <small>${escapeHtml(tp.nickname || "—")} · ${escapeHtml(formatForumTime(tp.createdAt))}${tp.ticker ? " · " + escapeHtml(tp.ticker) : ""}</small>
      </div>
      ${ForumAdminActions("topic", tp.id)}
    </div>
  `).join("")}</div>`;
}

export function ForumAdminReplyRows(replies) {
  if (!replies.length) return `<div class="popup-empty"><small>${escapeHtml(t("forum_no_replies"))}</small></div>`;
  return `<div class="forum-admin-list">${replies.map((r) => `
    <div class="forum-admin-item">
      <div class="fai-main">
        <div class="fai-top">
          <strong>${escapeHtml(r.nickname || "—")}</strong>
          <span class="forum-status forum-status-${escapeHtml((r.status || "").toLowerCase())}">${escapeHtml(r.status || "—")}</span>
        </div>
        <p class="fai-snippet">${escapeHtml(truncate(r.content, 120))}</p>
        <small>${escapeHtml(t("forum_admin_topic_ref"))}: ${escapeHtml(r.topicId || "—")} · ${escapeHtml(formatForumTime(r.createdAt))}</small>
      </div>
      ${ForumAdminActions("reply", r.id)}
    </div>
  `).join("")}</div>`;
}

function ForumAdminActions(kind, id) {
  return `
    <div class="fai-actions">
      <button type="button" class="mini-action-btn" data-forum-action="hide" data-kind="${kind}" data-id="${escapeHtml(id)}">${escapeHtml(t("forum_btn_hide"))}</button>
      <button type="button" class="mini-action-btn" data-forum-action="publish" data-kind="${kind}" data-id="${escapeHtml(id)}">${escapeHtml(t("forum_btn_restore"))}</button>
      <button type="button" class="mini-action-btn danger" data-forum-action="delete" data-kind="${kind}" data-id="${escapeHtml(id)}">${escapeHtml(t("forum_btn_delete"))}</button>
    </div>
  `;
}

function truncate(value, max) {
  const s = String(value || "");
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function formatForumTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 16).replace("T", " ");
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Settings / Development Test Page ────────────────────────────────────────

export function SettingsPage() {
  return `
    <header class="page-header">
      <div>
        <h1>${escapeHtml(t("settings_page_title"))}</h1>
        <p>${escapeHtml(t("settings_page_subtitle"))}</p>
      </div>
    </header>

    <section class="panel firecrawl-test-panel">
      <div class="panel-title">
        <h2>${escapeHtml(t("firecrawl_test_title"))}</h2>
      </div>
      <form id="firecrawl-test-form" class="firecrawl-test-form">
        <label for="firecrawl-test-url">${escapeHtml(t("firecrawl_test_url_label"))}</label>
        <div class="firecrawl-test-row">
          <input
            id="firecrawl-test-url"
            type="url"
            value="https://www.bankofcanada.ca/"
            placeholder="https://example.com"
            required
          />
          <button id="firecrawl-test-btn" class="refresh-news-btn" type="submit">${escapeHtml(t("firecrawl_test_button"))}</button>
        </div>
        <span id="firecrawl-test-status" class="news-refresh-status"></span>
      </form>
      <div id="firecrawl-test-result" class="firecrawl-test-result"></div>
    </section>

    <section class="panel firecrawl-test-panel">
      <div class="panel-title">
        <h2>${escapeHtml(t("enrich_watchlist_title"))}</h2>
      </div>
      <p class="news-refresh-status">${escapeHtml(t("enrich_watchlist_desc"))}</p>
      <label class="enrich-force-label">
        <input type="checkbox" id="enrich-force-checkbox" />
        <span>${escapeHtml(t("enrich_watchlist_force"))}</span>
      </label>
      <div class="firecrawl-test-row">
        <button id="btn-enrich-watchlist" class="refresh-news-btn" type="button">${escapeHtml(t("enrich_watchlist_button"))}</button>
        <span id="enrich-watchlist-status" class="news-refresh-status"></span>
      </div>
    </section>
  `;
}

export function SharePage() {
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;

  return `
    <header class="page-header">
      <div>
        <h1>${escapeHtml(t("share_page_title"))}</h1>
        <p>${escapeHtml(t("share_page_subtitle"))}</p>
      </div>
    </header>
    <section class="panel share-panel">
      <div class="panel-title"><h2>${escapeHtml(t("share_card_title"))}</h2></div>
      <div class="share-layout">
        <div class="share-link-block">
          <label>${escapeHtml(t("share_link_label"))}</label>
          <div id="share-url-text" class="share-url-text">${escapeHtml(shareUrl)}</div>
          <div class="share-actions">
            <button id="btn-copy-share-link" class="refresh-news-btn" type="button">${escapeHtml(t("share_copy_button"))}</button>
            <span id="share-copy-status" class="news-refresh-status"></span>
          </div>
          <p class="share-note">${escapeHtml(t("share_disclaimer"))}</p>
        </div>
        <div class="share-qr-block">
          <img src="${escapeHtml(qrUrl)}" alt="${escapeHtml(t("share_qr_alt"))}" width="220" height="220" />
          <span>${escapeHtml(t("share_qr_caption"))}</span>
        </div>
      </div>
    </section>
  `;
}

function currentStockTheme() {
  const hash = window.location.hash || "";
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  try {
    return new URLSearchParams(query).get("theme") || "all";
  } catch (_) {
    return "all";
  }
}

function stockThemeFilters(lang) {
  return [
    { key: "all", label: lang === "zh" ? "全部" : "All" },
    { key: "ai", label: lang === "zh" ? "AI" : "AI" },
    { key: "energy", label: lang === "zh" ? "能源" : "Energy" },
    { key: "bank", label: lang === "zh" ? "银行 / 金融" : "Banks / Finance" },
    { key: "etf", label: lang === "zh" ? "ETF" : "ETFs" },
    { key: "healthcare", label: lang === "zh" ? "医药" : "Healthcare" },
    { key: "china", label: lang === "zh" ? "中国科技" : "China Tech" },
    { key: "canada-tech", label: lang === "zh" ? "加拿大科技" : "Canada Tech" },
    { key: "payment", label: lang === "zh" ? "支付网络" : "Payments" },
  ];
}

function matchesStockTheme(row, key) {
  const theme = String(get(row, "主题分类") || "").toLowerCase();
  const type = String(get(row, "类型") || "").toLowerCase();
  const sector = String(get(row, "行业") || "").toLowerCase();
  const text = `${theme} ${type} ${sector}`;

  if (key === "ai") return text.includes("ai") || text.includes("算力") || text.includes("自动驾驶") || text.includes("云");
  if (key === "energy") return text.includes("能源") || text.includes("管道") || text.includes("energy") || text.includes("oil") || text.includes("gas");
  if (key === "bank") return text.includes("银行") || text.includes("金融");
  if (key === "etf") return text.includes("etf");
  if (key === "healthcare") return text.includes("医药") || text.includes("制药") || text.includes("health") || text.includes("pharma");
  if (key === "china") return text.includes("中国科技") || text.includes("china");
  if (key === "canada-tech") return text.includes("加拿大科技") || text.includes("canada tech");
  if (key === "payment") return text.includes("支付") || text.includes("payment");
  return true;
}

function stockThemeSummary(items, selectedTheme, lang) {
  if (selectedTheme === "all") {
    return lang === "zh"
      ? "从整体上看家庭关注的股票池。"
      : "Review the full family watch pool.";
  }

  const descriptions = {
    ai: lang === "zh" ? "AI 主题包括算力、云平台、软件、自动驾驶和电动车相关公司。" : "AI includes compute, cloud platforms, software, autonomous driving, and EV-related names.",
    energy: lang === "zh" ? "能源主题关注油气、管道、现金流、股息和 AI 数据中心带来的电力需求。" : "Energy focuses on oil & gas, pipelines, cash flow, dividends, and power demand from AI data centers.",
    bank: lang === "zh" ? "银行金融主题关注利率、贷款质量、分红、支付网络和经济周期。" : "Banks and finance focus on rates, credit quality, dividends, payment networks, and the economic cycle.",
    etf: lang === "zh" ? "ETF 主题用于观察加拿大大盘和蓝筹指数型配置。" : "ETF theme tracks broad Canada market and blue-chip index exposure.",
    healthcare: lang === "zh" ? "医药主题关注创新药、销售增长、医保定价和估值风险。" : "Healthcare focuses on drug pipelines, sales growth, pricing, and valuation risk.",
    china: lang === "zh" ? "中国科技主题关注消费、云业务、监管和地缘政治风险。" : "China Tech focuses on consumption, cloud, regulation, and geopolitical risk.",
    "canada-tech": lang === "zh" ? "加拿大科技主题关注软件平台、盈利能力和科技股估值。" : "Canada Tech focuses on software platforms, profitability, and tech valuations.",
    payment: lang === "zh" ? "支付网络主题关注消费支付量、跨境交易和金融科技竞争。" : "Payments focus on payment volume, cross-border activity, and fintech competition.",
  };

  return descriptions[selectedTheme] || (lang === "zh" ? "按主题查看相关股票。" : "View stocks by theme.");
}

function stockAnalysisTable(items, lang) {
  return `
    <div class="stock-research-layout">
      <div class="stock-research-list" role="list" aria-label="${escapeHtml(t("stock_select_label"))}">
        ${items.map((row, index) => stockAnalysisListEntry(row, lang, stockDetailId(row, index), false)).join("")}
      </div>
      <div class="stock-research-detail">
        ${items.map((row, index) => stockAnalysisRow(row, lang, stockDetailId(row, index), false)).join("")}
      </div>
    </div>
  `;
}

function stockDetailId(row, index) {
  const ticker = String(get(row, "Ticker") || `stock-${index}`).replace(/[^a-z0-9_-]+/gi, "-");
  return `${ticker}-${index}`;
}

function stockAnalysisListEntry(row, lang, detailId, active) {
  return `
    <div class="stock-list-entry" role="listitem">
      ${stockAnalysisListItem(row, lang, detailId, active)}
      ${stockAnalysisRow(row, lang, detailId, active, "stock-mobile-detail")}
    </div>
  `;
}

function stockAnalysisListItem(row, lang, detailId, active) {
  const ticker = get(row, "Ticker");
  const name = lang === "zh"
    ? (get(row, "中文名称") || get(row, "名称") || ticker || "—")
    : (get(row, "英文名称") || get(row, "名称") || ticker || "—");
  const type = get(row, "类型") || get(row, "行业") || (lang === "zh" ? "其他" : "Other");
  const price = get(row, "当前价格") || "—";
  const daily = get(row, "日变动%") || get(row, "日变动");
  const dailyClass = numberToneClass(daily);
  const overall = get(row, "综合评分");
  const overallClass = scoreToneClass(overall);

  return `
    <button class="stock-list-item${active ? " active" : ""}" type="button" data-stock-detail-target="${escapeHtml(detailId)}">
      <span class="stock-list-top">
        <strong>${escapeHtml(ticker || "—")}</strong>
        <span class="${dailyClass}">${escapeHtml(daily || "—")}</span>
      </span>
      <span class="stock-list-name">${escapeHtml(name)}</span>
      <span class="stock-list-meta">
        <span>${escapeHtml(type)}</span>
        <span>${escapeHtml(price)}</span>
        <span class="stock-score ${overallClass}">${escapeHtml(overall || "—")}</span>
      </span>
    </button>
  `;
}

function stockAnalysisRow(row, lang, detailId, active, extraClass = "") {
  const ticker = get(row, "Ticker");
  const zhName = get(row, "中文名称") || get(row, "名称") || ticker || "—";
  const enName = get(row, "英文名称") || get(row, "名称") || ticker || "—";
  const type = get(row, "类型") || get(row, "行业") || (lang === "zh" ? "其他" : "Other");
  const desc = get(row, "一句话说明") || "";
  const focus = get(row, "适合关注点") || "";
  const daily = get(row, "日变动%") || get(row, "日变动");
  const dailyClass = numberToneClass(daily);
  const overall = get(row, "综合评分");
  const overallClass = scoreToneClass(overall);
  const price = get(row, "当前价格") || "—";
  const volatility = get(row, "简化波动参考%") || get(row, "年化波动率%") || "—";
  const updated = formatStockUpdate(get(row, "更新时间"));
  const fundamentalsHtml = stockFundamentalsBlock(row, lang);

  return `
    <article class="stock-card stock-detail-panel${extraClass ? ` ${extraClass}` : ""}${active ? " active" : ""}" data-stock-detail-panel="${escapeHtml(detailId)}" ${active ? "" : "hidden"}>
      <div class="stock-card-main">
        <div class="stock-identity">
          <strong class="wl-ticker stock-ticker-large">${escapeHtml(ticker || "—")}</strong>
          <div>
            <div class="stock-name-line">${escapeHtml(zhName)} <span>${escapeHtml(enName)}</span></div>
            <div class="stock-type-pill">${escapeHtml(type)}</div>
          </div>
        </div>
        <div class="stock-metrics">
          <div><span>${lang === "zh" ? "价格" : "Price"}</span><strong>${escapeHtml(price)}</strong></div>
          <div><span>${lang === "zh" ? "日变动" : "Daily"}</span><strong class="${dailyClass}">${escapeHtml(daily || "—")}</strong></div>
          <div><span>${lang === "zh" ? "波动参考" : "Volatility Ref."}</span><strong>${escapeHtml(volatility)}</strong></div>
          <div><span>${lang === "zh" ? "综合评分" : "Overall"}</span><strong class="stock-score ${overallClass}">${escapeHtml(overall || "—")}</strong></div>
        </div>
      </div>

      <div class="stock-card-details">
        <p>${escapeHtml(desc || (lang === "zh" ? "暂无公司说明。" : "No company description yet."))}</p>
        <p><strong>${lang === "zh" ? "关注点：" : "Watch: "}</strong>${escapeHtml(focus || (lang === "zh" ? "待补充。" : "To be added."))}</p>
      </div>

      ${fundamentalsHtml}
      ${stockOfficialLinks(row, lang)}

      <div class="stock-card-foot">
        <span>Forward P/E: ${escapeHtml(pickStockValue(row, ["Forward P/E", "ForwardPE", "Forward PE"]) || "N/A")}</span>
        <span>Beta: ${escapeHtml(pickStockValue(row, ["Beta", "贝塔系数"]) || "N/A")}</span>
        <span>${lang === "zh" ? "行业" : "Sector"}: ${escapeHtml(pickStockValue(row, ["行业", "Sector"]) || type || "—")}</span>
        <span>${lang === "zh" ? "更新时间" : "Updated"}: ${escapeHtml(updated || "—")}</span>
      </div>
      ${extraClass ? `<button class="stock-back-to-list" type="button" data-stock-back-target="${escapeHtml(detailId)}">${escapeHtml(lang === "zh" ? "返回股票列表" : "Back to stock list")}</button>` : ""}
    </article>
  `;
}

function stockOfficialLinks(row, lang) {
  const ticker = String(get(row, "Ticker") || "").trim().toUpperCase();
  const fallback = OFFICIAL_STOCK_LINKS[ticker] || {};
  const links = [
    {
      label: t("stock_link_official"),
      url: pickStockValue(row, ["officialWebsite", "Official Website", "官方网站", "公司官网"]) || fallback.officialWebsite,
    },
    {
      label: t("stock_link_ir"),
      url: pickStockValue(row, ["investorRelations", "Investor Relations", "投资者关系"]) || fallback.investorRelations,
    },
    {
      label: t("stock_link_reports"),
      url: pickStockValue(row, ["financialReports", "Financial Reports", "财报", "财务报告"]) || fallback.financialReports,
    },
  ].filter((item) => isOfficialUrl(item.url));

  return `
    <div class="stock-official-links">
      <div class="stock-official-title">${escapeHtml(t("stock_official_links"))}</div>
      ${
        links.length
          ? `<div class="stock-link-grid">${links.map((item) => `
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.label)}</a>
            `).join("")}</div>`
          : `<p>${escapeHtml(t("stock_links_pending"))}</p>`
      }
    </div>
  `;
}

function isOfficialUrl(url) {
  const text = String(url || "").trim();
  if (!/^https?:\/\//i.test(text)) return false;
  return !/(finance\.yahoo|marketwatch|morningstar|seekingalpha|tipranks|benzinga|fool|nasdaq\.com|reuters\.com|cnbc\.com|bloomberg\.com)/i.test(text);
}

const OFFICIAL_STOCK_LINKS = {
  NVDA: { officialWebsite: "https://www.nvidia.com/", investorRelations: "https://investor.nvidia.com/", financialReports: "https://investor.nvidia.com/financial-info/quarterly-results/default.aspx" },
  TSLA: { officialWebsite: "https://www.tesla.com/", investorRelations: "https://ir.tesla.com/", financialReports: "https://ir.tesla.com/#quarterly-disclosure" },
  GOOGL: { officialWebsite: "https://abc.xyz/", investorRelations: "https://abc.xyz/investor/", financialReports: "https://abc.xyz/investor/" },
  MSFT: { officialWebsite: "https://www.microsoft.com/", investorRelations: "https://www.microsoft.com/en-us/Investor/", financialReports: "https://www.microsoft.com/en-us/Investor/earnings" },
  AMZN: { officialWebsite: "https://www.aboutamazon.com/", investorRelations: "https://ir.aboutamazon.com/", financialReports: "https://ir.aboutamazon.com/quarterly-results/default.aspx" },
  HSAI: { officialWebsite: "https://www.hesaitech.com/", investorRelations: "https://investor.hesaitech.com/", financialReports: "https://investor.hesaitech.com/financials/quarterly-results/default.aspx" },
  BABA: { officialWebsite: "https://www.alibabagroup.com/", investorRelations: "https://www.alibabagroup.com/en-US/ir-home", financialReports: "https://www.alibabagroup.com/en-US/ir-financial-reports" },
  "CVE.TO": { officialWebsite: "https://www.cenovus.com/", investorRelations: "https://www.cenovus.com/Investors", financialReports: "https://www.cenovus.com/Investors/Financial-information" },
  "SU.TO": { officialWebsite: "https://www.suncor.com/", investorRelations: "https://www.suncor.com/en-ca/investors", financialReports: "https://www.suncor.com/en-ca/investors/financial-reports" },
  XOM: { officialWebsite: "https://corporate.exxonmobil.com/", investorRelations: "https://investor.exxonmobil.com/", financialReports: "https://investor.exxonmobil.com/sec-filings" },
  CVX: { officialWebsite: "https://www.chevron.com/", investorRelations: "https://www.chevron.com/investors", financialReports: "https://www.chevron.com/investors/financial-information" },
  REI: { officialWebsite: "https://www.ringenergy.com/", investorRelations: "https://www.ringenergy.com/investors", financialReports: "https://www.ringenergy.com/investors/sec-filings" },
  "RY.TO": { officialWebsite: "https://www.rbc.com/", investorRelations: "https://www.rbc.com/investor-relations.html", financialReports: "https://www.rbc.com/investor-relations/financial-information.html" },
  "TD.TO": { officialWebsite: "https://www.td.com/", investorRelations: "https://www.td.com/ca/en/about-td/for-investors", financialReports: "https://www.td.com/ca/en/about-td/for-investors/investor-relations/financial-information/quarterly-results" },
  "SHOP.TO": { officialWebsite: "https://www.shopify.com/", investorRelations: "https://investors.shopify.com/", financialReports: "https://investors.shopify.com/financial-reports" },
  "ENB.TO": { officialWebsite: "https://www.enbridge.com/", investorRelations: "https://www.enbridge.com/investment-center", financialReports: "https://www.enbridge.com/investment-center/reports-and-filings" },
  "XIC.TO": { officialWebsite: "https://www.blackrock.com/ca/investors/en/products/239837/ishares-sptsx-capped-composite-index-etf", investorRelations: "https://www.blackrock.com/ca/investors/en/products/239837/ishares-sptsx-capped-composite-index-etf", financialReports: "https://www.blackrock.com/ca/investors/en/products/239837/ishares-sptsx-capped-composite-index-etf" },
  "XIU.TO": { officialWebsite: "https://www.blackrock.com/ca/investors/en/products/239832/ishares-sptsx-60-index-etf", investorRelations: "https://www.blackrock.com/ca/investors/en/products/239832/ishares-sptsx-60-index-etf", financialReports: "https://www.blackrock.com/ca/investors/en/products/239832/ishares-sptsx-60-index-etf" },
  AAPL: { officialWebsite: "https://www.apple.com/", investorRelations: "https://investor.apple.com/", financialReports: "https://investor.apple.com/sec-filings/default.aspx" },
  V: { officialWebsite: "https://usa.visa.com/", investorRelations: "https://investor.visa.com/", financialReports: "https://investor.visa.com/financial-information/sec-filings" },
  MA: { officialWebsite: "https://www.mastercard.com/", investorRelations: "https://investor.mastercard.com/", financialReports: "https://investor.mastercard.com/financials/sec-filings/default.aspx" },
  LLY: { officialWebsite: "https://www.lilly.com/", investorRelations: "https://investor.lilly.com/", financialReports: "https://investor.lilly.com/financial-information/sec-filings" },
  JPM: { officialWebsite: "https://www.jpmorganchase.com/", investorRelations: "https://www.jpmorganchase.com/ir", financialReports: "https://www.jpmorganchase.com/ir/annual-report" },
  AMD: { officialWebsite: "https://www.amd.com/", investorRelations: "https://ir.amd.com/", financialReports: "https://ir.amd.com/financial-information/sec-filings" },
  AVGO: { officialWebsite: "https://www.broadcom.com/", investorRelations: "https://investors.broadcom.com/", financialReports: "https://investors.broadcom.com/financial-information/sec-filings" },
  TSM: { officialWebsite: "https://www.tsmc.com/", investorRelations: "https://investor.tsmc.com/", financialReports: "https://investor.tsmc.com/english/financial-reports" },
  META: { officialWebsite: "https://about.meta.com/", investorRelations: "https://investor.atmeta.com/", financialReports: "https://investor.atmeta.com/financials" },
  ORCL: { officialWebsite: "https://www.oracle.com/", investorRelations: "https://investor.oracle.com/", financialReports: "https://investor.oracle.com/financials" },
  CRM: { officialWebsite: "https://www.salesforce.com/", investorRelations: "https://investor.salesforce.com/", financialReports: "https://investor.salesforce.com/financials" },
  PLTR: { officialWebsite: "https://www.palantir.com/", investorRelations: "https://investors.palantir.com/", financialReports: "https://investors.palantir.com/financials" },
  ARM: { officialWebsite: "https://www.arm.com/", investorRelations: "https://investors.arm.com/", financialReports: "https://investors.arm.com/financials" },
  ASML: { officialWebsite: "https://www.asml.com/", investorRelations: "https://www.asml.com/en/investors", financialReports: "https://www.asml.com/en/investors/financial-results" },
  SMCI: { officialWebsite: "https://www.supermicro.com/", investorRelations: "https://ir.supermicro.com/", financialReports: "https://ir.supermicro.com/financial-information/sec-filings" },
  MU: { officialWebsite: "https://www.micron.com/", investorRelations: "https://investors.micron.com/", financialReports: "https://investors.micron.com/financial-information/sec-filings" },
  ANET: { officialWebsite: "https://www.arista.com/", investorRelations: "https://investors.arista.com/", financialReports: "https://investors.arista.com/financials/sec-filings" },
  VRT: { officialWebsite: "https://www.vertiv.com/", investorRelations: "https://investors.vertiv.com/", financialReports: "https://investors.vertiv.com/financials/sec-filings" },
  DELL: { officialWebsite: "https://www.delltechnologies.com/", investorRelations: "https://investors.delltechnologies.com/", financialReports: "https://investors.delltechnologies.com/financial-information/sec-filings" },
  "CNQ.TO": { officialWebsite: "https://www.cnrl.com/", investorRelations: "https://www.cnrl.com/investor-relations", financialReports: "https://www.cnrl.com/investor-relations/financial-information" },
  "TRP.TO": { officialWebsite: "https://www.tcenergy.com/", investorRelations: "https://www.tcenergy.com/investors", financialReports: "https://www.tcenergy.com/investors/financial-reports" },
  "PPL.TO": { officialWebsite: "https://www.pembina.com/", investorRelations: "https://www.pembina.com/investors", financialReports: "https://www.pembina.com/investors/financial-reports" },
  CEG: { officialWebsite: "https://www.constellationenergy.com/", investorRelations: "https://investors.constellationenergy.com/", financialReports: "https://investors.constellationenergy.com/financials/sec-filings" },
  NEE: { officialWebsite: "https://www.nexteraenergy.com/", investorRelations: "https://www.nexteraenergy.com/investors", financialReports: "https://www.nexteraenergy.com/investors/financial-information/sec-filings" },
  "CCJ.TO": { officialWebsite: "https://www.cameco.com/", investorRelations: "https://www.cameco.com/investors", financialReports: "https://www.cameco.com/investors/financial-information" },
  "TECK.B.TO": { officialWebsite: "https://www.teck.com/", investorRelations: "https://www.teck.com/investors", financialReports: "https://www.teck.com/investors/financial-reports" },
  FCX: { officialWebsite: "https://www.fcx.com/", investorRelations: "https://investors.fcx.com/", financialReports: "https://investors.fcx.com/financial-information/sec-filings" },
  NEM: { officialWebsite: "https://www.newmont.com/", investorRelations: "https://investors.newmont.com/", financialReports: "https://investors.newmont.com/financials/sec-filings" },
  "BNS.TO": { officialWebsite: "https://www.scotiabank.com/", investorRelations: "https://www.scotiabank.com/ca/en/about/investors-shareholders.html", financialReports: "https://www.scotiabank.com/ca/en/about/investors-shareholders/financial-results.html" },
  "BMO.TO": { officialWebsite: "https://www.bmo.com/", investorRelations: "https://www.bmo.com/main/about-bmo/investor-relations", financialReports: "https://www.bmo.com/main/about-bmo/investor-relations/financial-information" },
  "CM.TO": { officialWebsite: "https://www.cibc.com/", investorRelations: "https://www.cibc.com/en/about-cibc/investor-relations.html", financialReports: "https://www.cibc.com/en/about-cibc/investor-relations/quarterly-results.html" },
  JNJ: { officialWebsite: "https://www.jnj.com/", investorRelations: "https://investor.jnj.com/", financialReports: "https://investor.jnj.com/financials/sec-filings" },
  UNH: { officialWebsite: "https://www.unitedhealthgroup.com/", investorRelations: "https://www.unitedhealthgroup.com/investors", financialReports: "https://www.unitedhealthgroup.com/investors/financial-reports" },
  MRK: { officialWebsite: "https://www.merck.com/", investorRelations: "https://www.merck.com/investor-relations", financialReports: "https://www.merck.com/investor-relations/financial-information" },
  "VFV.TO": { officialWebsite: "https://www.vanguard.ca/en/investor/products/products-group/etfs/VFV", investorRelations: "https://www.vanguard.ca/en/investor/products/products-group/etfs/VFV", financialReports: "https://www.vanguard.ca/en/investor/products/products-group/etfs/VFV" },
  "XQQ.TO": { officialWebsite: "https://www.blackrock.com/ca/investors/en/products/239853/ishares-nasdaq-100-index-etf-cad-hedged-fund", investorRelations: "https://www.blackrock.com/ca/investors/en/products/239853/ishares-nasdaq-100-index-etf-cad-hedged-fund", financialReports: "https://www.blackrock.com/ca/investors/en/products/239853/ishares-nasdaq-100-index-etf-cad-hedged-fund" },
  SMH: { officialWebsite: "https://www.vaneck.com/us/en/investments/semiconductor-etf-smh/", investorRelations: "https://www.vaneck.com/us/en/investments/semiconductor-etf-smh/", financialReports: "https://www.vaneck.com/us/en/investments/semiconductor-etf-smh/" },
  QQQ: { officialWebsite: "https://www.invesco.com/qqq-etf/en/home.html", investorRelations: "https://www.invesco.com/qqq-etf/en/home.html", financialReports: "https://www.invesco.com/qqq-etf/en/home.html" },
  SPCX: { officialWebsite: "https://www.subversiveetfs.com/spcx", investorRelations: "https://www.subversiveetfs.com/spcx", financialReports: "https://www.subversiveetfs.com/spcx" },
  OPENAI: { officialWebsite: "https://openai.com/", investorRelations: "https://openai.com/about/" },
  ANTHROPIC: { officialWebsite: "https://www.anthropic.com/", investorRelations: "https://www.anthropic.com/company" },
  CURSOR: { officialWebsite: "https://www.cursor.com/", investorRelations: "https://www.cursor.com/" },
};

function numberToneClass(value) {
  const n = Number(String(value || "").replace("%", ""));
  if (!Number.isFinite(n) || n === 0) return "stock-neutral";
  return n > 0 ? "stock-positive" : "stock-negative";
}

function scoreToneClass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "neutral";
  if (n >= 7.5) return "positive";
  if (n >= 6) return "neutral";
  return "negative";
}

function stockFundamentalsBlock(row, lang) {
  const zh = lang === "zh";

  const businessItems = [
    [zh ? "中文名称" : "Chinese Name", get(row, "中文名称")],
    [zh ? "英文名称" : "English Name", get(row, "英文名称")],
    [zh ? "类型" : "Type", get(row, "类型")],
    [zh ? "主题分类" : "Theme", get(row, "主题分类")],
    [zh ? "行业" : "Sector", get(row, "行业")],
  ].filter(([, value]) => hasDisplayValue(value));

  const valuationItems = [
    [zh ? "市值" : "Market Cap", formatLargeNumber(get(row, "市值 Market Cap"))],
    [zh ? "P/E 市盈率" : "P/E", get(row, "P/E 市盈率")],
    [zh ? "Forward P/E 预期市盈率" : "Forward P/E", get(row, "Forward P/E 预期市盈率") || get(row, "Forward P/E")],
    [zh ? "P/S 市销率" : "P/S", get(row, "P/S 市销率")],
    [zh ? "股息率" : "Dividend Yield", formatYieldValue(get(row, "股息率 Dividend Yield"))],
  ].filter(([, value]) => hasDisplayValue(value));

  const profitabilityItems = [
    [zh ? "净利率" : "Profit Margin", formatYieldValue(get(row, "Profit Margin 净利率"))],
    [zh ? "营业利润率" : "Operating Margin", formatYieldValue(get(row, "Operating Margin 营业利润率"))],
    [zh ? "ROE 净资产收益率" : "ROE", formatYieldValue(get(row, "ROE 净资产收益率"))],
    [zh ? "过去12月营收" : "Revenue TTM", formatLargeNumber(get(row, "Revenue TTM 过去12月营收"))],
    [zh ? "营收增长" : "Revenue Growth", formatYieldValue(get(row, "Revenue Growth 营收增长"))],
    [zh ? "EPS 每股收益" : "EPS", get(row, "EPS 每股收益")],
  ].filter(([, value]) => hasDisplayValue(value));

  const rangeItems = [
    [zh ? "52周高点" : "52W High", get(row, "52周高点")],
    [zh ? "52周低点" : "52W Low", get(row, "52周低点")],
    [zh ? "财务数据更新时间" : "Financial Updated", formatStockUpdate(get(row, "财务数据更新时间"))],
    [zh ? "基本面数据来源" : "Source", get(row, "基本面数据来源")],
  ].filter(([, value]) => hasDisplayValue(value));

  const oneLine = get(row, "一句话说明");
  const focus = get(row, "适合关注点");
  const reportSummary = get(row, "财报摘要");
  const aiComment = get(row, "AI财务简评");

  const hasAny = businessItems.length || valuationItems.length || profitabilityItems.length || rangeItems.length ||
    hasDisplayValue(oneLine) || hasDisplayValue(focus) || hasDisplayValue(reportSummary) || hasDisplayValue(aiComment);

  if (!hasAny) return "";

  const section = (title, items) => items.length ? `
    <div class="stock-fundamentals-section">
      <div class="stock-fundamentals-section-title">${escapeHtml(title)}</div>
      <div class="stock-fundamentals-grid">${items.map(([label, value]) => `
        <div>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `).join("")}</div>
    </div>
  ` : "";

  return `
    <div class="stock-fundamentals-block">
      <div class="stock-fundamentals-title">${zh ? "基本面数据" : "Fundamentals"}</div>

      ${section(zh ? "公司与主题" : "Company & Theme", businessItems)}
      ${hasDisplayValue(oneLine) ? `<p class="stock-fundamentals-summary"><strong>${zh ? "一句话说明：" : "One-line: "}</strong>${escapeHtml(oneLine)}</p>` : ""}
      ${hasDisplayValue(focus) ? `<p class="stock-fundamentals-summary"><strong>${zh ? "适合关注点：" : "Watch points: "}</strong>${escapeHtml(focus)}</p>` : ""}

      ${section(zh ? "估值数据" : "Valuation", valuationItems)}
      ${section(zh ? "盈利与增长" : "Profitability & Growth", profitabilityItems)}
      ${section(zh ? "价格区间与来源" : "Price Range & Source", rangeItems)}

      ${hasDisplayValue(reportSummary) ? `<p class="stock-fundamentals-summary"><strong>${zh ? "财报摘要：" : "Report Summary: "}</strong>${escapeHtml(reportSummary)}</p>` : ""}
      ${hasDisplayValue(aiComment) ? `<p class="stock-fundamentals-ai"><strong>${zh ? "AI财务简评：" : "AI Comment: "}</strong>${escapeHtml(aiComment)}</p>` : ""}
    </div>
  `;
}

function pickStockValue(row, keys) {
  for (const key of keys) {
    const value = get(row, key);
    if (hasDisplayValue(value)) return String(value).trim();
  }
  return "";
}

function hasDisplayValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  return !["na", "n/a", "null", "undefined", "—", "-"].includes(text.toLowerCase());
}

function formatYieldValue(value) {
  if (!hasDisplayValue(value)) return "";
  const text = String(value).trim();
  if (text.includes("%")) return text;
  const n = Number(text);
  if (!Number.isFinite(n)) return text;
  if (Math.abs(n) > 1) return `${n.toFixed(2)}%`;
  return `${(n * 100).toFixed(2)}%`;
}

function formatLargeNumber(value) {
  if (!hasDisplayValue(value)) return "";
  const text = String(value).replace(/,/g, "").trim();
  const n = Number(text);
  if (!Number.isFinite(n)) return String(value);
  if (Math.abs(n) >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  return String(value);
}

function latestStockUpdate(items) {
  const dates = items
    .map((row) => Date.parse(get(row, "更新时间")))
    .filter((value) => Number.isFinite(value));
  if (!dates.length) return "";
  return formatStockUpdate(new Date(Math.max(...dates)).toISOString());
}

function formatStockUpdate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(getLang() === "zh" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function actionLabelClass(action) {
  if (action === "High Attention") return "high";
  if (action === "Review")         return "review";
  return "none";
}

function localizedValue(value, fallback = "—") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (getLang() !== "zh") return raw;

  const exact = {
    Mabel: "稳健组合",
    Victor: "主动组合",
    Both: "共同",
    Stock: "股票",
    ETF: "ETF",
    Fund: "基金",
    "Mutual Fund": "共同基金",
    "Keyword Watch": "关键词观察",
    Cash: "现金",
    Other: "其他",
    Low: "低",
    Medium: "中",
    High: "高",
    "High Attention": "重点关注",
    Review: "复核",
    Watch: "观察",
    "No Action": "无需行动",
    Active: "有效",
    "Active Watch": "观察中",
    Archived: "已归档",
    Planned: "计划中",
    Completed: "已完成",
    Cancelled: "已取消",
    "Review Later": "稍后复核",
    Buy: "买入",
    Sell: "卖出",
    Hold: "持有",
    Dividend: "分红",
    Contribution: "存入",
    Withdrawal: "取出",
    "Non-registered": "非注册账户",
    Energy: "能源",
    "ETF / Fixed Income": "ETF / 固定收益",
    "AI / Semiconductor": "AI / 半导体",
    "AI / Search / Cloud": "AI / 搜索 / 云服务",
    "Energy / Oil & Gas": "能源 / 油气",
    Cybersecurity: "网络安全",
    "Consumer Tech": "消费科技",
  };
  if (exact[raw]) return exact[raw];

  return raw
    .replace(/\bHigh Attention\b/g, "重点关注")
    .replace(/\bReview Later\b/g, "稍后复核")
    .replace(/\bActive Watch\b/g, "观察中")
    .replace(/\bReview\b/g, "复核")
    .replace(/\bStock\b/g, "股票")
    .replace(/\bKeyword Watch\b/g, "关键词观察")
    .replace(/\bSemiconductor\b/g, "半导体")
    .replace(/\bCloud\b/g, "云服务")
    .replace(/\bEnergy\b/g, "能源")
    .replace(/\bConsumer\b/g, "消费")
    .replace(/\bEnterprise\b/g, "企业")
    .replace(/\bSoftware\b/g, "软件");
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

function publicSourceLink(value) {
  const link = String(value || "").trim();
  if (!link) return "";

  try {
    const url = new URL(link);
    const host = url.hostname.toLowerCase();
    if (host === "drive.google.com" || host.endsWith(".drive.google.com")) return "";
    if (host === "docs.google.com" || host.endsWith(".docs.google.com")) return "";
    return link;
  } catch {
    return "";
  }
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


// ─── Stock Fundamentals Update Button ────────────────────────────────────────
// Minimal front-end handler: updates only 5 tickers per click to avoid
// Alpha Vantage free-tier throttling and Apps Script timeout risk.
document.addEventListener("click", async (event) => {
  const btn = event.target.closest("#btn-update-stock-fundamentals");
  if (!btn) return;

  const status = document.getElementById("stock-fundamentals-status");
  const lang = getLang();

  btn.disabled = true;
  if (status) {
    status.textContent = lang === "zh" ? "基本面数据更新中..." : "Updating fundamentals...";
  }

  try {
    const response = await fetch("/.netlify/functions/updateStockAnalysis", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sessionStorage.getItem("fir_admin_token_v1") || ""}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ action: "update_stock_fundamentals", max: 5 }),
    });

    let data;
    try {
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Backend did not return JSON.");
      }
      data = await response.json();
    } catch (error) {
      throw new Error(lang === "zh" ? "后端没有返回 JSON。" : (error.message || "Backend did not return JSON."));
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (status) {
      status.textContent = (lang === "zh" ? "更新完成：" : "Updated: ") +
        `${data.updatedRows || 0} · ${data.updatedAt || ""}`;
    }
  } catch (error) {
    console.error(error);
    if (status) {
      status.textContent =
        lang === "zh"
          ? "更新失败，请稍后再试"
          : "Update failed. Please try again later.";
    }
  } finally {
    btn.disabled = false;
  }
});

// ─── Watchlist Enrichment Trigger (columns L / M) ────────────────────────────
// Calls the enrichWatchlist Netlify function, which fetches news + earnings via
// Firecrawl/OpenAI and writes Chinese summaries back to the Watchlist sheet.
document.addEventListener("click", async (event) => {
  const btn = event.target.closest("#btn-enrich-watchlist");
  if (!btn) return;

  const status = document.getElementById("enrich-watchlist-status");
  const force = !!document.getElementById("enrich-force-checkbox")?.checked;
  const lang = getLang();

  btn.disabled = true;
  if (status) status.textContent = t("status_enrich_running");

  try {
    const response = await fetch("/.netlify/functions/enrichWatchlist", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sessionStorage.getItem("fir_admin_token_v1") || ""}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      // Force re-analyzes existing rows (larger batch); normal run only fills pending rows.
      body: JSON.stringify(force ? { max: 10, force: true } : { max: 3 }),
    });

    let data;
    try {
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Backend did not return JSON.");
      }
      data = await response.json();
    } catch (error) {
      throw new Error(lang === "zh" ? "后端没有返回 JSON。" : (error.message || "Backend did not return JSON."));
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (status) {
      const updated = data.updatedRows || 0;
      const processed = data.processed || 0;
      status.textContent = (lang === "zh"
        ? `更新完成：写入 ${updated} 行（处理 ${processed} 行） · ${data.updatedAt || ""}`
        : `Updated ${updated} row(s) of ${processed} processed · ${data.updatedAt || ""}`);
    }
  } catch (error) {
    console.error(error);
    if (status) {
      status.textContent = lang === "zh"
        ? t("status_enrich_failed")
        : (error.message || t("status_enrich_failed"));
    }
  } finally {
    btn.disabled = false;
  }
});
