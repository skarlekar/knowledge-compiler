---
title: "Activity Log"
type: log
---

Append-only record of all wiki changes.

## Format

Each entry follows this format:

```text
### YYYY-MM-DD HH:MM — [Action Type]
- **Source/Trigger**: what initiated the action
- **Pages created**: list of new pages
- **Pages updated**: list of updated pages
- **Notes**: any contradictions flagged, decisions made
```

---

### 2026-04-08 00:00 — Setup

- **Source/Trigger**: Repository initialized
- **Pages created**: index.md, log.md, dashboard.md, analytics.md, flashcards.md
- **Pages updated**: none
- **Notes**: Empty knowledge base ready for first source ingestion

---

### 2026-04-13 — Ingest: Signal Over Noise Issue #7

- **Source/Trigger**: `ingest https://signalovernoise.karlekar.cloud/issue-007.html`
- **Raw file saved**: `raw/signal-over-noise-issue-007.txt`
- **Pages created**:
  - `wiki/summaries/signal-over-noise-issue-007.md`
  - `wiki/concepts/harness-engineering.md`
  - `wiki/concepts/specification-driven-development.md`
  - `wiki/concepts/vibe-coding.md`
  - `wiki/concepts/agent-maturity-arc.md`
  - `wiki/concepts/agent-behavioral-contracts.md`
  - `wiki/concepts/ears-notation.md`
  - `wiki/entities/aws-kiro.md`
  - `wiki/entities/github-spec-kit.md`
  - `wiki/entities/manus.md`
  - `wiki/entities/stripe-minions.md`
  - `wiki/entities/andrej-karpathy.md`
- **Pages updated**: `wiki/index.md`
- **Notes**: First source ingested. Central thesis: the model is a commodity; the harness (runtime infrastructure constraining, verifying, and observing agent behavior) is the durable competitive moat. No contradictions with existing wiki content (wiki was empty). All 6 concepts and 5 entities carry high confidence except `stripe-minions` (medium — limited detail in source).

---

### 2026-04-13 — Ingest: Detective Guide (Longform)

- **Source/Trigger**: `ingest https://signalovernoise.karlekar.cloud/longform-2026-03-21-detective-guide-enterprise-intelligence.html`
- **Raw file saved**: `raw/longform-2026-03-21-detective-guide-enterprise-intelligence.md` (fetched via `ingest-url` skill; 2 images downloaded to `raw/images/longform-2026-03-21-detective-guide-enterprise-intelligence/`)
- **Pages created**:
  - `wiki/summaries/longform-2026-03-21-detective-guide-enterprise-intelligence.md`
  - `wiki/concepts/pole-model.md`
  - `wiki/concepts/graph-database.md`
  - `wiki/concepts/graph-rag.md`
- **Pages updated**:
  - `wiki/concepts/harness-engineering.md` — added Graph Database, POLE Model, and Graph RAG to Related Concepts (graph DB is the memory substrate for the harness's context management component)
  - `wiki/index.md` — added 4 new pages, updated statistics
- **Notes**: Second source ingested. Central thesis: POLE+O+D (Persons, Objects, Locations, Events + Observation + Decision) is the optimal entity framework for enterprise intelligence; graph databases are the native architecture for it; Graph RAG is the retrieval pattern that connects graph-structured memory to LLM reasoning. Extends the harness-engineering framework from Issue #7 — establishes the graph DB as the concrete memory substrate for the harness's context management layer. No contradictions with existing wiki content. All 3 new concepts carry high confidence (well-documented with concrete examples).

---

### 2026-04-13 — Research: LLM Wiki

- **Source/Trigger**: `research "LLM Wiki"`
- **Research log saved**: `raw/research-llm-wiki-2026-04-13.md` (5 sources evaluated, 3 accepted)
- **Accepted sources**: Andrej Karpathy GitHub Gist (2026-04-04); DAIR.AI Academy / Elvis Saravia (2026-04-03); LLM Wiki v2 / rohitg00 (2026-04-13)
- **Rejected sources**: VentureBeat (inaccessible, HTTP 429); intelligentliving.co (no verifiable expert credentials, derivative summary)
- **Pages created**:
  - `wiki/summaries/research-llm-wiki-2026-04-13.md`
  - `wiki/concepts/llm-wiki.md`
  - `wiki/synthesis/llm-wiki-vs-rag.md`
- **Pages updated**:
  - `wiki/entities/andrej-karpathy.md` — added LLM Wiki as a contribution alongside vibe coding
  - `wiki/index.md` — added 3 new pages, first synthesis entry, updated statistics (19 total, 10 concepts, 3 summaries, 1 synthesis)
- **Contested claim**: Need for vector search — DAIR.AI holds unnecessary at personal scale; LLM Wiki v2 argues essential beyond ~100–200 documents. Both correct for their respective scale ranges; not a genuine contradiction.
- **Gaps flagged**: No formal academic research on the pattern; no quantitative RAG comparison; enterprise-scale deployments undocumented.

---

### 2026-04-13 — Newsletter: LLM Wiki

- **Source/Trigger**: `newsletter "LLM Wiki"`
- **File saved**: `wiki/newsletters/newsletter-llm-wiki-2026-04-13.md`
- **Word count**: ~4,850 words
- **Wiki pages used**: `wiki/concepts/llm-wiki.md`, `wiki/synthesis/llm-wiki-vs-rag.md`, `wiki/summaries/research-llm-wiki-2026-04-13.md`, `wiki/entities/andrej-karpathy.md`
- **Raw sources read**: `raw/research-llm-wiki-2026-04-13.md`
- **Research invoked**: No — wiki coverage was sufficient (4 relevant pages, all three coverage criteria met)
- **Pages updated**: `wiki/index.md` (newsletter entry added, statistics updated)

---

### 2026-04-13 — Newsletter: LLM Wiki (v2)

- **Source/Trigger**: `newsletter "LLM Wiki"`
- **File saved**: `wiki/newsletters/newsletter-llm-wiki-2026-04-13-v2.md` (versioned — base filename already existed)
- **Word count**: ~4,600 words
- **Angle**: Schema quality as the determinant of LLM Wiki durability; the constitution metaphor; schema as living software not setup artifact
- **Wiki pages used**: `wiki/concepts/llm-wiki.md`, `wiki/synthesis/llm-wiki-vs-rag.md`, `wiki/summaries/research-llm-wiki-2026-04-13.md`, `wiki/entities/andrej-karpathy.md`
- **Raw sources read**: `raw/research-llm-wiki-2026-04-13.md`
- **Research invoked**: No — wiki coverage was sufficient
- **Cross-references**: Links to v1 newsletter in hook to establish different angle
- **Back-linked pages (4)**: `concepts/llm-wiki.md`, `synthesis/llm-wiki-vs-rag.md`, `entities/andrej-karpathy.md`, `summaries/research-llm-wiki-2026-04-13.md` — Featured In sections added (also retroactively added v1 link to all four)
- **Pages updated**: `wiki/index.md` (v2 entry added, statistics updated to 21 total / 2 newsletters)

---

### 2026-04-13 — Lint: Full Wiki Health Check

- **Source/Trigger**: `lint`
- **Pages reviewed**: 21 total (10 concepts, 5 entities, 3 summaries, 1 synthesis, 2 newsletters)
- **Auto-fixes applied (7 pages)**:
  - `wiki/concepts/vibe-coding.md` — added link to `llm-wiki.md` in Related Concepts; fixed MD032 list-spacing in When To Use
  - `wiki/concepts/agent-maturity-arc.md` — added link to `llm-wiki.md` in Related Concepts; fixed MD032 list-spacing in When To Use
  - `wiki/concepts/specification-driven-development.md` — added link to `llm-wiki.md` in Related Concepts
  - `wiki/concepts/harness-engineering.md` — added link to `llm-wiki.md` in Related Concepts; fixed MD022 heading-spacing for all four Failure Mode subsections
  - `wiki/entities/manus.md` — populated empty Related Entities with link to `stripe-minions.md`
  - `wiki/entities/stripe-minions.md` — populated empty Related Entities with link to `manus.md`; fixed MD034 bare URL
  - `wiki/newsletters/newsletter-llm-wiki-2026-04-13.md` — added missing `word_count` and `wiki_pages_used` frontmatter fields (backfill from v2 schema improvements)
- **Issues requiring human judgment**: None
- **Pre-existing warnings noted (no action taken)**:
  - MD025 (Multiple H1) on all wiki pages — standard wiki format using both frontmatter `title:` and body `# H1`; structural pattern, not a defect
- **Cross-link gap closed**: `llm-wiki.md` was linked to by `harness-engineering.md`, `vibe-coding.md`, `specification-driven-development.md`, and `agent-maturity-arc.md` in its Related Concepts section, but none of those four pages linked back. All four now link to `llm-wiki.md`.
- **Entity orphan gap closed**: `manus.md` and `stripe-minions.md` had empty Related Entities sections despite being the only two agentic AI entity examples in the wiki. Both now cross-link.
- **Contradictions found**: None
- **Stale claims**: None identified — all pages reflect sources from April 2026
- **Orphan pages**: None — all pages have at least one inbound link
- **Confidence levels**: All pages appropriately assigned; no upgrades or downgrades needed

---

### 2026-04-14 — Ingest: The Control Dial (Issue #8 Draft)

- **Source**: `raw/the control dial.pdf`
- **Source type**: Signal Over Noise Issue #8 draft (pending review); partially drafted by DeepSeek model
- **Editorial flag**: Opening procurement anecdote explicitly flagged in source as hallucinated. Not cited as a real-world incident in any wiki page.
- **Pages created (13)**:
  - `wiki/summaries/the-control-dial.md`
  - `wiki/concepts/orchestration-autonomy-spectrum.md` — control dial concept, NVIDIA L0-L5 framework, bounded autonomy, HITL contracts
  - `wiki/concepts/adaptive-orchestration.md` — deterministic rails + autonomous interiors hybrid architecture
  - `wiki/concepts/corrigibility-spectrum.md` — Anthropic Claude Model Spec design principle
  - `wiki/concepts/controllability-trap.md` — ICLR 2026 governance degradation failure mode
  - `wiki/concepts/alignment-drift.md` — specification gaming / Goodhart's Law in agentic form
  - `wiki/entities/langgraph.md`
  - `wiki/entities/crewai.md`
  - `wiki/entities/google-a2a.md`
  - `wiki/entities/langsmith.md`
  - `wiki/entities/langfuse.md`
  - `wiki/entities/e2b.md`
  - `wiki/entities/nvidia-nemo-guardrails.md`
- **Pages updated (2)**:
  - `wiki/concepts/harness-engineering.md` — added Approval Gates as Architecture (section 7), cross-links to 4 new concepts, new source reference
  - `wiki/concepts/agent-maturity-arc.md` — added NVIDIA L0-L5 complementary framework table, cross-link to orchestration-autonomy-spectrum, new source reference
- **Contradictions**: None with existing wiki content. The source extends and deepens existing harness-engineering and agent-behavioral-contracts coverage.
- **Key sources cited in the raw document**: NVIDIA "Agentic Autonomy Levels and Security" (April 2025); arXiv "Orchestration of Multi-Agent Systems" (January 2026); Anthropic "Measuring AI Agent Autonomy" (February 2026); Mitchell et al. arXiv:2502.02649; Anthropic Claude Model Spec (early 2026); ICLR 2026 Workshop; arXiv "Agent Contracts" 2601.08815; Nature Communications September 2025.

---

### 2026-04-14 — Journal: Ingest: The Control Dial

- **Source/Trigger**: `journal "ingest: the-control-dial"`
- **File saved**: `wiki/journal/journal-the-control-dial-2026-04-14.md`
- **Session type**: ingest
- **Wiki pages consulted**: 4 (index.md, agent-maturity-arc.md, harness-engineering.md, agent-behavioral-contracts.md)
- **Wiki pages created/updated during session**: 13 created, 2 updated
- **Follow-up questions logged**: 5 (AutoGen/OpenAI Agents SDK entity pages; Mitchell et al. summary; real incident for irreversible-action threat; NVIDIA AI-Q blueprint entity; schema amendment for draft sources)

---

### 2026-04-14 — Newsletter: The Control Dial

- **Source/Trigger**: `newsletter "The Control Dial: Orchestration vs. Autonomy in Agentic AI and Where to Draw the Line"`
- **File saved**: `wiki/newsletters/newsletter-the-control-dial-2026-04-14.md`
- **Word count**: ~4,500 words
- **Wiki pages used**: `concepts/orchestration-autonomy-spectrum.md`, `concepts/adaptive-orchestration.md`, `concepts/corrigibility-spectrum.md`, `concepts/controllability-trap.md`, `concepts/alignment-drift.md`, `concepts/harness-engineering.md`, `concepts/agent-behavioral-contracts.md`, `concepts/agent-maturity-arc.md`, `entities/langgraph.md`, `entities/crewai.md`, `entities/google-a2a.md`, `entities/langsmith.md`, `entities/langfuse.md`, `entities/e2b.md`, `entities/nvidia-nemo-guardrails.md`, `summaries/the-control-dial.md`
- **Research invoked**: No — wiki coverage was sufficient (16 relevant pages, all coverage criteria met from prior ingest)
- **Diagrams included**: 2 Mermaid diagrams (adaptive orchestration flowchart; NVIDIA autonomy spectrum)
- **Back-linked pages (16)**: All 16 wiki pages used — Featured In sections added
- **Pages updated**: `wiki/index.md` (newsletter entry added, statistics updated to 36 total / 3 newsletters)

---

### 2026-04-14 — Journal: Newsletter: The Control Dial

- **Source/Trigger**: `journal "newsletter: the-control-dial"`
- **File saved**: `wiki/journal/journal-newsletter-the-control-dial-2026-04-14.md`
- **Session type**: newsletter
- **Wiki pages consulted**: 17 (index.md + 16 newsletter source pages)
- **Wiki pages created/updated during session**: newsletter file (1 created), 17 updated (index + 16 back-links)
- **Follow-up questions logged**: 4 (context interruption schema amendment; AutoGen/OpenAI Agents SDK entity pages; autonomy frameworks synthesis page candidate)

---

### 2026-04-14 — Ingest: AgentOps (Signal Over Noise, March 27, 2026)

- **Source/Trigger**: `ingest raw/AgentOps_SON.pdf`
- **Source type**: Scanned PDF — Signal Over Noise Weekly Agentic AI Brief, March 27, 2026
- **PDF parsing**: Stage 1 (pdfminer.six) produced 0 chars/page (confirmed scanned document); Stage 2 (Tesseract OCR) succeeded with avg 204 words/page; Stage 3 (Claude Vision) not needed
- **Raw file saved**: `raw/agentops-son.md`
- **Pages created (9)**:
  - `wiki/summaries/agentops-son.md`
  - `wiki/concepts/agentops.md` — AgentOps as operational discipline for probabilistic agentic systems; 5-stage lifecycle; DevOps vs AgentOps contrast; Buy vs Build toolscape segmentation
  - `wiki/concepts/trajectory-evaluation.md` — probabilistic testing methodology replacing unit tests; golden trajectories; heuristic evaluation dimensions
  - `wiki/entities/arize-phoenix.md` — open-source self-hosted tracing/observability
  - `wiki/entities/ragas.md` — RAG-specific evaluation framework
  - `wiki/entities/deepeval.md` — pytest-style general-purpose agent evaluation
  - `wiki/entities/trulens.md` — feedback-function-based agent evaluation
  - `wiki/entities/llama-guard.md` — Meta's model-based content safety classifier
- **Pages updated (4)**:
  - `wiki/concepts/harness-engineering.md` — added AgentOps and Trajectory Evaluation to Related Concepts; new source reference
  - `wiki/entities/langsmith.md` — added agentops-son.md to sources; added Also Cited In section
  - `wiki/entities/langfuse.md` — added agentops-son.md to sources; added Also Cited In section
  - `wiki/entities/nvidia-nemo-guardrails.md` — added agentops-son.md to sources; added Also Cited In section
- **Contradictions**: None with existing wiki content. The source extends harness-engineering and agent-behavioral-contracts coverage with a lifecycle framing. Four deployment perils (infinite loops, prompt injection, black box audit trail, model drift) are consistent with and deepen existing failure-mode documentation.
- **Key paper cited**: arXiv:2512.12791v1 — "An Assessment Framework for Evaluating Agentic AI Systems"
- **Notable editorial note**: OCR quality was good but some table formatting (DevOps vs AgentOps comparison table) was partially garbled in extraction; content was reconstructed faithfully from surrounding context.

---

### 2026-04-14 — Journal: Ingest: AgentOps (Signal Over Noise, March 27, 2026)

- **Source/Trigger**: `journal "ingest: agentops-son"`
- **File saved**: `wiki/journal/journal-agentops-son-2026-04-14.md`
- **Session type**: ingest
- **Wiki pages consulted**: 5 (index.md, harness-engineering.md, langsmith.md, langfuse.md, nvidia-nemo-guardrails.md)
- **Wiki pages created/updated during session**: 9 created, 4 updated (see ingest log entry above)
- **Follow-up questions logged**: 6 (arXiv:2512.12791v1 ingest; LangChain/LlamaIndex entity pages; Guardrails AI entity page; "Also Cited In" schema amendment; indirect prompt injection concept page; OCR table recovery enhancement)
