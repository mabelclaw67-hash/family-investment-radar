# 家庭投资雷达 / Family Investment Radar V1.2

A lightweight family investment monitoring WebUI backed by Google Sheets.
All data comes from `Family_Investment_Radar_Master` via Apps Script Web App.

---

## Run locally

```powershell
cd "C:\Users\mabel\_Share Folder\Family Investment\02_Web_Project"
python -m http.server 4173 --bind 127.0.0.1
```

Open: http://127.0.0.1:4173/

On first load you will see the **password gate**. In dev mode (when the password
is still the placeholder `CHANGE_ME_BEFORE_DEPLOY`) any input is accepted.

---

## Password gate

The site requires a password before showing any content.

Password is read from (first match wins):

1. `VITE_FAMILY_INVESTMENT_SITE_PASSWORD` env variable (Netlify / .env file)
2. Falls back to `"CHANGE_ME_BEFORE_DEPLOY"` (dev placeholder — accepts any input)

To set locally, create `.env` in the project root:

```text
VITE_FAMILY_INVESTMENT_SITE_PASSWORD=YourRealPassword
```

**Never commit `.env` with the real password.** `.env` is in `.gitignore`.

The password is stored in `sessionStorage` — the gate reappears when the tab is closed.
A **退出 / Lock** button in the sidebar logs out immediately.

---

## Netlify deployment checklist

Before deploying, complete all steps:

**Step 1 — Set site password**

In Netlify UI → Site settings → Environment variables → Add:
```
VITE_FAMILY_INVESTMENT_SITE_PASSWORD = YourRealFamilyPassword
```
Do NOT leave it as `CHANGE_ME_BEFORE_DEPLOY` in production.

**Step 2 — Confirm Apps Script Web App URL**

In `src/config.js`, verify `FAMILY_INVESTMENT_API_URL` points to the correct deployed
Apps Script Web App URL. The URL must be publicly accessible (deployed as "Anyone").

**Step 3 — Confirm no mock data**

All pages must load from the live Google Sheets API. Do not enable mock/stub data.
The app shows an error state if the API is unreachable — that is the correct behaviour.

**Step 4 — Test mobile view**

Before deploy, open browser DevTools → toggle device toolbar → set width 390px.
Verify:
- Password gate shows correctly on phone width
- Bottom tab bar appears (首页 / 持仓 / 观察 / 记录)
- Sidebar is hidden
- Holdings, Watchlist, Decision Log show as card lists (not tables)
- Watchlist popup opens full-screen
- Decision Log form is single-column
- All forms can be submitted without horizontal scroll

**Step 5 — Deploy**

Drag and drop the `02_Web_Project` folder to Netlify, or connect via Git.
`netlify.toml` is already configured for static deployment with SPA redirect.

---

## Google Sheets source

Spreadsheet: `Family_Investment_Radar_Master`
ID: `1mNmAtxQn9udMm0ljuX1nCJKif_VhvhFhkWxNZBJgBBs`

API URL is configured in `src/config.js`:
```js
export const FAMILY_INVESTMENT_API_URL = "https://script.google.com/macros/s/.../exec";
```

All API keys (NewsAPI, Alpha Vantage) stay in Apps Script `PropertiesService`.
No API keys are exposed in the frontend.

---

## Tab → Sheet mapping

| Page         | Sheet(s) read                                            |
|-------------|----------------------------------------------------------|
| Dashboard   | 01 Holdings Master, 06 Daily News, 07 Watchlist, 08 Alerts, 05 Market Radar, 99 Settings |
| Holdings    | 01 Holdings Master, 03 Holding Research, 06 Daily News   |
| Watchlist   | 07 Watchlist Intelligence, 03 Holding Research, 06 Daily News, 05 Market Radar |
| Decision Log | 09 Decision Log                                         |

---

## Architecture

```
index.html
└── src/
    ├── main.js          — routing, password gate, event binding
    ├── config.js        — API URL, sheet config, nav items, SITE_PASSWORD
    ├── components.js    — all HTML templates (AppShell, pages, cards, popup)
    ├── styles.css       — all CSS including mobile responsive
    └── data/
        ├── googleSheets.js      — fetch wrapper to Apps Script
        ├── dashboardMapper.js   — maps raw sheet rows → dashboard model
        ├── holdingsMapper.js    — maps raw rows → holdings model
        ├── watchlistMapper.js   — maps raw rows → watchlist model
        └── decisionLogMapper.js — maps raw rows → decision log model
```

Data flow: Google Sheets → Apps Script Web App → `googleSheets.js` → mapper → component → render
