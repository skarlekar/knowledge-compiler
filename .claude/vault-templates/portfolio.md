# Financial Portfolio Knowledge Base — Schema

## Purpose

<!-- CUSTOMIZE: Replace this with a one-paragraph description of this portfolio. -->
<!-- Example: "Personal investment portfolio tracker and financial intelligence base for [Your Name]. Tracks equity positions, fixed income, real estate, and cash — with automated price refresh, thesis tracking, rebalance suggestions, and net-worth snapshots." -->
This is an LLM-maintained knowledge base for tracking and analyzing a personal financial portfolio. The LLM writes and maintains all files under `wiki/`. The human provides holdings and account metadata; the LLM fetches current prices, news, earnings, and analyst data from the internet.

## Directory Layout

- `raw/` — Source documents: earnings snapshots, 10-K/10-Q summaries, analyst reports, research logs, PDF ingestions. Never modify these.
- `wiki/index.md` — Master catalog. Every wiki page must appear here.
- `wiki/log.md` — Append-only activity log.
- `wiki/holdings/` — One page per held position (stocks, ETFs, bonds, Treasuries, CDs).
- `wiki/watchlist/` — One page per tracked-but-not-held ticker or asset.
- `wiki/theses/` — Investment thesis pages (one per thesis, linked from holdings).
- `wiki/decisions/` — Permanent buy/sell/trim/hold decision records.
- `wiki/sectors/` — One page per sector or industry the portfolio is exposed to.
- `wiki/asset-classes/` — One page per asset class (equity, fixed income, real estate, cash, alternatives).
- `wiki/performance/` — Point-in-time portfolio snapshots (returns, allocation, drift).
- `wiki/research/` — Macro and sector research logs.
- `wiki/journal/` — Session journal entries.
- `wiki/net-worth/current.md` — Current net-worth calculation (always overwritten).
- `wiki/net-worth/history.md` — Append-only net-worth history table.
- `wiki/assets/` — Non-investment assets: real estate, vehicles, cash accounts, collectibles.
- `wiki/liabilities/` — Debts: mortgages, auto loans, student loans, credit card balances.

## File Naming

- All lowercase, hyphens for word separation: `aapl.md`, `vanguard-total-market-etf.md`
- Tickers: use the ticker symbol as the filename (e.g., `aapl.md`, `vti.md`, `us10y.md`)
- Non-ticker assets: descriptive slug (e.g., `home-123-main-st.md`, `toyota-camry-2022.md`)
- No spaces, no special characters, no uppercase

## Page Format

Every wiki page uses this frontmatter:

```yaml
---
title: "Page Title"
type: holding | watchlist | thesis | decision | sector | asset-class | performance-snapshot | asset | liability | net-worth-snapshot | journal | research
tags: [tag1, tag2, tag3]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high | medium | low
---
```

### Additional Frontmatter by Page Type

**Holding pages** add:

```yaml
ticker: AAPL
holding_type: stock | etf | bond | treasury | cd | other
tax_account: retirement-ira | retirement-roth | non-retirement
shares: 10.5
cost_basis_per_share: 142.30
price_last_fetched: 185.20
price_fetch_date: YYYY-MM-DD
target_weight_pct: 5.0
conviction: high | medium | low
thesis_page: theses/aapl-growth-thesis.md
sector: Technology
asset_class: equity
currency: USD
```

**Asset pages** add:

```yaml
asset_type: real-estate | vehicle | cash | collectible | other
estimated_value: 450000
value_source: zillow | redfin | kbb | manual
value_date: YYYY-MM-DD
currency: USD
```

**Liability pages** add:

```yaml
liability_type: mortgage | auto-loan | student-loan | credit-card | heloc | personal-loan | other
outstanding_balance: 320000
interest_rate_pct: 6.75
monthly_payment: 2100
maturity_date: YYYY-MM-DD
currency: USD
```

### Required Sections by Page Type

**Holding pages** (`wiki/holdings/`):

- `## Overview` — Company/fund description, what it does, why it exists in the portfolio
- `## Current Position` — Shares held, cost basis, current price, unrealized gain/loss, current weight vs. target
- `## Thesis` — Link to thesis page; one-sentence conviction statement
- `## Recent News` — 3–5 bullet points of recent material news with dates (refreshed on each update)
- `## Analyst View` — Consensus rating, price targets, key analyst commentary (sourced from internet)
- `## Earnings Summary` — Most recent quarter: EPS, revenue, guidance; YoY comparison (sourced from SEC/earnings releases)
- `## Risks` — 3–5 material risks to the thesis, each named and described
- `## Decision History` — Links to all decision pages for this ticker
- `## Related Sectors` — Links to sector pages

**Watchlist pages** (`wiki/watchlist/`):

- `## Overview` — What this is and why it is being watched
- `## Trigger Criteria` — What would move this to a held position (price target, event, catalyst)
- `## Current Price` — Last fetched price and date
- `## Preliminary Thesis` — Early thesis notes
- `## Risks` — Key risks to monitor

**Thesis pages** (`wiki/theses/`):

- `## Thesis Statement` — One paragraph: the core investment case
- `## Key Assumptions` — Numbered list of assumptions the thesis depends on
- `## Evidence For` — Facts, data, and events supporting the thesis (sourced)
- `## Evidence Against` — Contradicting data or risks; forces honest self-assessment
- `## Invalidation Criteria` — What specific events or data would cause a sell/trim
- `## Holdings Using This Thesis` — Links to all holding pages that reference this thesis
- `## Last Validated` — Date and brief note on most recent thesis review

**Decision pages** (`wiki/decisions/`):

Additional frontmatter:

```yaml
ticker: AAPL
action: buy | sell | trim | add | hold | add-to-watchlist | remove-from-watchlist
date: YYYY-MM-DD
shares: 5.0
price_at_decision: 178.50
account: retirement-roth | retirement-ira | non-retirement
```

Sections:
- `## Rationale` — Why this action was taken; what data or events triggered it
- `## Thesis Alignment` — How this aligns with or updates the investment thesis
- `## Alternatives Considered` — Other actions considered and why they were rejected
- `## Follow-Up` — What to monitor going forward

**Sector pages** (`wiki/sectors/`):

- `## Overview` — Brief description of the sector and its macro drivers
- `## Portfolio Exposure` — Table of holdings in this sector with current weights
- `## Sector Outlook` — Current macro/sector tailwinds and headwinds (refreshed)
- `## Concentration Risk` — Whether exposure is within target range; flag if overweight

**Asset-class pages** (`wiki/asset-classes/`):

- `## Overview` — Description of the asset class and its role in the portfolio
- `## Current Allocation` — Table of holdings/assets in this class with weights
- `## Target Allocation** — Target weight and rationale
- `## Drift` — Current vs. target; flag if rebalance is warranted

**Performance-snapshot pages** (`wiki/performance/`):

Additional frontmatter:

```yaml
snapshot_date: YYYY-MM-DD
total_portfolio_value: 0.00
total_cost_basis: 0.00
unrealized_gain_loss: 0.00
```

Sections:
- `## Allocation Table` — Full holdings table: ticker, shares, price, value, weight, target weight, drift
- `## Top Movers` — Best and worst performers since last snapshot
- `## Asset Class Breakdown` — Pie/table by asset class
- `## Sector Breakdown` — Pie/table by sector

**Asset pages** (`wiki/assets/`):

- `## Description` — What this asset is, when acquired, key details
- `## Current Value` — Estimated value, source, and date last updated
- `## Acquisition Cost` — Original purchase price and date
- `## Notes` — Any relevant details: address, VIN, insurance, etc.

**Liability pages** (`wiki/liabilities/`):

- `## Description` — What this debt is and what it funds
- `## Current Balance** — Outstanding balance and as-of date
- `## Terms` — Interest rate, monthly payment, maturity date
- `## Linked Asset** — Link to the asset page this liability funds (if any)
- `## Notes` — Refinance opportunities, payoff strategy, etc.

**Net-worth pages** (`wiki/net-worth/`):

`current.md` is always overwritten; `history.md` is append-only.

`current.md` sections:
- `## Total Net Worth` — Assets total, liabilities total, net worth figure
- `## Investment Portfolio` — Total market value of all holdings
- `## Non-Investment Assets** — Real estate, vehicles, cash, other
- `## Liabilities` — Mortgage, auto, student, credit card, other
- `## Asset Class Allocation` — Breakdown by asset class (% of total assets)

`history.md` is a table appended on each `net-worth-update` run:

```markdown
| Date | Total Assets | Total Liabilities | Net Worth | Change |
| --- | --- | --- | --- | --- |
```

**Journal pages** (`wiki/journal/`):

- Named `journal-<session-slug>-<YYYY-MM-DD>.md`
- Additional frontmatter: `session_type: add-holding | refresh | review | rebalance | tax | net-worth | research | query | lint | mixed`
- `## Setup` — What was being done; the starting goal
- `## Process` — Steps taken, decisions made, data fetched
- `## Result` — What was produced; links to new or updated wiki pages
- `## What Went Well` — What worked as expected
- `## What Could Improve` — Gaps, stale data found, follow-up items

## Linking Conventions

- Use standard Markdown relative links: `[Display Text](relative/path.md)`
- Always include the `.md` extension in link targets
- Paths must be relative to the **current file's location**, not the wiki root
  - Same folder: `[AAPL](aapl.md)`
  - Sibling folder: `[Technology Sector](../sectors/technology.md)`
  - From `holdings/` to `theses/`: `[AAPL Growth Thesis](../theses/aapl-growth-thesis.md)`
- Every page must link to at least one other page (no orphans)
- Holding pages must link to their thesis page and at least one sector page
- Decision pages must link to the holding page they describe

## Tagging Taxonomy

- **Holding type**: `stock`, `etf`, `bond`, `treasury`, `cd`, `cash`, `real-estate`, `vehicle`, `other`
- **Account type**: `retirement-ira`, `retirement-roth`, `non-retirement`
- **Asset class**: `equity`, `fixed-income`, `real-estate`, `cash-equivalent`, `alternative`
- **Sector**: `technology`, `healthcare`, `financials`, `consumer-discretionary`, `consumer-staples`, `energy`, `industrials`, `materials`, `utilities`, `real-estate`, `communication-services`
- **Conviction**: `high`, `medium`, `low`
- **Status**: `active`, `closed`, `watching`, `stale`
- **Quality**: `thesis-healthy`, `thesis-weakening`, `thesis-broken`, `needs-review`

## Confidence Levels

- **high** — Price/data fetched from internet within the last 7 days; earnings from official filings
- **medium** — Data fetched within 30 days or from secondary sources
- **low** — Data is stale (>30 days), manually estimated, or from a single unverified source

## Data Sources by Holding Type

| Holding Type | Price Source | Fundamentals | News |
| --- | --- | --- | --- |
| Stocks / ETFs | Yahoo Finance, MarketBeat | SEC EDGAR (10-K/10-Q), earnings releases | Yahoo Finance News, Seeking Alpha |
| Bonds / Treasuries | TreasuryDirect, FRED | Treasury.gov, issuer website | FRED, financial news |
| CDs | Issuer/bank website | Issuer terms | N/A |
| Real Estate | Zillow, Redfin | County records | Local market news |
| Vehicles | Kelley Blue Book | N/A | N/A |
| Cash Accounts | Manual (user-provided) | N/A | N/A |

## Workflows

### Add Holding

When the user says "add holding [ticker] [type] [account] [shares]":

1. Look up the ticker/asset online: current price, company overview, sector, asset class
2. Fetch recent news (3–5 items), analyst consensus, most recent earnings summary
3. Search SEC EDGAR for most recent 10-K or 10-Q summary
4. Create a holding page at `wiki/holdings/<ticker>.md` with all frontmatter populated
5. Create a thesis page at `wiki/theses/<ticker>-thesis.md` with a preliminary thesis
6. Create or update the relevant sector page and asset-class page
7. Update `wiki/index.md` and `wiki/log.md`
8. Invoke the journal skill: `Skill({ skill: "journal", args: "add-holding: <ticker>" })`

### Add Asset

When the user says "add asset [description] [type] [estimated value]":

1. For real estate: fetch AVM from Zillow or Redfin
2. For vehicles: fetch trade-in value from Kelley Blue Book
3. For other: use user-provided value
4. Create an asset page at `wiki/assets/<slug>.md` with all frontmatter populated
5. Update `wiki/index.md` and `wiki/log.md`
6. Invoke `net-worth-update` skill

### Add Liability

When the user says "add liability [description] [type] [balance]":

1. Create a liability page at `wiki/liabilities/<slug>.md` with all frontmatter populated
2. Link to the corresponding asset page if applicable
3. Update `wiki/index.md` and `wiki/log.md`
4. Invoke `net-worth-update` skill

### Refresh

When the user says "refresh [ticker]" or "refresh all":

1. For each holding to refresh: fetch current price, recent news, latest analyst ratings
2. Update the holding page's frontmatter (`price_last_fetched`, `price_fetch_date`) and `## Recent News`, `## Analyst View` sections
3. Update `wiki/log.md`
4. Invoke the journal skill: `Skill({ skill: "journal", args: "refresh: <ticker or all>" })`

### Portfolio Review

When the user says "portfolio-review" or "review portfolio":

1. Invoke the `portfolio-review` skill: `Skill({ skill: "portfolio-review" })`

### Rebalance

When the user says "rebalance":

1. Invoke the `rebalance` skill: `Skill({ skill: "rebalance" })`

### Tax Snapshot

When the user says "tax-snapshot":

1. Invoke the `tax-snapshot` skill: `Skill({ skill: "tax-snapshot" })`

### Net Worth

When the user says "net-worth-update" or "update net worth":

1. Invoke the `net-worth-update` skill: `Skill({ skill: "net-worth-update" })`

When the user says "net-worth-trend" or "net worth trend":

1. Invoke the `net-worth-trend` skill: `Skill({ skill: "net-worth-trend" })`

### Thesis Check

When the user says "thesis-check [ticker]" or "check thesis [ticker]":

1. Invoke the `thesis-check` skill: `Skill({ skill: "thesis-check", args: "<ticker>" })`

### Query

When the user asks a question about the portfolio:

1. Read `wiki/index.md` to find relevant pages
2. Read those pages
3. Synthesize an answer citing specific wiki pages with links and data sources
4. If the answer reveals a significant pattern (concentration risk, thesis correlation), create or update a sector/asset-class page

### Lint

When the user says "lint":

1. Invoke the `lint` skill: `Skill({ skill: "lint" })`

### Journal

When the user says "journal" or "journal [description]":

1. Invoke the `journal` skill: `Skill({ skill: "journal", args: "<description>" })`

## Rules

- Never modify files in `raw/`
- Always update `index.md` and `log.md` after any wiki change
- Prefer updating existing pages over creating duplicates
- Never fabricate prices, balances, or financial data — only record what is fetched from a live source or provided by the user
- Mark `confidence: low` whenever data is more than 30 days old
- Record `price_fetch_date` every time a price is updated — staleness is tracked by this field
- Use plain English — define financial jargon on first use in each page
- All dates in ISO 8601 format: YYYY-MM-DD
- Record dollar amounts with 2 decimal places
- When in doubt about a value, record it as-is and set confidence to "low"
