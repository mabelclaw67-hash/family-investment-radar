# -*- coding: utf-8 -*-
"""
DSA Adapter — Family Investment Radar analysis engine.

Reads the stock watchlist from the existing Google Sheet ("11 Stock Analysis"
tab, via the same Apps Script Web App the site already uses), runs quote +
fundamental collection through the vendored daily_stock_analysis (DSA)
modules, and writes a standardized read-only cache to
../data/stock-analysis/latest.json.

Single Source of Truth rules:
  - The ticker list ONLY comes from the Google Sheet. --stocks may narrow the
    run to a subset, but any ticker not present in the sheet is rejected.
  - latest.json is a regenerable cache, never a second master list.
  - A failed ticker keeps its previous data from the existing latest.json
    (last known good), marked with status/staleness — old values are never
    overwritten with blanks.

Usage:
  python dsa_adapter.py --stocks NVDA,QQQ,VFV.TO --verbose
  python dsa_adapter.py            # full sheet watchlist (Phase 3+)
  python dsa_adapter.py --dry-run  # fetch + report, do not write latest.json
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

ENGINE_DIR = Path(__file__).resolve().parent
REPO_ROOT = ENGINE_DIR.parent
VENDOR_DIR = ENGINE_DIR / "vendor" / "daily_stock_analysis"
OUTPUT_PATH = REPO_ROOT / "data" / "stock-analysis" / "latest.json"
SHEET_TAB = "11 Stock Analysis"

# Sheet rows that are known non-investable placeholders (private companies).
# They stay in the sheet (sheet is SSOT) but are skipped for market data.
PLACEHOLDER_HINTS = {"不可投", "未上市", "private"}

sys.path.insert(0, str(VENDOR_DIR))

logger = logging.getLogger("dsa_adapter")


# ---------------------------------------------------------------------------
# Watchlist (Google Sheet via existing Apps Script Web App — read only)
# ---------------------------------------------------------------------------

def load_env() -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv(REPO_ROOT / ".env")
    except ImportError:
        pass


def apps_script_url() -> str:
    url = (
        os.environ.get("FAMILY_INVESTMENT_API_URL")
        or os.environ.get("VITE_FAMILY_INVESTMENT_API_URL")
        or ""
    ).strip()
    if not url:
        raise SystemExit(
            "Missing FAMILY_INVESTMENT_API_URL / VITE_FAMILY_INVESTMENT_API_URL. "
            "Set it in the repo .env (Apps Script Web App /exec URL)."
        )
    return url


def fetch_watchlist() -> List[Dict[str, Any]]:
    """Read the 11 Stock Analysis tab rows from the existing Apps Script API."""
    import requests

    resp = requests.get(
        apps_script_url(),
        params={"action": "tab", "name": SHEET_TAB, "_": str(int(datetime.now().timestamp()))},
        timeout=60,
    )
    resp.raise_for_status()
    payload = resp.json()
    if not payload.get("ok"):
        raise RuntimeError(f"Apps Script returned ok:false: {payload.get('error')}")
    rows = payload.get("data") or []
    if not rows:
        raise RuntimeError("Watchlist tab returned 0 rows — refusing to continue.")
    return rows


def is_placeholder_row(row: Dict[str, Any]) -> bool:
    investable = str(row.get("可投性 / Investable") or "")
    return any(h in investable for h in PLACEHOLDER_HINTS)


# ---------------------------------------------------------------------------
# Ticker mapping (sheet ticker -> Yahoo Finance symbol)
# ---------------------------------------------------------------------------

def to_yahoo_symbol(ticker: str) -> str:
    """Sheet tickers are already Yahoo-style except share classes:
    TECK.B.TO -> TECK-B.TO (Yahoo uses a hyphen for Canadian share classes)."""
    t = ticker.strip().upper()
    parts = t.split(".")
    if len(parts) == 3 and parts[2] in ("TO", "V") and len(parts[1]) == 1:
        return f"{parts[0]}-{parts[1]}.{parts[2]}"
    return t


def is_canadian(ticker: str) -> bool:
    return ticker.upper().endswith((".TO", ".V"))


# ---------------------------------------------------------------------------
# Data collection (DSA modules first, yfinance supplement second)
# ---------------------------------------------------------------------------

def collect_quote(ticker: str) -> Dict[str, Any]:
    """Realtime/last-close quote.

    US tickers: DSA YfinanceFetcher.get_realtime_quote (reused as-is).
    Canadian .TO/.V tickers: DSA does not support Canada, so we run the same
    yfinance calls DSA makes, via fast_info. Source is recorded per path.
    """
    symbol = to_yahoo_symbol(ticker)

    if not is_canadian(ticker):
        from data_provider.yfinance_fetcher import YfinanceFetcher
        quote = YfinanceFetcher().get_realtime_quote(symbol)
        if quote is not None:
            return {
                "source": "dsa:yfinance_fetcher",
                "name": quote.name,
                "currency": quote.currency or "USD",
                "price": quote.price,
                "change": quote.change_amount,
                "changePercent": quote.change_pct,
                "volume": quote.volume,
                "marketCap": quote.total_mv,
            }
        logger.warning("[%s] DSA fetcher returned None, falling back to yfinance fast_info", ticker)

    import yfinance as yf
    info = yf.Ticker(symbol).fast_info
    price = info.last_price
    prev = info.previous_close
    if price is None:
        raise RuntimeError(f"yfinance returned no price for {symbol}")
    return {
        "source": "yfinance:fast_info",
        "name": None,
        "currency": getattr(info, "currency", None) or ("CAD" if is_canadian(ticker) else "USD"),
        "price": float(price),
        "change": (float(price) - float(prev)) if prev else None,
        "changePercent": (round((float(price) - float(prev)) / float(prev) * 100, 2)) if prev else None,
        "volume": getattr(info, "last_volume", None),
        "marketCap": getattr(info, "market_cap", None),
    }


def collect_fundamentals(ticker: str) -> Dict[str, Any]:
    """DSA YfinanceFundamentalAdapter bundle (works for US and .TO)."""
    from data_provider.yfinance_fundamental_adapter import YfinanceFundamentalAdapter
    bundle = YfinanceFundamentalAdapter().get_fundamental_bundle(to_yahoo_symbol(ticker))
    growth = bundle.get("growth") or {}
    report = (bundle.get("earnings") or {}).get("financial_report") or {}
    dividend = (bundle.get("earnings") or {}).get("dividend") or {}
    return {
        "source": "dsa:yfinance_fundamental_adapter",
        "status": bundle.get("status"),
        "revenue": report.get("revenue"),
        "revenueGrowth": growth.get("revenue_yoy"),
        "roe": growth.get("roe") if growth.get("roe") is not None else report.get("roe"),
        "grossMargin": growth.get("gross_margin"),
        "dividendYield": dividend.get("ttm_dividend_yield_pct"),
        "reportDate": report.get("report_date"),
        "sector": next((b.get("name") for b in bundle.get("belong_boards") or [] if b.get("type") == "行业"), None),
        "errors": bundle.get("errors") or [],
    }


def collect_valuation(ticker: str) -> Dict[str, Any]:
    """Valuation/ratio fields DSA's bundle does not cover, from the same
    yfinance library DSA uses (Ticker.info)."""
    import yfinance as yf
    info = yf.Ticker(to_yahoo_symbol(ticker)).info or {}

    def num(key: str) -> Optional[float]:
        v = info.get(key)
        return float(v) if isinstance(v, (int, float)) else None

    high, low = num("fiftyTwoWeekHigh"), num("fiftyTwoWeekLow")
    price = num("currentPrice") or num("regularMarketPrice") or num("previousClose")
    position = None
    if high is not None and low is not None and price is not None and high > low:
        position = round((price - low) / (high - low) * 100, 1)

    return {
        "source": "yfinance:info",
        "pe": num("trailingPE"),
        "forwardPe": num("forwardPE"),
        "peg": num("trailingPegRatio") or num("pegRatio"),
        "profitMargin": pct(num("profitMargins")),
        "operatingMargin": pct(num("operatingMargins")),
        "eps": num("trailingEps"),
        "week52High": high,
        "week52Low": low,
        "week52PositionPercent": position,
        "longName": info.get("longName") or info.get("shortName"),
    }


def pct(ratio: Optional[float]) -> Optional[float]:
    return round(ratio * 100, 2) if ratio is not None else None


# ---------------------------------------------------------------------------
# Per-stock assembly with last-known-good fallback
# ---------------------------------------------------------------------------

def build_stock_entry(row: Dict[str, Any], previous: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    ticker = str(row.get("Ticker") or "").strip().upper()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    entry: Dict[str, Any] = dict(previous or {})
    entry.update({
        "symbol": ticker,
        "yahooSymbol": to_yahoo_symbol(ticker),
        "name": row.get("英文名称") or row.get("名称") or ticker,
        "nameZh": row.get("中文名称") or "",
        "theme": row.get("主题分类") or "",
    })
    entry.setdefault("news", [])
    entry.setdefault("aiAnalysis", {"status": "not_generated", "summary": "", "generatedAt": None})
    sources = set(entry.get("dataSources") or [])
    failures: List[str] = []

    if is_placeholder_row(row):
        entry["status"] = "placeholder"
        entry["statusDetail"] = "Non-investable placeholder (private company) — market data skipped."
        return entry

    try:
        quote = collect_quote(ticker)
        entry.update({
            "currency": quote["currency"],
            "price": quote["price"],
            "change": quote["change"],
            "changePercent": quote["changePercent"],
            "volume": quote["volume"],
            "marketCap": quote["marketCap"],
            "quoteUpdatedAt": now,
        })
        if quote.get("name") and not entry.get("name"):
            entry["name"] = quote["name"]
        sources.add(quote["source"])
    except Exception as exc:
        failures.append(f"quote: {exc}")
        logger.warning("[%s] quote failed: %s", ticker, exc)

    try:
        fund = collect_fundamentals(ticker)
        for key in ("revenue", "revenueGrowth", "roe", "grossMargin", "dividendYield", "reportDate", "sector"):
            if fund.get(key) is not None:
                entry[key] = fund[key]
        entry["fundamentalsUpdatedAt"] = now
        sources.add(fund["source"])
    except Exception as exc:
        failures.append(f"fundamentals: {exc}")
        logger.warning("[%s] fundamentals failed: %s", ticker, exc)

    try:
        val = collect_valuation(ticker)
        for key in ("pe", "forwardPe", "peg", "profitMargin", "operatingMargin", "eps",
                    "week52High", "week52Low", "week52PositionPercent"):
            if val.get(key) is not None:
                entry[key] = val[key]
        if val.get("longName") and not entry.get("name"):
            entry["name"] = val["longName"]
        sources.add(val["source"])
    except Exception as exc:
        failures.append(f"valuation: {exc}")
        logger.warning("[%s] valuation failed: %s", ticker, exc)

    entry["dataSources"] = sorted(sources)
    if not failures:
        entry["status"] = "ok"
        entry.pop("statusDetail", None)
    elif len(failures) == 3 and previous:
        entry["status"] = "stale"  # everything failed; previous values retained above
        entry["statusDetail"] = "; ".join(failures)
    elif len(failures) == 3:
        entry["status"] = "failed"
        entry["statusDetail"] = "; ".join(failures)
    else:
        entry["status"] = "partial"
        entry["statusDetail"] = "; ".join(failures)
    return entry


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def load_previous() -> Dict[str, Any]:
    if OUTPUT_PATH.exists():
        try:
            with open(OUTPUT_PATH, encoding="utf-8") as fh:
                return json.load(fh)
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Could not read previous latest.json (%s); starting fresh.", exc)
    return {}


def write_output(doc: Dict[str, Any]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=OUTPUT_PATH.parent, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        os.replace(tmp, OUTPUT_PATH)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def main() -> int:
    parser = argparse.ArgumentParser(description="DSA Adapter for Family Investment Radar")
    parser.add_argument("--stocks", help="Comma-separated subset of sheet tickers (pilot mode)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and report, do not write latest.json")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logging.getLogger("yfinance").setLevel(logging.WARNING)
    logging.getLogger("peewee").setLevel(logging.WARNING)

    load_env()

    rows = fetch_watchlist()
    by_ticker = {str(r.get("Ticker") or "").strip().upper(): r for r in rows if str(r.get("Ticker") or "").strip()}
    logger.info("Watchlist loaded from Google Sheet '%s': %d tickers", SHEET_TAB, len(by_ticker))

    if args.stocks:
        requested = [t.strip().upper() for t in args.stocks.split(",") if t.strip()]
        unknown = [t for t in requested if t not in by_ticker]
        if unknown:
            raise SystemExit(
                f"Tickers not in the sheet watchlist (sheet is the single source of truth): {unknown}"
            )
        selected = requested
    else:
        selected = list(by_ticker.keys())

    previous_doc = load_previous()
    previous_stocks = previous_doc.get("stocks") or {}
    merged_stocks: Dict[str, Any] = dict(previous_stocks)  # keep untouched tickers as-is

    ok, failed, partial, placeholders = [], [], [], []
    for ticker in selected:
        entry = build_stock_entry(by_ticker[ticker], previous_stocks.get(ticker))
        merged_stocks[ticker] = entry
        status = entry["status"]
        if status == "ok":
            ok.append(ticker)
        elif status == "placeholder":
            placeholders.append(ticker)
        elif status == "partial":
            partial.append(ticker)
        else:
            failed.append(ticker)
        logger.info("[%s] status=%s price=%s", ticker, status, entry.get("price"))

    doc = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "marketDate": datetime.now(timezone.utc).date().isoformat(),
        "watchlistSource": f"Google Sheet '{SHEET_TAB}' via Apps Script (read-only)",
        "engine": "dsa-adapter (daily_stock_analysis vendored modules + yfinance)",
        "runScope": "subset" if args.stocks else "full",
        "requestedSymbols": len(selected),
        "totalSymbols": len(by_ticker),
        "successful": len(ok),
        "partial": len(partial),
        "failed": len(failed),
        "placeholders": len(placeholders),
        "failedSymbols": failed,
        "stocks": merged_stocks,
    }

    print("\n===== DSA Adapter run summary =====")
    print(f"  requested : {len(selected)} of {len(by_ticker)} sheet tickers")
    print(f"  ok        : {len(ok)} {ok}")
    print(f"  partial   : {len(partial)} {partial}")
    print(f"  failed    : {len(failed)} {failed}")
    print(f"  placeholder: {len(placeholders)} {placeholders}")

    if args.dry_run:
        print("  dry-run: latest.json NOT written")
        return 0

    write_output(doc)
    print(f"  wrote     : {OUTPUT_PATH.relative_to(REPO_ROOT)}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
