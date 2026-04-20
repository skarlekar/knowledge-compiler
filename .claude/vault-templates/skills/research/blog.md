# blog

Transform the wiki's knowledge on a topic into a compelling, authoritative long-form
blog post in the Signal Over Noise style. Saves to
`wiki/blogs/blog-<topic-slug>-<YYYY-MM-DD>.md`.

If a blog post for the same topic and date already exists, appends a version
suffix: `-v2`, `-v3`, etc.

If wiki coverage is insufficient, automatically invokes the `research` skill to
enrich the wiki before writing -- two outcomes from one command.

## Arguments

Topic: The Control Dial: Orchestration vs. Autonomy in Agentic AI

## Steps

### 1 -- Assess wiki coverage and check existing blogs

Read `wiki/index.md`. Do two things with it:

**A. Scan the Blogs and Newsletters sections for related prior posts.**
Note any existing blogs or newsletters whose topic overlaps with this one. These
will be cross-referenced in the new blog post.

**B. Identify all concept, entity, summary, and synthesis pages relevant to the
topic. Read those pages.**

**Coverage is sufficient if all three are true:**

- At least 3 **substantive** wiki pages exist on the topic -- each must have
  populated content in its primary sections (Definition + How It Works for
  concept pages; Overview + Characteristics for entity pages). Stub pages with
  placeholder text do not count.
- At least one raw source file or research log is cited in those pages.
- The pages collectively cover: what the thing is, how it works, and some
  indication of threats, tools, or adoption challenges.

**If coverage is insufficient:**

- Invoke the research skill: `Skill({ skill: "research", args: "<topic>" })`
- After the skill completes, **re-run the full coverage check above** -- re-read
  `wiki/index.md` and all new pages, then verify all three criteria again.
- If coverage is still insufficient after research, report this to the user and
  stop -- do not write a blog post on thin material.

### 2 -- Read original sources, verify claims, and collect entity URLs

**A. Read sources for direct quotes.**
For each relevant wiki page, read its `sources` frontmatter field and read those
raw files or research logs. Direct quotes and specific claims with source
attribution (arXiv IDs, author names, publication names, dates, version numbers,
statistics) must come from the original sources -- not paraphrased from wiki pages.

**B. Verify every specific claim you intend to use.**
Compile a list of every specific claim planned for the blog: dates, version
numbers, statistics, named attributions, direct quotes. Verify each one appears
explicitly in the research log or a raw source file. Claims that cannot be traced
to a source must be downgraded to general observations or omitted. Never
manufacture specifics from LLM knowledge alone -- if the source doesn't say it,
don't assert it as fact.

**C. Collect canonical URLs for all entities that will appear in the blog.**
For each named person, organization, tool, paper, or gist that will be mentioned:

- **Named people** (researchers, practitioners, executives): X/Twitter profile
  (`https://x.com/<handle>`), or personal site, or LinkedIn -- prefer X for tech
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
4. Omit the hyperlink if uncertain -- never manufacture or guess a URL

Compile the URL map before writing. Apply it during Step 4.

### 3 -- Plan the blog structure

Before writing, plan:

- Which opening hook archetype fits the topic (see Style Guide)
- The primary metaphor (sustained throughout) OR a rotation plan (one metaphor per section)
- 3-5 numbered/labeled analysis sections, each with a repeating internal pattern
- Whether to include a "Two Things the Skeptics Get Wrong" counter-argument section
- A Blueprint/Framework table (3 columns, 4-7 rows) for the synthesis section
- 5 action items for the closing
- Topic-specific section titles (never generic -- "The Six Fault Lines" not "Section 2")
- Which related prior blogs or newsletters (from Step 1A) to cross-reference, and where
- A running example if the topic lends itself to one (threaded through all sections)

### 4 -- Check for filename collision, then write the blog

**A. Check for existing file.**
Construct the base filename: `wiki/blogs/blog-<topic-slug>-<YYYY-MM-DD>.md`

Use Glob to check if this file exists. If it does, check for `-v2`, `-v3`, etc.
and use the next available version suffix.

**B. Estimate word count before writing.**
Using the section length targets in the Style Guide, estimate the planned word
count. Target range is 2,800-6,200 words. If the estimate falls outside this
range, adjust section depths before writing.

**C. Write the blog post.**
Follow the Style Guide exactly. Apply the URL map from Step 2C throughout.
Include concrete examples with specific details in every analysis section.
Cross-reference related prior blogs or newsletters where relevant, using relative
Markdown links: `[Post Title](../blogs/blog-slug.md)` or
`[Newsletter Title](../newsletters/newsletter-slug.md)`.

**D. Validate word count.**
After writing, estimate the actual word count. If it falls outside 2,800-6,200
words, revise before saving.

**File:** `wiki/blogs/blog-<topic-slug>-<YYYY-MM-DD>[-v<N>].md`

### 5 -- Update index, log, and back-link source wiki pages

**A. Add the blog to `wiki/index.md`** under the Blogs section.
If no Blogs section exists, create one after the Newsletters section.
The Blogs table has four columns: Page, Topic, Created, Key Argument.
`Key Argument` is a single sentence capturing the blog's central thesis.

**B. Back-link source wiki pages.**
For each concept, entity, or synthesis page used as a source in this blog,
add a "Featured In" entry to that page. Append to the page's Related Concepts or
Related Entities section (or add a new `## Featured In` section if neither
exists):

```markdown
## Featured In

- [Blog Title](../blogs/blog-slug.md) -- YYYY-MM-DD
```

Use relative paths from the wiki page's location.

**C. Append to `wiki/log.md`** with: topic, filename (including version suffix if
any), approximate word count, wiki pages used, whether research was triggered.

### 6 -- Report

Tell the user: blog saved to `<filepath>`, approximate word count, whether
the research skill was invoked to fill coverage gaps, and how many wiki pages
were back-linked.

---

## Style Guide

### Frontmatter

Every blog page uses this frontmatter:

```yaml
---
title: "Blog Title"
type: blog
tags: [tag1, tag2, tag3, tag4, tag5]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: ["raw/source1.md", "raw/source2.md"]
confidence: high | medium | low
word_count: ~NNNN
wiki_pages_used: ["concepts/page1.md", "entities/page2.md", "synthesis/page3.md"]
hook_archetype: historical-origin | nostalgic-inversion | old-contract-dead | breaking-news | industry-bombshell | counterintuitive-inversion | thought-experiment
---
```

`word_count` is an approximate integer (e.g., `~4850`).
`wiki_pages_used` lists every wiki page read to write the blog.
`hook_archetype` records which opening hook pattern was used.

---

### Voice and Tone

- **Authoritative-peer** -- write as a senior practitioner briefing peers who are
  equally technical but may not have had time to dig into this specific topic
- **Active voice dominates** -- 70-90% active voice; "agents act", not "actions
  are taken"
- **Present tense creates urgency** -- 60-70% present tense; the threat is
  happening now, not someday
- **Direct address** -- speak to the reader: "Your stack wasn't built for this."
  Target 40-50 "you/your" instances per post
- **Short paragraphs** -- 2-4 sentences maximum; one idea per paragraph
- **No filler** -- every sentence advances the argument or provides essential
  context
- **Specificity over generality** -- arXiv IDs, company names, dates, concrete
  metrics
- **Contractions used freely** -- "isn't", "won't", "doesn't" -- conversational
  but not casual
- **Em-dashes heavily** -- use 20-30 per post for parenthetical asides and
  dramatic emphasis
- **Sentence rhythm** -- alternate long explanatory sentences with short punchy
  fragments (1-5 words) for dramatic effect: "Ship it." / "No malware. No
  phishing link." / "Start this week."
- **First person sparingly** -- use "I" only for authority/conviction moments:
  "This is the one that keeps me up at night." Never use "we" editorially
- **Jargon inline** -- define technical terms on first use in plain English,
  embedded in the sentence
- **Rhetorical questions** -- use 5-8 per post to frame problems before
  presenting solutions

---

### Opening Hook (~300-500 words; choose one archetype)

**Archetype 1 -- Historical Origin Story**
Ground the reader in a specific time, place, and institutional setting. Build
credibility and narrative intrigue before naming the concept. The topic is named
within the first ~30 words.

> *In the early 2000s, in the smoke-filled incident rooms of Scotland Yard,
> British investigators formalized a model that would quietly revolutionize
> intelligence work...*

Use when the topic has a rich origin story that anchors the reader in concrete
reality before introducing the abstraction.

**Archetype 2 -- Nostalgic Inversion / "Death of the Old World"**
Invoke a shared cultural memory ("Remember when...") and then declare it dead.
Approximately 40-47 words of setup before naming the topic.

> *Remember when "it works on my machine" was the ultimate insult in software
> development? We laughed, we fixed our environment discrepancies, and we moved
> on. That era of deterministic software is over.*

Use when the reader's professional identity is built on the thing being disrupted.

**Archetype 3 -- "The Old Contract Is Dead"**
Establish a decades-long engineering norm, then dramatically demolish it in a
single sentence. Pattern: establish old world (para 1) -> one-sentence demolition
(para 2) -> explain new reality (para 3). ~55 words before the topic is named.

> *For three decades, the contract between software engineers and their CI/CD
> pipelines has been elegantly simple: assert(f(input) == expected_output)...
> Agentic AI obliterates that contract.*

Use when the disruption is to a deep technical assumption, not just a tool or
practice.

**Archetype 4 -- Breaking News Admission**
Open with a time-stamped revelation from an authoritative source, then
immediately escalate with a concrete exploit or failure example. ~42 words
before the topic is named.

> *In December 2025, OpenAI published something remarkable -- not a product
> launch, but an admission. Their research team acknowledged that prompt injection
> in agentic AI browsers "may always be a risk"...*

Use when a credible authority has recently acknowledged the problem.

**Archetype 5 -- Industry Bombshell / Provocative News Hook**
Frame a real event (open-source release, breach, funding round) as
simultaneously exciting and dangerous. Create immediate tension. ~24 words
before the topic is named.

> *A Google senior product manager just open-sourced something that will make
> enterprise AI architects sit up straight -- and then immediately reach for
> their risk register.*

Use when a specific, recent event is the catalyst for the analysis.

**Hook rules:**

- Never open with "In this blog post..." or any meta-framing
- Build stakes before naming the concept -- delay by 24-55 words
- End the hook with a one-sentence thesis in bold that states exactly what the
  blog argues
- The primary metaphor should appear in or immediately after the hook
- The hook must feel urgent, not academic

---

### Section Structure

Every blog post uses 3-5 **numbered or labeled major sections** after the
opening hook. Each section follows a repeating internal skeleton:

**Pattern A -- Scenario/Why/Defense (preferred for prescriptive posts):**

```markdown
### [N]. [Topic-Specific Heading] -- [Evocative Subtitle]

[2-3 paragraphs establishing the problem]

**The scenario:** [Detailed, concrete hypothetical -- specific person, specific
system, specific failure. 100-200 words.]

**Why it's hard:** [1-2 paragraphs explaining why this isn't a simple fix.
Include one vivid metaphor from a physical domain.]

**The defense:** [2-3 paragraphs of prescriptive guidance. Name specific tools
and approaches.]
```

**Pattern B -- Risk/Example/Rule (preferred for analytical posts):**

```markdown
### [Label N]: [Evocative Name] -- [Consequence Subtitle]

[1-2 paragraphs framing the risk]

**Concrete example:** [Detailed scenario paragraph, 100-200 words]

**When this doesn't matter:** [Nuance paragraph -- when the risk is acceptable]

**The rule:** [Clear decision criterion in 1-2 sentences]
```

**Section heading rules:**

- Always topic-specific, never generic ("The Six Degrees of Expense Fraud" not
  "Problem 1")
- Use the format: `N. [Name] -- [Subtitle]` or `[Label N]: [Name] -- [Subtitle]`
- Em-dash separates the name from a consequence or metaphorical subtitle

---

### Running Examples

When the topic lends itself to it, thread a **single concrete example** through
all analysis sections. The same organization, person, or system appears in every
section, each time revealing a different facet of the problem.

Mark each appearance with a consistent bold label:
- `**Corporate Travel Example:**` or
- `**[Domain] Example:**`

When a running example doesn't fit, use independent per-section scenarios with
bold "**The scenario:**" or "**Concrete example:**" labels.

---

### Metaphor Guidance

Choose one of two approaches:

**Option A -- Sustained metaphor:** Introduce one primary metaphor in the hook
and carry it through the entire post, evolving it per section. End by resolving
it in the closing.

> Example: Detective/corkboard metaphor evolving from evidence board -> case
> file -> command center -> "detective that never sleeps"

**Option B -- Rotating metaphors:** One vivid, self-contained metaphor per
section, each from a different physical domain. Place in the "Why It's Hard"
sub-section.

> Example: Submarine screen doors, surgeon's scalpels, jazz vs sheet music,
> jelly nailed to walls, co-pilot reading instruments

**Metaphor rules:**

- Always concrete, physical imagery people know from daily life
- Never repeat a metaphor across sections (Option B)
- Never use stale business metaphors (paradigm shift, synergy, deep dive)
- Bold or italicize the metaphorical phrase on first use

---

### "Two Things the Skeptics Get Wrong" Section (Optional)

Include this section when the topic has well-known counter-arguments worth
addressing. Appears in the second half of the post, after the main analysis.

**Format:**

```markdown
## Two Things the Skeptics Get Wrong

### "[Quoted objection in the skeptic's own voice]"

[2-3 paragraphs demolishing the objection with specific evidence]

### "[Second quoted objection]"

[2-3 paragraphs]
```

Heading format: the objection itself in quotation marks as the H3.

---

### Comparison / Blueprint Table

Include one table in the synthesis or blueprint section near the end.
Three columns. 4-7 rows.

**Format option A -- Paradigm shift table:**

```markdown
| Dimension | [Old Paradigm] | [New Paradigm] |
| --- | --- | --- |
| [Row] | [Old state] | [New requirement] |
```

**Format option B -- Decision matrix:**

```markdown
| Question | [Option A] | [Option B] |
| --- | --- | --- |
| [Criterion as question] | [Answer] | [Answer] |
```

**Format option C -- Blueprint/layers table:**

```markdown
| Layer | Control | Implementation |
| --- | --- | --- |
| [Layer name] | [What it governs] | [How to implement] |
```

---

### Hyperlink Rules

Apply the URL map from Step 2C throughout the blog.

- **Always link** (on first substantive mention): named people, organizations,
  commercial tools, open-source projects, research papers, gists, articles
- **Never link**: generic category terms, adjectives, abstract concepts without a
  canonical URL
- **First mention only** -- link when the entity first appears in a substantive
  context; do not repeat the link on every subsequent mention
- **Inline Markdown syntax** -- `[Name](URL)`
- **Sparse is acceptable** -- some blog posts have 0-2 body links; others have
  20+. Link density follows source density, not a quota
- **Omit rather than guess** -- if the URL is uncertain, leave the entity
  unlinked

---

### Action Items Section

**Header:** `## This Week` or `## Your Five-Step Action Plan`

```markdown
1. **[Bold imperative verb phrase].** [1-2 sentence explanation. Specific.]
2. **[Bold imperative verb phrase].** [1-2 sentence explanation.]
3. **[Bold imperative verb phrase].** [1-2 sentence explanation.]
4. **[Bold imperative verb phrase].** [1-2 sentence explanation.]
5. **[Bold imperative verb phrase].** [1-2 sentence explanation.]
```

Each action item maps back to a specific analysis section. Use second-person
imperative voice ("Audit your...", "Map your...", "Implement one...").

---

### Closing Section -- "The Bottom Line"

**Header:** `## The Bottom Line`

Structure:

1. **Context sentence** -- restate the industry landscape in one sentence
2. **Conditional promise** -- "The enterprises that [do X] will be the ones
   that [achieve Y]"
3. **Staccato imperatives** -- 3-5 short imperative commands in rapid succession
4. **Final kicker** -- 1-2 sentences, short and punchy. Often echoes the opening
   hook for a bookend effect. Sometimes first-person for conviction: "I know
   which one I'd choose."

The last sentence of the blog should be **under 15 words**.

---

### Footer

```markdown
---

*Tags: #Tag1 #Tag2 #Tag3 #Tag4 #Tag5 #Tag6 #Tag7 #Tag8*

*About the author: [Author name] is [one-line bio].*
```

Include 6-16 LinkedIn-style hashtags in CamelCase.

---

### Citation Format

Citations are inline -- they follow the claim, not precede it.

- **Research papers:** *"[Title]"* ([arXiv:XXXX.XXXXX](https://arxiv.org/abs/XXXX.XXXXX),
  Author et al., Year)
- **Named experts:** Full name hyperlinked, role inline:
  *[Phil Schmid](https://x.com/philschmid) of [Hugging Face](https://huggingface.co)
  argues that...*
- **Vendor reports / blog posts:** Source name hyperlinked with verb of
  attribution: *[HashiCorp's analysis](URL) puts it: "quote"*
- **No footnotes** -- all citations inline or omitted
- **No vague attribution** -- "researchers found" is not a citation; name the
  source
