---
name: help
description: Display all available operations and workflows for a portfolio vault, with usage examples and guidance.
argument-hint: (none required)
allowed-tools: [Read]
---

# help (Portfolio Vault)

Display the full guide of every operation available in a portfolio vault.

## Steps

Print the guide below exactly as written.

---

# Knowledge Compiler — Portfolio Vault

This vault tracks your financial portfolio — investment holdings, assets, liabilities, and net worth — and provides intelligence through automated data refresh, thesis tracking, rebalance analysis, and tax snapshots.

## Adding Positions and Accounts

### `add-holding <ticker> <type> <account> [shares]`
Add a new investment holding. Claude fetches current price, news, analyst ratings, and recent earnings from the internet. You provide: ticker, holding type, account type, and shares held.

**Holding types:** `stock`, `etf`, `bond`, `treasury`, `cd`, `other`
**Account types:** `retirement-ira`, `retirement-roth`, `non-retirement`

```
add-holding AAPL stock non-retirement 10
add-holding VTI etf retirement-roth 25
add-holding US10Y treasury non-retirement 5000
```

Creates: holding page, preliminary thesis page, initial buy decision page.

---

### `add-asset <description> <type> [value]`
Add a non-investment asset. For real estate, fetches Zillow/Redfin AVM. For vehicles, fetches KBB trade-in value. For cash and other, uses your provided value.

**Asset types:** `real-estate`, `vehicle`, `cash`, `collectible`, `other`

```
add-asset "Home at 123 Main St" real-estate
add-asset "2022 Toyota Camry XSE" vehicle
add-asset "Chase Savings Account" cash 45000
```

---

### `add-liability <description> <type> <balance>`
Add a debt. Balances are always user-provided — never fetched from the internet.

**Liability types:** `mortgage`, `auto-loan`, `student-loan`, `credit-card`, `heloc`, `personal-loan`, `other`

```
add-liability "Mortgage on 123 Main St" mortgage 320000
add-liability "Toyota Camry Auto Loan" auto-loan 18000
add-liability "Chase Sapphire Card" credit-card 2400
```

---

### `watchlist-add <ticker> [type]`
Add a ticker to the watchlist. Claude fetches current price and basic info. You specify what trigger criteria would move it to a held position.

```
watchlist-add NVDA stock
watchlist-add SCHD etf
```

---

## Keeping Data Current

### `refresh <ticker>` or `refresh all`
Re-fetch current price, recent news, and analyst data for one or all holdings. Updates holding pages and resets staleness.

```
refresh AAPL
refresh all
```

---

## Analysis and Review

### `portfolio-review`
Comprehensive allocation analysis: computes current weights vs. targets, identifies concentration risks, summarizes thesis health, and produces a dated performance snapshot page.

```
portfolio-review
```

Run this first to set up weight calculations; then use `rebalance` to act on drift.

---

### `thesis-check <ticker>`
Validate an investment thesis against the latest earnings, news, and analyst data. Assesses each thesis assumption and invalidation criterion. Flags theses as Healthy / Monitoring / At Risk / Broken.

```
thesis-check AAPL
thesis-check VTI
```

---

### `rebalance`
Drift analysis and trade suggestion list. Identifies overweight and underweight holdings relative to target weights and suggests specific buy/trim actions with tax-efficiency guidance.

```
rebalance
```

Returns a prioritized trade list — you execute trades in your brokerage.

---

### `tax-snapshot`
Unrealized gain/loss report for non-retirement holdings. Estimates short-term vs. long-term exposure and identifies tax-loss harvesting opportunities.

```
tax-snapshot
```

Note: this is an estimate, not official tax advice.

---

## Net Worth

### `net-worth-update`
Recompute total net worth from all holdings, assets, and liabilities. Overwrites `wiki/net-worth/current.md` and appends a row to `wiki/net-worth/history.md`.

```
net-worth-update
```

Run this after adding/updating any asset, liability, or after a `refresh all`.

---

### `net-worth-trend`
Analyze the net worth trend from history. Reports growth rate, peak/trough, trajectory, and asset vs. liability drivers.

```
net-worth-trend
```

---

## Logging Decisions

### `decision-log <ticker> <action> [shares] [price]`
Record a permanent buy/sell/trim/hold decision. Links to the holding's thesis and updates the decision history.

**Actions:** `buy`, `sell`, `trim`, `add`, `hold`, `add-to-watchlist`, `remove-from-watchlist`

```
decision-log AAPL trim 3 185.20
decision-log TSLA sell 5 195.00
decision-log NVDA add-to-watchlist
```

---

## Research

### `research <topic>`
Research a macro or sector topic by searching credible financial sources. Saves a research log and creates a `wiki/research/` page.

```
research "Federal Reserve interest rate outlook 2025"
research "semiconductor sector supply chain risks"
research "AAPL competitive landscape AI"
```

---

### `ingest <url>`
Fetch a financial article, analyst report, or earnings release and save it to `raw/`. Used to preserve source documents.

```
ingest https://example.com/analyst-report
```

---

### `ingest <path-to-pdf>`
Parse a local PDF (10-K, annual report, prospectus) and save the Markdown to `raw/`.

```
ingest ~/Downloads/AAPL-10K-2024.pdf
```

---

## Maintenance

### `lint`
Scan all wiki pages for health issues: stale prices, stale asset valuations, broken links, holdings without theses, unvalidated theses, and missing sections.

```
lint
```

Auto-fixes: adds missing cross-links. Reports stale prices and valuations as action items.

---

### `journal [description]`
Capture the current session as a structured journal entry in `wiki/journal/`.

```
journal
journal "added Q1 holdings and ran rebalance analysis"
```

---

## Asking Questions

Ask any question in plain English. Claude reads relevant wiki pages and answers with source citations.

```
What is my current allocation to technology?
Which holdings have broken or weakening theses?
What is my total unrealized gain in the Roth IRA?
Which holdings have no target weight set?
What is my total exposure to the semiconductor sector?
How has my net worth changed over the past year?
```

---

## Workflow Tips

**First-time portfolio setup:**
1. `add-holding` for each investment position
2. `add-asset` for real estate, vehicles, and cash accounts
3. `add-liability` for mortgages, auto loans, and other debts
4. `portfolio-review` — establishes baseline weights
5. `net-worth-update` — computes first net worth snapshot

**Weekly maintenance:**
1. `refresh all` — keep prices current
2. Ask questions to spot issues

**Monthly review:**
1. `portfolio-review` — check drift and thesis health
2. `rebalance` — generate trade suggestions
3. `net-worth-update` — capture monthly snapshot

**After earnings:**
1. `refresh <ticker>` — get latest data
2. `thesis-check <ticker>` — validate thesis vs. results

**Tax planning (end of year):**
1. `tax-snapshot` — identify harvesting opportunities
2. `decision-log` — record any tax-motivated trades

---

> Type any operation above to get started, or ask a question about your portfolio.
