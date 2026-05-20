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
    settings: "99 Settings",
    marketRadar: "05 Market Radar",
  },
};

export const FAMILY_INVESTMENT_API_URL =
  import.meta.env?.VITE_FAMILY_INVESTMENT_API_URL ||
  (typeof window !== "undefined" ? window.FAMILY_INVESTMENT_API_URL : "") ||
  "https://script.google.com/macros/s/AKfycbzdSdpB1ZZp8XZPIESgl6jQNc83GrvY5LM-kWYPLxWRjsGkLaJEIrxI-CBlsOIp_HWDXg/exec";

export const NAV_ITEMS = [
  ["首页", "Dashboard", "home", "dashboard"],
  ["已持仓", "Holdings", "briefcase", "holdings"],
  ["观察清单", "Watchlist", "bookmark", "watchlist"],
  ["重点提醒", "Priority Alerts", "bell", "alerts"],
  ["每日新闻", "Daily News", "news", "news"],
  ["市场雷达", "Market Radar", "radar", "market"],
  ["决策记录", "Decision Log", "document", "decisions"],
  ["设置", "Settings", "settings", "settings"],
];
