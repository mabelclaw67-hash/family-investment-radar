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
  SummaryCards,
  WatchlistPage,
  WatchlistPopupHtml,
} from "./components.js";

const app = document.querySelector("#app");
const AUTH_KEY = "fir_auth_v2";
const ACCESS_CODE = "246810";

// ── Password Gate ─────────────────────────────────────────────────────────────

function checkAuth() {
  return sessionStorage.getItem(AUTH_KEY) === "ok";
}

function showPasswordGate() {
  app.innerHTML = `
    <div class="pw-gate-wrapper">
      <div class="pw-gate-box">
        <div class="pw-brand">◎</div>
        <h2 class="pw-title">家庭投资雷达</h2>
        <p class="pw-subtitle">Family Investment Radar</p>
        <form id="pw-form" class="pw-form" autocomplete="off">
          <p class="pw-hint">请输入访问密码 / Enter access password</p>
          <input
            id="pw-input"
            type="text"
            class="pw-input"
            placeholder="Access code"
            inputmode="numeric"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            autofocus
          />
          <div id="pw-error" class="pw-error" hidden>
            密码不正确 / Incorrect password
          </div>
          <button type="submit" class="pw-submit pw-submit-small">Enter</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("pw-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("pw-input");
    const val = input.value.trim();
    input.value = val;

    if (val === ACCESS_CODE) {
      sessionStorage.setItem(AUTH_KEY, "ok");
      bootstrap();
    } else {
      const errEl = document.getElementById("pw-error");
      errEl.hidden = false;
      input.value = "";
      input.focus();
    }
  });
}

function bindGlobalActions() {
  const logoutBtn = document.querySelector("[data-action='logout']");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(AUTH_KEY);
      showPasswordGate();
    });
  }
}

const state = {
  page: getPageFromUrl(),
  holdingsFilter: "all",
  selectedHoldingId: "",
  holdingsSource: null,
  watchlistSource: null,
  decisionLogSource: null,
  decisionLogFilter: "all",
};

async function bootstrap() {
  if (!checkAuth()) {
    showPasswordGate();
    return;
  }

  app.innerHTML = LoadingState();

  try {
    await renderCurrentPage();
  } catch (error) {
    app.innerHTML = ErrorState(error);
    console.error(error);
    bindGlobalActions();
  }
}

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

function renderDashboard(dashboard) {
  app.innerHTML = AppShell(`
    ${Header()}
    ${KpiCards(dashboard.kpis)}
    ${MarketSection(dashboard.marketData)}
    <section class="dashboard-grid">
      ${LiveUpdatesPanel(dashboard.news)}
      ${AlertsPanel(dashboard.alerts)}
    </section>
    ${SummaryCards(dashboard.summaries)}
    <footer class="footer">
      本平台提供信息与监控服务，不构成投资建议或任何买卖推荐。投资有风险，请根据自身情况谨慎决策。
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
    statusEl.textContent = "正在刷新新闻...";
    statusEl.className = "news-refresh-status loading";

    try {
      const result = await refreshNews();
      statusEl.textContent = `新闻刷新完成：新增 ${result.inserted} 条，跳过 ${result.skipped} 条`;
      statusEl.className = "news-refresh-status success";

      const source = await loadDashboardSource();
      const dashboard = buildDashboardModel(source);
      renderDashboard(dashboard);
    } catch (err) {
      const msg = err.message || "";
      statusEl.textContent = msg.includes("not configured") || msg.includes("apiKey") || msg.includes("API key")
        ? "NEWS_API_KEY 未配置 / News API key is not configured."
        : "刷新失败：" + msg;
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
    statusEl.textContent = "正在刷新行情...";
    statusEl.className = "news-refresh-status loading";

    try {
      const result = await refreshMarketData();
      statusEl.textContent = `行情已更新：更新 ${result.updated} 条，错误 ${result.errors} 条`;
      statusEl.className = "news-refresh-status success";

      const source = await loadDashboardSource();
      const dashboard = buildDashboardModel(source);
      renderDashboard(dashboard);
    } catch (err) {
      const msg = err.message || "";
      statusEl.textContent = msg.includes("not set") || msg.includes("ALPHA_VANTAGE")
        ? "ALPHA_VANTAGE_API_KEY 未配置。"
        : "刷新失败：" + msg;
      statusEl.className = "news-refresh-status error";
      btn.disabled = false;
    }
  });
}

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
      owner: String(formData.get("owner") || "").trim(),
      ticker: String(formData.get("ticker") || "").trim(),
      name: String(formData.get("name") || "").trim(),
      type: String(formData.get("type") || "").trim(),
      sector: String(formData.get("sector") || "").trim(),
      priority: String(formData.get("priority") || "Medium").trim(),
      reason: String(formData.get("reason") || "").trim(),
    };

    if (!payload.owner || !payload.type || (!payload.ticker && !payload.name)) {
      if (statusEl) {
        statusEl.textContent = "请填写 Owner、Type，并填写 Ticker 或 Name。";
        statusEl.className = "news-refresh-status error";
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = "正在写入观察清单...";
      statusEl.className = "news-refresh-status loading";
    }

    try {
      const result = await addWatchItem(payload);
      if (statusEl) {
        statusEl.textContent = `已加入观察清单：${result.watchId || "新记录"}`;
        statusEl.className = "news-refresh-status success";
      }
      form.reset();
      const source = await loadWatchlistPageSource();
      state.watchlistSource = source;
      renderWatchlist();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "写入功能待接入 / Write action pending";
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
      if (p.owner)        { const s = form.querySelector('[name="owner"]');       if (s) s.value = p.owner; }
      if (p.ticker)       { const f = form.querySelector('[name="ticker"]');      if (f) f.value = p.ticker; }
      if (p.name)         { const f = form.querySelector('[name="name"]');        if (f) f.value = p.name; }
      if (p.assetType)    { const s = form.querySelector('[name="assetType"]');   if (s) s.value = p.assetType; }
      if (p.relatedWatchId) { const f = form.querySelector('[name="relatedWatchId"]'); if (f) f.value = p.relatedWatchId; }
      if (p.referenceInfo)  { const f = form.querySelector('[name="referenceInfo"]');  if (f) f.value = p.referenceInfo; }
    }
  }
}

function bindDecisionLogInteractions() {
  // Filter buttons
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
      date:            String(data.get("date")            || "").trim(),
      owner:           String(data.get("owner")           || "").trim(),
      accountType:     String(data.get("accountType")     || "").trim(),
      ticker:          String(data.get("ticker")          || "").trim(),
      name:            String(data.get("name")            || "").trim(),
      assetType:       String(data.get("assetType")       || "").trim(),
      actionType:      String(data.get("actionType")      || "").trim(),
      decisionStatus:  String(data.get("decisionStatus")  || "").trim(),
      amount:          String(data.get("amount")          || "").trim(),
      quantity:        String(data.get("quantity")        || "").trim(),
      price:           String(data.get("price")           || "").trim(),
      cost:            String(data.get("cost")            || "").trim(),
      decisionReason:  String(data.get("decisionReason")  || "").trim(),
      referenceInfo:   String(data.get("referenceInfo")   || "").trim(),
      riskLevel:       String(data.get("riskLevel")       || "").trim(),
      relatedWatchId:  String(data.get("relatedWatchId")  || "").trim(),
      relatedHoldingId:String(data.get("relatedHoldingId")|| "").trim(),
      reviewNotes:     String(data.get("reviewNotes")     || "").trim(),
    };

    if (!payload.date || !payload.owner || !payload.actionType || (!payload.ticker && !payload.name)) {
      if (statusEl) {
        statusEl.textContent = "请填写日期、所属人、操作类型，以及代码或名称。";
        statusEl.className = "news-refresh-status error";
      }
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = "正在写入决策记录...";
      statusEl.className = "news-refresh-status loading";
    }

    try {
      const result = await addDecisionLog(payload);
      if (statusEl) {
        statusEl.textContent = `已新增决策记录 ${result.decisionId || ""}`;
        statusEl.className = "news-refresh-status success";
      }
      form.reset();
      state.decisionLogFilter = "all";
      const source = await loadDecisionLogPageSource();
      state.decisionLogSource = source;
      renderDecisionLog();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "写入失败：" + (err.message || "未知错误");
        statusEl.className = "news-refresh-status error";
      }
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

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
