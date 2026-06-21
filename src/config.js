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
    stockAnalysis: "11 Stock Analysis",
    aiMarketTrend: "13 AI Market Trend",
  },
};

const CURRENT_API_URL =
  "https://script.google.com/macros/s/AKfycbwxCyBuqCjc8vB4SHe6QtYPx3WgfAsaJN4dHpFqBjc22h3R9gScYzgSs9XlJNrRdSpyNQ/exec";

const OLD_API_URL =
  "https://script.google.com/macros/s/AKfycbzdSdpB1ZZp8XZPIESgl6jQNc83GrvY5LM-kWYPLxWRjsGkLaJEIrxI-CBlsOIp_HWDXg/exec";

const configuredApiUrl =
  import.meta.env?.VITE_FAMILY_INVESTMENT_API_URL ||
  (typeof window !== "undefined" ? window.FAMILY_INVESTMENT_API_URL : "") ||
  CURRENT_API_URL;

export const FAMILY_INVESTMENT_API_URL =
  configuredApiUrl === OLD_API_URL ? CURRENT_API_URL : configuredApiUrl;

// Each entry: [i18n-key, icon-class, page-id]
export const NAV_ITEMS = [
  ["nav_dashboard", "home",      "dashboard"],
  ["nav_stock_lookup", "radar",  "stock-lookup"],
  ["nav_stock_analysis", "radar", "stock-analysis"],
  ["nav_market",    "radar",     "market"],
  ["nav_news",      "news",      "news"],
  ["nav_alerts",    "bell",      "alerts"],
  ["nav_forum",     "news",      "forum"],
  ["nav_learning", "document", "learning"],
  ["nav_share",     "news",      "share"],
  ["nav_morning_brief", "news",  "morning-brief", "admin"],
  ["nav_forum_admin", "document", "forum-admin", "admin"],
  ["nav_admin_learning", "document", "admin-learning", "admin"],
  ["nav_holdings",  "briefcase", "holdings", "admin"],
  ["nav_watchlist", "bookmark",  "watchlist", "admin"],
  ["nav_decisions", "document",  "decisions", "admin"],
  ["nav_settings",  "settings",  "settings", "admin"],
];
