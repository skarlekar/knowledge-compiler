# document-project

Generate a comprehensive **Technical Deep Dive** Markdown document for the analyzed codebase. The output is a self-contained, single-file document styled like a polished dev blog post — explaining not just *what* the code does but *why* it was built that way.

Saves to `wiki/deep-dive/technical-deep-dive.md` (overwrites on each run). Creates `wiki/deep-dive/` if it does not exist.

## Arguments

None required. Uses existing wiki pages and source files in the vault.

## Required outputs (success criteria)

This skill is **not** complete until **all four** of the following are true. Verify each one before reporting success:

1. `wiki/deep-dive/technical-deep-dive.md` exists and was just written (mtime is from this session).
2. `wiki/index.md` contains a `## Deep Dive` section with a working relative link to `deep-dive/technical-deep-dive.md`.
3. `wiki/index.md`'s Statistics table contains a `Deep Dive` row.
4. `wiki/log.md` has a new `### YYYY-MM-DD — document-project` entry from this run.

If any of (1)–(4) is missing at the end of this skill, treat the run as failed: fix the missing artifact, then re-verify. Do not silently report success when any of these is absent — the deep-dive page is invisible to the wiki UI without the index entry, and that is the failure mode this skill exists to prevent.

## Steps

### 1 — Gather codebase knowledge

Read `wiki/index.md`. If the wiki is empty (no pages in any section), stop and tell the user:
"No wiki pages found. Run `analyze <path>` first to populate the wiki, then run `document-project`."

Read all available wiki pages in this priority order:

1. `wiki/modules/` — system architecture and boundaries
2. `wiki/classes/` — core data models and key components
3. `wiki/apis/` — the API surface
4. `wiki/libraries/` — tech stack and integrations
5. `wiki/patterns/` — design decisions and intent
6. `wiki/anti-patterns/` — technical debt and lessons
7. `wiki/functions/` — important logic details

Also read the source files listed in `source_files` frontmatter of module and class pages — prioritise entry points and the most-referenced files. This ensures code snippets are real, not paraphrased.

### 2 — Plan the document structure

Based on what exists in the wiki, plan 8–14 sections. Rename sections 3–4 to match the actual subsystems found (e.g., "The Visualization Engine", "The Vault Registry"). Adapt the list below to the project:

1. **Architecture Overview** — tech stack, system design, why these choices
2. **Core Data Models** — main types, interfaces, schemas, state shape
3. **[Key Subsystem 1] Deep Dive** — the most important subsystem
4. **[Key Subsystem 2] Deep Dive** — the second most important subsystem
5. **How It All Connects** — orchestration, routing, data flow, event passing
6. **API Layer** — endpoints grouped by concern, request/response patterns
7. **External Integrations** — libraries and third-party services
8. **Design Patterns in Practice** — patterns found with concrete code examples
9. **Configuration & Environment** — settings, env vars, feature flags
10. **Error Handling & Resilience** — error boundaries, fallbacks, retry logic
11. **Technical Debt & Anti-Patterns** — what was found, impact, how to fix
12. **Lessons & Gotchas** — surprising behaviors, pitfalls, best practices

Skip sections where the wiki has no relevant pages. Never write placeholder content.

### 3 — Write the document

Generate a single Markdown file. Write every section before moving to the next.

**File header (required):**

```markdown
---
title: "Technical Deep Dive: <Project Name>"
type: technical-deep-dive
generated: YYYY-MM-DD
---
```

**Section format rules — apply all of these throughout:**

**A. Content cards** — engaging prose paragraphs, 2–4 sentences each. Write as if explaining to a smart friend over coffee. Use analogies: *"Think of X as Y"*, *"It's like having a..."*. Bold key terms on first use. Never write a section as a bare list of facts.

**B. Callout boxes** — at least one per section. Use these exact formats:

```markdown
> **Key Insight:** The WHY behind a design decision — not what it does, but why it was done this way.

> **Why?** The reasoning behind an architectural choice.

> **Gotcha:** A common trap, surprising behavior, or non-obvious constraint.

> **Tip:** An actionable best practice derived from the codebase.
```

**C. Code blocks** — REAL code from source files, not pseudocode. Always include a comment with the file path:

````markdown
<!-- src/server/index.js -->
```javascript
// actual code copied verbatim from the source
```
````

Pick the most representative 10–30 lines. For long functions, show the interesting part and add a `// ... (N lines)` comment for omitted sections.

**D. Tables** — use for: tech stack comparisons, API endpoint lists, config options, pattern comparisons. Always include a "Why This Choice" or "Notes" column.

Example:

```markdown
| Library | Purpose | Why This Choice |
| ------- | ------- | --------------- |
| express | HTTP server | Minimal overhead, ... |
```

**E. Mermaid diagrams** — one per section maximum. Use for: architecture, data flow, component relationships, API call sequences. Example:

````markdown
```mermaid
graph LR
    Client --> Server
    Server --> VaultRegistry
    VaultRegistry --> WikiFiles
```
````

**Writing style rules:**

- Write like a senior engineer walking a new teammate through the codebase
- Explain the WHY behind every design decision — what problem does it solve?
- Bold key terms (`**vault registry**`, `**pre-tick simulation**`) on first introduction
- Use backticks for file names, function names, class names, config keys
- Keep paragraphs short — 2–4 sentences
- Make it something someone would actually enjoy reading

### 4 — Save the document

Create `wiki/deep-dive/` if it does not exist. Write the completed document to `wiki/deep-dive/technical-deep-dive.md`.

### 5 — REQUIRED: Update the wiki index

This step is **not optional**. Without it, the deep-dive page exists on disk but is invisible to the wiki UI (which renders from the index). Edit `wiki/index.md` directly with the Edit tool; do not skip ahead to logging.

Make all three edits below in a single pass:

**A. Statistics table** — ensure a `Deep Dive` row exists. If absent, add it (count = 1 once the page is written). Update the count if the row already exists.

```markdown
| Deep Dive | 1 |
```

**B. Deep Dive section** — append (or refresh) a `## Deep Dive` section near the bottom of the index, immediately before `## Journals` if that section exists, otherwise at the end. Use this format:

```markdown
## Deep Dive

| Page | Description | Updated |
| --- | --- | --- |
| [Technical Deep Dive](deep-dive/technical-deep-dive.md) | Generated narrative deep dive across all wiki pages | YYYY-MM-DD |
```

If the section already exists, update only the `Updated` cell to today's date.

**C. Frontmatter** — bump the `updated:` field in the index frontmatter to today's date.

### 5b — REQUIRED: Verify the index update landed

Before moving on, run this check:

```bash
grep -n "## Deep Dive" wiki/index.md && grep -n "deep-dive/technical-deep-dive.md" wiki/index.md && grep -n "| Deep Dive |" wiki/index.md
```

All three greps must return a match. If any returns nothing, go back to Step 5 and fix the missing piece. Do not proceed to Step 6 until this verification passes.

### 6 — Update log

Append to `wiki/log.md`:

```text
### YYYY-MM-DD — document-project

- **Source/Trigger**: `document-project` skill
- **File saved**: `wiki/deep-dive/technical-deep-dive.md`
- **Sections generated**: N
- **Wiki pages read**: N
- **Notes**: any sections skipped due to thin coverage
```

### 7 — Report

Before reporting, re-confirm all four success criteria from the top of this skill (deep-dive file written, index `## Deep Dive` section present, Statistics row present, log entry written). Then tell the user:

- Document saved to `wiki/deep-dive/technical-deep-dive.md` (with mtime)
- Confirmed `wiki/index.md` updated: Statistics `Deep Dive` row + `## Deep Dive` section linking to the page
- Number of sections generated
- Number of wiki pages used as source material
- Any sections skipped or thinly covered, with a suggested `analyze <path>` run to fill them
