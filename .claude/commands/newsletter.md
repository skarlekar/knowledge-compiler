---
name: newsletter
description: Transform wiki knowledge on a topic into a compelling long-form newsletter following the Signal Over Noise style. Automatically invokes the research skill if wiki coverage is insufficient. Use when the user says "newsletter <topic>".
argument-hint: <topic>
allowed-tools: [Read, Write, Edit, Glob]
---

# newsletter

Transform the wiki's knowledge on a topic into a compelling, energetic long-form
newsletter in the Signal Over Noise style. Saves to
`wiki/newsletters/newsletter-<topic-slug>-<YYYY-MM-DD>.md`.

If a newsletter for the same topic and date already exists, appends a version
suffix: `-v2`, `-v3`, etc.

If wiki coverage is insufficient, automatically invokes the `research` skill to
enrich the wiki before writing — two outcomes from one command.

## Arguments

Topic: $ARGUMENTS

## Steps

### 1 — Assess wiki coverage and check existing newsletters

Read `wiki/index.md`. Do two things with it:

**A. Scan the Newsletters section for related prior issues.**
Note any existing newsletters whose topic overlaps with this one. These will be
cross-referenced in the new newsletter.

**B. Identify all concept, entity, summary, and synthesis pages relevant to the
topic. Read those pages.**

**Coverage is sufficient if all three are true:**

- At least 3 **substantive** wiki pages exist on the topic — each must have
  populated content in its primary sections (Definition + How It Works for
  concept pages; Overview + Characteristics for entity pages). Stub pages with
  placeholder text do not count.
- At least one raw source file or research log is cited in those pages.
- The pages collectively cover: what the thing is, how it works, and some
  indication of threats, tools, or adoption challenges.

**If coverage is insufficient:**
- Invoke the research skill: `Skill({ skill: "research", args: "<topic>" })`
- After the skill completes, **re-run the full coverage check above** — re-read
  `wiki/index.md` and all new pages, then verify all three criteria again.
- If coverage is still insufficient after research, report this to the user and
  stop — do not write a newsletter on thin material.

### 2 — Read original sources, verify claims, and collect entity URLs

**A. Read sources for direct quotes.**
For each relevant wiki page, read its `sources` frontmatter field and read those
raw files or research logs. Direct quotes and specific claims with source
attribution (arXiv IDs, author names, publication names, dates, version numbers,
statistics) must come from the original sources — not paraphrased from wiki pages.

**B. Verify every specific claim you intend to use.**
Compile a list of every specific claim planned for the newsletter: dates, version
numbers, statistics, named attributions, direct quotes. Verify each one appears
explicitly in the research log or a raw source file. Claims that cannot be traced
to a source must be downgraded to general observations or omitted. Never
manufacture specifics from LLM knowledge alone — if the source doesn't say it,
don't assert it as fact.

**C. Collect canonical URLs for all entities that will appear in the newsletter.**
For each named person, organization, tool, paper, or gist that will be mentioned:

- **Named people** (researchers, practitioners, executives): X/Twitter profile
  (`https://x.com/<handle>`), or personal site, or LinkedIn — prefer X for tech
  figures, LinkedIn for business figures. Check the entity's wiki page first for
  any URL already recorded there.
- **Organizations and companies**: public homepage (e.g., `https://neo4j.com`).
- **Open-source tools**: GitHub repository URL or official docs site.
- **Commercial tools**: official product page.
- **Papers, gists, articles**: use the direct URL from the research log citation.
  For arXiv papers, use the abstract page: `https://arxiv.org/abs/XXXX.XXXXX`.

**URL priority order:**

1. Explicit citation URL from the research log
2. URL found in the entity's wiki page (Overview or Characteristics section)
3. Canonical public URL from LLM knowledge (well-known entities only)
4. Omit the hyperlink if uncertain — never manufacture or guess a URL

Compile the URL map before writing. Apply it during Step 4.

### 3 — Plan the newsletter structure

Before writing, plan:
- Which opening hook archetype fits the topic (see Style Guide)
- The primary metaphor and which sections it will carry through
- 3–5 natural Friction Points
- The Toolscape: relevant open-source and COTS tools (minimum 3 categories,
  minimum 8 named tools)
- Topic-specific section titles (never generic — "The Three Fault Lines" not
  "Section 2")
- Which related prior newsletters (from Step 1A) to cross-reference, and where

### 4 — Check for filename collision, then write the newsletter

**A. Check for existing file.**
Construct the base filename: `wiki/newsletters/newsletter-<topic-slug>-<YYYY-MM-DD>.md`

Use Glob to check if this file exists. If it does, check for `-v2`, `-v3`, etc.
and use the next available version suffix. Examples:

- First run → `newsletter-llm-wiki-2026-04-13.md`
- Second run same day → `newsletter-llm-wiki-2026-04-13-v2.md`
- Third run same day → `newsletter-llm-wiki-2026-04-13-v3.md`

**B. Estimate word count before writing.**
Using the section length targets in the Style Guide, estimate the planned word
count. If the estimate falls outside 4,000–5,500 words, adjust section depths
before writing — expand thin sections or trim over-allocated ones.

**C. Write the newsletter.**
Follow the Style Guide exactly. Apply the URL map from Step 2C throughout.
Include at least 3 direct attributed quotes drawn from the original sources.
Cross-reference related prior newsletters where relevant, using relative Markdown
links: `[Issue Title](newsletter-slug.md)`.

**D. Validate word count.**
After writing, estimate the actual word count. If it falls outside 4,000–5,500
words, revise before saving — expand thin sections or trim padding.

**File:** `wiki/newsletters/newsletter-<topic-slug>-<YYYY-MM-DD>[-v<N>].md`

### 5 — Update index, log, and back-link source wiki pages

**A. Add the newsletter to `wiki/index.md`** under the Newsletters section.
The Newsletters table has four columns: Page, Topic, Created, Key Argument.
`Key Argument` is a single sentence capturing the newsletter's central thesis.

**B. Back-link source wiki pages.**
For each concept, entity, or synthesis page used as a source in this newsletter,
add a "Featured In" entry to that page. Append to the page's Related Concepts or
Related Entities section (or add a new `## Featured In` section if neither
exists):

```markdown
## Featured In

- [Newsletter Title](../newsletters/newsletter-slug.md) — YYYY-MM-DD
```

Use relative paths from the wiki page's location. This ensures every source page
links back to every newsletter that drew from it.

**C. Append to `wiki/log.md`** with: topic, filename (including version suffix if
any), approximate word count, wiki pages used, whether research was triggered.

### 6 — Report

Tell the user: newsletter saved to `<filepath>`, approximate word count, whether
the research skill was invoked to fill coverage gaps, and how many wiki pages
were back-linked.

---

## Style Guide

### Frontmatter

Every newsletter page uses this frontmatter:

```yaml
---
title: "Newsletter Title"
type: newsletter
tags: [tag1, tag2, tag3, tag4, tag5]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/source1.md", "raw/source2.md"]
confidence: high | medium | low
word_count: ~NNNN
wiki_pages_used: ["concepts/page1.md", "entities/page2.md", "synthesis/page3.md"]
---
```

`word_count` is an approximate integer (e.g., `~4850`).
`wiki_pages_used` lists every wiki page read to write the newsletter — used by
the back-linking step and for future cross-reference decisions.

---

### Voice and Tone

- **Energetic and confident** — write with authority; this is not a tentative summary
- **Active voice dominates** — "agents act", not "actions are taken"
- **Present tense creates urgency** — the threat is happening now, not someday
- **Direct address** — speak to the reader: "Your stack wasn't built for this"
- **Short paragraphs** — 2–4 sentences maximum; one idea per paragraph
- **No filler** — every sentence advances the argument or provides essential context
- **Specificity over generality** — arXiv IDs, company names, dates, concrete metrics
- **Jargon inline** — define technical terms on first use in plain English,
  embedded in the sentence: *"harness engineering — the discipline of building the
  runtime infrastructure that constrains, verifies, and observes an AI agent's
  behaviour in production"*

---

### Hyperlink Rules

Apply the URL map from Step 2C throughout the newsletter.

- **Always link** (on first substantive mention): named people, organizations,
  commercial tools, open-source projects, research papers, gists, articles
- **Never link**: generic category terms ("vector databases", "graph databases"),
  adjectives, abstract concepts without a canonical URL
- **First mention only** — link when the entity first appears in a substantive
  context; do not repeat the link on every subsequent mention
- **Inline Markdown syntax** — `[Andrej Karpathy](https://x.com/karpathy)`,
  `[Neo4j](https://neo4j.com)`, `[LLM Wiki gist](https://gist.github.com/...)`
- **arXiv papers** — link to the abstract page, not the PDF:
  `[Title](https://arxiv.org/abs/XXXX.XXXXX) (arXiv:XXXX.XXXXX, Author et al., Year)`
- **Omit rather than guess** — if the URL is uncertain, leave the entity unlinked;
  a broken or wrong URL is worse than no link

---

### Opening Hook (~350–400 words; choose one archetype)

**Archetype 1 — Narrative vignette**
Open with a concrete incident told as a short story. Specific person, specific
moment, specific failure. Do not name the concept yet. Build stakes viscerally
before introducing the framework that would have prevented it.

> *It is 3 AM. An agent tasked with modifying one module has quietly rewritten
> three config files, a database migration, and a shared utility library. No alarm
> fired. No test failed. The agent was doing exactly what agents without a harness
> do: trying until something external stops them.*

**Archetype 2 — Crisis framing**
Open with a declarative statement that names the paradigm being disrupted.
Present tense, second person. Immediately cite a research finding or real event.

> *Your data stack wasn't built for this. Neither was your governance framework,
> your security model, or your team's mental model of what "a system" even is.
> Agents are already in production. The collision has started.*

**Archetype 3 — Philosophical challenge**
Open by naming a long-held assumption and declaring it broken. Use a specific
timeframe ("For twenty years...") to establish how foundational the disruption is.

> *The End of Determinism. For two decades, the implicit contract of software
> engineering has been: same inputs, same outputs. That contract is now fracturing
> at every layer of the stack.*

**Hook rules:**
- Never open with "In this newsletter..." or any meta-framing
- Never introduce the concept name in the first paragraph — build stakes first
- End the hook with a one-sentence thesis that states exactly what the newsletter argues
- The primary metaphor should appear in or immediately after the hook

---

### Direct Quotes

Every newsletter must include **at least 3 direct attributed quotes** drawn
verbatim from the original source files or research log. Quotes must be:

- Enclosed in quotation marks with full attribution: author name, source name,
  date
- Traceable to a specific line in the research log or raw source
- Not paraphrased — if the exact wording cannot be confirmed in the source,
  use indirect attribution ("Karpathy argues that...") instead of quotation marks

---

### Comparison Table

Include one comparison table in the Problem/Context section.
Two columns: old paradigm vs. new. 5–7 rows covering the key shifted dimensions.

```markdown
| Dimension | [Old Paradigm] | [New Paradigm] |
| --- | --- | --- |
| [Row] | [Old state] | [New requirement] |
```

---

### Friction Point Callouts (3–5 per newsletter)

The most distinctive structural element. Placed after establishing what the right
approach is — friction lands with context, not before it.

**Format:**
```
> **Friction Point:** [What organizations have today] is [inadequate because]
> [specific consequence]. [Why the gap is wider than it looks — the organizational,
> cultural, or psychological barrier, not just the technical one.]
```

**Rules:**
- 100–150 words each
- Focus on WHY adoption is hard — organizational resistance, tool gaps, incentive
  misalignment — not HOW to solve it
- Use present tense: "Most teams don't have..." not "Most teams won't have..."
- Distribute one per major analysis section where adoption friction is highest

---

### Citation Format

Citations are inline — they follow the claim, not precede it.

- **arXiv papers:** *"[Title]"* ([arXiv:XXXX.XXXXX](https://arxiv.org/abs/XXXX.XXXXX), Author et al., Year)
- **Named experts:** Full name hyperlinked, role at organization inline:
  *[Phil Schmid](https://x.com/philschmid) of [Hugging Face](https://huggingface.co) argues that...*
- **Companies/products:** Linked product name:
  *[Neo4j](https://neo4j.com) uses this pattern to...*
- **Gists and informal sources:** Author hyperlinked, platform, date:
  *[Andrej Karpathy](https://x.com/karpathy) published [a GitHub gist](https://gist.github.com/...) on...*
- **No footnotes** — all citations inline or omitted
- **No vague attribution** — "researchers found" is not a citation; name the paper

---

### Metaphor Guidance

- Introduce the **primary metaphor** in or immediately after the opening hook
- Carry it through **at least 3 sections** — let it evolve: introduce it, deepen it,
  resolve it in the closing signal
- Use concrete, physical imagery people know from daily life: infrastructure,
  tools, investigations, geology, manufacturing
- Secondary metaphors are welcome in individual sections but must not conflict
  with the primary

**Examples from Signal Over Noise:**
- *"The CPU without an OS"* — hardware that cannot function without its layer
- *"Fault lines"* — geological inevitability; structural, not incidental
- *"The detective's corkboard"* — evidence-linking as intelligence work
- *"Picks and shovels"* — infrastructure as the real gold rush play

---

### Threats Section

Name each threat with a bold label. Pattern:

```
**[Threat Name]**
What happens. Why it happens. What it costs if left unaddressed.
(2–4 sentences per threat)
```

Cover 3–5 distinct, named threats. Be specific — "prompt injection" is better
than "security risks." Include at least one threat that will surprise the reader.

---

### Toolscape Section

1. Open with a one-sentence framing of the landscape
2. Organise by functional category (not vendor)
3. For each category:

```
**[Category Name]**
- **Open Source:** [Tool](URL) — [one-line purpose]. Use when [scenario].
- **Commercial / COTS:** [Tool](URL) — [one-line purpose]. Use when [scenario].
```

4. Close with a convergence signal: what the existence of this tool market tells
   us about where the industry is heading

**Rules:**
- No pricing
- Frame by architectural fit, not vendor features
- **Minimum 3 functional categories**
- **Minimum 8 named tools total across all categories**
- Minimum 2 open-source options per relevant category
- Name specific tools — "graph databases" is not a tool; "Neo4j and Amazon Neptune" are
- All tool names must be hyperlinked to their official site or GitHub repo

---

### Action Item Section

**Header:** `## This Week` or `## ⚡ Action Item`

```markdown
1. [Question probing current state — forces honest self-assessment]
2. [Question probing capability gap]
3. [Question probing risk / threat exposure]
4. [Question probing observability or auditability]
5. [Optional: question probing team or organizational readiness]

If any answer is "we haven't thought about this," you've found your gap.

**Start here:** [Which question to prioritize and why — one specific recommendation.]
```

---

### Closing Signal Section

**Header:** `## The Signal` or `## Signal`

Structure (no bullets — narrative prose only):
1. Restate the core thesis in 2–3 sentences
2. Pivot from threat to opportunity: "The organizations that [X] will [Y]"
3. Name the competitive moat that winners will build
4. **One-sentence philosophical close** — memorable, quotable, contains no new
   information

**Examples of closing sentences:**
- *"The detective's corkboard was always a graph. Now, so is your AI's memory."*
- *"Build the foundation first. The intelligence will follow."*
- *"The model is the CPU. The harness is the operating system. Ship the OS."*

---

### Masthead and Footer

**Masthead** (first line of body, before hook):
```
*Signal Over Noise | [Topic] | [YYYY-MM-DD]*
```

**Footer** (last line of file):
```
---
*Tags: #[tag1] #[tag2] #[tag3] #[tag4] #[tag5]*
```

---

### Section Length Targets

| Section | Target words |
| --- | --- |
| Opening hook | 350–400 |
| Problem / Context (with comparison table) | 600–800 |
| Deep analysis sections × 2–3 | 800–1,200 each |
| Threats | 400–600 |
| Toolscape | 400–700 |
| Action Item | 150–250 |
| Closing Signal | 250–350 |
| **Total** | **4,000–5,500** |
