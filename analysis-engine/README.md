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
public/data/stock-analysis/latest.json  (regenerable read-only cache;
        served by the site at /data/stock-analysis/latest.json)
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

Use the bootstrap script — it clones DSA at a **pinned** version and builds the
venv, idempotently (safe to re-run, works on a fresh machine or in CI):

```bash
cd analysis-engine
./bootstrap.sh --venv
```

`vendor/` and `.venv/` are gitignored and never committed; the script recreates
them. DSA is pinned so a run never floats to upstream `main`:

| | value |
| --- | --- |
| DSA release | **v3.26.1** |
| commit SHA | `e8a9ca7742e8cb2498c8f491dd76d239b3064e1a` |

To bump the version, edit `DSA_REF` + `DSA_SHA` in `bootstrap.sh` together and
update this table. The script aborts if the checked-out HEAD does not match the
pinned SHA.

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

## Scheduler (the only one)

There is exactly **one** stock-data scheduler for this project:

- **Name:** Family Investment Stock Refresh
- **File:** `.github/workflows/stock-data-refresh.yml`
- **When:** weekdays, twice a day — **09:00** and **16:00 America/Vancouver**
  (cron with the IANA `timezone` field). Note: GitHub queues scheduled runs, so
  actual start times are often several hours late (observed Nov 2026: the
  "09:00" run usually lands ~14:00–15:00, the "16:00" run ~20:00).
- **Manual run:** GitHub → Actions → *Family Investment Stock Refresh* → *Run workflow*.
- **Secrets required:**
  - `FAMILY_INVESTMENT_API_URL` (read-only Apps Script Web App `/exec` URL).
  - `OPENAI_API_KEY` (for AI analysis; if unset, AI is skipped and only news
    + market data update). Both values are never logged.

The workflow uses GitHub Actions' per-schedule `timezone: "America/Vancouver"`
field, so the two runs are DST-safe without a UTC guard step.

Data flow:

```text
Google Sheet 11 Stock Analysis
  → GitHub Actions (Family Investment Stock Refresh)
  → DSA Adapter (this engine)
  → public/data/stock-analysis/latest.json
  → git commit to main (github-actions[bot])
  → Netlify automatic deployment
```

Safety properties:

- Commits **only** `public/data/stock-analysis/latest.json`, and only when the
  data meaningfully changed (volatile timestamps are ignored, so no no-op commits).
- A sanity gate (total ≈ 76, ok ≥ 60, required tickers present, no `CCJ.TO`, no
  dups) must pass before any commit; on failure the job stops and the previously
  committed **last-known-good** `latest.json` is preserved.
- No force-push; a rebase conflict fails the job instead.
- The workflow has no `push`/`pull_request` trigger, so its own data commit can
  never re-trigger it (no loop).
- Pinned DSA version is verified before running (see below).
- **This workflow is inert until it lands on the default branch `main`;** on the
  feature branch it does not run.

### News + AI analysis

- **News**: free Yahoo Finance headlines per stock (no key, no cost). Deduped,
  recent (≤14 days), top 5, with title/source/time/summary/url. Refreshed daily
  for every investable stock.
- **AI analysis**: OpenAI (`OPENAI_API_KEY`, model `OPENAI_MODEL` default
  `gpt-5-nano`). **Cost-gated** — an LLM call happens only when a stock is
  significantly changed: no prior analysis, |daily move| ≥ 5%, new news, new
  earnings, or analysis older than 3 days. Otherwise the previous analysis is
  carried forward. Capped at `AI_MAX_CALLS` (default 30) LLM calls per run.
  Output is cautious Chinese observation (summary/trend/risk/catalysts/note)
  with **no buy/sell advice**; on failure the prior analysis is kept, never
  fabricated. Both live in the same `latest.json` (`stocks[].news`,
  `stocks[].aiAnalysis`).

### Replaces the old Netlify stock scheduler

`netlify/functions/scheduledAnalyzeStocks.js` (previously cron `0 15,19,23 * * *`,
triggering Apps Script `analyze_stocks` to write into the `11 Stock Analysis`
tab) has had its `schedule` config commented out — it is **superseded** by this
GitHub Actions workflow, so there is only one automatic stock refresh. The
function body is kept for manual invocation / rollback. The two unrelated
schedulers stay active and untouched:

- `scheduledEnrichWatchlist.js` — enriches the `07 Watchlist` summaries
- `scheduledMarketTrendSummary.js` — daily AI market-trend summary

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

## Request throttling

Runs are sequential (no concurrency). Between tickers there is a
`INTER_STOCK_DELAY_S` (1.5s) pause; each network call retries up to
`MAX_RETRIES` (2) times with exponential backoff, but only on transient /
rate-limit-looking errors. A single ticker failing never blocks the batch. The
full 76-row run takes ~3.5 minutes and, in testing, hit zero rate limits.

## Status values in latest.json

| status | meaning |
| --- | --- |
| `ok` | all data fetched this run |
| `partial` | price present, but some fundamentals/valuation fields failed |
| `stale` | fresh fetch failed; previous last-known-good values retained |
| `unavailable` | no price from any source and no prior value — usually a wrong sheet ticker/exchange suffix (e.g. `CCJ.TO`; Cameco is `CCJ` on NYSE / `CCO.TO` on TSX). Reported, never fabricated. |
| `placeholder` | non-investable private company (OPENAI/ANTHROPIC/CURSOR/SPCX); market data skipped |
