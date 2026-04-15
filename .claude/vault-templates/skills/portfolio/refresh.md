---
name: refresh
description: Re-fetch current prices, news, and analyst data for one holding or all holdings. Updates holding pages and marks data as fresh.
argument-hint: "<ticker> | all"
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# refresh

Refresh price, news, and analyst data for one holding or all holdings in the portfolio.

## Arguments

- `<ticker>` — refresh a single holding (e.g., `AAPL`)
- `all` — refresh every holding in `wiki/holdings/`

## Steps

### 1 — Identify holdings to refresh

If argument is `all`:
- Use Glob to list all files matching `wiki/holdings/*.md`
- Parse each file's frontmatter to get the ticker symbol

If argument is a ticker:
- Verify `wiki/holdings/<ticker-lowercase>.md` exists; if not, report and stop

### 2 — For each holding, fetch updated data

**A. Current price**

Search: `<ticker> current stock price today`

Extract: current price (USD) and the date/time.

**B. Recent news (last 30 days)**

Search: `<ticker> news last 30 days`

Extract 3–5 material news items with dates. Replace the existing `## Recent News` section.

**C. Analyst ratings (stocks and ETFs)**

Search: `<ticker> analyst rating price target consensus`

Extract: consensus rating, average price target, brief commentary. Replace the existing `## Analyst View` section.

**D. For bonds/treasuries only**

Search: `<ticker> yield maturity current rate`

Extract: current yield. Update the `## Overview` section accordingly.

### 3 — Update each holding page

For each refreshed holding:

1. Update frontmatter:
   - `price_last_fetched: <new_price>`
   - `price_fetch_date: YYYY-MM-DD`
   - `updated: YYYY-MM-DD`
   - Recompute `unrealized_gain_loss` in the `## Current Position` table

2. Replace `## Recent News` with fresh bullets

3. Replace `## Analyst View` with fresh data

4. Update `confidence`:
   - Set to `high` if data was fetched successfully today
   - Set to `medium` if only partial data was available

### 4 — Update index and log

**A. Update the `updated` date** for each refreshed holding in `wiki/index.md`.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Refresh: <ticker or "All Holdings">

- **Trigger**: `refresh <ticker or all>`
- **Holdings refreshed**: <N>
- **Tickers**: <comma-separated list>
- **Prices updated**: <list: TICKER $price>
```

### 5 — Invoke journal

`Skill({ skill: "journal", args: "refresh: <ticker or all>" })`

### 6 — Report

Tell the user:
- Number of holdings refreshed
- For each refreshed holding: ticker, new price, price change from cost basis
- Any tickers where data fetch failed (mark those as `confidence: low`)
