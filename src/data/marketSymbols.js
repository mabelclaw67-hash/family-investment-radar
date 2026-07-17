// Single source of truth for the homepage market cards' tickers.
// Both MarketSection (render) and the auto-refresh caller read from here, so
// there is never a second hand-maintained ticker list. The Netlify snapshot
// function only fetches the symbols the frontend asks for (validated + capped).
//
// These are the same symbols the homepage already showed; this file just
// centralizes them. Not the DSA 76-stock watchlist — that stays sheet-driven.

export const HOMEPAGE_MARKET_US = [
  { symbol: "^DJI", label: "Dow Jones" },
  { symbol: "^IXIC", label: "Nasdaq" },
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "NVDA", label: "NVIDIA" },
  { symbol: "GOOGL", label: "Alphabet (Google)" },
];

export const HOMEPAGE_MARKET_CA = [
  { symbol: "^GSPTSE", label: "S&P/TSX Composite" },
  { symbol: "CADUSD=X", label: "CAD/USD" },
  { symbol: "GC=F", label: "Gold (USD/oz)" },
  { symbol: "USO", label: "Oil ETF Proxy (USO)" },
  { symbol: "XBB.TO", label: "Canada Bond ETF (XBB.TO)" },
];

export const HOMEPAGE_MARKET_SYMBOLS = [...HOMEPAGE_MARKET_US, ...HOMEPAGE_MARKET_CA];

export const HOMEPAGE_MARKET_TICKERS = HOMEPAGE_MARKET_SYMBOLS.map((s) => s.symbol);
