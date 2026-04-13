# Signal Over Noise Knowledge Base — Schema

## Purpose

<!-- CUSTOMIZE: Replace this with a one-paragraph description of your knowledge domain. -->
<!-- Examples: "machine learning research", "19th-century literature", "competitive landscape for SaaS tools" -->
This is an LLM-maintained knowledge base on Signal Over Noise. The LLM writes and maintains all files under `wiki/`. The human curates raw sources and directs queries. The human never edits wiki files directly.

## Directory Layout

- `raw/` — Immutable source documents (transcripts, articles, notes). Never modify these.
- `wiki/index.md` — Master catalog. Every wiki page must appear here.
- `wiki/log.md` — Append-only activity log.
- `wiki/summaries/` — One summary page per raw source document.
- `wiki/concepts/` — Concept, strategy, and framework pages.
- `wiki/entities/` — Entity pages (people, tools, organizations, products — whatever "things" exist in your domain).
- `wiki/synthesis/` — Comparison tables, decision frameworks, cross-cutting analyses.
- `wiki/newsletters/` — Long-form newsletter issues generated from wiki content.
- `wiki/journal/` — Research or session journal entries.
- `wiki/presentations/` — Marp slide decks generated from wiki content.

## File Naming

- All lowercase, hyphens for word separation: `concept-name.md`
- No spaces, no special characters, no uppercase
- Name should match the page title slug

## Page Format

Every wiki page uses this frontmatter and structure:

```yaml
---
title: "Page Title"
type: concept | entity | summary | synthesis | newsletter
tags: [tag1, tag2, tag3]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/filename.txt"]
confidence: high | medium | low
---
```

### Required Sections by Page Type

**Summary pages** (`wiki/summaries/`):

- `## Key Points` — Bulleted list of main claims/ideas
- `## Relevant Concepts` — Links to concept pages this source touches
- `## Source Metadata` — Type of source, author/speaker, date, URL or identifier

**Concept pages** (`wiki/concepts/`):

- `## Definition` — One-paragraph plain-English definition
- `## How It Works` — Mechanics, process, or structure of the concept
- `## Key Parameters` — Important variables, dimensions, or factors
- `## When To Use` — Situations and contexts where this concept applies
- `## Risks & Pitfalls` — Known failure modes, common mistakes, limitations
- `## Related Concepts` — Wiki links to related pages
- `## Sources` — Which raw sources inform this page

**Entity pages** (`wiki/entities/`):

- `## Overview` — What this entity is
- `## Characteristics` — Key properties, attributes, structure
- `## Common Strategies` — Links to concept pages for strategies or methods associated with this entity
- `## Related Entities` — Links to related entity pages

**Synthesis pages** (`wiki/synthesis/`):

- `## Comparison` — Table or structured comparison
- `## Analysis` — Cross-cutting insights
- `## Recommendations` — When to prefer which approach
- `## Pages Compared` — Links to all pages involved

**Newsletter pages** (`wiki/newsletters/`):

- Named `newsletter-<topic-slug>-<YYYY-MM-DD>.md`; if a same-day same-topic file already exists, append a version suffix: `newsletter-<topic-slug>-<YYYY-MM-DD>-v2.md`, `-v3.md`, etc.
- Long-form (4,000–5,500 words), Signal Over Noise style
- Masthead: `*Signal Over Noise | [Topic] | [YYYY-MM-DD]*`
- Sections: Opening hook, Problem/Context (with comparison table), 2–3 deep analysis sections, Threats, Toolscape, Action Item, Closing Signal
- Footer: `*Tags: #tag1 #tag2 ...*`
- Additional frontmatter fields: `word_count: ~NNNN` and `wiki_pages_used: [...]`

## Linking Conventions

- Use standard Markdown relative links: `[Display Text](relative/path.md)`
- Always include the `.md` extension in link targets
- Paths must be relative to the **current file's location**, not the wiki root
  - Same folder: `[Decision Trace](decision-trace.md)`
  - Sibling folder (e.g., from `concepts/` to `entities/`): `[AWS Neptune](../entities/aws-neptune.md)`
  - From `summaries/` to `concepts/`: `[Context Graph](../concepts/context-graph.md)`
- Every page must link to at least one other page (no orphans)
- When mentioning a concept that has a page, always link it

## Tagging Taxonomy

<!-- CUSTOMIZE: Replace these placeholder categories with tags relevant to your domain. -->
<!-- Each category should have 3-8 specific tags. -->
<!-- Example for a cooking KB: -->
<!--   Cuisine: italian, japanese, french, mexican -->
<!--   Technique: braising, fermenting, sous-vide, grilling -->
<!--   Ingredient: protein, vegetable, grain, dairy -->

- **Category-A**: `tag-1`, `tag-2`, `tag-3`
- **Category-B**: `tag-4`, `tag-5`, `tag-6`
- **Category-C**: `tag-7`, `tag-8`, `tag-9`
- **Scope**: `foundational`, `advanced`, `experimental`
- **Status**: `well-established`, `emerging`, `speculative`

## Confidence Levels

- **high** — Well-established idea, multiple corroborating sources, demonstrated with concrete examples
- **medium** — Supported by sources but limited examples or single-source
- **low** — Single mention, anecdotal, or speculative

### Multi-source Confidence (Research workflow)

When a page is informed by multiple sources from a Research operation, set confidence based on source agreement:

| Sources | Agreement | Confidence |
| --- | --- | --- |
| 3+ credible | Consensus | `high` |
| 2 credible | Consensus | `high` |
| Any | Contested — sources disagree | `medium` |
| 1 credible only | No corroboration | `medium` |
| Emerging, speculative, or heavily opinion-based | — | `low` |

## Source Credibility Heuristics

Used during the Research workflow when Claude is selecting sources rather than the user.

**Prefer:**

- Academic papers and preprints (arXiv, Google Scholar, PubMed, ACM)
- Official documentation (vendor docs, standards bodies, government sources)
- Established publications (major newspapers, peer-reviewed journals, recognised industry analysts)
- Named authors with verifiable domain credentials

**Avoid:**

- Anonymous or unattributed content
- Advocacy or heavily opinion-framed content (unless capturing a specific perspective is the explicit goal)
- Sources older than 2 years for fast-moving topics — flag staleness if used
- Content that is itself a summary of summaries with no primary sources cited

**Note:** Claude's knowledge cutoff is August 2025. For topics that evolve rapidly, add a note to the wiki page that the research reflects the state of knowledge at retrieval date and may be outdated.

## Contradiction Handling

**Within a Research operation (cross-source contradictions):**

- Never silently merge conflicting claims into false consensus
- Use explicit framing: *"Source X holds that… while Source Y argues…"*
- Where two credible frameworks genuinely compete, create separate concept pages rather than one page that conflates them
- The synthesis page is the right place to map the disagreement; concept pages should represent individual coherent positions
- Set confidence to `medium` for any claim that is contested across sources

**Between Research and existing wiki (inbound contradictions):**

- Flag contradictions with existing wiki content explicitly in the log entry
- Do not silently overwrite existing high-confidence content with research findings
- If research contradicts an existing high-confidence page, note both positions and downgrade confidence to `medium` until the contradiction is resolved by the user

## Workflows

### Ingest

When the user says "ingest [source]" or adds a file to `raw/`:

**If [source] is a URL (begins with `http://` or `https://`):**

- Invoke the `ingest-url` skill with the URL as the argument:
  `Skill({ skill: "ingest-url", args: "<url>" })`
- The skill downloads the page and its images to `raw/` and returns the saved filepath.
- Use that filepath as [source] for steps 1–8 below.

**If [source] is a local file already in `raw/`:**

- Proceed directly to step 1.

1. Read the raw source completely
2. Create `wiki/summaries/<source-slug>.md` with full summary
3. Identify all concepts, entities, and strategies mentioned
4. For each concept/entity: create the page if it doesn't exist, or update it with new information if it does
5. Add cross-links in both directions between all touched pages
6. Update `wiki/index.md` — add new entries, update summaries of changed pages
7. Append to `wiki/log.md` with timestamp, source name, pages created/updated
8. Flag any contradictions with existing wiki content

### Query

When the user asks a question:

1. Read `wiki/index.md` to find relevant pages
2. Read those pages
3. Synthesize an answer citing specific pages with wiki links
4. If the answer reveals new insight worth preserving:
   - Create a synthesis page in `wiki/synthesis/`
   - Update index and log

### Lint

When the user says "lint" or "health check":

1. Read all wiki pages
2. Check for: orphan pages (no inbound links), stale claims, contradictions between pages, missing cross-links, incomplete sections, low-confidence pages that could be strengthened
3. Fix what can be fixed automatically
4. Report issues that need human judgment
5. Suggest new sources or topics to investigate
6. Update log

### Research

When the user says "research [topic]":

**Boundary with Query:** Query reasons over the existing wiki. Research populates the wiki from external sources. Do not research a topic the wiki already covers well — run a Query first to check.

**Boundary with Ingest:** If the user provides a specific URL or file, use Ingest, not Research.

Invoke the `research` skill with the topic as the argument:
`Skill({ skill: "research", args: "<topic>" })`

The skill handles web search, source evaluation, content fetching, claim extraction, and saves a research log to `raw/research-<topic-slug>-<YYYY-MM-DD>.md`. Once the skill completes:

1. Read the research log at `raw/research-<topic-slug>-<YYYY-MM-DD>.md`
2. Create `wiki/summaries/research-<topic-slug>-<YYYY-MM-DD>.md`
3. Identify all concepts and entities across the accepted sources
4. For each concept/entity: create the page if it doesn't exist, or update it with new information
   - Apply Multi-source Confidence rules when setting confidence
   - Apply Contradiction Handling rules when sources disagree
5. If multiple perspectives or competing frameworks were found, create a synthesis page in `wiki/synthesis/`
6. Add cross-links in both directions between all touched pages
7. Update `wiki/index.md`
8. Append to `wiki/log.md` with timestamp, topic, sources consulted count, and pages created/updated

### Newsletter

When the user says "newsletter [topic]":

Invoke the `newsletter` skill with the topic as the argument:
`Skill({ skill: "newsletter", args: "<topic>" })`

The skill assesses wiki coverage, auto-invokes the `research` skill if coverage is insufficient, then writes a long-form newsletter to `wiki/newsletters/newsletter-<topic-slug>-<YYYY-MM-DD>.md`. Once the skill completes, update `wiki/index.md` (add newsletter entry under the Newsletters section) and append to `wiki/log.md`.

## Rules

- Never modify files in `raw/`
- Always update `index.md` and `log.md` after any wiki change
- Prefer updating existing pages over creating duplicates
- When in doubt about a claim, set confidence to "low" and note the uncertainty
- Keep pages focused — one concept per page, split if a page gets too long
- Use plain English — define jargon on first use in each page
- All dates in ISO 8601 format: YYYY-MM-DD
- When a source provides specific examples, include them with concrete details
- Research populates the wiki from external sources; Query reasons over the existing wiki — never conflate the two
- Never silently overwrite existing high-confidence wiki content with research findings that contradict it
- The research log in `raw/` is the authoritative record of what was retrieved; treat it as immutable after creation
