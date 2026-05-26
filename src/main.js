import {
  addDecisionLog,
  addWatchItem,
  loadDashboardSource,
  loadDecisionLogPageSource,
  loadHoldingsPageSource,
  loadWatchlistPageSource,
  refreshMarketData,
  refreshNews,
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
  SummaryCards,
  WatchlistPage,
  WatchlistPopupHtml,
} from "./components.js";
import { SITE_PASSWORD } from "./config.js";
import { t, getLang, setLang } from "./i18n.js";

const app = document.querySelector("#app");
const AUTH_KEY = "fir_auth_v2";

// ── Password Gate ─────────────────────────────────────────────────────────────

function checkAuth() {
  return sessionStorage.getItem(AUTH_KEY) === "ok";
}

function showPasswordGate() {
  app.innerHTML = `
    <div class="pw-gate-wrapper">
      <div class="pw-gate-box">
        <div class="pw-brand">◎</div>
        <h2 class="pw-title">${t("pw_title")}</h2>
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
      </div>
    </div>
  `;

  document.getElementById("pw-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = document.getElementById("pw-input").value;
    if (val === SITE_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "ok");
      bootstrap();
    } else {
      const errEl = document.getElementById("pw-error");
      errEl.hidden = false;
      document.getElementById("pw-input").value = "";
      document.getElementById("pw-input").focus();
    }
  });
}

function bindGlobalActions() {
  // Logout
  const logoutBtn = document.querySelector("[data-action='logout']");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      showPasswordGate();
    });
  }

  // Language toggle
  const langBtn = document.querySelector("[data-action='toggleLang']");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const newLang = getLang() === "en" ? "zh" : "en";
      setLang(newLang);
      // Update document language attribute
      document.documentElement.lang = newLang === "zh" ? "zh-CN" : "en";
      // Re-render current page with new language
      app.innerHTML = LoadingState();
      renderCurrentPage().catch((error) => {
        app.innerHTML = ErrorState(error);
        console.error(error);
        bindGlobalActions();
      });
    });
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  page: getPageFromUrl(),
  holdingsFilter: "all",
  selectedHoldingId: "",
  holdingsSource: null,
  watchlistSource: null,
  decisionLogSource: null,
  decisionLogFilter: "all",
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  if (!checkAuth()) {
    showPasswordGate();
    return;
  }

  // Apply stored language preference to document
  document.documentElement.lang = getLang() === "zh" ? "zh-CN" : "en";

  app.innerHTML = LoadingState();

  try {
    await renderCurrentPage();
  } catch (error) {
    app.innerHTML = ErrorState(error);
    console.error(error);
    bindGlobalActions();
  }
}

// ── Page Routing ──────────────────────────────────────────────────────────────

async function renderCurrentPage() {
  state.page = getPageFromUrl();

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

  const source = await loadDashboardSource();
  const dashboard = buildDashboardModel(source);
  renderDashboard(dashboard);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function renderDashboard(dashboard) {
  app.innerHTML = AppShell(`
    ${Header()}
    ${KpiCards(dashboard.kpis)}
    ${MarketSection(dashboard.marketData)}
    <section class="dashboard-grid">
      ${LiveUpdatesPanel(dashboard.news)}
      ${MorningBriefPanel(dashboard.morningBrief)}
    </section>
    ${SummaryCards(dashboard.summaries)}
    <footer class="footer">
      ${t("footer_disclaimer")}
    </footer>
  `, "dashboard");
  bindRefreshNewsButton();
  bindRefreshMarketButton();
  bindGlobalActions();
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
      const result = await refreshNews();
      const lang = getLang();
      statusEl.textContent = lang === "zh"
        ? `新闻刷新完成：新增 ${result.inserted} 条，跳过 ${result.skipped} 条`
        : `News refresh complete: ${result.inserted} inserted, ${result.skipped} skipped`;
      statusEl.className = "news-refresh-status success";

      const source = await loadDashboardSource();
      const dashboard = buildDashboardModel(source);
      renderDashboard(dashboard);
    } catch (err) {
      const msg = err.message || "";
      statusEl.textContent = msg.includes("not configured") || msg.includes("apiKey") || msg.includes("API key")
        ? t("status_news_api_missing")
        : t("status_refresh_failed") + msg;
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
  app.innerHTML = AppShell(HoldingsPage(holdings), "holdings");
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
  app.innerHTML = AppShell(WatchlistPage(model), "watchlist");
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
        statusEl.textContent = t("status_watchlist_writing").replace("...", "") + `: ${result.watchId || t("nav_watchlist")}`;
        // Better: show added confirmation
        const id = result.watchId || "";
        const lang = getLang();
        statusEl.textContent = lang === "zh"
          ? `已加入观察清单：${id || "新记录"}`
          : `Added to watchlist: ${id || "new record"}`;
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

// ── Decision Log ──────────────────────────────────────────────────────────────

function renderDecisionLog() {
  const model = buildDecisionLogModel(state.decisionLogSource ?? { decisions: [] }, state.decisionLogFilter);
  app.innerHTML = AppShell(DecisionLogPage(model), "decisions");
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
  if (window.location.pathname.includes("/holdings"))  return "holdings";
  if (window.location.pathname.includes("/watchlist")) return "watchlist";
  if (window.location.pathname.includes("/decisions")) return "decisions";
  const hashPage = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (hashPage === "holdings")  return "holdings";
  if (hashPage === "watchlist") return "watchlist";
  if (hashPage === "decisions") return "decisions";
  return "dashboard";
}

window.addEventListener("hashchange", () => {
  if (!checkAuth()) {
    showPasswordGate();
    return;
  }
  document.getElementById("watchlist-popup-overlay")?.remove();
  app.innerHTML = LoadingState();
  renderCurrentPage().catch((error) => {
    app.innerHTML = ErrorState(error);
    console.error(error);
    bindGlobalActions();
  });
});

bootstrap();
