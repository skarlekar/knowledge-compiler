---
name: net-worth-trend
description: Analyze the net worth trend from wiki/net-worth/history.md. Reports growth rate, peak/trough, and trajectory commentary.
argument-hint: (none required)
allowed-tools: [Read, Glob]
---

# net-worth-trend

Analyze net worth trend from the history file. Reports growth rates, peaks, troughs, and a plain-English trajectory assessment.

## Steps

### 1 — Read the history file

Read `wiki/net-worth/history.md`.

If the file does not exist or contains fewer than 2 data rows, report:

> "Not enough history to compute a trend. Run `net-worth-update` at least twice to build history."

### 2 — Parse history table

Extract each row: date, total_assets, total_liabilities, net_worth.

Sort by date ascending if not already.

### 3 — Compute trend metrics

```
first_entry = oldest row
last_entry = most recent row
total_change = last_entry.net_worth − first_entry.net_worth
total_pct_change = total_change / abs(first_entry.net_worth) × 100
days_elapsed = last_entry.date − first_entry.date

annualized_growth_rate = ((last/first)^(365/days_elapsed) − 1) × 100  (if days > 30)

peak_net_worth = max(net_worth across all rows)
trough_net_worth = min(net_worth across all rows)
current_vs_peak = (last_entry.net_worth − peak_net_worth) / peak_net_worth × 100
```

If the dataset has 3+ entries, compute:
- Quarter-over-quarter or month-over-month change for recent periods
- Trend direction: **Rising**, **Declining**, **Flat**, or **Volatile** (standard deviation > 10% of mean → Volatile)

### 4 — Generate the trend report

Present the analysis to the user:

```markdown
## Net Worth Trend Analysis — YYYY-MM-DD

**Period:** <first date> → <last date> (<N> snapshots)

### Summary

| Metric | Value |
| --- | --- |
| Starting Net Worth | $<first_entry.net_worth> |
| Current Net Worth | $<last_entry.net_worth> |
| Total Change | $<total_change> (<pct>%) |
| Annualized Growth Rate | <rate>% |
| Peak Net Worth | $<peak> (on <date>) |
| Trough Net Worth | $<trough> (on <date>) |
| Current vs. Peak | <pct>% |
| Trend Direction | <Rising / Declining / Flat / Volatile> |

### Recent Changes

| Period | Net Worth | Change |
| --- | --- | --- |
<Last 5 rows from history, most recent first>

### Asset vs. Liability Trend

<Summarize whether asset growth, liability reduction, or both are driving net worth change.>

### Commentary

<3–5 sentences of plain-English assessment. Example: "Net worth has grown $X over the past N months, driven primarily by investment portfolio appreciation (+$X) and real estate appreciation (+$X). Liabilities have declined by $X as the mortgage is paid down. The annualized growth rate of X% is [above/below/in line with] the general benchmark of ~7% real return for a diversified equity portfolio.">
```

### 5 — Report

Present the trend report directly to the user. This skill is read-only — it does not modify any wiki pages.
