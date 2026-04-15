---
name: add-asset
description: Add a non-investment asset (real estate, vehicle, cash account, collectible, or other) to the portfolio wiki. Fetches estimated value from the internet where possible.
argument-hint: "<description> <type> [estimated_value]"
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# add-asset

Add a non-investment asset to the portfolio wiki. For real estate and vehicles, Claude fetches an estimated market value from the internet. For other asset types, the user provides the value.

## Arguments

- `<description>` — Human-readable description (e.g., "Home at 123 Main St", "2022 Toyota Camry XSE")
- `<type>` — one of: `real-estate`, `vehicle`, `cash`, `collectible`, `other`
- `[estimated_value]` — Optional. For cash accounts and other types where the value is known.

## Steps

### 1 — Parse inputs and gather additional information

Ask the user for any missing details:

**For real estate:**
- Full address (required for AVM lookup)
- Approximate square footage (optional — helps validate AVM)
- Year purchased and purchase price (for cost basis)

**For vehicles:**
- Year, make, model, trim, mileage (for KBB lookup)
- Purchase date and purchase price

**For cash accounts:**
- Institution name, account type (checking, savings, money market, CD)
- Current balance (user-provided — never fetched from the internet)
- Interest rate / APY (optional)

**For collectibles / other:**
- Description of the item
- Estimated value (user-provided)
- Basis for the estimate

### 2 — Fetch estimated value from the internet

**Real estate:**

Search: `<address> home value estimate Zillow OR Redfin`

Fetch the Zillow or Redfin page for the property and extract:
- Zestimate or Redfin Estimate
- Date of estimate
- Last sold price and date (for context)

If the property is not found, ask the user to provide an estimated value and note `value_source: manual`.

**Vehicles:**

Fetch Kelley Blue Book trade-in value:

Search: `<year> <make> <model> <trim> KBB trade-in value <mileage>`

Extract:
- KBB trade-in value range (use midpoint)
- Date of estimate

If KBB lookup fails, ask for user-provided estimate.

**Cash / Collectible / Other:**

Use the user-provided value directly. Set `value_source: manual`.

### 3 — Derive a filename slug

- Convert description to lowercase, hyphens, no special chars
- Examples: `123-main-st-anytown-ca.md`, `toyota-camry-2022-xse.md`, `chase-savings-account.md`

Check if `wiki/assets/<slug>.md` already exists. If so, report and ask whether to update.

### 4 — Create the asset page

```markdown
---
title: "<Description>"
type: asset
tags: [<asset_type>, asset]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: <high if fetched live | low if manual estimate>
asset_type: <real-estate | vehicle | cash | collectible | other>
estimated_value: <value>
value_source: <zillow | redfin | kbb | manual>
value_date: YYYY-MM-DD
currency: USD
---

# <Description>

## Description

<1 paragraph describing the asset, when acquired, key details.>

## Current Value

| Field | Value |
| --- | --- |
| Estimated Value | $<value> |
| Source | <Zillow / Redfin / KBB / Manual> |
| As of Date | YYYY-MM-DD |

## Acquisition Cost

| Field | Value |
| --- | --- |
| Purchase Price | $<purchase_price> |
| Purchase Date | YYYY-MM-DD |
| Unrealized Gain | $<gain> (<pct>%) |

## Notes

<Address, VIN, account details, or other relevant notes. For cash accounts: institution, account type, APY.>
```

For real estate, also add:
```markdown
## Linked Liability

<If there is a mortgage on this property, link it here once added: [Mortgage](../liabilities/<slug>.md)>
```

### 5 — Update index and log

**A. Add to `wiki/index.md`** under the Assets section.

The Assets table has columns: Page, Type, Estimated Value, Updated.

Also increment the Assets count in Statistics.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Add Asset: <Description>

- **Trigger**: `add-asset`
- **Asset page**: `wiki/assets/<slug>.md`
- **Type**: <asset_type>
- **Estimated Value**: $<value> (source: <source>)
```

### 6 — Invoke net-worth-update

After adding any asset, automatically update net worth:

`Skill({ skill: "net-worth-update" })`

### 7 — Report

Tell the user:
- Asset page created at `wiki/assets/<slug>.md`
- Estimated value: $<value> (source and date)
- Net worth updated
