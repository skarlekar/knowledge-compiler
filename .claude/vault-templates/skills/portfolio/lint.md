---
name: lint
description: Scan all portfolio wiki pages for health issues — stale prices, broken links, holdings without theses, liabilities without linked assets, and incomplete sections.
argument-hint: (none required)
allowed-tools: [Read, Write, Edit, Glob, Bash]
---

# lint (Portfolio)

Scan the portfolio wiki for health issues specific to portfolio vaults: stale prices, orphan pages, broken links, missing theses, incomplete sections, and stale asset valuations.

## Steps

### 1 — Load all wiki pages

Use Glob to list all `.md` files under `wiki/`. Read each file and parse frontmatter.

### 2 — Run staleness checks

**A. Stale holding prices**

For each holding page, check `price_fetch_date`. Flag if:
- Older than 7 days → `⚠️ STALE PRICE (7+ days)` — suggest `refresh <ticker>`
- Older than 30 days → `🔴 VERY STALE PRICE (30+ days)` — unreliable for net worth or review

**B. Stale asset valuations**

For each asset page, check `value_date`. Flag if:
- Older than 90 days → `⚠️ STALE ASSET VALUE` — suggest updating the estimate

**C. Stale liability balances**

For each liability page, check `updated`. Flag if:
- Older than 90 days → `⚠️ LIABILITY BALANCE MAY BE STALE` — suggest manual update

### 3 — Run orphan and link checks

**A. Orphan pages** — wiki pages with no inbound links from any other wiki page.

To check: for each page P, search all other wiki pages for a Markdown link pointing to P. If none found, flag as orphan.

**B. Broken internal links** — links in wiki pages whose target file does not exist.

For each Markdown link in each wiki page, resolve the relative path and verify the file exists. Flag broken links with the source page and the broken target.

**C. Holdings without a thesis page**

For each holding page, check the `thesis_page` frontmatter field. Verify that the referenced file exists. If not, flag: "Missing thesis page — run `add-holding` or create manually."

**D. Holdings without at least one decision page**

Check `wiki/decisions/` for at least one file matching `<ticker>-*.md`. Flag holdings with no decision page.

**E. Liabilities without linked assets** (for mortgage and auto-loan types)

For each liability page where `liability_type: mortgage` or `liability_type: auto-loan`, check if the `## Linked Asset` section contains a valid link. If missing or broken, flag.

**F. Missing required sections**

For each holding page, verify presence of: `## Overview`, `## Current Position`, `## Thesis`, `## Recent News`, `## Analyst View`, `## Risks`, `## Decision History`, `## Related Sectors`.

For each thesis page, verify: `## Thesis Statement`, `## Key Assumptions`, `## Invalidation Criteria`.

For each decision page, verify: `## Rationale`, `## Thesis Alignment`.

Report any missing sections.

### 4 — Run portfolio integrity checks

**A. Net worth currency**

Check if `wiki/net-worth/current.md` exists. If not, flag: "Net worth has never been computed — run `net-worth-update`."

If it exists, check the `updated` date. If older than 30 days, flag as stale.

**B. Holdings without target weights**

List all holdings where `target_weight_pct` is null or not set. These holdings cannot participate in rebalance analysis.

**C. Theses never validated**

List all thesis pages with no `## Last Validated` section. These theses have never been checked against current data.

### 5 — Auto-fix what can be fixed

Auto-fixable issues (fix silently and report):
- Add missing cross-links where a page mentions a ticker/page name without linking it
- Ensure every holding page links back to its sector page (add link if missing)

Non-auto-fixable issues (report as human-judgment items):
- Stale prices (require `refresh` command)
- Stale asset/liability values (require user input)
- Broken thesis or decision links (file may have been moved or deleted)

### 6 — Update log

Append to `wiki/log.md`:

```
### YYYY-MM-DD — Lint

- **Trigger**: `lint`
- **Pages scanned**: <N>
- **Stale prices**: <N holdings>
- **Stale asset values**: <N assets>
- **Orphan pages**: <N>
- **Broken links**: <N>
- **Holdings without theses**: <N>
- **Theses never validated**: <N>
- **Auto-fixed**: <N issues>
- **Human-judgment items**: <N issues>
```

### 7 — Invoke journal

`Skill({ skill: "journal", args: "lint" })`

### 8 — Report

Present a structured health report:

```
## Portfolio Wiki Health Report — YYYY-MM-DD

### Auto-Fixed
<list of auto-fixed issues or "None">

### Action Required (run these commands)
<list of stale prices with suggested refresh commands>

### Human-Judgment Items
<list of broken links, stale asset values, missing thesis pages>

### Portfolio Integrity Flags
<net worth currency, holdings without targets, unvalidated theses>
```
