# -*- coding: utf-8 -*-
"""
DSA Adapter — Family Investment Radar analysis engine.

Reads the stock watchlist from the existing Google Sheet ("11 Stock Analysis"
tab, via the same Apps Script Web App the site already uses), runs quote +
fundamental collection through the vendored daily_stock_analysis (DSA)
modules, and writes a standardized read-only cache to
../public/data/stock-analysis/latest.json (served by the site at
/data/stock-analysis/latest.json).

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
import random
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, TypeVar

ENGINE_DIR = Path(__file__).resolve().parent
REPO_ROOT = ENGINE_DIR.parent
VENDOR_DIR = ENGINE_DIR / "vendor" / "daily_stock_analysis"
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "stock-analysis" / "latest.json"
SHEET_TAB = "11 Stock Analysis"

# Sheet rows that are known non-investable placeholders (private companies).
# They stay in the sheet (sheet is SSOT) but are skipped for market data.
PLACEHOLDER_HINTS = {"不可投", "未上市", "private"}

# Request throttling / retry (be a good Yahoo citizen; never hammer it).
INTER_STOCK_DELAY_S = 1.5      # pause between tickers (sequential run)
MAX_RETRIES = 2               # retries per network call, on top of the first try
BACKOFF_BASE_S = 2.0          # exponential backoff base
RATE_LIMIT_HINTS = ("rate limit", "too many requests", "429", "try again", "timed out", "timeout")

sys.path.insert(0, str(VENDOR_DIR))

logger = logging.getLogger("dsa_adapter")

# Set by main(): counts how many calls hit an apparent rate limit / retry.
rate_limit_events = 0

T = TypeVar("T")


def with_retry(label: str, fn: Callable[[], T]) -> T:
    """Run fn with up to MAX_RETRIES retries and exponential backoff.
    Only transient/rate-limit-looking errors are retried; others fail fast."""
    global rate_limit_events
    attempt = 0
    while True:
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 — deliberately broad; caller isolates
            transient = any(h in str(exc).lower() for h in RATE_LIMIT_HINTS)
            if any(h in str(exc).lower() for h in ("rate limit", "too many requests", "429")):
                rate_limit_events += 1
            if attempt >= MAX_RETRIES or not transient:
                raise
            delay = BACKOFF_BASE_S * (2 ** attempt) + random.uniform(0, 0.5)
            logger.warning("[%s] transient error (attempt %d/%d), retrying in %.1fs: %s",
                           label, attempt + 1, MAX_RETRIES, delay, exc)
            time.sleep(delay)
            attempt += 1


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
        quote = with_retry(f"{ticker} quote", lambda: YfinanceFetcher().get_realtime_quote(symbol))
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
    info = with_retry(f"{ticker} fast_info", lambda: yf.Ticker(symbol).fast_info)
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
    bundle = with_retry(
        f"{ticker} fundamentals",
        lambda: YfinanceFundamentalAdapter().get_fundamental_bundle(to_yahoo_symbol(ticker)),
    )
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
    info = with_retry(f"{ticker} info", lambda: yf.Ticker(to_yahoo_symbol(ticker)).info) or {}

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
# News (free, no API key — Yahoo Finance via yfinance)
# ---------------------------------------------------------------------------

NEWS_LIMIT = 5
NEWS_MAX_AGE_DAYS = 14


def _parse_iso_ts(value: Any) -> Optional[float]:
    if not value:
        return None
    try:
        s = str(value).replace("Z", "+00:00")
        return datetime.fromisoformat(s).timestamp()
    except (ValueError, TypeError):
        return None


def collect_news(ticker: str) -> List[Dict[str, Any]]:
    import yfinance as yf
    raw = with_retry(f"{ticker} news", lambda: yf.Ticker(to_yahoo_symbol(ticker)).news) or []
    cutoff = datetime.now(timezone.utc).timestamp() - NEWS_MAX_AGE_DAYS * 86400
    items: List[Dict[str, Any]] = []
    seen = set()
    for r in raw:
        c = r.get("content") or r
        title = str(c.get("title") or "").strip()
        if not title:
            continue
        url = (
            (c.get("canonicalUrl") or {}).get("url")
            or (c.get("clickThroughUrl") or {}).get("url")
            or ""
        )
        key = (url or title).lower()
        if key in seen:
            continue
        pub = c.get("pubDate") or c.get("displayTime") or ""
        ts = _parse_iso_ts(pub)
        if ts is not None and ts < cutoff:
            continue
        seen.add(key)
        items.append({
            "title": title,
            "summary": str(c.get("summary") or c.get("description") or "").strip(),
            "source": (c.get("provider") or {}).get("displayName") or "Yahoo Finance",
            "publishedAt": pub,
            "url": url,
        })
        if len(items) >= NEWS_LIMIT:
            break
    return items


def _news_signature(news: Optional[List[Dict[str, Any]]]) -> List[str]:
    return sorted((n.get("url") or n.get("title") or "") for n in (news or []))


# ---------------------------------------------------------------------------
# AI analysis (OpenAI, cost-gated — only significant-change stocks)
# ---------------------------------------------------------------------------

AI_STALE_DAYS = 3
AI_SIGNIFICANT_MOVE_PCT = 5.0
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


def openai_key() -> str:
    return os.environ.get("OPENAI_API_KEY") or os.environ.get("HEALTH_PASSPORT_OPENAI_API_KEY") or ""


def openai_model() -> str:
    return os.environ.get("OPENAI_MODEL", "gpt-5-nano")


def determine_ai_need(entry: Dict[str, Any], previous: Optional[Dict[str, Any]],
                      fresh_news: List[Dict[str, Any]]) -> tuple:
    """Return (needed, reasons, score). Score orders which stocks get the LLM
    budget first. Only significant changes trigger a (paid) LLM call; otherwise
    the previous analysis is carried forward."""
    prev = previous or {}
    prev_ai = prev.get("aiAnalysis") or {}
    reasons: List[str] = []
    score = 0.0
    chg = entry.get("changePercent")
    if isinstance(chg, (int, float)):
        score = abs(chg)
        if abs(chg) >= AI_SIGNIFICANT_MOVE_PCT:
            reasons.append(f"move {chg:+.1f}%")
    if prev_ai.get("status") != "ok":
        reasons.append("first analysis")
        score += 100.0  # first-time stocks get top priority
    else:
        if _news_signature(fresh_news) != _news_signature(prev.get("news")):
            reasons.append("new news")
            score += 10.0
        gen = _parse_iso_ts(prev_ai.get("generatedAt"))
        if gen is None or (datetime.now(timezone.utc).timestamp() - gen) > AI_STALE_DAYS * 86400:
            reasons.append("stale")
            score += 5.0
        if entry.get("reportDate") and entry.get("reportDate") != prev.get("reportDate"):
            reasons.append("new earnings")
            score += 20.0
    return bool(reasons), reasons, score


def _extract_openai_text(data: Dict[str, Any]) -> str:
    if isinstance(data.get("output_text"), str) and data["output_text"].strip():
        return data["output_text"]
    for item in data.get("output", []):
        if item.get("type") == "message":
            for c in item.get("content", []):
                if c.get("type") in ("output_text", "text") and c.get("text"):
                    return c["text"]
    raise RuntimeError("no text in OpenAI response")


def generate_ai_analysis(entry: Dict[str, Any], news: List[Dict[str, Any]]) -> Dict[str, Any]:
    import requests
    key = openai_key()
    if not key:
        raise RuntimeError("OPENAI_API_KEY not configured")
    model = openai_model()
    headlines = "\n".join(
        f"- {n['title']}" + (f"（{n['summary']}）" if n.get("summary") else "")
        for n in news[:5]
    ) or "（暂无近期新闻）"
    facts = {
        "名称": entry.get("nameZh") or entry.get("name"),
        "代码": entry.get("symbol"),
        "现价": entry.get("price"),
        "日涨跌%": entry.get("changePercent"),
        "PE": entry.get("pe"),
        "ForwardPE": entry.get("forwardPe"),
        "营收增长%": entry.get("revenueGrowth"),
        "ROE%": entry.get("roe"),
        "股息率%": entry.get("dividendYield"),
        "52周位置%": entry.get("week52PositionPercent"),
    }
    prompt = (
        "你是面向华人家庭投资者的股票观察助手。根据下列公开数据和新闻，用简体中文给出简洁、谨慎的观察分析。"
        "严禁给出买入/卖出/持有等任何交易建议，只做趋势观察与风险提示。只依据提供的信息，信息不足就写明不确定。\n\n"
        f"数据：{json.dumps(facts, ensure_ascii=False)}\n近期新闻：\n{headlines}\n\n"
        "只输出一个JSON对象，字段：summary(一段话中文总结，不超过120字)、trend(取值：偏多/偏空/中性)、"
        "riskLevel(取值：低/中/高)、catalysts(字符串数组，2-4个关注点或驱动因素)、note(一句风险或不确定性提示)。"
    )
    body = {
        "model": model,
        "max_output_tokens": 1500,
        "reasoning": {"effort": "minimal"},
        "input": [
            {"role": "system", "content": [{"type": "input_text",
                "text": "你是谨慎的中文投资观察助手，只分析公开信息，不提供买卖建议，必须只输出严格JSON对象。"}]},
            {"role": "user", "content": [{"type": "input_text", "text": prompt}]},
        ],
        "text": {"format": {"type": "json_object"}},
    }
    resp = requests.post(
        OPENAI_RESPONSES_URL,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=body, timeout=60,
    )
    data = resp.json()
    if not resp.ok:
        raise RuntimeError((data.get("error") or {}).get("message") or f"OpenAI HTTP {resp.status_code}")
    parsed = json.loads(_extract_openai_text(data))
    return {
        "status": "ok",
        "summary": str(parsed.get("summary", "")).strip(),
        "trend": str(parsed.get("trend", "")).strip(),
        "riskLevel": str(parsed.get("riskLevel", "")).strip(),
        "catalysts": [str(c).strip() for c in (parsed.get("catalysts") or []) if str(c).strip()][:4],
        "note": str(parsed.get("note", "")).strip(),
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": model,
    }


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

    # News — free (Yahoo), refreshed daily for every investable stock. On failure
    # keep the prior news list rather than blanking it.
    try:
        entry["news"] = collect_news(ticker)
        entry["newsUpdatedAt"] = now
        sources.add("yfinance:news")
    except Exception as exc:
        # News is supplementary — a failure keeps prior news and does NOT
        # downgrade the market-data status.
        logger.warning("[%s] news failed (keeping prior): %s", ticker, exc)

    # Decide whether this stock needs a (paid) LLM analysis this run. The actual
    # OpenAI call happens in the capped AI pass in main(); here we only flag it.
    needed, reasons, score = determine_ai_need(entry, previous, entry.get("news") or [])
    entry["_aiNeed"] = {"needed": needed, "reasons": reasons, "score": score}

    entry["dataSources"] = sorted(sources)
    has_price = isinstance(entry.get("price"), (int, float))
    if not failures:
        entry["status"] = "ok"
        entry.pop("statusDetail", None)
    elif not has_price and previous and isinstance(previous.get("price"), (int, float)):
        # All fresh data missing, but a prior good price exists: keep it, mark stale.
        entry["status"] = "stale"
        entry["statusDetail"] = "; ".join(failures)
    elif not has_price:
        # No fresh price and no last-known-good — do not pretend it's usable.
        # Most common cause: the sheet ticker does not resolve on Yahoo
        # (e.g. a wrong exchange suffix). Reported, never fabricated.
        entry["status"] = "unavailable"
        entry["statusDetail"] = "; ".join(failures) or "no price data from any source"
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
    # Keep untouched tickers as-is, but drop any that the sheet no longer lists
    # so latest.json stays in sync with the SSOT even on an incremental run
    # (e.g. a ticker renamed CCJ.TO -> CCO.TO removes the old key).
    merged_stocks: Dict[str, Any] = {t: e for t, e in previous_stocks.items() if t in by_ticker}
    pruned = [t for t in previous_stocks if t not in by_ticker]
    if pruned:
        logger.info("Pruned %d ticker(s) no longer in the sheet: %s", len(pruned), pruned)

    buckets: Dict[str, List[str]] = {
        "ok": [], "partial": [], "stale": [], "unavailable": [], "failed": [], "placeholder": [],
    }
    started = time.monotonic()
    for index, ticker in enumerate(selected):
        entry = build_stock_entry(by_ticker[ticker], previous_stocks.get(ticker))
        merged_stocks[ticker] = entry
        status = entry["status"]
        buckets.get(status, buckets["failed"]).append(ticker)
        logger.info("[%s] status=%s price=%s", ticker, status, entry.get("price"))
        # Throttle between tickers (skip after the last one and after placeholders,
        # which made no network calls).
        if index < len(selected) - 1 and status != "placeholder":
            time.sleep(INTER_STOCK_DELAY_S)

    # ---- AI analysis pass (cost-gated) --------------------------------------
    # Only stocks flagged as significantly changed get a (paid) LLM call, capped
    # per run. Everything else carries its previous analysis forward. On any
    # failure the prior analysis is kept; nothing is fabricated.
    ai_done, ai_failed, ai_skipped_budget = 0, 0, 0
    ai_budget = int(os.environ.get("AI_MAX_CALLS", "30"))
    candidates = [
        (t, merged_stocks[t]) for t in selected
        if merged_stocks[t].get("_aiNeed", {}).get("needed")
        and merged_stocks[t].get("status") in ("ok", "partial", "stale")
    ]
    candidates.sort(key=lambda te: te[1]["_aiNeed"]["score"], reverse=True)
    if not openai_key():
        logger.warning("OPENAI_API_KEY not set — skipping AI analysis (news still updated).")
    else:
        for rank, (t, e) in enumerate(candidates):
            if rank >= ai_budget:
                ai_skipped_budget += 1
                if (e.get("aiAnalysis") or {}).get("status") != "ok":
                    e["aiAnalysis"] = {"status": "pending", "summary": "", "generatedAt": None}
                continue
            try:
                e["aiAnalysis"] = generate_ai_analysis(e, e.get("news") or [])
                ai_done += 1
                logger.info("[%s] AI analysis generated (%s)", t, ", ".join(e["_aiNeed"]["reasons"]))
            except Exception as exc:
                ai_failed += 1
                logger.warning("[%s] AI analysis failed (keeping prior): %s", t, exc)
                if (e.get("aiAnalysis") or {}).get("status") != "ok":
                    e["aiAnalysis"] = {"status": "pending", "summary": "", "generatedAt": None}
            time.sleep(0.4)
    for e in merged_stocks.values():
        e.pop("_aiNeed", None)  # strip internal scheduling field from output

    elapsed = time.monotonic() - started

    # This run's buckets (what was processed this invocation).
    ok = buckets["ok"]
    partial = buckets["partial"]
    stale = buckets["stale"]
    unavailable = buckets["unavailable"]
    failed = buckets["failed"]
    placeholders = buckets["placeholder"]

    # Top-level summary describes the WHOLE cache (all 76 tickers), not just the
    # subset processed this run — so the frontend status strip is meaningful
    # after an incremental run too.
    file_counts: Dict[str, int] = {
        "ok": 0, "partial": 0, "stale": 0, "unavailable": 0, "failed": 0, "placeholder": 0,
    }
    file_failed_symbols: List[str] = []
    file_unavailable_symbols: List[str] = []
    file_stale_symbols: List[str] = []
    ai_ok_total = 0
    news_total = 0
    for tk, entry in merged_stocks.items():
        st = entry.get("status", "failed")
        file_counts[st] = file_counts.get(st, 0) + 1
        if st == "failed":
            file_failed_symbols.append(tk)
        elif st == "unavailable":
            file_unavailable_symbols.append(tk)
        elif st == "stale":
            file_stale_symbols.append(tk)
        if (entry.get("aiAnalysis") or {}).get("status") == "ok":
            ai_ok_total += 1
        if entry.get("news"):
            news_total += 1

    doc = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "marketDate": datetime.now(timezone.utc).date().isoformat(),
        "watchlistSource": f"Google Sheet '{SHEET_TAB}' via Apps Script (read-only)",
        "engine": "dsa-adapter (daily_stock_analysis vendored modules + yfinance)",
        "runScope": "subset" if args.stocks else "full",
        "requestedSymbols": len(selected),
        "totalSymbols": len(by_ticker),
        # Whole-file counts (drive the frontend status strip):
        "successful": file_counts["ok"],
        "partial": file_counts["partial"],
        "stale": file_counts["stale"],
        "unavailable": file_counts["unavailable"],
        "failed": file_counts["failed"],
        "placeholders": file_counts["placeholder"],
        "failedSymbols": file_failed_symbols,
        "staleSymbols": file_stale_symbols,
        "unavailableSymbols": file_unavailable_symbols,
        # This-run detail (for logs/debugging):
        "thisRun": {
            "ok": len(ok), "partial": len(partial), "stale": len(stale),
            "unavailable": len(unavailable), "failed": len(failed), "placeholder": len(placeholders),
        },
        "rateLimitEvents": rate_limit_events,
        "runSeconds": round(elapsed, 1),
        "aiAnalyzed": ai_ok_total,
        "newsCovered": news_total,
        "thisRunAi": {"generated": ai_done, "failed": ai_failed, "skippedOverBudget": ai_skipped_budget, "budget": ai_budget},
        "stocks": merged_stocks,
    }

    print("\n===== DSA Adapter run summary =====")
    print(f"  requested   : {len(selected)} of {len(by_ticker)} sheet tickers")
    print(f"  ok          : {len(ok)} {ok}")
    print(f"  partial     : {len(partial)} {partial}")
    print(f"  stale       : {len(stale)} {stale}")
    print(f"  unavailable : {len(unavailable)} {unavailable}")
    print(f"  failed      : {len(failed)} {failed}")
    print(f"  placeholder : {len(placeholders)} {placeholders}")
    print(f"  news covered: {news_total} | AI analyzed (file total): {ai_ok_total}")
    print(f"  AI this run : generated={ai_done} failed={ai_failed} over-budget={ai_skipped_budget} (budget={ai_budget})")
    print(f"  rate-limit events: {rate_limit_events}")
    print(f"  elapsed     : {elapsed:.1f}s")

    if args.dry_run:
        print("  dry-run: latest.json NOT written")
        return 0

    write_output(doc)
    print(f"  wrote       : {OUTPUT_PATH.relative_to(REPO_ROOT)}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
