# Knowledge Compiler

An LLM-powered knowledge base with an interactive graph viewer. You drop raw sources into `raw/`, tell the LLM to ingest them, and it writes and maintains structured wiki pages — summaries, concepts, entities, and synthesis — all cross-linked and indexed. A browser-based graph viewer lets you explore the knowledge base visually.

Built on [Andrej Karpathy's "LLM Wiki" pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## How It Works

```text
raw/        Sources you collect (articles, transcripts, notes) — you never edit these
wiki/       LLM-written & maintained pages — you never edit these directly
CLAUDE.md   Schema that tells the LLM how to structure everything
src/        Graph viewer — Node.js server + browser frontend
```

**Division of responsibility:** You curate raw sources and direct queries. The LLM reads, writes, and links all wiki pages. The graph viewer lets you navigate the result.

---

## Quick Start

**Prerequisites:** Node.js v18 or later. Python 3.8+ and pip (required for URL ingestion only).

```bash
# From the repo root
./start.sh
```

`start.sh` installs dependencies on first run and starts the server at `http://localhost:3000`.

Or manually:

```bash
cd src
npm install   # first run only
npm start
```

---

## Using the Knowledge Compiler

There are four operations. Type them in the chat with your LLM (Claude Code, Claude.ai, or any LLM that can read your repo).

### 1. Ingest

**Trigger:** `ingest <source>` — where source is a local file path or a URL

The LLM will:

1. Read the source in full (fetching it first if it is a URL — see below)
2. Create `wiki/summaries/<source-slug>.md`
3. Identify every concept, entity, and strategy mentioned
4. Create a new page for each concept/entity that doesn't have one yet; update existing pages with new information
5. Add cross-links in both directions across all touched pages
6. Update `wiki/index.md` with new and changed entries
7. Append a timestamped entry to `wiki/log.md`
8. Flag any contradictions with existing wiki content

**Local file examples:**

```text
ingest raw/podcast-transcript-episode-42.txt
```

```text
I just added raw/q3-earnings-call.txt — please ingest it
```

**URL examples:**

```text
ingest https://example.com/article-about-graph-databases
```

```text
ingest https://signalovernoise.karlekar.cloud/issue-007.html
```

When given a URL, the LLM automatically invokes the `ingest-url` skill, which runs `src/tools/fetch_md.py` to download the page and its images, save the result to `raw/`, and then proceeds with the standard ingest steps above. Images are saved to `raw/images/<slug>/` and embedded with relative paths. No API calls or external services are used — pure local Python.

After ingestion you will see new or updated files in `wiki/summaries/`, `wiki/concepts/`, `wiki/entities/`, and possibly `wiki/synthesis/`. Click **Refresh** in the graph viewer to see the changes.

---

### 2. Query

**Trigger:** Ask any natural-language question

The LLM searches the wiki and synthesises an answer with citations. It will:

1. Read `wiki/index.md` to identify relevant pages
2. Read those pages
3. Synthesise a cited answer using wiki links
4. If the answer reveals new cross-cutting insight: create a synthesis page in `wiki/synthesis/` and update the index and log

**Examples:**

```text
What are the key differences between community detection and node similarity?
```

```text
Which sources mention AWS Neptune? What do they say about its limitations?
```

```text
Summarise everything the wiki knows about vector embeddings and how they relate to graph databases.
```

```text
What strategies does the wiki recommend for handling high-cardinality graphs?
```

The LLM answers inline and, when appropriate, writes a new `wiki/synthesis/` page capturing the insight for future reference.

---

### 3. Lint

**Trigger:** `lint` or `health check`

Audits the entire wiki and fixes what it can automatically. The LLM will:

1. Read every wiki page
2. Check for:
   - Orphan pages (no inbound links)
   - Missing cross-links (concept mentioned but not linked)
   - Contradictions between pages
   - Incomplete required sections
   - Low-confidence claims that could be strengthened with existing sources
3. Fix issues it can resolve automatically (add missing links, fill incomplete sections)
4. Report issues that need human judgement (genuine contradictions, gaps requiring new sources)
5. Suggest topics or sources worth investigating
6. Append a lint summary to `wiki/log.md`

**Examples:**

```text
lint
```

```text
health check
```

```text
Run a lint and tell me which concepts have the least source coverage.
```

---

### 4. Research

**Trigger:** `research <topic>`

Searches the web for credible sources on a topic, evaluates them, extracts attributed claims, and populates the wiki — without you providing a specific source. Use this when you want the LLM to go find and compile knowledge on a subject rather than ingest something you already have.

The LLM will:

1. Check existing wiki coverage to avoid duplicating what's already there
2. Run web searches to find 5–7 candidate sources
3. Evaluate each for credibility (author, publisher, recency, sourcing quality) — accept 3–5, skip the rest
4. Extract key claims tagged to their source URL
5. Map consensus, disagreement, and gaps across sources
6. Save a research log to `raw/research-<topic-slug>-<date>.md` with full source provenance
7. Create concept, entity, and synthesis wiki pages from the findings
8. Update `wiki/index.md` and `wiki/log.md`

**Examples:**

```text
research "transformer attention mechanisms"
```

```text
research "agentic AI frameworks 2025"
```

```text
research "graph database performance benchmarks"
```

The LLM uses the `research` skill, which handles web search and source evaluation automatically. Contested claims across sources are noted explicitly — never silently merged. A synthesis page is created whenever multiple competing perspectives are found.

---

### 5. Reset

**Trigger:** `./reset-wiki.sh`

Wipes all local wiki content and raw sources, then restores the five wiki root files to their pristine template state. Use this to start fresh with a new knowledge domain or to recover from a corrupted wiki state.

```bash
./reset-wiki.sh
```

The script will prompt for confirmation before doing anything. What it clears:

- `raw/` — all files and subdirectories except `.gitkeep`
- `wiki/concepts/`, `wiki/entities/`, `wiki/summaries/`, `wiki/synthesis/`, `wiki/presentations/` — all `.md` files
- `wiki/journal/` — all `.md` files except `template.md`
- `wiki/index.md`, `wiki/log.md`, `wiki/analytics.md`, `wiki/dashboard.md`, `wiki/flashcards.md` — overwritten with pristine template content

The script is fully self-contained — it does not call git or any external service. Pristine template content is embedded directly in the script.

---

## Wiki Page Types

Every page the LLM creates lives in one of these directories and follows a fixed structure.

### Summary pages (`wiki/summaries/`)

One page per raw source. Created automatically during ingest.

```markdown
---
title: "Source Title"
type: summary
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/filename.txt"]
confidence: high | medium | low
---

## Key Points
- Main claims and ideas from the source

## Relevant Concepts
Links to concept pages this source touches

## Source Metadata
Type, author/speaker, date, URL or identifier
```

### Concept pages (`wiki/concepts/`)

One page per idea, framework, or strategy. Created or updated during ingest; also created on demand.

```markdown
---
title: "Concept Name"
type: concept
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/source1.txt", "raw/source2.txt"]
confidence: high | medium | low
---

## Definition
Plain-English definition in one paragraph

## How It Works
Mechanics, process, or structure

## Key Parameters
Important variables, dimensions, or factors

## When To Use
Situations and contexts where this applies

## Risks & Pitfalls
Known failure modes, common mistakes, limitations

## Related Concepts
Links to related wiki pages

## Sources
Which raw sources inform this page
```

### Entity pages (`wiki/entities/`)

One page per named thing — person, tool, organisation, product, dataset.

```markdown
---
title: "Entity Name"
type: entity
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/source.txt"]
confidence: high | medium | low
---

## Overview
What this entity is

## Characteristics
Key properties, attributes, structure

## Common Strategies
Links to concept pages for methods associated with this entity

## Related Entities
Links to related entity pages
```

### Synthesis pages (`wiki/synthesis/`)

Cross-cutting comparisons and analyses. Created when a query reveals novel insight, or on demand.

```markdown
---
title: "Comparison or Analysis Title"
type: synthesis
tags: [tag1, tag2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/source1.txt", "raw/source2.txt"]
confidence: high | medium | low
---

## Comparison
Table or structured comparison

## Analysis
Cross-cutting insights

## Recommendations
When to prefer which approach

## Pages Compared
Links to all pages involved
```

---

## Confidence Levels

Every page carries a `confidence` field in its frontmatter.

| Level | Meaning |
| ----- | ------- |
| `high` | Well-established; multiple corroborating sources; demonstrated with concrete examples |
| `medium` | Supported by sources but limited examples or single-source |
| `low` | Single mention, anecdotal, or speculative |

When in doubt the LLM sets `low` and notes the uncertainty inline. The lint workflow surfaces low-confidence pages and suggests how to strengthen them.

---

## Linking Conventions

The LLM follows these rules when writing pages — useful to know when reading the wiki or navigating the graph:

- Links use standard Markdown relative syntax: `[Display Text](relative/path.md)`
- Paths are relative to the **current file's location**, not the wiki root
  - Same folder: `[Decision Trace](decision-trace.md)`
  - Sibling folder: `[AWS Neptune](../entities/aws-neptune.md)`
  - From `summaries/` to `concepts/`: `[Context Graph](../concepts/context-graph.md)`
- Every page links to at least one other page — no orphans
- When a concept is mentioned by name in a page, it is always linked if a page exists for it

---

## Graph Viewer Features

| Feature | Description |
| ------- | ----------- |
| **Force-directed graph** | Nodes coloured by page type (concept, entity, summary, synthesis, journal, …) with a live legend |
| **Content panel** | Renders Markdown with a metadata bar showing `type`, `tags`, `confidence`, and `updated` |
| **Bidirectional navigation** | Click nodes in the graph or links in the content panel — both stay in sync |
| **Breadcrumb trail** | Last 10 visited nodes, each clickable |
| **Search** | Instant dropdown search across node names and file paths |
| **Type filters** | Toggle-button filters that show/hide node types; graph re-stabilizes automatically |
| **Graph statistics** | Node count, edge count, nodes per type, orphan count |
| **Pan / zoom / drag** | Scroll to zoom, drag background to pan, drag nodes to reposition |
| **Fit to view** | One-click "Fit" button to see the whole graph |
| **Refresh** | Rebuilds the graph from `wiki/` without a full page reload; preserves the active node |
| **Upload to `raw/`** | Upload source files directly from the browser to the `raw/` directory |

### Keyboard Shortcuts

| Shortcut | Action |
| -------- | ------ |
| `Ctrl+/` / `Cmd+/` | Focus the search input |
| `Escape` | Clear search and close dropdown |
| `Backspace` (search not focused) | Navigate back |
| `Home` | Navigate to `index.md` |

---

## Directory Structure

```text
.
├── CLAUDE.md                      # Schema — the LLM's instructions
├── start.sh                       # Convenience launcher
├── reset-wiki.sh                  # Reset raw/ and wiki/ to pristine template state
├── raw/                           # Your source documents (immutable, not in git)
├── .claude/
│   └── commands/
│       ├── ingest-url.md          # Project skill — fetch URL and save to raw/
│       └── research.md            # Project skill — web research, source evaluation, claim extraction
├── docs/
│   ├── specification.md           # Full software requirements (EARS format)
│   └── tasks.md                   # Implementation task list
├── src/
│   ├── package.json
│   ├── tools/
│   │   ├── fetch_md.py            # HTML-to-Markdown converter for URL ingest
│   │   └── requirements.txt       # Python deps: markdownify, beautifulsoup4
│   ├── server/
│   │   └── index.js               # Express server — file API + upload endpoint
│   └── public/
│       ├── index.html
│       ├── css/styles.css
│       ├── js/
│       │   ├── app.js             # Entry point — wires modules together
│       │   ├── graph.js           # Graph model builder (file discovery, link extraction)
│       │   ├── visualization.js   # D3 force-directed graph rendering
│       │   ├── content.js         # Markdown renderer + metadata bar
│       │   ├── navigation.js      # Breadcrumb, Back, Home
│       │   ├── search.js          # Search input + type filter toggles
│       │   └── utils.js           # Shared helpers
│       └── lib/                   # Vendored dependencies (no CDN at runtime)
│           ├── d3.v7.min.js
│           ├── marked.min.js
│           ├── js-yaml.min.js
│           └── dompurify.min.js
└── wiki/
    ├── index.md                   # Master catalog — default selected node
    ├── log.md                     # Append-only activity log
    ├── dashboard.md               # Dataview dashboard (Obsidian)
    ├── analytics.md               # Charts View analytics (Obsidian)
    ├── flashcards.md              # Spaced repetition cards
    ├── summaries/                 # One page per source document (not in git)
    ├── concepts/                  # Concept and framework pages (not in git)
    ├── entities/                  # People, tools, organizations, etc. (not in git)
    ├── synthesis/                 # Cross-cutting analyses and comparisons (not in git)
    ├── journal/                   # Research/session journal entries (not in git)
    │   └── template.md
    └── presentations/             # Marp slide decks (not in git)
```

> **Note:** `raw/` and all `wiki/` subdirectory content is excluded from git — these are LLM-generated or user-collected files that live only on your machine. The repo tracks infrastructure only: source code, schema, skills, and the wiki root files (`index.md`, `log.md`, etc.) at their initial state.

---

## Server API

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/wiki/files` | Returns a JSON array of all `.md` paths under `wiki/` |
| `GET` | `/api/wiki/file?path=<rel>` | Returns the raw content of a wiki file |
| `POST` | `/api/raw/upload` | Accepts `multipart/form-data`; writes the file to `raw/` (rejects overwrites) |

The server binds to `127.0.0.1` only and never modifies files in `wiki/`.

---

## Customizing for Your Domain

Edit `CLAUDE.md`:

1. **Purpose** — Replace the placeholder paragraph with a description of your knowledge domain
2. **Tagging taxonomy** — Replace the placeholder categories with your own (e.g., for a cooking KB: `cuisine`, `technique`, `ingredient`, `equipment`)
3. **Confidence levels** — Adjust the descriptions to match your domain's evidence standards
4. **Entity types** — Update the entity page description to match what entities mean in your domain
5. **Journal template** — Customize `wiki/journal/template.md` for your workflow

Page formats, linking conventions, workflows, and graph viewer behaviour are domain-agnostic and work as-is.

---

## Technology Stack

| Role | Library |
| ---- | ------- |
| Graph visualization | [D3.js](https://d3js.org/) v7 (d3-force) |
| Markdown rendering | [marked](https://marked.js.org/) |
| HTML sanitization | [DOMPurify](https://github.com/cure53/DOMPurify) |
| YAML / frontmatter | [js-yaml](https://github.com/nodeca/js-yaml) |
| Server | [Express](https://expressjs.com/) + [multer](https://github.com/expressjs/multer) |

All frontend dependencies are bundled locally — no CDN requests at runtime.

## License

MIT
