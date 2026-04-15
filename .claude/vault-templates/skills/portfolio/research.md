---
name: research
description: Research a macro or sector topic by searching credible online sources. Saves a research log to raw/ and populates wiki/research/ pages.
argument-hint: "<topic>"
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# research

Research a macro or sector topic for the portfolio wiki. Searches credible online sources, evaluates them, extracts attributed claims, and saves a research log so the portfolio wiki can be populated with context.

## Arguments

Topic to research (e.g., "Federal Reserve interest rate outlook 2025", "semiconductor sector headwinds", "AAPL competitive landscape")

## Steps

### 1 — Check existing research coverage

Read `wiki/index.md`. If a research page already exists for this topic, report this and ask whether to continue (research may duplicate or update existing content).

### 2 — Derive slug and output path

- Lowercase the topic; replace spaces and non-alphanumeric characters with hyphens
- Output path: `raw/research-<topic-slug>-<YYYY-MM-DD>.md`

### 3 — Search for candidate sources

Run 2–3 `WebSearch` queries with varied angles to maximize source diversity:

- Overview: `<topic> overview analysis`
- Recent: `<topic> 2024 OR 2025`
- Expert/institutional: `<topic> Federal Reserve OR SEC OR analyst report`

Collect 5–7 candidate URLs. Aim for a mix of institutional, financial news, and analyst sources.

### 4 — Evaluate each candidate for credibility

Fetch each candidate with `WebFetch`. Assess:

| Signal | Credible | Not credible |
| --- | --- | --- |
| Authorship | Named analyst, institution, official source | Anonymous, forum post |
| Publisher | Financial news (Bloomberg, Reuters, WSJ), SEC, Fed | Personal blog, undisclosed |
| Recency | Within 12 months for fast-moving topics | Outdated — flag if used |
| Sourcing | Cites data, filings, or primary sources | Summary of summaries |

Accept 3–5 sources. Do not proceed with fewer than 2 accepted sources.

### 5 — Extract attributed claims

For each accepted source extract:
- Key claims, data points, forecasts
- Evidence or citations supporting each claim
- Date of publication

Tag every claim with its source URL.

### 6 — Write the research log

Write `raw/research-<topic-slug>-<YYYY-MM-DD>.md`:

```markdown
# Research Log: <Topic>

**Date:** YYYY-MM-DD
**Topic:** <topic>
**Sources evaluated:** N
**Sources accepted:** M

## Sources Evaluated

### [Title](URL)
- **Publisher / Author:** ...
- **Date:** ...
- **Verdict:** Accepted | Rejected — <reason>

## Attributed Claims

### <Subtopic>

- <Claim> — [Source](URL), YYYY-MM-DD

## Consensus Map

**Agreed across sources:** ...
**Contested:** ...
**Gaps (no credible coverage found):** ...
```

### 7 — Create or update a research wiki page

Create `wiki/research/<topic-slug>.md`:

```markdown
---
title: "Research: <Topic>"
type: research
tags: [research, <topic-tags>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
confidence: medium
sources: ["raw/research-<topic-slug>-<date>.md"]
---

# Research: <Topic>

## Summary

<3–5 sentence summary of key findings.>

## Key Findings

- <Finding 1 — attributed>
- <Finding 2 — attributed>

## Consensus vs. Contested

**Consensus:** <What most sources agree on>
**Contested:** <Where sources disagree>

## Implications for Portfolio

<How this research should inform portfolio decisions. Link to relevant holding, sector, or asset-class pages.>
```

### 8 — Update index and log

**A. Add to `wiki/index.md`** under the Research section.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Research: <Topic>

- **Trigger**: `research "<topic>"`
- **Log file**: `raw/research-<slug>-<date>.md`
- **Sources evaluated**: N | Accepted: M
- **Wiki page**: `wiki/research/<slug>.md`
```

### 9 — Report

Tell the user: research log saved, wiki page created, and number of sources evaluated/accepted.
