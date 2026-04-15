---
name: add-holding
description: Add a new holding to the portfolio wiki. Accepts ticker, type, tax account, and shares; fetches all other data (price, news, earnings, analyst ratings) from the internet.
argument-hint: "<ticker> <holding_type> <tax_account> [shares]"
allowed-tools: [Read, Write, Edit, Glob, Bash, WebSearch, WebFetch]
---

# add-holding

Add a new holding to the portfolio wiki. The user provides the minimum required metadata; Claude fetches everything else.

## Arguments

- `<ticker>` — ticker symbol (e.g., `AAPL`, `VTI`, `US10Y`)
- `<holding_type>` — one of: `stock`, `etf`, `bond`, `treasury`, `cd`, `other`
- `<tax_account>` — one of: `retirement-ira`, `retirement-roth`, `non-retirement`
- `[shares]` — number of shares or units held (optional; ask the user if not provided)

## Steps

### 1 — Validate inputs

Parse the arguments. If `shares` was not provided, ask the user:

> "How many shares/units of `<ticker>` do you hold in this account?"

Accept a numeric value. Continue once you have: ticker, holding_type, tax_account, shares.

### 2 — Fetch current data from the internet

Run 3–4 web searches and fetches to gather:

**A. Price and basic info**

Search: `<ticker> stock price current` and `<ticker> company overview sector`

Extract:
- Current price (USD)
- Company/fund name
- Sector (for stocks/ETFs)
- Asset class (equity, fixed-income, cash-equivalent, etc.)
- Brief description (1–2 sentences)

**B. Recent news**

Search: `<ticker> news last 30 days`

Extract 3–5 material news items with dates. Note: only include items that are material to the investment case (earnings beats/misses, product launches, legal/regulatory events, macro events affecting this holding). Skip routine price movement articles.

**C. Analyst ratings (stocks and ETFs only)**

Search: `<ticker> analyst rating price target consensus`

Extract:
- Consensus rating (Buy/Hold/Sell or equivalent)
- Average price target
- 1–2 notable analyst comments

**D. Most recent earnings (stocks only)**

Search: `<ticker> most recent earnings EPS revenue quarterly results`
Fetch SEC EDGAR if available: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=<ticker>&type=10-Q&dateb=&owner=include&count=1`

Extract:
- Most recent quarter (e.g., Q1 2025)
- EPS: reported vs. estimate
- Revenue: reported vs. estimate
- Key guidance or management commentary

**E. For Treasury/bond holdings**

Search: `<ticker> current yield maturity date`
Fetch TreasuryDirect or FRED for yield data.

Extract: current yield, maturity date (if known), issuer.

### 3 — Compute cost basis and unrealized gain/loss

- `cost_basis_per_share` = ask the user: "What is your average cost basis per share for `<ticker>`?"
- `unrealized_gain_loss` = (current_price − cost_basis) × shares
- `current_weight_pct` = cannot be computed yet without a full portfolio refresh; record as "TBD — run `portfolio-review` to compute"

### 4 — Create the holding page

Filename: `wiki/holdings/<ticker-lowercase>.md`

Check if this file already exists. If it does, report that the holding already exists and ask the user whether to update it instead.

Write the page with full frontmatter and all sections populated from the data gathered in Steps 2–3.

Use this structure:

```markdown
---
title: "<Company/Fund Name> (<TICKER>)"
type: holding
tags: [<holding_type>, <tax_account>, <asset_class>, <sector-tag>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high
ticker: <TICKER>
holding_type: <holding_type>
tax_account: <tax_account>
shares: <shares>
cost_basis_per_share: <cost_basis>
price_last_fetched: <price>
price_fetch_date: YYYY-MM-DD
target_weight_pct: null
conviction: medium
thesis_page: theses/<ticker-lowercase>-thesis.md
sector: <sector>
asset_class: <asset_class>
currency: USD
---

# <Company/Fund Name> (<TICKER>)

## Overview

<1-2 paragraph company/fund description. What it does, market position, why it might belong in a portfolio.>

## Current Position

| Field | Value |
| --- | --- |
| Shares Held | <shares> |
| Cost Basis / Share | $<cost_basis> |
| Current Price | $<price> (as of YYYY-MM-DD) |
| Unrealized Gain/Loss | $<gain_loss> (<pct>%) |
| Current Weight | TBD — run `portfolio-review` |
| Target Weight | Not set |

## Thesis

See [<Ticker> Investment Thesis](../theses/<ticker-lowercase>-thesis.md).

**Conviction summary:** <one sentence on why this is held>

## Recent News

- **YYYY-MM-DD** — <news item 1>
- **YYYY-MM-DD** — <news item 2>
- **YYYY-MM-DD** — <news item 3>

## Analyst View

- **Consensus Rating:** <Buy/Hold/Sell>
- **Average Price Target:** $<target>
- **Commentary:** <1-2 sentences from analyst reports>

## Earnings Summary

**<Most Recent Quarter>:**

| Metric | Reported | Estimate | YoY |
| --- | --- | --- | --- |
| EPS | $<eps> | $<est> | <+/->% |
| Revenue | $<rev>B | $<est>B | <+/->% |

<Guidance or key management comment if available.>

## Risks

1. **<Risk Name>** — <Description>
2. **<Risk Name>** — <Description>
3. **<Risk Name>** — <Description>

## Decision History

- [Buy — <date>](../decisions/<ticker-lowercase>-buy-<date>.md)

## Related Sectors

- [<Sector Name>](../sectors/<sector-slug>.md)
```

### 5 — Create a preliminary thesis page

Filename: `wiki/theses/<ticker-lowercase>-thesis.md`

Check if it already exists; if so, skip creation.

```markdown
---
title: "<Ticker> Investment Thesis"
type: thesis
tags: [<holding_type>, <sector>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: medium
---

# <Ticker> Investment Thesis

## Thesis Statement

<Synthesize a 1-paragraph thesis from the data gathered. Focus on: why this company/fund, what the growth or income driver is, what time horizon is implied.>

## Key Assumptions

1. <Assumption 1 — e.g., "Revenue growth continues at 10%+ annually">
2. <Assumption 2>
3. <Assumption 3>

## Evidence For

- <Supporting data point 1 — sourced>
- <Supporting data point 2 — sourced>

## Evidence Against

- <Contradicting factor 1>
- <Contradicting factor 2>

## Invalidation Criteria

1. <Event or data that would trigger a sell/trim — e.g., "EPS growth falls below 5% for two consecutive quarters">
2. <Invalidation criterion 2>

## Holdings Using This Thesis

- [<Ticker>](../holdings/<ticker-lowercase>.md)

## Last Validated

<YYYY-MM-DD> — Initial thesis created on position add.
```

### 6 — Create an initial decision page

Filename: `wiki/decisions/<ticker-lowercase>-buy-<YYYY-MM-DD>.md`

```markdown
---
title: "Buy <TICKER> — <YYYY-MM-DD>"
type: decision
tags: [<holding_type>, <tax_account>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high
ticker: <TICKER>
action: buy
date: YYYY-MM-DD
shares: <shares>
price_at_decision: <price>
account: <tax_account>
---

# Buy <TICKER> — <YYYY-MM-DD>

## Rationale

Position added via `add-holding`. <Briefly note the core thesis driver.>

## Thesis Alignment

See [<Ticker> Investment Thesis](../theses/<ticker-lowercase>-thesis.md).

## Alternatives Considered

None recorded at initial position entry.

## Follow-Up

- Run `thesis-check <ticker>` after next earnings release
- Set `target_weight_pct` after running `portfolio-review`
```

### 7 — Create or update sector and asset-class pages

Check if `wiki/sectors/<sector-slug>.md` exists:

- If not, create a minimal sector page with an `## Overview` and a `## Portfolio Exposure` table containing this holding.
- If it exists, add this holding to the `## Portfolio Exposure` table.

Check if `wiki/asset-classes/<asset-class-slug>.md` exists:

- If not, create a minimal asset-class page with an `## Overview` and a `## Current Allocation` table.
- If it exists, add this holding to the table.

### 8 — Update index and log

**A. Add to `wiki/index.md`** under the Holdings section:

```markdown
| [<Company> (<TICKER>)](holdings/<ticker>.md) | <holding_type> | <tax_account> | YYYY-MM-DD |
```

Also increment the Holdings count in Statistics.

Add thesis page to Theses section, decision page to Decisions section.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Add Holding: <TICKER>

- **Trigger**: `add-holding <TICKER>`
- **Holding page**: `wiki/holdings/<ticker>.md`
- **Thesis page**: `wiki/theses/<ticker>-thesis.md`
- **Decision page**: `wiki/decisions/<ticker>-buy-<date>.md`
- **Data fetched**: price ($<price>), news, analyst consensus, earnings
- **Account**: <tax_account>
- **Shares**: <shares>
```

### 9 — Invoke journal

`Skill({ skill: "journal", args: "add-holding: <ticker>" })`

### 10 — Report

Tell the user:
- Holding page created at `wiki/holdings/<ticker>.md`
- Thesis page created at `wiki/theses/<ticker>-thesis.md`
- Decision page created at `wiki/decisions/<ticker>-buy-<date>.md`
- Current price fetched: $<price>
- Unrealized gain/loss: $<amount> (<pct>%)
- Remind them to set `target_weight_pct` after running `portfolio-review`
