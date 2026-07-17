# Analysis Engine — DSA Adapter

Backend analysis engine for Family Investment Radar, built on the open-source
[daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) (DSA,
MIT license) project.

## What it does

```text
Google Sheet "11 Stock Analysis"  (single source of truth for the watchlist)
        │  read-only, via the existing Apps Script Web App
        ▼
dsa_adapter.py  (vendored DSA data_provider modules + yfinance)
        ▼
data/stock-analysis/latest.json  (regenerable read-only cache)
```

- The ticker list is **never** maintained here. It is read from the Google
  Sheet on every run. `--stocks` can narrow a run to a subset, but rejects any
  ticker not present in the sheet.
- `latest.json` is a cache, not a database. A failed ticker keeps its previous
  values (last known good) and is marked `status: "stale"` — old data is never
  blanked out.
- Not included by design: DSA's Web dashboard, portfolio module, notification
  bots, chan-theory/wave-theory strategies, auto-trading, backtesting.

## Setup (one-time)

```bash
cd analysis-engine
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
git clone --depth 1 https://github.com/ZhuLinsen/daily_stock_analysis.git vendor/daily_stock_analysis
```

`vendor/` and `.venv/` are gitignored; CI recreates them.

Required environment (already in the repo root `.env`):

- `VITE_FAMILY_INVESTMENT_API_URL` (or `FAMILY_INVESTMENT_API_URL`) — the
  existing Apps Script Web App `/exec` URL. Read-only access, no key needed.

No market-data API key is required: quotes and fundamentals come from Yahoo
Finance via the `yfinance` library (the same fallback source DSA uses).

## Run

```bash
# Pilot subset
./.venv/bin/python dsa_adapter.py --stocks NVDA,QQQ,VFV.TO,HXQ.TO,XIU.TO

# Full sheet watchlist
./.venv/bin/python dsa_adapter.py

# Fetch + report only, no file written
./.venv/bin/python dsa_adapter.py --dry-run --stocks NVDA
```

Validate the output:

```bash
npm run validate:stock-data
```

## DSA reuse map

| Capability | Module used | Notes |
| --- | --- | --- |
| US quotes | `data_provider/yfinance_fetcher.py` (`YfinanceFetcher.get_realtime_quote`) | used as-is |
| Fundamentals (US + .TO) | `data_provider/yfinance_fundamental_adapter.py` | used as-is; handles `.TO` natively |
| Canadian quotes | thin extension in `dsa_adapter.py` | DSA does not support Canada; we call the same `yfinance` APIs it wraps |
| Valuation ratios (P/E, PEG, margins, 52w) | `yfinance` `Ticker.info` | fields DSA's bundle doesn't cover |
| News / AI analysis | not wired yet | Phase 3+; needs a search API key and LLM key |

## Ticker mapping

Sheet tickers are already Yahoo-format except Canadian share classes:
`TECK.B.TO` → `TECK-B.TO`. See `to_yahoo_symbol()`. The JSON key always stays
the sheet's original ticker.
