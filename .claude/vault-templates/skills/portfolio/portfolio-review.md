---
name: portfolio-review
description: Comprehensive portfolio analysis — allocation, concentration, sector exposure, thesis health, and drift. Produces a performance-snapshot page and a summary report.
argument-hint: (none required)
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# portfolio-review

Generate a comprehensive portfolio review: allocation analysis, concentration risk, sector exposure, thesis health summary, and drift vs. targets. Produces a new performance-snapshot page.

## Steps

### 1 — Load all holdings

Use Glob to list all files in `wiki/holdings/*.md`. Read each file.

Parse from each holding page:
- `ticker`
- `holding_type`
- `tax_account`
- `shares`
- `price_last_fetched`
- `price_fetch_date`
- `cost_basis_per_share`
- `target_weight_pct`
- `conviction`
- `sector`
- `asset_class`

If any holding's `price_fetch_date` is older than 7 days, automatically refresh it by invoking the refresh skill inline:

`Skill({ skill: "refresh", args: "<ticker>" })`

Repeat for all stale holdings, then re-read the updated pages.

### 2 — Load all assets and liabilities (for net-worth context)

Read `wiki/net-worth/current.md` if it exists to get total assets and liabilities.

If it does not exist, note "Net worth snapshot not available — run `net-worth-update`."

### 3 — Compute portfolio metrics

For each holding:

```
market_value = shares × price_last_fetched
unrealized_gain_loss = (price_last_fetched − cost_basis_per_share) × shares
unrealized_return_pct = (price_last_fetched − cost_basis_per_share) / cost_basis_per_share × 100
```

Total portfolio value:
```
total_portfolio_value = sum of all market_value
```

For each holding:
```
actual_weight_pct = market_value / total_portfolio_value × 100
drift_pct = actual_weight_pct − target_weight_pct  (null if no target set)
```

### 4 — Identify concentration risks

Flag holdings that meet any of these conditions:
- Single holding > 10% of portfolio → **High concentration**
- Single sector > 30% of portfolio → **Sector concentration**
- Single asset class > 60% of portfolio (excluding planned overweights) → **Asset-class concentration**
- More than 3 holdings with `conviction: low` → **Low-conviction cluster**
- Retirement accounts < 60% of total investable assets → **Tax allocation note**

### 5 — Read thesis health across all holdings

For each holding, check if its thesis page exists and read the `## Last Validated` section.

Categorize:
- Thesis not yet validated (no `## Last Validated` section)
- Thesis healthy
- Thesis monitoring
- Thesis at risk
- Thesis broken

### 6 — Create the performance-snapshot page

Filename: `wiki/performance/snapshot-<YYYY-MM-DD>.md`

Check if this file already exists; if so, append `-v2`, `-v3`.

```markdown
---
title: "Portfolio Snapshot — YYYY-MM-DD"
type: performance-snapshot
tags: [performance, portfolio-review]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high
snapshot_date: YYYY-MM-DD
total_portfolio_value: <total>
total_cost_basis: <cost>
unrealized_gain_loss: <gain_loss>
---

# Portfolio Snapshot — YYYY-MM-DD

## Summary

| Metric | Value |
| --- | --- |
| Total Portfolio Value | $<total> |
| Total Cost Basis | $<cost> |
| Unrealized Gain/Loss | $<gain_loss> (<pct>%) |
| Number of Holdings | <N> |
| Holdings with Target Weight Set | <N> |

## Allocation Table

| Ticker | Type | Account | Shares | Price | Market Value | Weight | Target | Drift | G/L |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [<TICKER>](../holdings/<ticker>.md) | <type> | <account> | <shares> | $<price> | $<value> | <weight>% | <target>% | <drift>% | $<gl> |

*Holdings sorted by market value descending.*

## Concentration Flags

<List all concentration risks identified in Step 4. Use "> ⚠️ **Flag:**" callout style.>

## Sector Breakdown

| Sector | Market Value | Weight |
| --- | --- | --- |
| <Sector> | $<value> | <pct>% |

## Asset Class Breakdown

| Asset Class | Market Value | Weight |
| --- | --- | --- |
| <Class> | $<value> | <pct>% |

## Account Type Breakdown

| Account | Market Value | Weight |
| --- | --- | --- |
| Retirement (IRA + Roth) | $<value> | <pct>% |
| Non-Retirement | $<value> | <pct>% |

## Thesis Health Summary

| Ticker | Conviction | Thesis Health | Last Validated |
| --- | --- | --- | --- |
| [<TICKER>](../holdings/<ticker>.md) | <high/med/low> | <Healthy/Monitoring/At Risk/Broken/Not Validated> | <date or "Never"> |

## Top Movers (vs. Cost Basis)

**Best Performers:**
1. <TICKER> — +<pct>% ($<gain>)

**Worst Performers:**
1. <TICKER> — <pct>% ($<loss>)
```

### 7 — Update sector and asset-class pages

For each sector and asset class page in the wiki, update the `## Portfolio Exposure` and `## Current Allocation` tables to reflect current weights from this snapshot.

### 8 — Update index and log

**A. Add to `wiki/index.md`** under the Performance section.

The Performance table has columns: Page, Date, Total Value, Unrealized G/L.

Also increment the Performance count in Statistics.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Portfolio Review

- **Trigger**: `portfolio-review`
- **Snapshot**: `wiki/performance/snapshot-<date>.md`
- **Total portfolio value**: $<value>
- **Holdings analyzed**: <N>
- **Concentration flags**: <N>
- **Theses needing review**: <N>
```

### 9 — Invoke journal

`Skill({ skill: "journal", args: "portfolio-review" })`

### 10 — Report

Tell the user:
- Total portfolio value: $<total>
- Unrealized gain/loss: $<amount> (<pct>%)
- Number of holdings, concentration flags raised
- List of theses that need validation (`thesis-check <ticker>`)
- Suggest running `rebalance` if any drift > 5%
