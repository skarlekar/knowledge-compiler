---
title: "Specification-Driven Development"
type: concept
tags: [agentic-ai, specification, reliability, enterprise, compliance]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: high
---

# Specification-Driven Development

## Definition

Specification-driven development (SDD) is the practice of writing complete, human-approved specifications — requirements, design, and implementation plan — before an AI agent writes a single line of code. SDD is not a new idea (requirements before implementation is foundational software engineering) applied to a new context: autonomous agents that write code, call tools, and make decisions without continuous human oversight.

SDD is Phase 2 of the [agent maturity arc](agent-maturity-arc.md), following [vibe coding](vibe-coding.md). Its defining contribution is **traceability**: when an agent produces unexpected behavior, you can trace backward from the implementation to the task, from the task to the design, from the design to the requirement. Every failure has a diagnosis — specification error, design error, or implementation error — rather than being an opaque mystery.

In regulated industries, SDD is not engineering hygiene. It is **audit infrastructure**. "What was this agent supposed to do?" is a compliance question. The specification is the answer.

## How It Works

The canonical SDD workflow is the three-document system, formalized by [AWS Kiro](../entities/aws-kiro.md):

1. **`requirements.md`** — User stories with [EARS-notation](ears-notation.md) acceptance criteria. Machine-testable: "When [trigger], the system shall [response]." These are the formal commitments the implementation must satisfy.
2. **`design.md`** — Technical architecture: components, data flows, interfaces, constraints.
3. **`tasks.md`** — Ordered implementation plan: discrete work units with dependency tracking, each traceable to a requirement.

A **mandatory human approval gate** sits between specification and implementation. The agent generates the documents; a human reviews and approves before any code is written. This is an architectural constraint, not a suggestion — in Kiro's implementation, the agent literally cannot proceed without approval.

Specs are treated as **versioned artifacts** in version control, subject to the same review process as code changes. The spec version is pinned at task creation time, preventing the Spec Drift Bug ([harness failure mode 3](harness-engineering.md)).

## Key Parameters

- **Specification completeness**: What inputs the agent receives, what outputs it produces, which tools it may call, under what conditions it triggers human review, and what the EARS-formatted acceptance criteria are
- **Approval gate**: Who must approve and what constitutes approval before implementation begins
- **Version pinning**: The spec commit hash locked at task creation
- **Traceability depth**: How far back through the spec hierarchy a failure can be traced (implementation → task → design → requirement)

## When To Use

- Any agent-assisted workflow being introduced to a codebase or production system
- Any agent operating in a regulated environment (mortgage finance, consumer banking, healthcare, government)
- Any agent tasked with writing code that will be deployed or merged without line-by-line human review
- Specifically: **before** the agent touches the workflow (not retrospectively applied after the first incident)

The cultural barrier is psychological, not technical. Teams resist the upfront discipline. The objection is "it slows us down." It does — and the speed lost to specification is recovered when you are not debugging a hallucinated architecture at 3 AM.

## Risks & Pitfalls

- **Spec drift**: Spec updated mid-flight without version-pinning in-flight tasks. Fix: treat specs as immutable at task creation time; new requirements generate new tasks.
- **Incomplete EARS coverage**: Vague acceptance criteria that aren't machine-testable. Fix: require the "When [trigger], the system shall [response]" form for every behavioral requirement.
- **Approval gate erosion**: Human review becomes a rubber stamp under deadline pressure. Fix: treat approval as a legal commitment, not a formality — especially in regulated industries.
- **Spec-without-harness**: SDD without a [harness](harness-engineering.md) still has no runtime enforcement. The spec describes what the agent should do; the harness ensures it cannot do otherwise.

## Related Concepts

- [Harness Engineering](harness-engineering.md) — the runtime enforcement layer that makes specs operational
- [EARS Notation](ears-notation.md) — the requirement format that makes acceptance criteria machine-testable
- [Agent Behavioral Contracts](agent-behavioral-contracts.md) — the formal theoretical framework unifying SDD and harness
- [Agent Maturity Arc](agent-maturity-arc.md) — SDD is Phase 2; harness engineering is Phase 3
- [Vibe Coding](vibe-coding.md) — Phase 1; the absence of specification discipline

## Sources

- [Signal Over Noise Issue #7](../summaries/signal-over-noise-issue-007.md) — primary source
- Academic: "Agent Behavioral Contracts" (arxiv 2602.22302, February 2026)
- Academic: "Agent Contracts: A Formal Framework for Resource-Bounded Autonomous AI Systems" (arxiv 2601.08815, January 2026)
