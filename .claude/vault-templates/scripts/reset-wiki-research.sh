#!/usr/bin/env bash
set -euo pipefail

# reset-wiki.sh
# Resets raw/ and wiki/ to pristine template state for a research vault.
# Self-contained — no git commands. Pristine content is embedded below.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

CURRENT_DATE=$(date +%Y-%m-%d)

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
#    Remove everything inside raw/ but keep the directory itself.
# ---------------------------------------------------------------------------

find raw/ -mindepth 1 -maxdepth 1 -exec rm -rf {} +
echo "  Cleared raw/"

# ---------------------------------------------------------------------------
# 2. Clean wiki subdirectories
#    Remove all .md files.  Keep wiki/journal/template.md if present.
# ---------------------------------------------------------------------------

for dir in wiki/concepts wiki/entities wiki/summaries wiki/synthesis \
           wiki/newsletters wiki/presentations wiki/images; do
  if [ -d "$dir" ]; then
    find "$dir" -name '*.md' -delete
  fi
done
echo "  Cleared wiki/concepts, entities, summaries, synthesis, newsletters, presentations"

if [ -d "wiki/journal" ]; then
  find wiki/journal -name '*.md' ! -name 'template.md' -delete
fi
echo "  Cleared wiki/journal (preserved template.md if present)"

# ---------------------------------------------------------------------------
# 3. Reset wiki root files to pristine template content
# ---------------------------------------------------------------------------

cat > wiki/index.md << HEREDOC
---
title: "Knowledge Base Index"
type: index
updated: $CURRENT_DATE
---

# Knowledge Base Index

Master catalog of all wiki pages. Every page in the wiki must have an entry here.

## Concepts

| Page | Tags | Confidence | Updated |
|------|------|------------|---------|

## Entities

| Page | Tags | Updated |
|------|------|---------|

## Summaries

| Page | Source | Key Topics | Created |
|------|--------|------------|---------|

## Synthesis

| Page | Pages Compared | Created |
|------|----------------|---------|

## Newsletters

| Page | Topic | Created | Key Argument |
|------|-------|---------|--------------|

## Journals

| Page | Session Type | Created | Outcome |
|------|--------------|---------|---------|

## Statistics

- **Total pages**: 0
- **Concepts**: 0
- **Entities**: 0
- **Summaries**: 0
- **Synthesis**: 0
- **Newsletters**: 0
- **Journals**: 0
- **Sources ingested**: 0
HEREDOC

cat > wiki/log.md << HEREDOC
---
title: "Activity Log"
type: log
---

# Activity Log

Append-only record of all wiki changes.

## Format

Each entry follows this format:
\`\`\`
### YYYY-MM-DD HH:MM — [Action Type]
- **Source/Trigger**: what initiated the action
- **Pages created**: list of new pages
- **Pages updated**: list of updated pages
- **Notes**: any decisions made
\`\`\`

---

### $CURRENT_DATE — Reset

- **Source/Trigger**: reset-wiki.sh executed
- **Pages created**: index.md, log.md
- **Pages updated**: none
- **Notes**: Wiki reset to pristine state
HEREDOC

cat > wiki/analytics.md << HEREDOC
---
title: "Analytics"
type: dashboard
tags: [meta]
updated: $CURRENT_DATE
---

# Analytics

Visual analytics powered by the [Charts View](https://github.com/caronchen/obsidian-chartsview-plugin) Obsidian plugin.

## Page Distribution by Type

\`\`\`chartsview
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
\`\`\`

## Confidence Distribution

\`\`\`chartsview
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
\`\`\`
HEREDOC

cat > wiki/dashboard.md << HEREDOC
---
title: "Dashboard"
type: dashboard
tags: [meta]
updated: $CURRENT_DATE
---

# Dashboard

Live queries powered by the [Dataview](https://github.com/blacksmithgu/obsidian-dataview) Obsidian plugin.

## Low Confidence Pages

\`\`\`dataview
TABLE confidence, sources, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE confidence = "low"
SORT updated DESC
\`\`\`

## Recently Updated Pages

\`\`\`dataview
TABLE type, tags, updated
FROM "wiki/"
SORT updated DESC
LIMIT 15
\`\`\`

## Orphan Check

\`\`\`dataview
TABLE type, tags, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE length(file.inlinks) = 0
SORT updated ASC
\`\`\`
HEREDOC

cat > wiki/flashcards.md << HEREDOC
---
title: "Flashcards"
type: flashcards
tags: [meta, flashcards]
updated: $CURRENT_DATE
---

# Flashcards

Spaced repetition cards for the [Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) Obsidian plugin.

## Format

Each flashcard uses this format:

\`\`\`
Question text goes here
?
Answer text goes here
\`\`\`

Separate cards with blank lines. Ask the LLM to generate flashcards from any wiki page:
\`\`\`
Generate flashcards from [[concepts/concept-name]]
\`\`\`

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
