---
name: rebalance
description: Drift analysis and trade suggestion list. Identifies holdings that are over/under their target weights and suggests specific buy/sell/trim actions to restore target allocation.
argument-hint: (none required)
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# rebalance

Analyze portfolio drift and generate a specific, actionable rebalance trade list. Respects account type (retirement vs. non-retirement) for tax efficiency.

## Steps

### 1 — Load all holdings with target weights

Read all files in `wiki/holdings/*.md`.

Parse: `ticker`, `shares`, `price_last_fetched`, `price_fetch_date`, `cost_basis_per_share`, `target_weight_pct`, `tax_account`, `conviction`, `asset_class`.

Holdings without a `target_weight_pct` are excluded from rebalance calculations (noted as "no target set").

Refresh any holdings with `price_fetch_date` older than 7 days:

`Skill({ skill: "refresh", args: "<ticker>" })`

### 2 — Compute current allocation

```
total_portfolio_value = sum(shares × price_last_fetched)
actual_weight_pct[ticker] = (shares × price) / total_portfolio_value × 100
drift_pct[ticker] = actual_weight_pct − target_weight_pct
```

### 3 — Identify rebalance candidates

Apply a drift threshold of **±2%** (flag for attention) and **±5%** (strong rebalance signal):

- Holdings where `drift_pct > 2%` → **Overweight** (consider trimming)
- Holdings where `drift_pct < -2%` → **Underweight** (consider adding)
- Holdings where `drift_pct > 5%` → **Significantly overweight** (prioritize trim)
- Holdings where `drift_pct < -5%` → **Significantly underweight** (prioritize add)

### 4 — Generate trade suggestions

For each rebalance candidate:

```
target_value = target_weight_pct / 100 × total_portfolio_value
current_value = shares × price
value_delta = target_value − current_value
share_delta = value_delta / price   (round to nearest whole share for stocks; nearest 0.001 for ETFs)
```

If `share_delta > 0` → Buy suggestion
If `share_delta < 0` → Sell/trim suggestion

**Tax efficiency rules:**

- For **retirement accounts** (IRA/Roth): Rebalancing has no immediate tax consequence. All drift candidates are eligible.
- For **non-retirement accounts**: Prefer trimming positions with a gain only when drift > 5% OR the thesis is `At Risk`/`Broken`. For positions with a loss, trimming for tax-loss harvesting is always eligible — flag these explicitly.
- Suggest funding underweight positions in non-retirement accounts with new cash before selling overweights (avoids taxable events).

### 5 — Output the rebalance plan

Format the trade list as a prioritized table:

```markdown
## Rebalance Trade List — YYYY-MM-DD

**Total Portfolio Value:** $<total>

### Priority Trades (drift > 5%)

| Action | Ticker | Shares | Est. Value | Account | Reason |
| --- | --- | --- | --- | --- | --- |
| TRIM | AAPL | -3 | -$570 | non-retirement | +8.2% over target |
| BUY | VTI | +2 | +$410 | retirement-roth | -6.1% under target |

### Secondary Trades (drift 2–5%)

| Action | Ticker | Shares | Est. Value | Account | Reason |
| --- | --- | --- | --- | --- | --- |

### Tax-Loss Harvesting Opportunities (non-retirement only)

| Ticker | Unrealized Loss | Tax Account | Suggestion |
| --- | --- | --- | --- |

### Holdings Without Target Weights

| Ticker | Current Weight | Note |
| --- | --- | --- |
| <TICKER> | <pct>% | No target set — run `portfolio-review` to set targets |
```

### 6 — Update log

Append to `wiki/log.md`:

```
### YYYY-MM-DD — Rebalance Analysis

- **Trigger**: `rebalance`
- **Total portfolio value**: $<value>
- **Priority trades identified**: <N>
- **Secondary trades identified**: <N>
- **Tax-loss harvesting opportunities**: <N>
```

### 7 — Report

Present the rebalance plan to the user. Remind them:
- These are **suggestions only** — the user must execute trades in their brokerage account
- Ask whether to log any decisions: "Would you like me to log any of these as decision pages?"
- If yes, for each confirmed trade, create a decision page using the decision page template (action: `buy`, `trim`, or `sell`)
