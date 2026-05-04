import {
  addDecisionLog,
  addWatchItem,
  generateResearchPack,
  loadDailyPortfolioIntelligenceSource,
  loadDashboardSource,
  loadDecisionLogPageSource,
  loadHoldingsPageSource,
  loadResearchPackRows,
  loadWatchlistPageSource,
  refreshMarketData,
  refreshNews,
  saveNotebookLmAnalysis,
} from "./data/googleSheets.js";
import { buildDashboardModel } from "./data/dashboardMapper.js";
import { buildHoldingsModel } from "./data/holdingsMapper.js";
import { buildWatchlistModel } from "./data/watchlistMapper.js";
import { buildDecisionLogModel } from "./data/decisionLogMapper.js";
import { buildDailyPortfolioIntelligenceModel } from "./data/dailyPortfolioMapper.js";
import {
  AlertsPanel,
  AppShell,
  DecisionLogPage,
  DailyPortfolioIntelligencePage,
  ErrorState,
  Header,
  HoldingsPage,
  KpiCards,
  LiveUpdatesPanel,
  LoadingState,
  MarketSection,
  ResearchPackResultHtml,
  ResearchPacksPage,
  SummaryCards,
  WatchlistPage,
  WatchlistPopupHtml,
} from "./components.js";
import { SITE_PASSWORD, SITE_PASSWORD_CONFIGURED } from "./config.js";

const app = document.querySelector("#app");
const AUTH_KEY = "fir_auth_v1";

// ── Password Gate ─────────────────────────────────────────────────────────────

function checkAuth() {
  return localStorage.getItem(AUTH_KEY) === "ok";
}

function showSetupError() {
  app.innerHTML = `
    <div class="pw-gate-wrapper">
      <div class="pw-gate-box">
        <div class="pw-brand">⚠</div>
        <h2 class="pw-title">配置错误 / Setup Error</h2>
        <p class="pw-subtitle">Family Investment Radar</p>
        <div class="pw-form" style="text-align:left;">
          <p class="pw-hint" style="color:var(--orange);">
            未检测到访问密码环境变量 / Site password env variable is missing.
          </p>
          <p class="pw-hint">
            请在 Netlify → Site settings → Environment variables 中设置：<br/>
            Please set this in Netlify → Site settings → Environment variables:
          </p>
          <code style="display:block;background:#111;color:#eee;padding:10px;border-radius:6px;font-size:12px;margin:8px 0;">
            VITE_SITE_PASSWORD=&lt;your password&gt;
          </code>
          <p class="pw-hint">
            本地开发请在项目根目录 <code>.env</code> 中加入相同变量，然后重新构建。<br/>
            For local dev, add the same variable to a <code>.env</code> file in the project root and rebuild.
          </p>
        </div>
      </div>
    </div>
  `;
}

function showPasswordGate() {
  app.innerHTML = `
    <div class="pw-gate-wrapper">
      <div class="pw-gate-box">
        <div class="pw-brand">◎</div>
        <h2 class="pw-title">家庭投资雷达</h2>
        <p class="pw-subtitle">Family Investment Radar</p>
        <form id="pw-form" class="pw-form" autocomplete="on">
          <p class="pw-hint">请输入访问密码 / Enter access password</p>
          <input
            id="pw-input"
            type="password"
            class="pw-input"
            placeholder="Password"
            autocomplete="current-password"
            autofocus
          />
          <div id="pw-error" class="pw-error" hidden>
            密码不正确 / Incorrect password
          </div>
          <button type="submit" class="pw-submit">进入 / Enter</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById("pw-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = document.getElementById("pw-input").value;
    if (val === SITE_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "ok");
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
  const logoutBtn = document.querySelector("[data-action='logout']");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(AUTH_KEY);
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
  researchPackRows: [],
  dailyPortfolioSource: null,
};

async function bootstrap() {
  if (!SITE_PASSWORD_CONFIGURED) {
    showSetupError();
    return;
  }
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

  if (state.page === "daily-portfolio") {
    state.dailyPortfolioSource = await loadDailyPortfolioIntelligenceSource();
    renderDailyPortfolioIntelligence();
    return;
  }

  if (state.page === "decisions") {
    const source = await loadDecisionLogPageSource();
    state.decisionLogSource = source;
    renderDecisionLog();
    return;
  }

  if (state.page === "research-packs") {
    state.researchPackRows = await loadResearchPackRows();
    renderResearchPacks();
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
    ${SummaryCards(dashboard.summaries, dashboard.marketData)}
    <footer class="footer">
      本平台提供信息与监控服务，不构成投资建议或任何买卖推荐。投资有风险，请根据自身情况谨慎决策。
    </footer>
  `, "dashboard");
  bindRefreshNewsButton();
  bindRefreshMarketButton();
  bindPriorityAlertResearchButtons();
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

function bindPriorityAlertResearchButtons() {
  app.querySelectorAll("[data-alert-research]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "生成中...";

      try {
        const result = await generateResearchPack({
          topic: button.dataset.topic || button.dataset.ticker || "Priority Alert",
          owner: button.dataset.owner || "",
          relatedTicker: button.dataset.ticker || "",
          relatedWatchId: button.dataset.watchId || "",
          sourceContext: "Priority Alert High Attention",
        });
        button.textContent = result.packId ? `已生成 ${result.packId}` : "已生成";
        if (!button.parentElement.querySelector("[data-view-research-packs]")) {
          const viewLink = document.createElement("a");
          viewLink.className = "small-research-link";
          viewLink.href = `#/research-packs?packId=${encodeURIComponent(result.packId || "")}`;
          viewLink.dataset.viewResearchPacks = "1";
          viewLink.textContent = "查看研究包";
          button.insertAdjacentElement("afterend", viewLink);
        }
        window.open(result.docUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.warn(err);
        button.disabled = false;
        button.textContent = "生成失败";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2400);
      }
    });
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

function renderDailyPortfolioIntelligence() {
  const model = buildDailyPortfolioIntelligenceModel(state.dailyPortfolioSource ?? {
    holdings: [],
    dailyHoldingIntelligence: [],
  });
  app.innerHTML = AppShell(DailyPortfolioIntelligencePage(model), "daily-portfolio");
  bindGlobalActions();
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

  bindPopupResearchPack(overlay);

  const onKey = (event) => {
    if (event.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);
}

function bindPopupResearchPack(overlay) {
  const generateBtn = overlay.querySelector("#btn-popup-generate-research-pack");
  const statusEl = overlay.querySelector("#research-pack-status");
  const resultEl = overlay.querySelector("#research-pack-result");
  if (!generateBtn || !statusEl || !resultEl) return;

  generateBtn.addEventListener("click", async () => {
    generateBtn.disabled = true;
    statusEl.textContent = "正在生成研究包...";
    statusEl.className = "news-refresh-status loading";

    try {
      const result = await generateResearchPack({
        topic: generateBtn.dataset.topic || generateBtn.dataset.ticker || "Research Topic",
        owner: generateBtn.dataset.owner || "",
        relatedTicker: generateBtn.dataset.ticker || "",
        relatedWatchId: generateBtn.dataset.watchId || "",
        sourceContext: generateBtn.dataset.sourceContext || "Watchlist Quick Research",
      });
      statusEl.textContent = result.packId ? `已生成 ${result.packId}` : "Google Doc 已生成";
      statusEl.className = "news-refresh-status success";
      resultEl.innerHTML = ResearchPackResultHtml(result);
      resultEl.hidden = false;
      bindResearchPackResultActions(resultEl);
    } catch (err) {
      statusEl.textContent = "生成失败：" + (err.message || "未知错误");
      statusEl.className = "news-refresh-status error";
      generateBtn.disabled = false;
    }
  });
}

function bindResearchPackResultActions(container) {
  const copyBtn = container.querySelector("#btn-copy-notebook-prompt");
  const promptEl = container.querySelector("#notebook-prompt-text");
  if (copyBtn && promptEl) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(promptEl.value);
        copyBtn.textContent = "已复制 / Copied";
      } catch (err) {
        promptEl.select();
        copyBtn.textContent = "请手动复制 / Select text";
      }
    });
  }

  const saveBtn = container.querySelector("#btn-save-notebook-analysis");
  const statusEl = container.querySelector("#notebook-save-status");
  const form = container.querySelector(".research-pack-analysis-form");
  if (!saveBtn || !statusEl || !form) return;

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    statusEl.textContent = "正在保存分析...";
    statusEl.className = "news-refresh-status loading";

    try {
      await saveNotebookLmAnalysis({
        packId: form.dataset.packId || "",
        notebookLmConclusion: container.querySelector("#notebook-analysis-text")?.value || "",
        investmentSteps: container.querySelector("#notebook-steps-text")?.value || "",
        decisionStatus: container.querySelector("#notebook-decision-status")?.value || "Review",
        notes: container.querySelector("#notebook-notes-text")?.value || "",
      });
      statusEl.textContent = "NotebookLM 分析已保存 / NotebookLM analysis saved";
      statusEl.className = "news-refresh-status success";
    } catch (err) {
      statusEl.textContent = "保存失败：" + (err.message || "未知错误");
      statusEl.className = "news-refresh-status error";
      saveBtn.disabled = false;
    }
  });
}

function renderResearchPacks() {
  const highlightedPackId = getHashParam("packId");
  app.innerHTML = AppShell(ResearchPacksPage(state.researchPackRows, highlightedPackId), "research-packs");
  bindResearchPackPageActions();
  bindGlobalActions();
  if (highlightedPackId) {
    const target = app.querySelector(`[data-rp-id="${CSS.escape(highlightedPackId)}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function bindResearchPackPageActions() {
  app.querySelectorAll("[data-copy-rp-prompt]").forEach((button) => {
    button.addEventListener("click", async () => {
      const prompt = button.dataset.prompt || "";
      try {
        await navigator.clipboard.writeText(prompt);
        button.textContent = "已复制 / Copied";
      } catch (err) {
        button.textContent = "复制失败 / Copy failed";
      }
    });
  });

  app.querySelectorAll("[data-rp-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const statusEl = form.querySelector("[data-rp-save-status]");
      const submitBtn = form.querySelector("button[type='submit']");
      const formData = new FormData(form);
      const packId = String(form.dataset.packId || "").trim();

      if (!packId) {
        if (statusEl) {
          statusEl.textContent = "缺少 Pack ID";
          statusEl.className = "news-refresh-status error";
        }
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (statusEl) {
        statusEl.textContent = "正在保存分析...";
        statusEl.className = "news-refresh-status loading";
      }

      try {
        await saveNotebookLmAnalysis({
          packId,
          notebookLmConclusion: String(formData.get("notebookLmConclusion") || "").trim(),
          investmentSteps: String(formData.get("investmentSteps") || "").trim(),
          decisionStatus: String(formData.get("decisionStatus") || "Review").trim(),
          notes: String(formData.get("notes") || "").trim(),
        });
        if (statusEl) {
          statusEl.textContent = "NotebookLM 分析已保存 / NotebookLM analysis saved";
          statusEl.className = "news-refresh-status success";
        }
        state.researchPackRows = await loadResearchPackRows();
        renderResearchPacks();
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = "保存失败：" + (err.message || "未知错误");
          statusEl.className = "news-refresh-status error";
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
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
  if (window.location.pathname.includes("/daily-portfolio")) return "daily-portfolio";
  if (window.location.pathname.includes("/watchlist")) return "watchlist";
  if (window.location.pathname.includes("/decisions")) return "decisions";
  if (window.location.pathname.includes("/research-packs")) return "research-packs";
  const hashPage = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (hashPage === "holdings")  return "holdings";
  if (hashPage === "daily-portfolio") return "daily-portfolio";
  if (hashPage === "watchlist") return "watchlist";
  if (hashPage === "decisions") return "decisions";
  if (hashPage === "research-packs") return "research-packs";
  return "dashboard";
}

function getHashParam(name) {
  const query = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(query).get(name) || "";
}

window.addEventListener("hashchange", () => {
  if (!SITE_PASSWORD_CONFIGURED) {
    showSetupError();
    return;
  }
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
