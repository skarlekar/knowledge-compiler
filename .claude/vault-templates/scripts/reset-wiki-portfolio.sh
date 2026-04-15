#!/usr/bin/env bash
set -euo pipefail

# reset-wiki.sh
# Resets raw/ and wiki/ to pristine template state for a portfolio vault.
# Self-contained — no git commands. Pristine content is embedded below.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

CURRENT_DATE=$(date +%Y-%m-%d)

# ---------------------------------------------------------------------------
# Confirmation
# ---------------------------------------------------------------------------

echo "WARNING: This will permanently delete all wiki pages, holdings data, net worth history, and raw source snapshots."
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
#    Remove all .md files. Keep wiki/journal/template.md if present.
# ---------------------------------------------------------------------------

for dir in wiki/holdings wiki/watchlist wiki/theses wiki/decisions \
           wiki/sectors wiki/asset-classes wiki/performance wiki/research \
           wiki/assets wiki/liabilities wiki/images; do
  if [ -d "$dir" ]; then
    find "$dir" -name '*.md' -delete
  fi
done
echo "  Cleared holdings, watchlist, theses, decisions, sectors, asset-classes, performance, research, assets, liabilities"

if [ -d "wiki/journal" ]; then
  find wiki/journal -name '*.md' ! -name 'template.md' -delete
fi
echo "  Cleared wiki/journal (preserved template.md if present)"

if [ -d "wiki/net-worth" ]; then
  find wiki/net-worth -name '*.md' -delete
fi
echo "  Cleared wiki/net-worth"

# ---------------------------------------------------------------------------
# 3. Reset wiki root files to pristine template content
# ---------------------------------------------------------------------------

cat > wiki/index.md << HEREDOC
---
title: "Portfolio Index"
type: index
updated: $CURRENT_DATE
---

# Portfolio Index

Master catalog of all wiki pages. Every page in the wiki must have an entry here.

## Holdings

| Page | Ticker | Type | Account | Updated |
| --- | --- | --- | --- | --- |

## Watchlist

| Page | Ticker | Trigger Criteria | Added |
| --- | --- | --- | --- |

## Theses

| Page | Ticker | Conviction | Last Validated |
| --- | --- | --- | --- |

## Decisions

| Page | Ticker | Action | Date |
| --- | --- | --- | --- |

## Sectors

| Page | Holdings | Updated |
| --- | --- | --- |

## Asset Classes

| Page | Current Allocation | Updated |
| --- | --- | --- |

## Performance

| Page | Date | Total Value | Unrealized G/L |
| --- | --- | --- | --- |

## Assets

| Page | Type | Estimated Value | Updated |
| --- | --- | --- | --- |

## Liabilities

| Page | Type | Outstanding Balance | Updated |
| --- | --- | --- | --- |

## Net Worth

| Page | Date | Net Worth |
| --- | --- | --- |

## Research

| Page | Topic | Created |
| --- | --- | --- |

## Journals

| Page | Session Type | Created | Outcome |
| --- | --- | --- | --- |

## Statistics

- **Total pages**: 0
- **Holdings**: 0
- **Watchlist**: 0
- **Theses**: 0
- **Decisions**: 0
- **Sectors**: 0
- **Asset Classes**: 0
- **Performance Snapshots**: 0
- **Assets**: 0
- **Liabilities**: 0
- **Research**: 0
- **Journals**: 0
HEREDOC

cat > wiki/log.md << HEREDOC
---
title: "Activity Log"
type: log
---

# Activity Log

Append-only record of all portfolio wiki changes.

## Format

Each entry follows this format:
\`\`\`
### YYYY-MM-DD — [Action Type]
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
# 4. Ensure net-worth directory is clean
# ---------------------------------------------------------------------------

mkdir -p wiki/net-worth
echo "  Ensured wiki/net-worth/ exists"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo ""
echo "Reset complete. raw/ and wiki/ are in pristine state."
