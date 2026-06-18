import {
  addDecisionLog,
  addWatchItem,
  loadDashboardSource,
  loadDecisionLogPageSource,
  loadHoldingsPageSource,
  loadStockAnalysisPageSource,
  loadWatchlistPageSource,
  refreshMarketData,
  syncNewsFromSheet,
  syncMorningBrief,
  refreshStockAnalysis,
} from "./data/googleSheets.js";
import { buildDashboardModel } from "./data/dashboardMapper.js";
import { buildHoldingsModel } from "./data/holdingsMapper.js";
import { buildWatchlistModel } from "./data/watchlistMapper.js";
import { buildDecisionLogModel } from "./data/decisionLogMapper.js";
import {
  AlertsPanel,
  AppShell,
  DecisionLogPage,
  ErrorState,
  Header,
  HoldingsPage,
  KpiCards,
  LiveUpdatesPanel,
  LoadingState,
  MarketSection,
  MorningBriefPanel,
  AiMarketRadarPanel,
  StockRadarHomeEntry,
  SharePage,
  SettingsPage,
  StockAnalysisPage,
  WatchlistPage,
  WatchlistPopupHtml,
} from "./components.js";
import { t, getLang, setLang } from "./i18n.js";

const app = document.querySelector("#app");
const AUTH_KEY = "fir_auth_v2";
const ADMIN_TOKEN_KEY = "fir_admin_token_v1";

// ── Password Gate ─────────────────────────────────────────────────────────────

function checkAuth() {
  return sessionStorage.getItem(AUTH_KEY) === "ok";
}

function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function showPasswordGate() {
  document.getElementById("admin-login-overlay")?.remove();
  document.body.insertAdjacentHTML("beforeend", `
    <div id="admin-login-overlay" class="pw-gate-wrapper">
      <div class="pw-gate-box" role="dialog" aria-modal="true" aria-labelledby="admin-login-title">
        <div class="pw-brand">◎</div>
        <h2 id="admin-login-title" class="pw-title">${t("pw_title")}</h2>
        <p class="pw-subtitle">${t("pw_subtitle")}</p>
        <form id="pw-form" class="pw-form" autocomplete="on">
          <p class="pw-hint">${t("pw_hint")}</p>
          <input
            id="pw-input"
            type="password"
            class="pw-input"
            placeholder="Password"
            autocomplete="current-password"
            autofocus
          />
          <div id="pw-error" class="pw-error" hidden>
            ${t("pw_error")}
          </div>
          <button type="submit" class="pw-submit">${t("pw_submit")}</button>
        </form>
        <button id="pw-change-help-btn" class="pw-change-help-btn" type="button">${t("pw_change_button")}</button>
        <div id="pw-change-help" class="pw-change-help" hidden>
          ${t("pw_change_help")}
        </div>
        <button id="pw-cancel-btn" class="pw-cancel-btn" type="button">${t("pw_cancel")}</button>
      </div>
    </div>
  `);

  const wrapper = document.getElementById("admin-login-overlay");
  document.getElementById("pw-cancel-btn")?.addEventListener("click", () => {
    wrapper?.remove();
  });

  document.getElementById("pw-change-help-btn")?.addEventListener("click", () => {
    const helpEl = document.getElementById("pw-change-help");
    if (helpEl) helpEl.hidden = !helpEl.hidden;
  });

  document.getElementById("pw-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const inputEl = document.getElementById("pw-input");
    const submitBtn = document.querySelector(".pw-submit");
    const errEl = document.getElementById("pw-error");
    if (submitBtn) submitBtn.disabled = true;
    if (errEl) errEl.hidden = true;

    const verified = await verifyAdminPassword(inputEl.value);
    if (verified.success) {
      sessionStorage.setItem(AUTH_KEY, "ok");
      sessionStorage.setItem(ADMIN_TOKEN_KEY, verified.token || "");
      wrapper?.remove();
      renderCurrentPage().catch((error) => {
        app.innerHTML = ErrorState(error, checkAuth());
        console.error(error);
        bindGlobalActions();
      });
    } else {
      if (errEl) errEl.hidden = false;
      inputEl.value = "";
      inputEl.focus();
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

async function verifyAdminPassword(password) {
  try {
    const response = await fetch("/.netlify/functions/verifyAdminPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = await readJsonResponse(response, "Admin password API");
    return {
      success: response.ok && payload.success === true,
      token: payload.token || "",
    };
  } catch {
    return { success: false, token: "" };
  }
}

function bindGlobalActions() {
  const loginBtn = document.querySelector("[data-action='adminLogin']");
  if (loginBtn) {
    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      showPasswordGate();
    });
  }

  const logoutBtn = document.querySelector("[data-action='logout']");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.hash = "#/dashboard";
      renderCurrentPage().catch((error) => {
        app.innerHTML = ErrorState(error, checkAuth());
        console.error(error);
        bindGlobalActions();
      });
    });
  }

  // Language switcher (floating widget — EN and 中文 buttons)
  document.querySelectorAll("[data-action='setLang']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newLang = btn.dataset.lang;
      if (getLang() === newLang) return; // already active
      setLang(newLang);
      document.documentElement.lang = newLang === "zh" ? "zh-CN" : "en";
      app.innerHTML = LoadingState(checkAuth());
      renderCurrentPage().catch((error) => {
        app.innerHTML = ErrorState(error, checkAuth());
        console.error(error);
        bindGlobalActions();
      });
    });
  });
}

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  page: getPageFromUrl(),
  holdingsFilter: "all",
  selectedHoldingId: "",
  holdingsSource: null,
  watchlistSource: null,
  decisionLogSource: null,
  stockAnalysisSource: null,
  aiMarketTrendSummary: null,
  aiMarketTrendSources: [],
  decisionLogFilter: "all",
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  document.documentElement.lang = getLang() === "zh" ? "zh-CN" : "en";

  app.innerHTML = LoadingState(checkAuth());

  try {
    await renderCurrentPage();
  } catch (error) {
    app.innerHTML = ErrorState(error, checkAuth());
    console.error(error);
    bindGlobalActions();
  }
}

// ── Page Routing ──────────────────────────────────────────────────────────────

async function renderCurrentPage() {
  state.page = getPageFromUrl();
  const isAdmin = checkAuth();

  if (isAdminRoute(state.page) && !isAdmin) {
    window.location.hash = "#/dashboard";
    showPasswordGate();
    return;
  }

  if (state.page === "holdings") {
    const source = await loadHoldingsPageSource();
    state.holdingsSource = source;
    renderHoldings();
    return;
  }

  if (state.page === "watchlist") {
    const source = await loadWatchlistPageSource();
    state.watchlistSource = source;
    renderWatchlist();
    return;
  }

  if (state.page === "decisions") {
    const source = await loadDecisionLogPageSource();
    state.decisionLogSource = source;
    renderDecisionLog();
    return;
  }

  if (state.page === "stock-analysis") {
    const source = await loadStockAnalysisPageSource();
    state.stockAnalysisSource = source;
    renderStockAnalysis();
    return;
  }

  if (state.page === "market") {
    const source = await loadDashboardSource();
    renderMarketPage(buildDashboardModel(source));
    return;
  }

  if (state.page === "news") {
    const source = await loadDashboardSource();
    renderNewsPage(buildDashboardModel(source));
    return;
  }

  if (state.page === "alerts") {
    const source = await loadDashboardSource();
    renderAlertsPage(buildDashboardModel(source));
    return;
  }

  if (state.page === "morning-brief") {
    const source = await loadDashboardSource();
    renderMorningBriefPage(buildDashboardModel(source));
    return;
  }

  if (state.page === "share") {
    renderSharePage();
    return;
  }

  if (state.page === "settings") {
    renderSettings();
    return;
  }

  const source = await loadDashboardSource();
  const dashboard = buildDashboardModel(source);
  await loadSavedMarketTrendSummary();
  renderDashboard(dashboard);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function renderDashboard(dashboard) {
  app.innerHTML = AppShell(`
    ${Header()}
    ${checkAuth() ? KpiCards(dashboard.kpis) : ""}
    ${MarketSection(dashboard.marketData)}
    ${StockRadarHomeEntry()}
    <section class="dashboard-grid">
      ${LiveUpdatesPanel(dashboard.news)}
      ${AiMarketRadarPanel(state.aiMarketTrendSummary, state.aiMarketTrendSources)}
    </section>
    <footer class="footer">
      ${t("footer_disclaimer")}
    </footer>
  `, "dashboard", checkAuth());
  bindRefreshNewsButton();
  bindRefreshMarketButton();
  hydrateAiMarketTrendResult();
  bindGlobalActions();
}

async function loadSavedMarketTrendSummary() {
  try {
    const response = await fetch("/.netlify/functions/getMarketTrendSummary");
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Market trend read API did not return JSON.");
    }

    const payload = await readJsonResponse(response, "Market trend read API");
    if (!response.ok || !payload.ok) return;

    state.aiMarketTrendSummary = payload.summary || null;
    state.aiMarketTrendSources = Array.isArray(payload.sources) ? payload.sources : [];
  } catch {
    state.aiMarketTrendSummary = null;
    state.aiMarketTrendSources = [];
  }
}

function hydrateAiMarketTrendResult() {
  const resultEl = document.getElementById("ai-market-trend-result");
  if (!resultEl || !state.aiMarketTrendSummary) return;
  resultEl.innerHTML = renderAiMarketTrendResult(state.aiMarketTrendSummary, state.aiMarketTrendSources);
}

function friendlyAiTrendError(message) {
  if (message.includes("format could not be parsed") || message.includes("summary format was incomplete") || message.includes("invalid JSON")) {
    return t("status_ai_trend_format_incomplete");
  }
  return message || t("status_unknown_error");
}

async function readJsonResponse(response, label) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`${label} did not return JSON.`);
  }
  return await response.json();
}

function renderAiMarketTrendResult(summary, sources = []) {
  if (!summary) return "";

  const isDetailedSummary = Boolean(summary.marketOverview || summary.watchNext || summary.conservativeInvestorNotes);

  return `
    <div class="ai-market-radar-list">
      ${
        isDetailedSummary
          ? [
              detailedTrendItem(t("ai_radar_overview_title"), summary.marketOverview),
              detailedTrendItem(t("ai_radar_us_title"), summary.usMarket),
              detailedTrendItem(t("ai_radar_ca_title"), summary.canadaMarket),
              detailedTrendItem(t("ai_radar_risk_title"), summary.riskSignals),
              detailedTrendItem(t("ai_radar_watch_title"), summary.watchNext),
              detailedTrendItem(t("ai_radar_conservative_title"), summary.conservativeInvestorNotes),
            ].join("")
          : renderLegacyAiMarketTrendResult(summary)
      }
    </div>
    <div class="ai-market-source-status">
      <span>${escapeHtmlLocal(t("ai_trend_updated_at"))}: ${escapeHtmlLocal(formatAiTrendDate(summary.updatedAt))}</span>
      <span>${escapeHtmlLocal(t("ai_trend_sources"))}: ${sources.filter((source) => source.ok).length}/${sources.length}</span>
    </div>
  `;
}

function renderLegacyAiMarketTrendResult(summary) {
  const usRisks = summary.usMarket?.riskSignals || [];
  const canadaRisks = summary.canadaMarket?.riskSignals || [];
  const risks = [...usRisks, ...canadaRisks];

  return [
    marketTrendItem(t("ai_radar_us_title"), summary.usMarket),
    marketTrendItem(t("ai_radar_ca_title"), summary.canadaMarket),
    arrayTrendItem(t("ai_radar_risk_title"), risks),
    arrayTrendItem(t("ai_radar_watch_title"), summary.watchItems || []),
  ].join("");
}

function detailedTrendItem(title, block = {}) {
  const groups = [
    [t("ai_trend_facts"), block.facts || []],
    [t("ai_trend_judgment"), block.trendJudgment || []],
    [t("ai_trend_risks"), block.riskNotes || []],
  ];

  return `
    <article class="ai-market-radar-item">
      <strong>${escapeHtmlLocal(title)}</strong>
      ${block.summary ? `<p>${escapeHtmlLocal(block.summary)}</p>` : ""}
      ${groups.map(([label, items]) => trendGroup(label, items)).join("")}
    </article>
  `;
}

function trendGroup(label, items = []) {
  return `
    <div class="ai-market-radar-group">
      <span>${escapeHtmlLocal(label)}</span>
      ${
        items.length
          ? `<ul>${items.slice(0, 5).map((item) => `<li>${escapeHtmlLocal(item)}</li>`).join("")}</ul>`
          : `<p>${escapeHtmlLocal(t("ai_trend_no_data"))}</p>`
      }
    </div>
  `;
}

function marketTrendItem(title, block = {}) {
  const details = [
    block.direction ? `${t("ai_trend_direction")}: ${block.direction}` : "",
    ...(block.drivers || []).slice(0, 3),
    ...(block.leadingSectors || []).slice(0, 3),
  ].filter(Boolean);

  return `
    <article class="ai-market-radar-item">
      <strong>${escapeHtmlLocal(title)}</strong>
      <p>${escapeHtmlLocal(block.summary || t("ai_trend_no_data"))}</p>
      ${details.length ? `<ul>${details.map((item) => `<li>${escapeHtmlLocal(item)}</li>`).join("")}</ul>` : ""}
    </article>
  `;
}

function arrayTrendItem(title, items = []) {
  return `
    <article class="ai-market-radar-item">
      <strong>${escapeHtmlLocal(title)}</strong>
      ${
        items.length
          ? `<ul>${items.slice(0, 6).map((item) => `<li>${escapeHtmlLocal(item)}</li>`).join("")}</ul>`
          : `<p>${escapeHtmlLocal(t("ai_trend_no_data"))}</p>`
      }
    </article>
  `;
}

function formatAiTrendDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(getLang() === "zh" ? "zh-CN" : "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderSettings() {
  app.innerHTML = AppShell(`
    ${SettingsPage()}
  `, "settings", checkAuth());
  bindFirecrawlTest();
  bindGlobalActions();
}

function renderMarketPage(dashboard) {
  app.innerHTML = AppShell(`
    ${Header()}
    ${MarketSection(dashboard.marketData)}
    <footer class="footer">${t("footer_disclaimer")}</footer>
  `, "market", checkAuth());
  bindRefreshMarketButton();
  bindGlobalActions();
}

function renderNewsPage(dashboard) {
  app.innerHTML = AppShell(`
    ${Header()}
    ${LiveUpdatesPanel(dashboard.news)}
    <footer class="footer">${t("footer_disclaimer")}</footer>
  `, "news", checkAuth());
  bindRefreshNewsButton();
  bindGlobalActions();
}

function renderAlertsPage(dashboard) {
  app.innerHTML = AppShell(`
    ${Header()}
    ${AlertsPanel({ alerts: dashboard.alerts, holdingStatuses: dashboard.holdingStatuses })}
  `, "alerts", checkAuth());
  bindGlobalActions();
}

function renderMorningBriefPage(dashboard) {
  app.innerHTML = AppShell(`
    ${Header()}
    ${MorningBriefPanel(dashboard.morningBrief)}
  `, "morning-brief", checkAuth());
  bindSyncMorningBriefButton();
  bindGlobalActions();
}

function renderSharePage() {
  app.innerHTML = AppShell(`
    ${SharePage()}
  `, "share", checkAuth());
  bindShareActions();
  bindGlobalActions();
}

function bindShareActions() {
  const btn = document.getElementById("btn-copy-share-link");
  const statusEl = document.getElementById("share-copy-status");
  const linkEl = document.getElementById("share-url-text");
  if (!btn || !statusEl || !linkEl) return;

  btn.addEventListener("click", async () => {
    const shareUrl = linkEl.textContent.trim();
    try {
      await navigator.clipboard.writeText(shareUrl);
      statusEl.textContent = t("share_copy_success");
      statusEl.className = "news-refresh-status success";
    } catch {
      statusEl.textContent = t("share_copy_failed");
      statusEl.className = "news-refresh-status error";
    }
  });
}

function bindFirecrawlTest() {
  const form = document.getElementById("firecrawl-test-form");
  const input = document.getElementById("firecrawl-test-url");
  const btn = document.getElementById("firecrawl-test-btn");
  const statusEl = document.getElementById("firecrawl-test-status");
  const resultEl = document.getElementById("firecrawl-test-result");
  if (!form || !input || !btn || !statusEl || !resultEl) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    btn.disabled = true;
    statusEl.textContent = t("status_firecrawl_testing");
    statusEl.className = "news-refresh-status loading";
    resultEl.innerHTML = "";

    try {
      const response = await fetch("/.netlify/functions/firecrawlFetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.value.trim() }),
      });
      const payload = await readJsonResponse(response, "Firecrawl test API");

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      statusEl.textContent = t("status_firecrawl_complete");
      statusEl.className = "news-refresh-status success";
      resultEl.innerHTML = renderFirecrawlTestResult(payload);
    } catch (error) {
      statusEl.textContent = t("status_firecrawl_failed");
      statusEl.className = "news-refresh-status error";
      resultEl.innerHTML = `<div class="firecrawl-error">${escapeHtmlLocal(error.message || "Unknown error")}</div>`;
    } finally {
      btn.disabled = false;
    }
  });
}

function renderFirecrawlTestResult(payload) {
  const markdown = String(payload.markdown || "").slice(0, 2000);
  return `
    <div class="firecrawl-result-grid">
      <div>
        <span>title</span>
        <strong>${escapeHtmlLocal(payload.title || "—")}</strong>
      </div>
      <div>
        <span>sourceUrl</span>
        <strong>${escapeHtmlLocal(payload.sourceUrl || "—")}</strong>
      </div>
    </div>
    <pre class="firecrawl-markdown-preview">${escapeHtmlLocal(markdown || t("firecrawl_no_markdown"))}</pre>
  `;
}

function bindRefreshNewsButton() {
  const btn = document.getElementById("btn-refresh-news");
  const statusEl = document.getElementById("news-refresh-status");
  if (!btn || !statusEl) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    statusEl.textContent = t("status_refreshing_news");
    statusEl.className = "news-refresh-status loading";

    try {
      const result = await syncNewsFromSheet();
      const lang = getLang();
      statusEl.textContent = lang === "zh"
        ? `新闻同步完成：已读取 ${result.count} 条`
        : `News sync complete: ${result.count} rows loaded`;
      statusEl.className = "news-refresh-status success";

      const source = await loadDashboardSource();
      const dashboard = buildDashboardModel(source);
      renderDashboard(dashboard);
    } catch (err) {
      const msg = err.message || "";
      statusEl.textContent = t("status_refresh_failed") + msg;
      statusEl.className = "news-refresh-status error";
      btn.disabled = false;
    }
  });
}

function bindRefreshMarketButton() {
  const btn = document.getElementById("btn-refresh-market");
  const statusEl = document.getElementById("market-refresh-status");
  if (!btn || !statusEl) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    statusEl.textContent = t("status_refreshing_market");
    statusEl.className = "news-refresh-status loading";

    try {
      const result = await refreshMarketData();
      const lang = getLang();
      statusEl.textContent = lang === "zh"
        ? `行情已更新：更新 ${result.updated} 条，错误 ${result.errors} 条`
        : `Market updated: ${result.updated} updated, ${result.errors} errors`;
      statusEl.className = "news-refresh-status success";

      const source = await loadDashboardSource();
      const dashboard = buildDashboardModel(source);
      renderDashboard(dashboard);
    } catch (err) {
      const msg = err.message || "";
      statusEl.textContent = msg.includes("not set") || msg.includes("ALPHA_VANTAGE")
        ? t("status_alpha_missing")
        : t("status_refresh_failed") + msg;
      statusEl.className = "news-refresh-status error";
      btn.disabled = false;
    }
  });
}

function bindSyncMorningBriefButton() {
  const btn = document.getElementById("btn-sync-morning-brief");
  const statusEl = document.getElementById("morning-brief-sync-status");
  if (!btn || !statusEl) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    statusEl.textContent = t("status_syncing_morning_brief");
    statusEl.className = "news-refresh-status loading";

    try {
      const result = await syncMorningBrief();
      const lang = getLang();
      statusEl.textContent = lang === "zh"
        ? `晨报同步完成：新增 ${result.inserted} 条`
        : `Morning brief synced: ${result.inserted} inserted`;
      statusEl.className = "news-refresh-status success";

      const source = await loadDashboardSource();
      const dashboard = buildDashboardModel(source);
      renderDashboard(dashboard);
    } catch (err) {
      statusEl.textContent = t("status_refresh_failed") + (err.message || t("status_unknown_error"));
      statusEl.className = "news-refresh-status error";
      btn.disabled = false;
    }
  });
}

// ── Holdings ──────────────────────────────────────────────────────────────────

function renderHoldings() {
  const holdings = buildHoldingsModel(
    state.holdingsSource,
    state.holdingsFilter,
    state.selectedHoldingId
  );
  state.selectedHoldingId = holdings.selectedHolding
    ? holdings.selectedHolding["持仓ID / Holding ID"]
    : "";
  app.innerHTML = AppShell(HoldingsPage(holdings), "holdings", checkAuth());
  bindHoldingsInteractions();
  bindGlobalActions();
}

function bindHoldingsInteractions() {
  app.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.holdingsFilter = button.dataset.filter;
      state.selectedHoldingId = "";
      renderHoldings();
    });
  });

  app.querySelectorAll("[data-holding-id]").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedHoldingId = row.dataset.holdingId;
      renderHoldings();
    });
  });
}

// ── Watchlist ─────────────────────────────────────────────────────────────────

function renderWatchlist() {
  const model = buildWatchlistModel(state.watchlistSource);
  app.innerHTML = AppShell(WatchlistPage(model), "watchlist", checkAuth());
  bindWatchlistInteractions();
  bindGlobalActions();
}

function bindWatchlistInteractions() {
  app.querySelectorAll("[data-watch-id]").forEach((row) => {
    row.addEventListener("click", () => {
      openWatchlistPopup(row.dataset.watchId);
    });
  });

  const form = document.getElementById("watchlist-add-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const statusEl = document.getElementById("watchlist-add-status");
    const submitBtn = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    const payload = {
      owner:    String(formData.get("owner")    || "").trim(),
      ticker:   String(formData.get("ticker")   || "").trim(),
      name:     String(formData.get("name")     || "").trim(),
      type:     String(formData.get("type")     || "").trim(),
      sector:   String(formData.get("sector")   || "").trim(),
      priority: String(formData.get("priority") || "Medium").trim(),
      reason:   String(formData.get("reason")   || "").trim(),
    };

    if (!payload.owner || !payload.type || (!payload.ticker && !payload.name)) {
      if (statusEl) {
        statusEl.textContent = t("status_watchlist_validation");
        statusEl.className = "news-refresh-status error";
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = t("status_watchlist_writing");
      statusEl.className = "news-refresh-status loading";
    }

    try {
      const result = await addWatchItem(payload);
      if (statusEl) {
        const id = result.watchId || "";
        statusEl.textContent = `${t("status_watchlist_added")}: ${id || t("status_watchlist_new_record")}`;
        statusEl.className = "news-refresh-status success";
      }
      form.reset();
      const source = await loadWatchlistPageSource();
      state.watchlistSource = source;
      renderWatchlist();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = t("status_watchlist_pending");
        statusEl.className = "news-refresh-status";
      }
      console.warn(err);
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function openWatchlistPopup(id) {
  if (!id || !state.watchlistSource) return;

  const model = buildWatchlistModel(state.watchlistSource, id);
  if (!model.popupData) return;

  document.getElementById("watchlist-popup-overlay")?.remove();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = WatchlistPopupHtml(model.popupData);
  const overlay = wrapper.firstElementChild;
  document.body.appendChild(overlay);

  overlay.querySelector(".popup-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });

  const addDecisionBtn = overlay.querySelector("#btn-popup-add-decision");
  if (addDecisionBtn) {
    addDecisionBtn.addEventListener("click", () => {
      window._decisionPrefill = {
        ticker:         addDecisionBtn.dataset.ticker  || "",
        name:           addDecisionBtn.dataset.name    || "",
        owner:          addDecisionBtn.dataset.owner   || "",
        assetType:      addDecisionBtn.dataset.type    || "",
        relatedWatchId: addDecisionBtn.dataset.watchId || "",
        referenceInfo:  "From Watchlist Quick Research",
      };
      overlay.remove();
      window.location.hash = "#/decisions";
    });
  }

  const onKey = (event) => {
    if (event.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

// ── Stock Analysis ────────────────────────────────────────────────────────────

function renderStockAnalysis() {
  app.innerHTML = AppShell(StockAnalysisPage(state.stockAnalysisSource ?? [], checkAuth()), "stock-analysis", checkAuth());
  bindStockAnalysisInteractions();
  bindGlobalActions();
}

function bindStockAnalysisInteractions() {
  bindStockDetailSelection();

  const btn = document.getElementById("btn-refresh-stock-analysis");
  const statusEl = document.getElementById("stock-refresh-status");
  if (!btn || !statusEl) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    statusEl.textContent = t("status_refreshing_stock");
    statusEl.className = "news-refresh-status loading";

    try {
      const result = await refreshStockAnalysis(getAdminToken());
      state.stockAnalysisSource = await loadStockAnalysisPageSource();
      renderStockAnalysis();
      const nextStatusEl = document.getElementById("stock-refresh-status");
      if (nextStatusEl) {
        nextStatusEl.textContent = `${t("status_stock_refreshed")} ${result.updatedRows || 0} · ${formatAiTrendDate(result.updatedAt)}`;
        nextStatusEl.className = "news-refresh-status success";
      }
    } catch (err) {
      statusEl.textContent = t("status_refresh_failed") + (err.message || t("status_unknown_error"));
      statusEl.className = "news-refresh-status error";
      btn.disabled = false;
    }
  });
}

function bindStockDetailSelection() {
  const listItems = Array.from(document.querySelectorAll("[data-stock-detail-target]"));
  const panels = Array.from(document.querySelectorAll("[data-stock-detail-panel]"));
  if (!listItems.length || !panels.length) return;

  listItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-stock-detail-target");
      listItems.forEach((button) => button.classList.toggle("active", button === item));
      panels.forEach((panel) => {
        const active = panel.getAttribute("data-stock-detail-panel") === target;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
      });
    });
  });
}

// ── Decision Log ──────────────────────────────────────────────────────────────

function renderDecisionLog() {
  const model = buildDecisionLogModel(state.decisionLogSource ?? { decisions: [] }, state.decisionLogFilter);
  app.innerHTML = AppShell(DecisionLogPage(model), "decisions", checkAuth());
  bindDecisionLogInteractions();
  bindGlobalActions();

  // Apply prefill from Watchlist popup if available
  if (window._decisionPrefill) {
    const p = window._decisionPrefill;
    window._decisionPrefill = null;
    const form = document.getElementById("dl-add-form");
    if (form) {
      if (p.owner)          { const s = form.querySelector('[name="owner"]');           if (s) s.value = p.owner; }
      if (p.ticker)         { const f = form.querySelector('[name="ticker"]');          if (f) f.value = p.ticker; }
      if (p.name)           { const f = form.querySelector('[name="name"]');            if (f) f.value = p.name; }
      if (p.assetType)      { const s = form.querySelector('[name="assetType"]');       if (s) s.value = p.assetType; }
      if (p.relatedWatchId) { const f = form.querySelector('[name="relatedWatchId"]');  if (f) f.value = p.relatedWatchId; }
      if (p.referenceInfo)  { const f = form.querySelector('[name="referenceInfo"]');   if (f) f.value = p.referenceInfo; }
    }
  }
}

function bindDecisionLogInteractions() {
  app.querySelectorAll("[data-dl-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.decisionLogFilter = btn.dataset.dlFilter;
      renderDecisionLog();
    });
  });

  const form = document.getElementById("dl-add-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const statusEl  = document.getElementById("dl-add-status");
    const submitBtn = form.querySelector("button[type='submit']");
    const data      = new FormData(form);

    const payload = {
      date:             String(data.get("date")             || "").trim(),
      owner:            String(data.get("owner")            || "").trim(),
      accountType:      String(data.get("accountType")      || "").trim(),
      ticker:           String(data.get("ticker")           || "").trim(),
      name:             String(data.get("name")             || "").trim(),
      assetType:        String(data.get("assetType")        || "").trim(),
      actionType:       String(data.get("actionType")       || "").trim(),
      decisionStatus:   String(data.get("decisionStatus")   || "").trim(),
      amount:           String(data.get("amount")           || "").trim(),
      quantity:         String(data.get("quantity")         || "").trim(),
      price:            String(data.get("price")            || "").trim(),
      cost:             String(data.get("cost")             || "").trim(),
      decisionReason:   String(data.get("decisionReason")   || "").trim(),
      referenceInfo:    String(data.get("referenceInfo")    || "").trim(),
      riskLevel:        String(data.get("riskLevel")        || "").trim(),
      relatedWatchId:   String(data.get("relatedWatchId")   || "").trim(),
      relatedHoldingId: String(data.get("relatedHoldingId") || "").trim(),
      reviewNotes:      String(data.get("reviewNotes")      || "").trim(),
    };

    if (!payload.date || !payload.owner || !payload.actionType || (!payload.ticker && !payload.name)) {
      if (statusEl) {
        statusEl.textContent = t("status_decision_validation");
        statusEl.className = "news-refresh-status error";
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = t("status_decision_writing");
      statusEl.className = "news-refresh-status loading";
    }

    try {
      const result = await addDecisionLog(payload);
      if (statusEl) {
        const lang = getLang();
        statusEl.textContent = lang === "zh"
          ? `已新增决策记录 ${result.decisionId || ""}`
          : `Decision record added ${result.decisionId || ""}`;
        statusEl.className = "news-refresh-status success";
      }
      form.reset();
      state.decisionLogFilter = "all";
      const source = await loadDecisionLogPageSource();
      state.decisionLogSource = source;
      renderDecisionLog();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = t("status_decision_failed") + (err.message || t("status_unknown_error"));
        statusEl.className = "news-refresh-status error";
      }
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ── URL Routing ───────────────────────────────────────────────────────────────

function getPageFromUrl() {
  if (window.location.hash === "#/" || window.location.hash === "#") return "dashboard";
  if (window.location.pathname.includes("/holdings"))  return "holdings";
  if (window.location.pathname.includes("/watchlist")) return "watchlist";
  if (window.location.pathname.includes("/decisions")) return "decisions";
  const hashPage = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (hashPage === "holdings")  return "holdings";
  if (hashPage === "watchlist") return "watchlist";
  if (hashPage === "decisions") return "decisions";
  if (hashPage === "stock-analysis") return "stock-analysis";
  if (hashPage === "settings") return "settings";
  if (hashPage === "market") return "market";
  if (hashPage === "news") return "news";
  if (hashPage === "alerts") return "alerts";
  if (hashPage === "morning-brief") return "morning-brief";
  if (hashPage === "share") return "share";
  return "dashboard";
}

function isAdminRoute(page) {
  return ["morning-brief", "holdings", "watchlist", "decisions", "settings"].includes(page);
}

function escapeHtmlLocal(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.addEventListener("hashchange", () => {
  if (!checkAuth()) {
    const targetPage = getPageFromUrl();
    if (isAdminRoute(targetPage)) {
      window.location.hash = "#/dashboard";
      showPasswordGate();
      return;
    }
  }
  document.getElementById("watchlist-popup-overlay")?.remove();
  app.innerHTML = LoadingState(checkAuth());
  renderCurrentPage().catch((error) => {
    app.innerHTML = ErrorState(error, checkAuth());
    console.error(error);
    bindGlobalActions();
  });
});

bootstrap();
