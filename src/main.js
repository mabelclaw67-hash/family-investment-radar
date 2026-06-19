import {
  addDecisionLog,
  addWatchItem,
  archiveDecisionLog,
  archiveWatchItem,
  loadDashboardSource,
  loadDecisionLogPageSource,
  loadHoldingsPageSource,
  loadStockAnalysisPageSource,
  loadWatchlistPageSource,
  refreshMarketData,
  syncNewsFromSheet,
  syncMorningBrief,
  refreshStockAnalysis,
  updateDecisionLog,
  updateWatchItem,
} from "./data/googleSheets.js";
import { buildDashboardModel, get } from "./data/dashboardMapper.js";
import { buildHoldingsModel } from "./data/holdingsMapper.js";
import { buildWatchlistModel } from "./data/watchlistMapper.js";
import { buildDecisionLogModel } from "./data/decisionLogMapper.js";
import {
  AlertsPanel,
  AppShell,
  BuffettMottoBanner,
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
  StockLookupPage,
  StockCandidateList,
  StockDetailCard,
  ForumPage,
  ForumTopicList,
  ForumTopicDetail,
  ForumAdminPage,
  ForumAdminTopicRows,
  ForumAdminReplyRows,
  WatchlistPage,
  WatchlistPopupHtml,
} from "./components.js";
import { t, getLang, setLang } from "./i18n.js";

const app = document.querySelector("#app");
const AUTH_KEY = "fir_auth_v2";
const ADMIN_TOKEN_KEY = "fir_admin_token_v1";
let globalActionsBound = false;

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
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = t("pw_verifying");
    }
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
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = t("pw_submit");
      }
    }
  });
}

async function verifyAdminPassword(password) {
  try {
    const cleanPassword = String(password || "").trim();
    const response = await fetch("/.netlify/functions/verifyAdminPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: cleanPassword }),
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
  if (!globalActionsBound) {
    document.addEventListener("click", (event) => {
      const actionEl = event.target instanceof Element ? event.target.closest("[data-action]") : null;
      if (!actionEl || (!app.contains(actionEl) && !actionEl.closest("#admin-login-overlay"))) return;

      if (actionEl.dataset.action === "adminLogin") {
        event.preventDefault();
        showPasswordGate();
        return;
      }

      if (actionEl.dataset.action !== "logout") return;
      event.preventDefault();
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.hash = "#/dashboard";
      renderCurrentPage().catch((error) => {
        app.innerHTML = ErrorState(error, checkAuth());
        console.error(error);
        bindGlobalActions();
      });
    });
    globalActionsBound = true;
  }

  document.querySelectorAll("[data-action='adminLogin']").forEach((btn) => {
    if (btn.dataset.boundAdminLogin) return;
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      showPasswordGate();
    });
    btn.dataset.boundAdminLogin = "true";
  });

  document.querySelectorAll("[data-action='logout']").forEach((btn) => {
    if (btn.dataset.boundLogout) return;
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.hash = "#/dashboard";
      renderCurrentPage().catch((error) => {
        app.innerHTML = ErrorState(error, checkAuth());
        console.error(error);
        bindGlobalActions();
      });
    });
    btn.dataset.boundLogout = "true";
  });

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
  editingWatchId: "",
  editingDecisionId: "",
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

  if (state.page === "stock-lookup") {
    renderStockLookup();
    return;
  }

  if (state.page === "forum") {
    renderForum();
    return;
  }

  if (state.page === "forum-admin") {
    renderForumAdmin();
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
    ${BuffettMottoBanner()}
    ${checkAuth() ? KpiCards(dashboard.kpis) : ""}
    ${MarketSection(dashboard.marketData)}
    ${StockRadarHomeEntry()}
    <section class="dashboard-grid">
      ${LiveUpdatesPanel(dashboard.news)}
      ${AiMarketRadarPanel(state.aiMarketTrendSummary, state.aiMarketTrendSources, checkAuth())}
    </section>
    <footer class="footer">
      ${t("footer_disclaimer")}
    </footer>
  `, "dashboard", checkAuth());
  bindRefreshNewsButton();
  bindRefreshMarketButton();
  bindAiMarketTrendButton();
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

function bindAiMarketTrendButton() {
  const btn = document.getElementById("btn-update-ai-market-trend");
  const statusEl = document.getElementById("ai-market-trend-status");
  const resultEl = document.getElementById("ai-market-trend-result");
  if (!btn || !statusEl || !resultEl) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    statusEl.textContent = t("status_ai_trend_loading");
    statusEl.className = "news-refresh-status loading";

    try {
      const response = await fetch("/.netlify/functions/generateMarketTrendSummary", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getAdminToken()}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const payload = await readJsonResponse(response, "AI market trend update API");

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      state.aiMarketTrendSummary = payload.summary || null;
      state.aiMarketTrendSources = Array.isArray(payload.sources) ? payload.sources : [];
      statusEl.textContent = payload.saved === false
        ? t("status_ai_trend_save_failed")
        : t("status_ai_trend_saved");
      statusEl.className = payload.saved === false
        ? "news-refresh-status error"
        : "news-refresh-status success";
      resultEl.innerHTML = renderAiMarketTrendResult(state.aiMarketTrendSummary, state.aiMarketTrendSources);
    } catch (error) {
      statusEl.textContent = t("status_ai_trend_failed");
      statusEl.className = "news-refresh-status error";
      resultEl.innerHTML = `<div class="firecrawl-error">${escapeHtmlLocal(friendlyAiTrendError(error.message || ""))}</div>`;
    } finally {
      btn.disabled = false;
    }
  });
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

const STOCK_LAST_KEY = "fir_stock_last_v1";

function renderStockLookup() {
  app.innerHTML = AppShell(`
    ${StockLookupPage()}
  `, "stock-lookup", checkAuth());
  bindStockLookup();
  bindGlobalActions();
  // Small UX helper: keep the last result visible across a page refresh.
  // (The reusable cache of record is 16 Public Stock Cache; this is display-only.)
  try {
    const saved = JSON.parse(localStorage.getItem(STOCK_LAST_KEY) || "null");
    if (saved && saved.symbol) {
      const resultEl = document.getElementById("stock-lookup-result");
      const input = document.getElementById("stock-lookup-input");
      if (resultEl) resultEl.innerHTML = StockDetailCard(saved);
      if (input && !input.value) input.value = saved.symbol;
    }
  } catch {}
}

function bindStockLookup() {
  const form = document.getElementById("stock-lookup-form");
  const input = document.getElementById("stock-lookup-input");
  const statusEl = document.getElementById("stock-lookup-status");
  const resultEl = document.getElementById("stock-lookup-result");
  if (!form || !input || !resultEl) return;

  const setStatus = (text, kind = "") => {
    if (statusEl) {
      statusEl.textContent = text || "";
      statusEl.className = `news-refresh-status${kind ? " " + kind : ""}`;
    }
  };

  async function call(payload) {
    const response = await fetch("/.netlify/functions/publicStockSearch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(payload),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(t("stock_lookup_error"));
    }
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || t("stock_lookup_error"));
    }
    return data;
  }

  async function loadDetail(symbol, refresh = false) {
    setStatus(t("stock_lookup_loading"), "loading");
    if (!refresh) resultEl.innerHTML = "";
    try {
      const data = await call({ action: "quote", symbol, lang: getLang(), refresh });
      if (data.type === "detail" && data.data) {
        resultEl.innerHTML = StockDetailCard(data.data);
        try { localStorage.setItem(STOCK_LAST_KEY, JSON.stringify(data.data)); } catch {}
        setStatus("");
      } else {
        resultEl.innerHTML = `<div class="popup-empty"><strong>${t("stock_lookup_none")}</strong></div>`;
        setStatus("");
      }
    } catch (error) {
      setStatus(error.message || t("stock_lookup_error"), "error");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    setStatus(t("stock_lookup_loading"), "loading");
    resultEl.innerHTML = "";
    try {
      const data = await call({ action: "search", query });
      if (data.type === "private") {
        resultEl.innerHTML = `<div class="popup-empty"><strong>${t("stock_lookup_private")}</strong></div>`;
        setStatus("");
      } else if (data.type === "none" || !Array.isArray(data.candidates) || !data.candidates.length) {
        resultEl.innerHTML = `<div class="popup-empty"><strong>${t("stock_lookup_none")}</strong></div>`;
        setStatus("");
      } else if (data.candidates.length === 1) {
        await loadDetail(data.candidates[0].symbol);
      } else {
        resultEl.innerHTML = StockCandidateList(data.candidates);
        setStatus("");
      }
    } catch (error) {
      setStatus(error.message || t("stock_lookup_error"), "error");
    }
  });

  resultEl.addEventListener("click", (event) => {
    const candidate = event.target.closest(".stock-candidate");
    if (candidate) {
      const symbol = candidate.getAttribute("data-symbol");
      if (symbol) loadDetail(symbol);
      return;
    }
    const refreshBtn = event.target.closest("[data-stock-refresh]");
    if (refreshBtn) {
      const symbol = refreshBtn.getAttribute("data-stock-refresh");
      if (symbol) loadDetail(symbol, true);
    }
  });
}

// ── Public Forum ("大家在关注") ──────────────────────────────────────────────

let forumTopicsCache = [];

async function forumApi(path, options = {}) {
  const response = await fetch(`/.netlify/functions/${path}`, {
    cache: "no-store",
    ...options,
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error(t("forum_error"));
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || t("forum_error"));
  return data;
}

function readAntiBot(form) {
  return {
    antiBotAnswer: (form.querySelector(".forum-antibot")?.value || "").trim(),
    honeypot: (form.querySelector(".forum-honeypot")?.value || "").trim(),
  };
}

function renderForum() {
  app.innerHTML = AppShell(`${ForumPage()}`, "forum", checkAuth());
  bindForum();
  bindGlobalActions();
  loadForumTopics();
}

async function loadForumTopics() {
  const root = document.getElementById("forum-root");
  if (!root) return;
  try {
    const data = await forumApi("listPublicTopics");
    forumTopicsCache = data.topics || [];
    root.innerHTML = ForumTopicList(forumTopicsCache);
  } catch (error) {
    root.innerHTML = `<div class="popup-empty"><strong>${error.message || t("forum_error")}</strong></div>`;
  }
}

async function openForumTopic(topicId) {
  const root = document.getElementById("forum-root");
  if (!root) return;
  const topic = forumTopicsCache.find((tp) => tp.id === topicId);
  if (!topic) return loadForumTopics();
  root.innerHTML = `<div class="forum-loading">${t("forum_loading")}</div>`;
  try {
    const data = await forumApi(`listPublicReplies?topicId=${encodeURIComponent(topicId)}`);
    root.innerHTML = ForumTopicDetail(topic, data.replies || []);
  } catch (error) {
    root.innerHTML = `<div class="popup-empty"><strong>${error.message || t("forum_error")}</strong></div>`;
  }
}

function bindForum() {
  const topicForm = document.getElementById("forum-topic-form");
  const root = document.getElementById("forum-root");

  if (topicForm) {
    topicForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const statusEl = document.getElementById("forum-topic-status");
      const fd = new FormData(topicForm);
      const payload = {
        nickname: String(fd.get("nickname") || "").trim(),
        ticker: String(fd.get("ticker") || "").trim(),
        title: String(fd.get("title") || "").trim(),
        content: String(fd.get("content") || "").trim(),
        ...readAntiBot(topicForm),
      };
      const btn = topicForm.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      if (statusEl) { statusEl.textContent = t("forum_submitting"); statusEl.className = "news-refresh-status loading"; }
      try {
        await forumApi("submitPublicTopic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        topicForm.reset();
        if (statusEl) { statusEl.textContent = t("forum_post_success"); statusEl.className = "news-refresh-status success"; }
        await loadForumTopics();
      } catch (error) {
        if (statusEl) { statusEl.textContent = error.message || t("forum_error"); statusEl.className = "news-refresh-status error"; }
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  if (root) {
    root.addEventListener("click", async (event) => {
      const card = event.target.closest(".forum-topic-card");
      if (card) { openForumTopic(card.getAttribute("data-topic-id")); return; }
      if (event.target.closest("#forum-back")) { loadForumTopics(); return; }
    });

    root.addEventListener("submit", async (event) => {
      const form = event.target.closest("#forum-reply-form");
      if (!form) return;
      event.preventDefault();
      const statusEl = document.getElementById("forum-reply-status");
      const fd = new FormData(form);
      const payload = {
        topicId: form.getAttribute("data-topic-id"),
        nickname: String(fd.get("nickname") || "").trim(),
        content: String(fd.get("content") || "").trim(),
        ...readAntiBot(form),
      };
      const btn = form.querySelector("button[type=submit]");
      if (btn) btn.disabled = true;
      if (statusEl) { statusEl.textContent = t("forum_submitting"); statusEl.className = "news-refresh-status loading"; }
      try {
        await forumApi("submitPublicReply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (statusEl) { statusEl.textContent = t("forum_post_success"); statusEl.className = "news-refresh-status success"; }
        await openForumTopic(payload.topicId);
      } catch (error) {
        if (statusEl) { statusEl.textContent = error.message || t("forum_error"); statusEl.className = "news-refresh-status error"; }
        if (btn) btn.disabled = false;
      }
    });
  }
}

// ── Forum Admin ──────────────────────────────────────────────────────────────

function renderForumAdmin() {
  app.innerHTML = AppShell(`${ForumAdminPage()}`, "forum-admin", checkAuth());
  bindForumAdmin();
  bindGlobalActions();
  loadForumAdmin();
}

async function adminForumApi(action, extra = {}) {
  const response = await fetch("/.netlify/functions/adminPublicForum", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sessionStorage.getItem("fir_admin_token_v1") || ""}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ action, ...extra }),
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new Error(t("forum_error"));
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || t("forum_error"));
  return data;
}

async function loadForumAdmin() {
  const topicsEl = document.getElementById("forum-admin-topics");
  const repliesEl = document.getElementById("forum-admin-replies");
  try {
    const topics = await adminForumApi("listTopics");
    if (topicsEl) topicsEl.innerHTML = ForumAdminTopicRows(topics.topics || []);
  } catch (error) {
    if (topicsEl) topicsEl.innerHTML = `<div class="popup-empty"><strong>${error.message}</strong></div>`;
  }
  try {
    const replies = await adminForumApi("listReplies");
    if (repliesEl) repliesEl.innerHTML = ForumAdminReplyRows(replies.replies || []);
  } catch (error) {
    if (repliesEl) repliesEl.innerHTML = `<div class="popup-empty"><strong>${error.message}</strong></div>`;
  }
}

function bindForumAdmin() {
  const STATUS_MAP = { hide: "Hidden", publish: "Published", delete: "Deleted" };
  document.querySelector(".main")?.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-forum-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-forum-action");
    const kind = btn.getAttribute("data-kind");
    const id = btn.getAttribute("data-id");
    const status = STATUS_MAP[action];
    if (!status || !id) return;
    btn.disabled = true;
    try {
      await adminForumApi(kind === "topic" ? "updateTopicStatus" : "updateReplyStatus", { id, status });
      await loadForumAdmin();
    } catch (error) {
      btn.disabled = false;
      alert(error.message || t("forum_error"));
    }
  });
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
  app.querySelectorAll("[data-watch-edit]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      startWatchlistEdit(button.dataset.watchEdit || "");
    });
  });

  app.querySelectorAll("[data-watch-delete]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await archiveWatchlistRecord(button.dataset.watchDelete || "");
    });
  });

  app.querySelectorAll("[data-watch-id]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("[data-watch-edit], [data-watch-delete]")) return;
      openWatchlistPopup(row.dataset.watchId);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openWatchlistPopup(row.dataset.watchId);
    });
  });

  const form = document.getElementById("watchlist-add-form");
  if (!form) return;

  document.getElementById("watchlist-edit-cancel")?.addEventListener("click", () => {
    state.editingWatchId = "";
    form.reset();
    resetWatchlistSubmitState();
  });

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
      statusEl.textContent = state.editingWatchId ? t("status_watchlist_updating") : t("status_watchlist_writing");
      statusEl.className = "news-refresh-status loading";
    }

    try {
      const result = state.editingWatchId
        ? await updateWatchItem({ ...payload, watchId: state.editingWatchId })
        : await addWatchItem(payload);
      if (statusEl) {
        const id = result.watchId || "";
        statusEl.textContent = state.editingWatchId
          ? `${t("status_watchlist_updated")}: ${id}`
          : `${t("status_watchlist_added")}: ${id || t("status_watchlist_new_record")}`;
        statusEl.className = "news-refresh-status success";
      }
      state.editingWatchId = "";
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

function startWatchlistEdit(watchId) {
  if (!watchId || !state.watchlistSource) return;
  const row = (state.watchlistSource.watchlist ?? []).find((item) =>
    (get(item, "观察ID / Watch ID") || get(item, "代码 / Ticker")) === watchId
  );
  const form = document.getElementById("watchlist-add-form");
  if (!row || !form) return;

  state.editingWatchId = watchId;
  setFormValue(form, "owner", get(row, "所属人 / Owner"));
  setFormValue(form, "ticker", get(row, "代码 / Ticker"));
  setFormValue(form, "name", get(row, "名称 / Name"));
  setFormValue(form, "type", get(row, "类型 / Type"));
  setFormValue(form, "sector", get(row, "板块 / Sector"));
  setFormValue(form, "priority", get(row, "关注级别 / Watch Priority") || "Medium");
  setFormValue(form, "reason", get(row, "观察原因 / Watch Reason"));
  const submitBtn = form.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.textContent = t("btn_edit");
  const cancelBtn = document.getElementById("watchlist-edit-cancel");
  if (cancelBtn) cancelBtn.hidden = false;
  const statusEl = document.getElementById("watchlist-add-status");
  if (statusEl) {
    statusEl.textContent = watchId;
    statusEl.className = "news-refresh-status";
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function archiveWatchlistRecord(watchId) {
  if (!watchId) return;
  const message = getLang() === "zh"
    ? `确定删除观察项目 ${watchId} 吗？记录会归档，不会从 Google Sheet 物理删除。`
    : `Delete watchlist item ${watchId}? The row will be archived, not physically removed from Google Sheet.`;
  if (!window.confirm(message)) return;

  const statusEl = document.getElementById("watchlist-add-status");
  if (statusEl) {
    statusEl.textContent = t("status_watchlist_archiving");
    statusEl.className = "news-refresh-status loading";
  }
  try {
    await archiveWatchItem(watchId);
    state.editingWatchId = "";
    state.watchlistSource = await loadWatchlistPageSource();
    renderWatchlist();
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = t("status_decision_failed") + (err.message || t("status_unknown_error"));
      statusEl.className = "news-refresh-status error";
    }
  }
}

function resetWatchlistSubmitState() {
  const submitBtn = document.querySelector("#watchlist-add-form button[type='submit']");
  if (submitBtn) submitBtn.textContent = t("btn_add_watchlist");
  const cancelBtn = document.getElementById("watchlist-edit-cancel");
  if (cancelBtn) cancelBtn.hidden = true;
  const statusEl = document.getElementById("watchlist-add-status");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.className = "news-refresh-status";
  }
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

  document.querySelectorAll("[data-stock-back-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-stock-back-target");
      const listItem = listItems.find((item) => item.getAttribute("data-stock-detail-target") === target);
      listItem?.scrollIntoView({ behavior: "smooth", block: "center" });
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
  app.querySelectorAll("[data-dl-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      startDecisionEdit(button.dataset.dlEdit || "");
    });
  });

  app.querySelectorAll("[data-dl-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await archiveDecisionRecord(button.dataset.dlDelete || "");
    });
  });

  app.querySelectorAll("[data-dl-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.decisionLogFilter = btn.dataset.dlFilter;
      renderDecisionLog();
    });
  });

  const form = document.getElementById("dl-add-form");
  if (!form) return;

  document.getElementById("dl-edit-cancel")?.addEventListener("click", () => {
    state.editingDecisionId = "";
    form.reset();
    resetDecisionSubmitState();
  });

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
      statusEl.textContent = state.editingDecisionId ? t("status_decision_updating") : t("status_decision_writing");
      statusEl.className = "news-refresh-status loading";
    }

    try {
      const result = state.editingDecisionId
        ? await updateDecisionLog({ ...payload, decisionId: state.editingDecisionId })
        : await addDecisionLog(payload);
      if (statusEl) {
        const lang = getLang();
        statusEl.textContent = state.editingDecisionId
          ? `${t("status_decision_updated")} ${result.decisionId || ""}`
          : lang === "zh"
            ? `已新增决策记录 ${result.decisionId || ""}`
            : `Decision record added ${result.decisionId || ""}`;
        statusEl.className = "news-refresh-status success";
      }
      state.editingDecisionId = "";
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

function startDecisionEdit(decisionId) {
  if (!decisionId || !state.decisionLogSource) return;
  const row = (state.decisionLogSource.decisions ?? []).find((item) =>
    get(item, "决策ID / Decision ID") === decisionId
  );
  const form = document.getElementById("dl-add-form");
  if (!row || !form) return;

  state.editingDecisionId = decisionId;
  setFormValue(form, "date", get(row, "日期 / Date"));
  setFormValue(form, "owner", get(row, "所属人 / Owner"));
  setFormValue(form, "accountType", get(row, "账户类型 / Account Type"));
  setFormValue(form, "ticker", get(row, "代码 / Ticker"));
  setFormValue(form, "name", get(row, "名称 / Name"));
  setFormValue(form, "assetType", get(row, "资产类型 / Asset Type"));
  setFormValue(form, "actionType", get(row, "操作类型 / Action Type"));
  setFormValue(form, "decisionStatus", get(row, "决策状态 / Decision Status"));
  setFormValue(form, "amount", get(row, "金额 / Amount"));
  setFormValue(form, "quantity", get(row, "数量 / Quantity"));
  setFormValue(form, "price", get(row, "单价 / Price"));
  setFormValue(form, "cost", get(row, "成本 / Cost"));
  setFormValue(form, "decisionReason", get(row, "决策原因 / Decision Reason"));
  setFormValue(form, "referenceInfo", get(row, "参考信息 / Reference Info"));
  setFormValue(form, "riskLevel", get(row, "风险等级 / Risk Level"));
  setFormValue(form, "relatedWatchId", get(row, "关联观察ID / Related Watch ID"));
  setFormValue(form, "relatedHoldingId", get(row, "关联持仓ID / Related Holding ID"));
  setFormValue(form, "reviewNotes", get(row, "复盘备注 / Review Notes"));
  const submitBtn = form.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.textContent = t("btn_edit");
  const cancelBtn = document.getElementById("dl-edit-cancel");
  if (cancelBtn) cancelBtn.hidden = false;
  const statusEl = document.getElementById("dl-add-status");
  if (statusEl) {
    statusEl.textContent = decisionId;
    statusEl.className = "news-refresh-status";
  }
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function archiveDecisionRecord(decisionId) {
  if (!decisionId) return;
  const message = getLang() === "zh"
    ? `确定删除决策记录 ${decisionId} 吗？记录会归档，不会从 Google Sheet 物理删除。`
    : `Delete decision record ${decisionId}? The row will be archived, not physically removed from Google Sheet.`;
  if (!window.confirm(message)) return;

  const statusEl = document.getElementById("dl-add-status");
  if (statusEl) {
    statusEl.textContent = t("status_decision_archiving");
    statusEl.className = "news-refresh-status loading";
  }
  try {
    await archiveDecisionLog(decisionId);
    state.editingDecisionId = "";
    state.decisionLogSource = await loadDecisionLogPageSource();
    renderDecisionLog();
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = t("status_decision_failed") + (err.message || t("status_unknown_error"));
      statusEl.className = "news-refresh-status error";
    }
  }
}

function resetDecisionSubmitState() {
  const submitBtn = document.querySelector("#dl-add-form button[type='submit']");
  if (submitBtn) submitBtn.textContent = t("btn_add_decision_log");
  const cancelBtn = document.getElementById("dl-edit-cancel");
  if (cancelBtn) cancelBtn.hidden = true;
  const statusEl = document.getElementById("dl-add-status");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.className = "news-refresh-status";
  }
}

function setFormValue(form, name, value) {
  const field = form.querySelector(`[name="${name}"]`);
  if (!field) return;
  field.value = value ?? "";
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
  if (hashPage === "stock-lookup") return "stock-lookup";
  if (hashPage === "forum") return "forum";
  if (hashPage === "forum-admin") return "forum-admin";
  if (hashPage === "settings") return "settings";
  if (hashPage === "market") return "market";
  if (hashPage === "news") return "news";
  if (hashPage === "alerts") return "alerts";
  if (hashPage === "morning-brief") return "morning-brief";
  if (hashPage === "share") return "share";
  return "dashboard";
}

function isAdminRoute(page) {
  return ["morning-brief", "holdings", "watchlist", "decisions", "settings", "forum-admin"].includes(page);
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
