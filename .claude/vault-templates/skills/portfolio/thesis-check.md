---
name: thesis-check
description: Validate an investment thesis against current data. Fetches latest earnings, news, and analyst views; evaluates whether the thesis assumptions still hold; flags weakening or broken theses.
argument-hint: "<ticker>"
allowed-tools: [Read, Write, Edit, Glob, WebSearch, WebFetch]
---

# thesis-check

Validate an investment thesis against current data. Compares the thesis's key assumptions against the latest available information and produces a structured assessment.

## Arguments

- `<ticker>` — ticker symbol of the holding to check (e.g., `AAPL`, `VTI`)

## Steps

### 1 — Read the thesis and holding pages

1. Read `wiki/holdings/<ticker-lowercase>.md` — get the current position details and link to thesis page
2. Read `wiki/theses/<ticker-lowercase>-thesis.md` — get the thesis statement, key assumptions, and invalidation criteria

If either page is missing, report and stop.

### 2 — Fetch fresh data to validate the thesis

**A. Most recent earnings**

Search: `<ticker> latest quarterly earnings EPS revenue guidance`

Extract: EPS vs. estimate, revenue vs. estimate, guidance, notable management commentary.

**B. Recent news relevant to thesis assumptions**

Search: `<ticker> news 60 days growth margin competition`

Extract: 3–5 items directly relevant to the thesis assumptions (e.g., if the thesis assumes market expansion, find news about market share; if it assumes cost discipline, find margin data).

**C. Analyst consensus update**

Search: `<ticker> analyst rating price target upgrade downgrade`

Extract: current consensus, recent rating changes (upgrades/downgrades), price target changes.

**D. Macro/sector context (if relevant to the thesis)**

Search: `<sector> outlook <current year> macro headwinds tailwinds`

Extract: 1–2 macro or sector-level datapoints relevant to the thesis.

### 3 — Evaluate each thesis assumption

For each assumption listed in `## Key Assumptions`:

1. Assess: **Holds** / **Weakening** / **Broken** / **Insufficient data**
2. Cite specific evidence from Step 2 to support the assessment
3. Note confidence level

### 4 — Check invalidation criteria

For each criterion listed in `## Invalidation Criteria`:

1. Has this criterion been met? **No** / **Partially** / **Yes**
2. Cite evidence if partially or fully met

### 5 — Produce a thesis health verdict

**Thesis Health**: one of:
- `Healthy` — All major assumptions hold; no invalidation criteria met
- `Monitoring` — 1–2 assumptions weakening but not broken; no invalidation criteria met
- `At Risk` — 2+ assumptions weakening or one assumption broken; review warranted
- `Broken` — One or more invalidation criteria met; serious consideration of exit warranted

### 6 — Update the thesis page

1. Add a `## Last Validated` entry:

```markdown
## Last Validated

<YYYY-MM-DD> — Thesis health: **<Healthy | Monitoring | At Risk | Broken>**

<2–3 sentence summary of findings.>

**Assumption Assessment:**
- [Assumption 1]: <Holds / Weakening / Broken> — <evidence>
- [Assumption 2]: <Holds / Weakening / Broken> — <evidence>

**Invalidation Check:**
- [Criterion 1]: <Not met / Partially met / Met> — <evidence>
```

2. Update the page's frontmatter:
   - `updated: YYYY-MM-DD`
   - `confidence: <high | medium | low>` based on data freshness

3. If thesis is `At Risk` or `Broken`, add tag `thesis-weakening` or `thesis-broken` to the frontmatter tags list.

### 7 — Update holding page conviction

Update `wiki/holdings/<ticker-lowercase>.md`:

1. Update `conviction` frontmatter field based on verdict:
   - `Healthy` → keep existing or set `high`
   - `Monitoring` → set `medium`
   - `At Risk` → set `low`
   - `Broken` → set `low` and add a `> ⚠️ Thesis is broken — review this position` callout

2. Update the `## Thesis` section to include the last validated date and health status.

### 8 — Optionally create a decision page

If thesis health is `At Risk` or `Broken`, prompt the user:

> "The thesis for <TICKER> is **<health>**. Do you want to log a Hold/Review decision, or take action (trim/sell)?"

If the user says yes to logging a decision, create `wiki/decisions/<ticker>-review-<date>.md` using the decision page template.

### 9 — Update log

Append to `wiki/log.md`:

```
### YYYY-MM-DD — Thesis Check: <TICKER>

- **Trigger**: `thesis-check <ticker>`
- **Thesis health**: <verdict>
- **Assumptions evaluated**: <N>
- **Invalidation criteria checked**: <N>
- **Action**: <none | decision page created | user prompted>
```

### 10 — Report

Tell the user:
- Thesis health: **<verdict>**
- Summary of which assumptions hold, are weakening, or are broken
- Whether any invalidation criteria have been met
- Suggested next step (none / monitor / consider trimming or exiting)
