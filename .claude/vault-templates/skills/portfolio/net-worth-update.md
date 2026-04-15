---
name: net-worth-update
description: Recompute net worth from all holding, asset, and liability pages. Overwrites wiki/net-worth/current.md and appends a row to wiki/net-worth/history.md.
argument-hint: (none required)
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# net-worth-update

Recompute net worth from all holdings, assets, and liabilities. Overwrites `wiki/net-worth/current.md` and appends a timestamped row to `wiki/net-worth/history.md`.

## Steps

### 1 — Load all holdings and compute investment portfolio value

Read all files in `wiki/holdings/*.md`.

Refresh stale prices (older than 7 days) by invoking the refresh skill for each:

`Skill({ skill: "refresh", args: "<ticker>" })`

For each holding:
```
market_value = shares × price_last_fetched
```

```
total_investment_portfolio = sum of all market_value
total_investment_cost_basis = sum of (shares × cost_basis_per_share)
```

Group by account type:
```
retirement_value = sum of market_value for retirement-ira and retirement-roth holdings
non_retirement_value = sum of market_value for non-retirement holdings
```

### 2 — Load all non-investment assets

Read all files in `wiki/assets/*.md`.

Check each asset's `value_date`. If it is older than 90 days, add a note that this asset's value may be stale.

```
total_non_investment_assets = sum of estimated_value
```

Group by asset type: real-estate, vehicle, cash, collectible, other.

### 3 — Load all liabilities

Read all files in `wiki/liabilities/*.md`.

```
total_liabilities = sum of outstanding_balance
```

Group by liability type: mortgage, auto-loan, student-loan, credit-card, heloc, other.

### 4 — Compute net worth

```
total_assets = total_investment_portfolio + total_non_investment_assets
net_worth = total_assets − total_liabilities
```

### 5 — Overwrite wiki/net-worth/current.md

Ensure the `wiki/net-worth/` directory exists.

Write the following (overwrite any existing content):

```markdown
---
title: "Net Worth — Current"
type: net-worth-snapshot
tags: [net-worth, portfolio]
created: <first ever creation date>
updated: YYYY-MM-DD
confidence: <high if all prices fresh | medium if any stale>
---

# Net Worth — Current

*Last updated: YYYY-MM-DD*

## Total Net Worth

| Category | Value |
| --- | --- |
| **Total Assets** | **$<total_assets>** |
| **Total Liabilities** | **$<total_liabilities>** |
| **Net Worth** | **$<net_worth>** |

## Investment Portfolio

| Sub-category | Value |
| --- | --- |
| Total Market Value | $<total_investment_portfolio> |
| Total Cost Basis | $<total_investment_cost_basis> |
| Unrealized Gain/Loss | $<gain_loss> (<pct>%) |
| Retirement (IRA + Roth) | $<retirement_value> |
| Non-Retirement | $<non_retirement_value> |

*<N> holdings tracked. Last price refresh: YYYY-MM-DD.*

## Non-Investment Assets

| Type | Value |
| --- | --- |
| Real Estate | $<real_estate_value> |
| Vehicles | $<vehicle_value> |
| Cash Accounts | $<cash_value> |
| Other | $<other_value> |
| **Total** | **$<total_non_investment_assets>** |

<If any asset's value is older than 90 days, add a "> ⚠️ **Stale data:**" callout listing which assets need updating.>

## Liabilities

| Type | Balance |
| --- | --- |
| Mortgage | $<mortgage_balance> |
| Auto Loans | $<auto_balance> |
| Student Loans | $<student_balance> |
| Credit Cards | $<credit_card_balance> |
| Other | $<other_balance> |
| **Total** | **$<total_liabilities>** |

## Asset Class Allocation (% of Total Assets)

| Asset Class | Value | % of Assets |
| --- | --- | --- |
| Equities | $<equity_value> | <pct>% |
| Fixed Income | $<fi_value> | <pct>% |
| Real Estate | $<re_value> | <pct>% |
| Cash | $<cash_value> | <pct>% |
| Other | $<other_value> | <pct>% |

## History

See [Net Worth History](history.md) for the full trend.
```

### 6 — Append to wiki/net-worth/history.md

Create the file if it does not exist with this header:

```markdown
---
title: "Net Worth History"
type: net-worth-snapshot
tags: [net-worth, history]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Net Worth History

| Date | Total Assets | Total Liabilities | Net Worth | Change vs. Prior |
| --- | --- | --- | --- | --- |
```

Append one row:

```markdown
| YYYY-MM-DD | $<total_assets> | $<total_liabilities> | $<net_worth> | <+/->$<change from prior row, or "—" if first entry> |
```

### 7 — Update index and log

**A. Ensure `wiki/index.md`** has a Net Worth section and that both `current.md` and `history.md` are listed.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Net Worth Update

- **Trigger**: `net-worth-update`
- **Net worth**: $<net_worth>
- **Total assets**: $<total_assets>
- **Total liabilities**: $<total_liabilities>
- **Investment portfolio**: $<investment_portfolio>
- **Stale asset values**: <N assets older than 90 days>
```

### 8 — Report

Tell the user:
- Net worth: $<net_worth>
- Total assets: $<total_assets> | Total liabilities: $<total_liabilities>
- Investment portfolio: $<investment_portfolio> (gain/loss vs. cost basis)
- Any stale asset values that need manual updating
