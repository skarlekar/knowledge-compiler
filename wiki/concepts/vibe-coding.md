---
title: "Vibe Coding"
type: concept
tags: [agentic-ai, specification]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: high
---

# Vibe Coding

## Definition

Vibe coding is the intuition-driven approach to AI-assisted development that dominated early agent adoption (2024–2025). The workflow: open a chat window, describe what you want, run what the model generates, iterate. No specification. No plan. No verification beyond "does it feel right?"

The term was coined by [Andrej Karpathy](../entities/andrej-karpathy.md) in February 2025, who called it "the hottest new programming paradigm" while also acknowledging it works best for throwaway projects where correctness doesn't matter. In the [agent maturity arc](agent-maturity-arc.md), vibe coding is Phase 1.

**For enterprise systems, vibe coding is prototyping mistaken for production engineering.**

## How It Works

1. Engineer opens a chat interface (Claude Code, Cursor, Copilot Chat, etc.)
2. Describes the desired behavior in natural language — no formal requirements
3. Runs whatever the model generates
4. Iterates based on whether the output "feels right"
5. Ships when the demo looks good

There is no written specification, no acceptance criteria, no audit trail of intent. The agent's "spec" exists only as conversational context, which is ephemeral and unverifiable.

## Key Parameters

- **Iteration speed**: Very fast — no upfront investment in requirements
- **Correctness signal**: Subjective ("does it feel right?")
- **Debuggability**: Near zero — no spec to trace failures back to
- **Auditability**: None — no record of what the agent was supposed to do
- **Suitable project size**: Small, throwaway, correctness-insensitive

## When To Use

Vibe coding is appropriate when:
- Correctness failures have no meaningful consequences
- The output is a prototype or personal tool, not a production system
- Speed of exploration matters more than verifiability
- The project will be discarded rather than maintained

Vibe coding is **not** appropriate for enterprise systems, regulated industries, or any context where the output will be deployed, maintained, or audited.

## Risks & Pitfalls

- **Undebugable failures**: No spec means no baseline to compare actual behavior against. Every failure is a mystery.
- **No reproducibility**: The "requirements" existed only in a conversation. Different prompt phrasing produces different behavior with no documented rationale.
- **Compounding technical debt**: Vibe-coded architecture makes sense to the model in the moment; it often doesn't make sense to a human six weeks later.
- **Regulatory exposure**: In any regulated environment, "the model thought it was a good idea" is not a defensible answer to an auditor's question.
- **The demo trap**: Vibe coding produces good demos. The dopamine hit of fast output creates pressure to ship without the discipline of [specification-driven development](specification-driven-development.md). The cultural barrier to moving past vibe coding is psychological, not technical.

## Related Concepts

- [Agent Maturity Arc](agent-maturity-arc.md) — vibe coding is Phase 1 of the three-phase evolution
- [Specification-Driven Development](specification-driven-development.md) — Phase 2; the corrective discipline
- [Harness Engineering](harness-engineering.md) — Phase 3; the runtime infrastructure vibe coding entirely lacks
- [Andrej Karpathy](../entities/andrej-karpathy.md) — coined the term in February 2025

## Sources

- [Signal Over Noise Issue #7](../summaries/signal-over-noise-issue-007.md)
