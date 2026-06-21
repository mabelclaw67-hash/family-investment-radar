# 家庭投资趋势分析 / Family Investment Radar

A lightweight family investment trend WebUI backed by Google Sheets, Apps Script,
and Netlify Functions.

Main source of truth: `Family_Investment_Radar_Master`.

---

## Project folder

Use this folder only:

```text
/Users/mabelchen/Mabel Project/02_Family Investment/02_Web_Project_GitHub
```

This is the active website project. It is connected to GitHub:

```text
https://github.com/mabelclaw67-hash/family-investment-radar.git
```

Do not edit old archived copies such as `02_Web_Project`,
`02_Web_Project_BACKUP_20260507_133607`, or standalone Apps Script `.gs` files.
They are kept only for history.

---

## Run locally

```bash
cd "/Users/mabelchen/Mabel Project/02_Family Investment/02_Web_Project_GitHub"
npm install
npm run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173/
```

---

## Public and admin access

The public website is open without a site password.

Public users can view published investment trend content. Admin mode still
requires the admin login / admin password. Admin-only actions remain protected.

Admin password is checked through:

```text
netlify/functions/verifyAdminPassword.js
```

Admin actions use a session admin token and controlled Netlify Functions. Do not
expose Apps Script write endpoints directly to public users.

Public users should not see admin update buttons or admin-only controls.

---

## Navigation

Public navigation:

- 首页 / Home
- 投资趋势 / Investment Trends
- 市场趋势 / Market Trends
- 每日新闻 / Daily News
- 分享 / Share

Admin navigation:

- 今日晨报
- 已持仓
- 观察名单
- 重点提醒
- 决策记录
- 设置

Some additional public or admin utility pages may exist in the code, such as
stock lookup or public discussion management. Keep navigation simple and avoid
adding duplicate pages for the same workflow.

---

## Branding and design direction

Main branding:

- 家庭投资趋势分析
- Family Investment Radar

Design principle:

- Light, clean, elegant, premium, generous, restrained luxury.
- Use deep navy / royal-blue premium accents.
- Use tasteful gold typography accents where helpful.
- Avoid black gloomy backgrounds.
- Avoid cheap gold, neon effects, clutter, and excessive complexity.

---

## Netlify deployment checklist

This site is deployed through GitHub to Netlify.

Before committing or deploying:

1. Confirm `npm run build` passes.
2. Confirm public pages load without a site password.
3. Confirm admin login is still required for admin-only pages and actions.
4. Confirm admin update controls are hidden from public users.
5. Confirm no API keys or Apps Script write endpoints are exposed in frontend code.
6. Confirm Netlify deployment completes after the GitHub push.

Deploy from the connected GitHub repository. Do not drag and drop old local
project folders to Netlify.

`netlify.toml` is configured for static deployment with SPA redirect and
Netlify Functions.

---

## Google Sheets source

Spreadsheet: `Family_Investment_Radar_Master`

Spreadsheet ID:

```text
1mNmAtxQn9udMm0ljuX1nCJKif_VhvhFhkWxNZBJgBBs
```

API URL is configured in `src/config.js`.

All API keys stay in backend services such as Apps Script `PropertiesService` or
Netlify environment variables. No API keys should be exposed in the frontend.

---

## Tab to sheet mapping

| Area | Sheet or backend source |
| --- | --- |
| Dashboard / Home | 01 Holdings Master, 06 Daily News Intelligence, 07 Watchlist Intelligence, 08 Priority Alert Watch, 05 Market Radar, 99 Settings |
| Holdings | 01 Holdings Master, 03 Holding Research, 06 Daily News Intelligence |
| Watchlist | 07 Watchlist Intelligence, 03 Holding Research, 06 Daily News Intelligence, 05 Market Radar |
| Decision Log | 09 Decision Log |
| Morning Brief | 10 Morning Brief |
| Investment Trends / Stock Analysis | 11 Stock Analysis |
| AI Market Trend Summary | 13 AI Market Trend, Netlify Blobs where used |
| Public discussion | Apps Script public topic/reply actions and related Netlify Functions |

---

## Architecture

```text
Google Sheet / backend source
-> Apps Script Web App and Netlify Functions
-> frontend data layer
-> mapper
-> component
-> render
```

Core files:

```text
index.html
src/
  main.js
  config.js
  components.js
  styles.css
  i18n.js
  data/
    googleSheets.js
    dashboardMapper.js
    holdingsMapper.js
    watchlistMapper.js
    decisionLogMapper.js
apps-script/
  Code.gs
netlify/functions/
  adminAuth.js
  verifyAdminPassword.js
  updateStockAnalysis.js
  generateMarketTrendSummary.js
  scheduledMarketTrendSummary.js
  getMarketTrendSummary.js
  marketTrendSheetStore.js
  marketTrendSummaryGenerator.js
  firecrawlFetch.js
  publicStockSearch.js
  listPublicTopics.js
  listPublicReplies.js
  submitPublicTopic.js
  submitPublicReply.js
  adminPublicForum.js
```

Architecture principles:

- Keep Google Sheet as the single source of truth where possible.
- Avoid duplicate data tables.
- Avoid unnecessary new databases.
- Admin actions should go through controlled backend endpoints.
- Public pages should read published data only.
- Keep one-way data flow from source to backend endpoint to frontend display.

---

## Development Principles / 开发原则

These rules must be followed by Codex, Claude Code, Gemini, and any future
developer working on this project.

### 1. Simple and efficient first

- 本项目优先简单、高效、低维护。
- 不为了“看起来更高级”而增加复杂架构。
- 自动化必须减少人工重复，而不是增加系统复杂度。

### 2. Google Sheet as Single Source of Truth

- `11 Stock Analysis` 是 Stock Analysis / ETF / 观察池的唯一数据源。
- 前端只读 Google Sheet。
- Apps Script 只负责补数据、补空字段、刷新价格、刷新基本面。
- 不要在前端、代码、额外数据库中复制一份观察池名单。

### 3. Sheet-driven watchlist

- 以后新增、删除、暂停观察股票或 ETF，优先通过 Google Sheet 修改。
- 不应该每次新增 ETF 或股票都改脚本。
- `getStockAnalysisInfoMap_()` 只能作为 metadata fallback，不应该成为唯一名单来源。
- `runRadarUpgradeOnce` / `enrichStockAnalysis_()` 不允许删除、清空或冲掉表里已有 ticker。
- 对已有 ticker，只能补空字段，不要覆盖用户手工填写内容。

### 4. Minimal fallback, no over-engineering

- 数据源优先顺序保持简单：
  - 美股 / AI 股票：Finnhub first
  - 加拿大 `.TO` / `.V` 股票：Alpha Vantage fallback
  - ETF / 不支持 ticker：graceful fallback
- 数据源失败不能中断整批任务。
- 不要新增复杂 pipeline。
- 不要新建表，除非用户明确批准。

### 5. Frontend rules

- 前端继续只读 `11 Stock Analysis`。
- 不要因为新增字段就重做 UI。
- 如果表里有数据但前端不显示，只修字段 mapping。
- 所有 formatter 必须安全处理 `null` / `undefined` / `""` / `"N/A"`。
- 无数据时显示 N/A，不能让页面崩溃。

### 6. Scoring and AI fields

- 不要重写评分系统，除非用户明确要求。
- 基本面数据补齐后，现有评分逻辑应自然工作。
- 不要为了一个字段缺失而新建另一套评分表。

### 7. Safe change process

- 每次修改前先说明要改什么。
- 每次只做一个明确任务。
- build 必须通过。
- 未经确认不要 push / deploy。
- 文档-only 修改可以单独 commit，但要说明没有代码变更。

### 8. Project philosophy

- 这个项目是家庭投资观察和决策辅助工具，不是复杂交易系统。
- 目标是帮助用户每天快速观察趋势、发现风险、辅助决策。
- 设计必须服务于：简单、稳定、可维护、低成本、数据清楚。

---

## Recent development log

### Public site access

- Public site access is now open without a general password gate.
- Admin mode still requires admin login / admin password.
- Public users can view investment trend content.
- Admin-only actions remain protected by backend validation.

### Investment Trends / Stock Analysis

- Data source is Google Sheet tab `11 Stock Analysis`.
- Apps Script actions include `analyze_stocks` and `update_stock_fundamentals`.
- Admin refresh buttons call Netlify Functions, not direct frontend Apps Script calls.
- `netlify/functions/updateStockAnalysis.js` validates the admin token and returns JSON only.
- This fixed the old endpoint problem where a request could return HTML instead of JSON.
- The stock analysis page uses summary cards, filters, and a master-detail layout.
- The stock list includes AI, semiconductors, energy, commodities, finance, healthcare, and ETFs.
- Annualized volatility percent display was fixed.

### AI investment analysis fields

The Google Sheet has added or expanded AI analysis fields:

- AI Trend
- AI Summary
- Main Risks
- AI Chinese Comment

Frontend should display these existing sheet values directly where appropriate.
Admin update buttons should update backend data only when explicitly clicked.
Do not show admin update controls to public users.

### AI Market Trend / Market Trend Summary

- Added support for Google Sheet tab `13 AI Market Trend`.
- Apps Script Web App supports reading and writing AI Market Trend data.
- Netlify scheduled function generates the daily AI market trend summary.
- Public page reads the latest published AI market trend record.
- Scheduled function runs daily around 15:00 UTC / 8:00 AM Pacific daylight time.
- Data may be stored in Netlify Blobs and/or Google Sheet depending on the current implementation.

### Daily News / Firecrawl

- Firecrawl can be used for daily news and market information gathering.
- Long-term direction: use Firecrawl fetch through Netlify Functions so other projects can reuse it.
- Keep the news pipeline simple and avoid unnecessary layers.

### Stock fundamentals refresh

- Added or planned admin button to refresh stock fundamentals.
- Goal: avoid manually opening multiple action URLs.
- Admin action should go through a Netlify Function.
- Keep it one-click and low maintenance.

### Discussion / community direction

- Public discussion feature should remain lightweight.
- Preferred concept: 大家在关注 / 投资话题墙.
- Use pseudonymous posting.
- Do not require real-name registration.
- Do not require pre-approval before posts and replies appear.
- Add anti-bot protection and admin delete/hide ability as needed.
- Avoid building a full forum.
- Keep maintenance burden low.

---

## Current caution and risks

- Check admin token handling before deployment.
- Do not expose API keys.
- Do not expose Apps Script write endpoints publicly without validation.
- Confirm public users cannot access admin-only controls.
- Confirm build passes before commit.
- Confirm Netlify deployment after push.
- Keep data writes controlled to protect data integrity.

---

## TODO / next steps

- Improve AI investment analysis depth:
  - industry drivers
  - policy impact
  - Canadian vs US market separation
  - top gainers / laggards
  - risk explanation
- Add company official website / financial report links in the detail panel if not already complete.
- Improve mobile display.
- Keep homepage visual design premium and clean.
- Add lightweight discussion wall only after core data pages are stable.
- Consider Firecrawl daily news automation.
