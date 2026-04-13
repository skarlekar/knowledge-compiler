#!/usr/bin/env bash
set -euo pipefail

# reset-wiki.sh
# Resets raw/ and wiki/ to pristine template state.
# Self-contained — no git commands. Pristine content is embedded below.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ---------------------------------------------------------------------------
# Confirmation
# ---------------------------------------------------------------------------

echo "WARNING: This will permanently delete all local wiki content and raw sources."
echo "This action cannot be undone."
echo ""
read -r -p "Reset raw/ and wiki/ to pristine state? [y/N] " confirm
case "$confirm" in
  [yY][eE][sS]|[yY]) ;;
  *) echo "Aborted."; exit 0 ;;
esac

echo ""
echo "Resetting..."

# ---------------------------------------------------------------------------
# 1. Clean raw/
#    Preserve raw/.gitkeep; remove everything else (files and subdirs).
# ---------------------------------------------------------------------------

find raw/ -mindepth 1 -maxdepth 1 ! -name '.gitkeep' -exec rm -rf {} +
echo "  Cleared raw/"

# ---------------------------------------------------------------------------
# 2. Clean wiki subdirectories
#    Preserve .gitkeep in each; remove all .md files.
#    wiki/journal: also preserve template.md.
# ---------------------------------------------------------------------------

for dir in wiki/concepts wiki/entities wiki/summaries wiki/synthesis wiki/newsletters wiki/presentations; do
  find "$dir" -name '*.md' -delete
done
echo "  Cleared wiki/concepts, entities, summaries, synthesis, newsletters, presentations"

find wiki/journal -name '*.md' ! -name 'template.md' -delete
echo "  Cleared wiki/journal (preserved template.md)"

# ---------------------------------------------------------------------------
# 3. Reset wiki root files to pristine template content
# ---------------------------------------------------------------------------

cat > wiki/index.md << 'HEREDOC'
---
title: "Knowledge Base Index"
type: index
updated: 2026-04-08
---

# Knowledge Base Index

Master catalog of all wiki pages. Every page in the wiki must have an entry here.

## Concepts

| Page | Tags | Confidence | Updated |
|------|------|------------|---------|
| <!-- entries added by LLM during ingest --> | | | |

## Entities

| Page | Tags | Updated |
|------|------|---------|
| <!-- entries added by LLM during ingest --> | | |

## Summaries

| Page | Source | Key Topics | Created |
|------|--------|------------|---------|
| <!-- entries added by LLM during ingest --> | | | |

## Synthesis

| Page | Pages Compared | Created |
|------|----------------|---------|
| <!-- entries added by LLM during ingest --> | | |

## Newsletters

| Page | Topic | Created |
|------|-------|---------|
| <!-- entries added by LLM during newsletter --> | | |

## Statistics

- **Total pages**: 0
- **Concepts**: 0
- **Entities**: 0
- **Summaries**: 0
- **Synthesis**: 0
- **Newsletters**: 0
- **Sources ingested**: 0
- **High confidence**: 0
- **Medium confidence**: 0
- **Low confidence**: 0
HEREDOC

cat > wiki/log.md << 'HEREDOC'
---
title: "Activity Log"
type: log
---

# Activity Log

Append-only record of all wiki changes.

## Format

Each entry follows this format:
```
### YYYY-MM-DD HH:MM — [Action Type]
- **Source/Trigger**: what initiated the action
- **Pages created**: list of new pages
- **Pages updated**: list of updated pages
- **Notes**: any contradictions flagged, decisions made
```

---

### 2026-04-08 00:00 — Setup

- **Source/Trigger**: Repository initialized
- **Pages created**: index.md, log.md, dashboard.md, analytics.md, flashcards.md
- **Pages updated**: none
- **Notes**: Empty knowledge base ready for first source ingestion
HEREDOC

cat > wiki/analytics.md << 'HEREDOC'
---
title: "Analytics"
type: dashboard
tags: [meta]
updated: 2026-04-08
---

# Analytics

Visual analytics powered by the [Charts View](https://github.com/caronchen/obsidian-chartsview-plugin) Obsidian plugin.

## Page Distribution by Type

<!-- CUSTOMIZE: Update these numbers as your wiki grows. -->
<!-- The LLM can update this page during lint operations. -->

```chartsview
type: pie
options:
  legend:
    display: true
    position: right
data:
  - label: Concepts
    value: 0
  - label: Entities
    value: 0
  - label: Summaries
    value: 0
  - label: Syntheses
    value: 0
```

## Confidence Distribution

```chartsview
type: bar
options:
  legend:
    display: false
  indexAxis: y
data:
  - label: High
    value: 0
    backgroundColor: "#4caf50"
  - label: Medium
    value: 0
    backgroundColor: "#ff9800"
  - label: Low
    value: 0
    backgroundColor: "#f44336"
```

## Top Tags

<!-- CUSTOMIZE: Replace these placeholder tags with your actual tags after ingesting sources. -->

```chartsview
type: wordcloud
options:
  maxRotation: 0
  minRotation: 0
data:
  - tag: placeholder-tag-1
    value: 1
  - tag: placeholder-tag-2
    value: 1
  - tag: placeholder-tag-3
    value: 1
```
HEREDOC

cat > wiki/dashboard.md << 'HEREDOC'
---
title: "Dashboard"
type: dashboard
tags: [meta]
updated: 2026-04-08
---

# Dashboard

Live queries powered by the [Dataview](https://github.com/blacksmithgu/obsidian-dataview) Obsidian plugin.

## Low Confidence Pages

Pages that need more sources or evidence to strengthen.

```dataview
TABLE confidence, sources, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE confidence = "low"
SORT updated DESC
```

## All Concepts by Tag

```dataview
TABLE tags, confidence, updated
FROM "wiki/concepts"
SORT file.name ASC
```

## Recently Updated Pages

The 15 most recently modified wiki pages.

```dataview
TABLE type, tags, updated
FROM "wiki/"
SORT updated DESC
LIMIT 15
```

## Pages with Most Sources

Pages informed by the greatest number of raw sources.

```dataview
TABLE length(sources) AS "Source Count", confidence, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE sources
SORT length(sources) DESC
LIMIT 10
```

## Orphan Check

Pages that may lack inbound links (review manually — Dataview cannot check incoming links directly).

```dataview
TABLE type, tags, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE length(file.inlinks) = 0
SORT updated ASC
```

## Entity Overview

```dataview
TABLE tags, updated
FROM "wiki/entities"
SORT file.name ASC
```
HEREDOC

cat > wiki/flashcards.md << 'HEREDOC'
---
title: "Flashcards"
type: flashcards
tags: [meta, flashcards]
updated: 2026-04-08
---

# Flashcards

Spaced repetition cards for the [Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) Obsidian plugin.

## Format

Each flashcard uses this format:

```
Question text goes here
?
Answer text goes here
```

Separate cards with blank lines. The `?` on its own line separates question from answer.

Ask the LLM to generate flashcards from any wiki page:
```
Generate flashcards from [[concepts/concept-name]]
```

---

## Cards

What is the purpose of the "ingest" workflow?
?
The ingest workflow reads a raw source document, creates a summary page, identifies and creates/updates concept and entity pages, adds cross-links between all touched pages, and updates the index and log.

What are the three confidence levels and when is each used?
?
**High** — well-established idea with multiple corroborating sources and concrete examples. **Medium** — supported by sources but limited examples or single-source. **Low** — single mention, anecdotal, or speculative.

What does the "lint" operation check for?
?
Orphan pages (no inbound links), stale claims, contradictions between pages, missing cross-links, incomplete sections, and low-confidence pages that could be strengthened.
HEREDOC

echo "  Restored wiki/index.md, log.md, analytics.md, dashboard.md, flashcards.md"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo ""
echo "Reset complete. raw/ and wiki/ are in pristine state."
