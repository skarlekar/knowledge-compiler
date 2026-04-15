---
name: decision-log
description: Create a permanent buy/sell/trim/hold decision record. Use when executing or recording a trade or portfolio decision.
argument-hint: "<ticker> <action> [shares] [price]"
allowed-tools: [Read, Write, Edit, Glob]
---

# decision-log

Create a permanent decision record for a portfolio action: buy, sell, trim, add, hold, or watchlist change.

## Arguments

- `<ticker>` — ticker symbol
- `<action>` — one of: `buy`, `sell`, `trim`, `add`, `hold`, `add-to-watchlist`, `remove-from-watchlist`
- `[shares]` — number of shares (required for buy/sell/trim/add)
- `[price]` — price per share at execution (required for buy/sell/trim/add)

## Steps

### 1 — Gather required fields

If shares or price were not provided for buy/sell/trim/add actions, ask:
- "How many shares?"
- "At what price per share?"

Also ask:
- "Which account? (retirement-ira / retirement-roth / non-retirement)"
- "What was the rationale for this decision?" (free-text, 1–3 sentences)

### 2 — Derive the filename

Format: `wiki/decisions/<ticker-lowercase>-<action>-<YYYY-MM-DD>.md`

If a file with this name already exists (same ticker + action + date), append `-v2`, `-v3`.

### 3 — Create the decision page

```markdown
---
title: "<ACTION> <TICKER> — <YYYY-MM-DD>"
type: decision
tags: [<action>, <holding_type or "unknown">, <tax_account>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high
ticker: <TICKER>
action: <action>
date: YYYY-MM-DD
shares: <shares or null>
price_at_decision: <price or null>
account: <tax_account>
---

# <ACTION> <TICKER> — <YYYY-MM-DD>

## Rationale

<User-provided rationale. If none given, write "Not recorded.">

## Thesis Alignment

<Read the thesis page for this ticker and note whether this action aligns with, strengthens, or modifies the thesis. If the thesis page does not exist, write "No thesis page on record.">

See [<Ticker> Investment Thesis](../theses/<ticker-lowercase>-thesis.md)

## Alternatives Considered

<Was trimming considered instead of selling? Was adding considered instead of holding? Note briefly.>

## Follow-Up

<What should be monitored after this decision. E.g., "Monitor earnings in 6 weeks to validate trim decision.">
```

### 4 — Update the holding page

Read `wiki/holdings/<ticker-lowercase>.md`:

1. Add a link to this decision page in the `## Decision History` section
2. If action is `sell` (full exit): update holding page to note "Position closed on <date>"
3. If action is `trim` or `add`: update `shares` frontmatter field and recompute `Current Position` table values

### 5 — Update index and log

**A. Add to `wiki/index.md`** under the Decisions section.

The Decisions table has columns: Page, Ticker, Action, Date.

Also increment the Decisions count in Statistics.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Decision: <ACTION> <TICKER>

- **Trigger**: `decision-log`
- **Decision page**: `wiki/decisions/<ticker>-<action>-<date>.md`
- **Action**: <action>
- **Shares**: <shares>
- **Price**: $<price>
- **Account**: <account>
```

### 6 — Report

Tell the user:
- Decision page created at `wiki/decisions/<ticker>-<action>-<date>.md`
- Holding page updated
- Suggest running `portfolio-review` to see updated allocation
