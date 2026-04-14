---
name: journal
description: Capture the current session as a structured journal entry in wiki/journal/. Records what was investigated, decisions made, wiki pages consulted, outcomes, and follow-up questions. Use when the user says "journal" or "journal <description>".
argument-hint: <optional session description>
allowed-tools: [Read, Write, Edit, Glob]
---

# journal

Capture the current session as a structured journal entry. Saves to
`wiki/journal/journal-<session-slug>-<YYYY-MM-DD>.md`.

Journal entries record the *session's reasoning* — not the domain content (that
lives in wiki pages) but how the session unfolded: what was investigated, what
decisions were made, what was uncertain, and what questions remain. Each entry
links to any wiki pages created or consulted.

The distinction from other page types:
- **Synthesis pages** capture cross-cutting insight about the *domain*
- **Journal entries** capture notes about the *session process* — reasoning, judgment
  calls, gaps, and follow-up questions that don't belong in a wiki page

## Arguments

Session description (optional): $ARGUMENTS

## Steps

### 1 — Determine session scope

From the current conversation context, identify:

- **Session type**: `query` | `research` | `ingest` | `newsletter` | `lint` | `mixed`
- **Starting question or goal**: what prompted this session
- **Wiki pages consulted**: every wiki page read during this session
- **Wiki pages created or updated**: every wiki page written or modified
- **Key decisions**: any judgment calls worth recording — what was uncertain, what
  was ambiguous, what alternatives were considered
- **Gaps and follow-up questions**: anything unresolved, contested, or worth
  investigating next

If `$ARGUMENTS` is provided, use it as the session description and derive the
slug from it (e.g., `"LLM Wiki research"` → `llm-wiki-research`).

If not provided, derive a slug from the session's primary topic
(e.g., `llm-wiki-query`, `harness-engineering-lint`).

### 2 — Check for filename collision

Construct the filename: `wiki/journal/journal-<session-slug>-<YYYY-MM-DD>.md`

Use Glob to check if this file exists. If it does, check for `-v2`, `-v3`, etc.
and use the next available version suffix.

### 3 — Write the journal entry

Create the file using this frontmatter:

```yaml
---
title: "Journal Entry — <Session Description>"
type: journal
tags: [journal, <topic-tags>]
created: YYYY-MM-DD
session_type: query | research | ingest | newsletter | lint | mixed
wiki_pages_consulted: ["concepts/page.md", "entities/page.md"]
outcome: "<one-line summary of what was produced or learned>"
---
```

Populate all five sections:

**## Setup**
What was being investigated. The starting question or goal. What prompted this
session. 2–4 sentences. Link to any prior journal entries or wiki pages that
provide context for *why* this session happened.

**## Process**
Steps taken, decisions made, and wiki pages consulted — linked with relative
paths from `journal/` (e.g., `[Harness Engineering](../concepts/harness-engineering.md)`).

Focus on *reasoning*, not just actions:
- What was uncertain at the start?
- What judgment calls were required?
- What alternatives were considered and rejected?
- Where did the schema's rules cover the situation, and where did they require
  interpretation?

If the session revealed a case the schema doesn't handle well, note it here —
these are amendment candidates.

**## Result**
What was produced. Links to any new or updated wiki pages. What was learned that
wasn't known at the start of the session.

If a synthesis page was created, note why the insight warranted permanent filing
rather than staying in the journal.

If the session ended without a full answer, explain what gap remains and what
would resolve it (new source? new research? human judgment?).

**## What Went Well**
What worked as expected or better. Be specific — "the schema's contradiction-handling
rules correctly surfaced the conflict between sources X and Y" is more useful than
"the session went smoothly." Entries here reinforce which schema rules and workflow
steps are worth keeping exactly as written.

**## What Could Improve**
Gaps identified during the session. Follow-up questions raised but not yet pursued.
Topics that merit a future research or ingest operation. Schema rules that were
ambiguous or produced inconsistent results. These become seeds for the next session
and candidates for schema amendments.

At least one entry is required here — if nothing could improve, the session wasn't
examined honestly.

### 4 — Update index and log

**A. Add to `wiki/index.md`** under the Journals section:

```markdown
| [Entry Title](journal/journal-slug-YYYY-MM-DD.md) | session_type | YYYY-MM-DD | outcome one-liner |
```

The Journals table has four columns: Page, Session Type, Created, Outcome.

Also increment the **Journals** count in the Statistics section.

**B. Append to `wiki/log.md`**:

```
### YYYY-MM-DD — Journal: <Session Description>

- **Source/Trigger**: `journal "<description>"`
- **File saved**: `wiki/journal/journal-<slug>-<YYYY-MM-DD>.md`
- **Session type**: <type>
- **Wiki pages consulted**: <N> pages
- **Wiki pages created/updated during session**: <list or "none">
- **Follow-up questions logged**: <N>
```

### 5 — Report

Tell the user: journal entry saved to `<filepath>`, session type, number of wiki
pages linked, and the follow-up questions flagged for future investigation.
