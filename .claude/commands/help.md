---
name: help
description: Display all available operations and workflows for the active vault type, with usage examples and guidance.
argument-hint: (none required)
allowed-tools: [Read, Glob]
---

# help

Display a formatted guide of every operation available in the active vault, with usage examples and tips.

## Steps

### 1 — Determine vault type

Read the active vault's `CLAUDE.md`.

- If the Directory Layout lists `wiki/concepts/` and `wiki/entities/` → **research** vault
- If it lists `wiki/classes/` and `wiki/functions/` → **code-analysis** vault

### 2 — Print the appropriate help guide

Print the guide exactly as written below for the detected vault type. Do not summarise — print the full guide so the user can read it.

---

## Research Vault Guide

> Print this block when vault type is **research**.

---

# Knowledge Compiler — Research Vault

This vault ingests source material, builds a structured wiki, and produces newsletters and synthesis pages from accumulated knowledge.

## Operations

### `ingest <url>`
Fetch a webpage, convert it to Markdown in `raw/`, then analyse the content and populate wiki pages (concepts, entities, summaries).

```
ingest https://arxiv.org/abs/2401.00123
ingest https://example.com/article-title
```

Use this for any article, blog post, documentation page, or online paper you want the wiki to learn from.

---

### `ingest <path-to-pdf>`
Parse a local PDF file using OCR or Claude Vision, save the Markdown to `raw/`, then populate wiki pages.

```
ingest papers/my-paper.pdf
ingest ~/Downloads/report-2025.pdf
```

Three extraction stages are attempted automatically: text extraction → Tesseract OCR → Claude Vision. Requires `ANTHROPIC_API_KEY` for the Vision fallback.

---

### `research <topic>`
Search 3–5 credible online sources, evaluate each for credibility, extract attributed claims, and save a research log to `raw/`. Then populate wiki pages from the log.

```
research "LLM knowledge graphs"
research "agentic AI safety 2025"
research "retrieval augmented generation"
```

Use this when you want the wiki to learn about a topic without providing a specific source document.

---

### `newsletter <topic>`
Transform the wiki's accumulated knowledge on a topic into a long-form newsletter (4,000–5,500 words) in the Signal Over Noise style. If wiki coverage is thin, `research` is invoked automatically first.

```
newsletter "The Control Dial: Orchestration vs Autonomy in Agentic AI"
newsletter "Knowledge Graphs for Enterprise AI"
```

The newsletter is saved to `wiki/newsletters/` and source wiki pages are back-linked.

---

### `lint`
Scan all wiki pages for health issues and auto-fix what can be fixed.

Checks: orphan pages · broken internal links · stale source citations · missing required sections · claims without source attribution · contradictions between pages.

```
lint
```

Auto-fixes: adds missing cross-links, removes dead links. Reports stale sources and contradictions as human-judgment items.

---

### `journal [description]`
Capture the current session as a structured journal entry in `wiki/journal/`. Records what was investigated, decisions made, wiki pages consulted, and follow-up questions.

```
journal
journal "researched transformer architecture sources"
journal "ingested Q1 2025 AI safety report"
```

Journal entries record *session reasoning*, not domain content. Domain content belongs in concept/entity pages.

---

### Asking questions
Ask any question in plain English. Claude will read relevant wiki pages and synthesise an answer with citations.

```
What does the wiki say about retrieval augmented generation?
What sources have we ingested about LLM agents?
Which concepts are related to knowledge graphs?
Summarise what we know about [topic].
```

---

## Workflow Tips

**Starting fresh with a new source:**
1. `ingest <url-or-pdf>` — pulls in the source
2. Ask questions to explore what was learned

**Building wiki coverage on a topic:**
1. `research <topic>` — searches and populates wiki
2. `newsletter <topic>` — turns coverage into publishable content

**Keeping the wiki healthy:**
- Run `lint` periodically, especially after many ingestions
- Run `journal` at the end of focused sessions to preserve reasoning

**Re-ingesting a changed source:**
Run `ingest` again on the same URL or file. Pages are updated, not duplicated.

---

## Research Vault Guide (end)

---

## Code Analysis Vault Guide

> Print this block when vault type is **code-analysis**.

---

# Knowledge Compiler — Code Analysis Vault

This vault reads source code files, builds a structured wiki of classes, functions, APIs, libraries, patterns, and anti-patterns, and answers questions about the codebase.

## Operations

### `analyze <path>`
Read source files at the given path and populate wiki pages. Works on a single file or an entire directory (recursive).

```
analyze src/server/index.js          ← single file
analyze src/                         ← whole directory
analyze src/components/UserAuth.tsx  ← specific component
```

**What gets created:** class pages · function pages · API endpoint pages · library pages · pattern pages · anti-pattern pages · module pages.

Each page records the `source_files` location and `file:line` references so everything stays traceable.

---

### Re-analyzing after a code change
Run `analyze` again on any file or directory that changed. Existing wiki pages are **updated**, not overwritten — information that is still accurate is preserved, new information is merged in.

```
analyze src/auth/               ← after refactoring auth module
analyze src/server/index.js     ← after adding a new route
```

**Recommended workflow for changes:**
1. `lint` — find stale references from the previous state
2. `analyze <changed-path>` — update wiki with new state

---

### `analyze-deps` or `analyze dependencies`
Scan dependency manifests (`package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, `pom.xml`) and create or update library pages for every declared dependency.

```
analyze-deps
analyze dependencies
```

Records: package name · pinned version · which APIs the codebase actually uses · decision rationale (if documented).

---

### `lint`
Scan all wiki pages for health issues specific to code analysis vaults.

Checks: stale `source_files` (file moved or deleted) · broken `file:line` references in Where Found / Calls / Called By · orphan pages with no inbound links · missing required sections · module pages with no dependency links.

```
lint
```

Auto-fixes: adds missing cross-links. Reports stale file paths and broken line references as human-judgment items (the file may have been refactored — only you know whether to update or delete the page).

---

### `journal [description]`
Capture the current analysis session as a structured journal entry in `wiki/journal/`. Records what was analyzed, decisions made, patterns found, and follow-up questions.

```
journal
journal "analyzed auth module after OAuth migration"
journal "found god object in UserService"
```

Session types for code-analysis vaults: `analyze` · `query` · `lint` · `mixed`.

---

### `document-project`

Generate a comprehensive **Technical Deep Dive** document for the entire codebase. Reads all wiki pages and source files, then produces a single polished Markdown file at `wiki/deep-dive/technical-deep-dive.md` — styled like a dev blog post, with callout boxes, real code snippets, comparison tables, and Mermaid diagrams.

```
document-project
```

The document covers architecture overview, core data models, key subsystem deep dives, API layer, external integrations, design patterns, technical debt, and lessons learned. Run `analyze` first to ensure the wiki is populated; the richer the wiki, the better the output.

> **Note:** `analyze` automatically calls `document-project` at the end of every run.

---

### Asking questions about the codebase
Ask any question in plain English. Claude reads relevant wiki pages and answers with `file:line` source references.

```
How does authentication work in this codebase?
What design patterns does the server module use?
Which classes depend on the database layer?
What anti-patterns have been identified?
Where is the entry point for API requests?
What libraries handle file I/O?
Which functions call the cache service?
```

If the answer reveals a significant cross-cutting pattern not yet captured, Claude will create a pattern page.

---

## Workflow Tips

**First-time analysis of a codebase:**
1. `analyze src/` — full scan
2. `analyze-deps` — capture all library dependencies
3. Ask questions to explore what was found
4. `journal "initial codebase analysis"` — record the session

**After a code change:**
1. `lint` — surface any pages that reference moved or deleted code
2. `analyze <changed-path>` — update wiki for what changed

**Deep-dive on a module:**
1. `analyze src/specific-module/` — focused scan
2. Ask: "What are the dependencies of this module?"
3. Ask: "Are there any anti-patterns in this module?"

**Checking for technical debt:**
```
What anti-patterns have been identified in the codebase?
Which files have the most stale references after the last refactor?
```

---

## Code Analysis Vault Guide (end)

### 3 — Offer next steps

After printing the guide, add one line:

> Type any operation above to get started, or ask a question about your vault's content.
