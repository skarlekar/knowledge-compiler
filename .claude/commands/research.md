---
name: research
description: Search the web for credible sources on a topic, evaluate them, extract attributed claims, and save a research log to raw/. Invoke this at the start of the Research workflow whenever the user asks to research a topic.
argument-hint: <topic>
allowed-tools: [WebSearch, WebFetch, Read, Write]
---

# research

Search credible online sources for a topic, evaluate each source, extract
attributed claims, and save a structured research log to `raw/` so the
Knowledge Compiler Research workflow can populate wiki pages from it.

## Arguments

Topic to research: $ARGUMENTS

## Steps

### 1 — Check existing wiki coverage

Read `wiki/index.md`. If the topic already has substantial coverage in existing
concept or entity pages, report this to the user and ask whether to continue —
research may duplicate or risk contradicting curated content.

### 2 — Derive slug and output path

- Lowercase the topic; replace spaces and non-alphanumeric characters with hyphens
- Output path: `raw/research-<topic-slug>-<YYYY-MM-DD>.md`

### 3 — Search for candidate sources

Run 2–3 `WebSearch` queries with varied angles to maximise source diversity:

- Conceptual overview: `<topic> overview explanation`
- Academic / technical: `<topic> research paper arxiv documentation`
- Recent: `<topic> 2024 OR 2025`

Collect 5–7 candidate URLs. Aim for a mix of academic, official documentation,
and practitioner sources — avoid pulling all results from a single domain.

### 4 — Evaluate each candidate for credibility

Fetch each candidate with `WebFetch`. Assess against these signals:

| Signal | Credible | Not credible |
| --- | --- | --- |
| Authorship | Named expert, institution, or official docs | Anonymous or unknown |
| Publisher | Peer-reviewed, established publication, vendor docs | Personal blog, forum post, wiki |
| Recency | Within 2 years for fast-moving topics | Outdated — flag if used anyway |
| Sourcing | Cites primary sources | Summary of summaries, no citations |
| Framing | Informational | Advocacy, undisclosed conflict of interest |

Accept 3–5 sources. Record every candidate — accepted or rejected — with a
one-line credibility verdict. Do not proceed with fewer than 2 accepted sources;
report to the user and stop.

### 5 — Extract attributed claims

For each accepted source extract:

- Key claims the source makes
- Evidence or citations supporting each claim
- Retrieval date

Tag every claim with its source URL. Attribution must be at the **claim level**,
not just the page level.

### 6 — Map consensus, disagreement, and gaps

Across all accepted sources identify:

- **Consensus** — claims supported by 2+ independent sources
- **Contested** — claims where sources disagree; record both positions with attribution
- **Gaps** — significant aspects of the topic with no credible source coverage found

### 7 — Write the research log

Write the output file with this structure:

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
- **Verdict:** Accepted | Rejected — <one-line reason>

## Attributed Claims

### <Subtopic or theme>

- <Claim statement> — [Title](URL), YYYY-MM-DD
- <Claim statement> — [Title](URL), YYYY-MM-DD

## Consensus Map

**Agreed across sources:** ...
**Contested:** ...
**Gaps (no credible coverage found):** ...
```

### 8 — Handle errors

- Fewer than 2 credible sources found → report to the user and stop; do not
  create a research log with insufficient evidence
- A source returns an error or is paywalled → skip it and note it in the log
  as "Rejected — inaccessible"
- WebSearch returns no useful results → try 1–2 alternative query phrasings
  before giving up

### 9 — Report and return

Tell the user: "Research log saved to `<filepath>`. Evaluated N sources,
accepted M. Proceeding with wiki population."

Return the filepath so the Research workflow in CLAUDE.md can proceed with
wiki page creation.
