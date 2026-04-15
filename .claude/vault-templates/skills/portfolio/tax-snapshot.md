---
name: tax-snapshot
description: Generate an unrealized gain/loss report for non-retirement holdings, identify tax-loss harvesting candidates, and estimate tax exposure by lot.
argument-hint: (none required)
allowed-tools: [Read, Write, Edit, Glob]
---

# tax-snapshot

Generate a tax-focused analysis of the portfolio's non-retirement holdings. Identifies unrealized gains and losses, tax-loss harvesting opportunities, and approximate short-term vs. long-term gain exposure.

> **Note:** This skill analyzes positions in `wiki/holdings/` pages. It does not file taxes, connect to brokerage accounts, or produce official tax documents. Always verify with your tax advisor.

## Steps

### 1 — Load non-retirement holdings

Read all files in `wiki/holdings/*.md`.

Filter to holdings where `tax_account: non-retirement`.

Parse: `ticker`, `shares`, `price_last_fetched`, `price_fetch_date`, `cost_basis_per_share`.

If any holding's `price_fetch_date` is older than 7 days, refresh it:

`Skill({ skill: "refresh", args: "<ticker>" })`

### 2 — Check for decision pages to determine holding period

Read all files in `wiki/decisions/*.md` for each non-retirement holding.

For each decision page where `action: buy` and `account: non-retirement`, note the `date` field.

This allows estimation of holding period:
- Days held = today − buy date
- **Short-term**: held ≤ 365 days (ordinary income tax rate applies to gains)
- **Long-term**: held > 365 days (preferential capital gains rate applies)

If no decision page exists for a holding, note "Holding date unknown — unable to determine short/long term status."

### 3 — Compute gain/loss for each non-retirement holding

```
unrealized_gain_loss = (price_last_fetched − cost_basis_per_share) × shares
unrealized_return_pct = (price_last_fetched − cost_basis_per_share) / cost_basis_per_share × 100
holding_period = <short-term | long-term | unknown>
```

### 4 — Identify tax-loss harvesting candidates

Flag positions where:
- `unrealized_gain_loss < 0` → unrealized loss (harvesting candidate)
- `unrealized_return_pct < -10%` → significant loss

For each loss candidate, note:
- Total harvestable loss amount
- Whether a similar-but-not-substantially-identical replacement security could be used (suggest by asset class/sector)
- Wash-sale caution: if the same security was bought within 30 days before/after a sale, the loss is disallowed

### 5 — Generate the tax snapshot report

Output (displayed to user and optionally written to a snapshot page):

```markdown
## Tax Snapshot — YYYY-MM-DD (Non-Retirement Only)

**Disclaimer:** This is an estimate based on recorded cost basis. Consult your tax advisor for official calculations.

### Unrealized Gains and Losses

| Ticker | Shares | Cost Basis | Current Price | Unrealized G/L | Return % | Holding Period |
| --- | --- | --- | --- | --- | --- | --- |
| AAPL | 10 | $142.30 | $185.20 | +$429.00 | +30.2% | Long-term |
| TSLA | 5 | $280.00 | $195.00 | -$425.00 | -30.4% | Long-term |

### Summary

| Category | Total |
| --- | --- |
| Total Unrealized Gains | $<total gains> |
| Total Unrealized Losses | $<total losses> |
| Net Unrealized Position | $<net> |
| Short-term gains (ordinary rate) | $<amount> |
| Long-term gains (preferential rate) | $<amount> |

### Tax-Loss Harvesting Opportunities

| Ticker | Unrealized Loss | Holding Period | Suggested Replacement |
| --- | --- | --- | --- |
| TSLA | -$425.00 | Long-term | Consider broad EV ETF (DRIV, KARS) — verify wash-sale rules |

### Notes

- **Wash-sale rule reminder:** If you sell a security at a loss, you cannot buy a "substantially identical" security within 30 days before or after the sale.
- **Short-term gains** are taxed as ordinary income. Consider holding until the 1-year mark when possible.
- These figures are based on average cost basis. Your actual cost basis (FIFO, specific lot) may differ.
```

### 6 — Update log

Append to `wiki/log.md`:

```
### YYYY-MM-DD — Tax Snapshot

- **Trigger**: `tax-snapshot`
- **Non-retirement holdings analyzed**: <N>
- **Total unrealized gains**: $<gains>
- **Total unrealized losses**: $<losses>
- **Tax-loss harvesting candidates**: <N>
```

### 7 — Report

Present the full tax snapshot report. Remind the user that this is an estimate, not tax advice.
