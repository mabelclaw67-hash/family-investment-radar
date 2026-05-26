export const SHEET_CONFIG = {
  spreadsheetId: "1mNmAtxQn9udMm0ljuX1nCJKif_VhvhFhkWxNZBJgBBs",
  spreadsheetTitle: "Family_Investment_Radar_Master",
  tabs: {
    holdings: "01 Holdings Master",
    holdingResearch: "03 Holding Research",
    dailyNews: "06 Daily News Intelligence",
    watchlist: "07 Watchlist Intelligence",
    priorityAlerts: "08 Priority Alert Watch",
    decisionLog: "09 Decision Log",
    morningBrief: "10 Morning Brief",
    settings: "99 Settings",
    marketRadar: "05 Market Radar",
  },
};

// ── Site password gate ────────────────────────────────────────────────────────
// Fixed local password gate. Keep UI copy generic and do not expose it on screen.
export const SITE_PASSWORD = "246810";

export const FAMILY_INVESTMENT_API_URL =
  import.meta.env?.VITE_FAMILY_INVESTMENT_API_URL ||
  (typeof window !== "undefined" ? window.FAMILY_INVESTMENT_API_URL : "") ||
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

// Each entry: [i18n-key, icon-class, page-id]
export const NAV_ITEMS = [
  ["nav_dashboard", "home",      "dashboard"],
  ["nav_holdings",  "briefcase", "holdings"],
  ["nav_watchlist", "bookmark",  "watchlist"],
  ["nav_alerts",    "bell",      "alerts"],
  ["nav_news",      "news",      "news"],
  ["nav_market",    "radar",     "market"],
  ["nav_decisions", "document",  "decisions"],
  ["nav_settings",  "settings",  "settings"],
];
