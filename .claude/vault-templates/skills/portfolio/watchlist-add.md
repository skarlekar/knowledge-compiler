---
name: watchlist-add
description: Add a ticker or asset to the watchlist. Fetches current price and basic info; records trigger criteria for conversion to a held position.
argument-hint: "<ticker> [type]"
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# watchlist-add

Add a ticker or asset to the portfolio watchlist. A watchlist item is tracked but not held — it represents something being monitored for future investment.

## Arguments

- `<ticker>` — ticker symbol or asset identifier
- `[type]` — optional holding type hint: `stock`, `etf`, `bond`, `treasury`, `cd`, `other`

## Steps

### 1 — Fetch basic info and current price

Search: `<ticker> stock overview current price sector`

Extract:
- Company/fund name
- Current price
- Sector (for stocks/ETFs)
- Brief description (1–2 sentences)

### 2 — Ask for trigger criteria

Ask the user:

> "What would move `<ticker>` from the watchlist to your portfolio? For example: a specific price target, an earnings catalyst, a macro event, or a valuation threshold."

Record the user's response.

### 3 — Create the watchlist page

Filename: `wiki/watchlist/<ticker-lowercase>.md`

Check if this file already exists. If so, report and offer to update it.

```markdown
---
title: "<Company/Fund Name> (<TICKER>) — Watchlist"
type: watchlist
tags: [watchlist, <type-if-known>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: medium
ticker: <TICKER>
holding_type: <type or "unknown">
---

# <Company/Fund Name> (<TICKER>) — Watchlist

## Overview

<1–2 sentence description of what this is and why it is being watched.>

## Trigger Criteria

<What would move this to a held position. Record the user's response verbatim or paraphrased.>

## Current Price

| Field | Value |
| --- | --- |
| Price | $<price> |
| As of | YYYY-MM-DD |

## Preliminary Thesis

<Brief initial thesis — why this might be a good investment if the trigger criteria are met. 2–4 sentences.>

## Risks

- <Risk 1 to monitor>
- <Risk 2 to monitor>
- <Risk 3 to monitor>
```

### 4 — Update index and log

**A. Add to `wiki/index.md`** under the Watchlist section.

The Watchlist table has columns: Page, Ticker, Trigger Criteria, Added.

Also increment the Watchlist count in Statistics.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Watchlist Add: <TICKER>

- **Trigger**: `watchlist-add <ticker>`
- **Watchlist page**: `wiki/watchlist/<ticker>.md`
- **Current price**: $<price>
- **Trigger criteria**: <brief summary>
```

### 5 — Report

Tell the user:
- Watchlist page created at `wiki/watchlist/<ticker>.md`
- Current price: $<price>
- Remind them: run `refresh <ticker>` periodically to keep price current, and use `decision-log <ticker> add-to-watchlist` to formalize the decision if needed
