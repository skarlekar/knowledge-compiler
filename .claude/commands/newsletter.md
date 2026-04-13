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

If wiki coverage is insufficient, automatically invokes the `research` skill to
enrich the wiki before writing — two outcomes from one command.

## Arguments

Topic: $ARGUMENTS

## Steps

### 1 — Assess wiki coverage

Read `wiki/index.md`. Identify all concept, entity, summary, synthesis, and
newsletter pages relevant to the topic. Read those pages.

**Coverage is sufficient if all three are true:**
- At least 3 substantive wiki pages exist on the topic
- At least one raw source file or research log is cited in those pages
- The pages collectively cover: what the thing is, how it works, and some
  indication of threats, tools, or adoption challenges

**If coverage is insufficient:**
- Invoke the research skill: `Skill({ skill: "research", args: "<topic>" })`
- The skill enriches the wiki with new concept pages, summaries, and a research
  log in `raw/` as a side effect
- After the skill completes, re-read `wiki/index.md` and the new pages before
  continuing

### 2 — Read original sources for direct quotes

For each relevant wiki page, read its `sources` frontmatter field and read those
raw files or research logs. Direct quotes and specific claims with source
attribution (arXiv IDs, author names, publication names) must come from the
original sources — not paraphrased from wiki pages.

### 3 — Plan the newsletter structure

Before writing, plan:
- Which opening hook archetype fits the topic (see Style Guide)
- The primary metaphor and which sections it will carry through
- 3–5 natural Friction Points
- The Toolscape: relevant open-source and COTS tools
- Topic-specific section titles (never generic — "The Three Fault Lines" not "Section 2")

### 4 — Write the newsletter

Follow the Style Guide exactly. Target 4,000–5,500 words total.
File: `wiki/newsletters/newsletter-<topic-slug>-<YYYY-MM-DD>.md`

### 5 — Update index and log

Add the newsletter to `wiki/index.md` under the Newsletters section.
Append to `wiki/log.md` with: topic, word count, wiki pages used, whether
research was triggered.

### 6 — Report

Tell the user: newsletter saved to `<filepath>`, approximate word count, and
whether the research skill was invoked to fill coverage gaps.

---

## Style Guide

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

- **arXiv papers:** *"[Title]"* (arXiv:XXXX.XXXXX, Author et al., Year)
- **Named experts:** Full name, role at organization inline:
  *Phil Schmid of Hugging Face argues that...*
- **Companies/products:** Linked product name:
  *[Neo4j](https://neo4j.com) uses this pattern to...*
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
- **Open Source:** [Tool] — [one-line purpose]. Use when [scenario].
- **Commercial / COTS:** [Tool] — [one-line purpose]. Use when [scenario].
```

4. Close with a convergence signal: what the existence of this tool market tells
   us about where the industry is heading

**Rules:**
- No pricing
- Frame by architectural fit, not vendor features
- Minimum 2 open-source options per relevant category
- Name specific tools — "graph databases" is not a tool; "Neo4j and Amazon Neptune" are

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
