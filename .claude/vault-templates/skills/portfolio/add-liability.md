---
name: add-liability
description: Add a liability (mortgage, auto loan, student loan, credit card, HELOC, etc.) to the portfolio wiki. Balance is user-provided; links to the corresponding asset page if applicable.
argument-hint: "<description> <type> <balance>"
allowed-tools: [Read, Write, Edit, Glob]
---

# add-liability

Add a debt or liability to the portfolio wiki. Outstanding balances are always user-provided — Claude never fetches financial account balances from the internet.

## Arguments

- `<description>` — Human-readable description (e.g., "Mortgage on 123 Main St", "Toyota Camry Auto Loan")
- `<type>` — one of: `mortgage`, `auto-loan`, `student-loan`, `credit-card`, `heloc`, `personal-loan`, `other`
- `<balance>` — Current outstanding balance (user-provided dollar amount)

## Steps

### 1 — Gather additional information

Ask the user for:
- Interest rate (APR or APY as a percentage)
- Monthly payment amount
- Maturity date (when the loan is fully paid off)
- For mortgages and auto loans: link to the corresponding asset page (optional)

### 2 — Derive a filename slug

- Convert description to lowercase, hyphens, no special chars
- Examples: `mortgage-123-main-st.md`, `toyota-camry-auto-loan.md`, `chase-credit-card.md`

Check if `wiki/liabilities/<slug>.md` already exists. If so, report and ask whether to update.

### 3 — Create the liability page

```markdown
---
title: "<Description>"
type: liability
tags: [<liability_type>, liability]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: high
liability_type: <mortgage | auto-loan | student-loan | credit-card | heloc | personal-loan | other>
outstanding_balance: <balance>
interest_rate_pct: <rate>
monthly_payment: <payment>
maturity_date: YYYY-MM-DD
currency: USD
---

# <Description>

## Description

<1 paragraph describing what this debt is and what it funds.>

## Current Balance

| Field | Value |
| --- | --- |
| Outstanding Balance | $<balance> |
| As of Date | YYYY-MM-DD |
| Interest Rate | <rate>% APR |
| Monthly Payment | $<payment> |
| Maturity Date | YYYY-MM-DD |

## Terms

| Field | Value |
| --- | --- |
| Loan Type | <type> |
| Original Loan Amount | $<original if known, else "Unknown"> |
| Origination Date | <date if known, else "Unknown"> |
| Lender | <lender name if known> |

## Linked Asset

<Link to the asset this liability funds, if applicable. E.g.:>
[Home at 123 Main St](../assets/123-main-st.md)

## Notes

<Refinance opportunities, payoff strategy, insurance requirements, or other notes.>
```

### 4 — Update linked asset page

If the user provided a linked asset, add or update the `## Linked Liability` section of that asset page:

```markdown
## Linked Liability

- [<Description>](../liabilities/<slug>.md) — $<balance> outstanding
```

### 5 — Update index and log

**A. Add to `wiki/index.md`** under the Liabilities section.

The Liabilities table has columns: Page, Type, Outstanding Balance, Updated.

Also increment the Liabilities count in Statistics.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Add Liability: <Description>

- **Trigger**: `add-liability`
- **Liability page**: `wiki/liabilities/<slug>.md`
- **Type**: <liability_type>
- **Balance**: $<balance>
- **Interest rate**: <rate>%
```

### 6 — Invoke net-worth-update

After adding any liability, automatically update net worth:

`Skill({ skill: "net-worth-update" })`

### 7 — Report

Tell the user:
- Liability page created at `wiki/liabilities/<slug>.md`
- Outstanding balance: $<balance>
- Net worth updated
