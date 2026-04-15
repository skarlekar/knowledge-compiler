#!/usr/bin/env bash
set -euo pipefail

# reset-wiki.sh
# Resets raw/ and wiki/ to pristine template state for a code-analysis vault.
# Self-contained — no git commands. Pristine content is embedded below.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

CURRENT_DATE=$(date +%Y-%m-%d)

# ---------------------------------------------------------------------------
# Confirmation
# ---------------------------------------------------------------------------

echo "WARNING: This will permanently delete all wiki pages and raw source snapshots."
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

for dir in wiki/classes wiki/functions wiki/apis wiki/libraries \
           wiki/patterns wiki/anti-patterns wiki/modules wiki/images; do
  if [ -d "$dir" ]; then
    find "$dir" -name '*.md' -delete
  fi
done
echo "  Cleared wiki/classes, functions, apis, libraries, patterns, anti-patterns, modules"

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

## Classes

| Page | Language | Confidence | Updated |
|------|----------|------------|---------|

## Functions

| Page | Language | Confidence | Updated |
|------|----------|------------|---------|

## APIs

| Page | Endpoint | Updated |
|------|----------|---------|

## Libraries

| Page | Language | Updated |
|------|----------|---------|

## Patterns

| Page | Where Used | Updated |
|------|------------|---------|

## Anti-Patterns

| Page | Impact | Updated |
|------|--------|---------|

## Modules

| Page | Language | Updated |
|------|----------|---------|

## Journals

| Page | Session Type | Created | Outcome |
|------|--------------|---------|---------|

## Statistics

- **Total pages**: 0
- **Classes**: 0
- **Functions**: 0
- **APIs**: 0
- **Libraries**: 0
- **Patterns**: 0
- **Anti-Patterns**: 0
- **Modules**: 0
- **Journals**: 0
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

echo "  Restored wiki/index.md, log.md"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo ""
echo "Reset complete. raw/ and wiki/ are in pristine state."
