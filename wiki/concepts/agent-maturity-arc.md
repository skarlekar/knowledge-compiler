---
title: "Agent Maturity Arc"
type: concept
tags: [agentic-ai, enterprise, specification, harness-engineering]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: high
---

# Agent Maturity Arc

## Definition

The agent maturity arc is a three-phase model describing the evolution of how engineering teams work with AI code agents — from intuition-driven prototyping through specification discipline to full harness infrastructure. First articulated in Signal Over Noise Issue #7 (April 2026), the arc provides a diagnostic framework: understanding honestly (not aspirationally) where your organization sits is the first step toward closing the gap between agents that demo and agents that deploy.

## How It Works

### Phase 1: Vibe Coding (2024–2025)

Open a chat window, describe what you want, run the output, iterate. No specification, no plan, no formal verification. Coined by [Andrej Karpathy](../entities/andrej-karpathy.md) in February 2025. See [Vibe Coding](vibe-coding.md).

**Hallmark:** The demo looks great. Production is a mystery.

### Phase 2: Spec Coding (2025–2026)

Requirements, design, and acceptance criteria come first. The agent implements against a written plan. Human approval gates separate specification from implementation. Tools like [AWS Kiro](../entities/aws-kiro.md) and [GitHub spec-kit](../entities/github-spec-kit.md) formalize this approach. See [Specification-Driven Development](specification-driven-development.md).

**Hallmark:** Failures are diagnosable (spec error, design error, implementation error). Audit trail exists.

### Phase 3: Harness Engineering (2026+)

Specs tell the agent what to build. The harness constrains how it operates while building it — and afterward. Context management, tool access control, cost boundaries, retry policies, verification layers, observability. See [Harness Engineering](harness-engineering.md).

**Hallmark:** The agent is safe, reliable, and auditable at scale. You can improve the system, not just restart it.

## Key Parameters

- **Diagnostic question, Phase 1**: "Can we demo this?" — Yes.
- **Diagnostic question, Phase 2**: "Can we trace why it failed?" — Yes.
- **Diagnostic question, Phase 3**: "Can we operate this at scale in production without human supervision?" — Yes.
- **Where most enterprise teams are**: Somewhere between Phase 1 and Phase 2 as of 2026. Past pure vibe coding, but no systematic SDD and no harness infrastructure.

## When To Use

Use this framework to:
- Honestly assess your organization's current maturity
- Identify the highest-leverage improvement: if you're in Phase 1, move to Phase 2 before worrying about Phase 3 infrastructure
- Set realistic expectations: the jump from Phase 2 to Phase 3 requires infrastructure investment that doesn't demo well
- Communicate to non-technical stakeholders why "the demo worked" is not "production-ready"

## Risks & Pitfalls

- **Aspirational self-assessment**: Teams overestimate their phase. The test is not "do we write better prompts?" (still Phase 1) but "do we have written, approved specs before the agent touches the workflow?" (Phase 2) and "do we have cost circuit breakers, file-system sandboxing, and full execution traces?" (Phase 3).
- **Phase 2 without Phase 3**: Specs without a harness still have no runtime enforcement. The agent knows what to build but nothing stops it from retrying forever, modifying out-of-scope files, or hiding failures in a dependency chain.
- **Skipping Phase 2**: Some teams attempt to jump from vibe coding directly to harness infrastructure. Without specification discipline, the harness has nothing authoritative to enforce.

## Related Concepts

- [Vibe Coding](vibe-coding.md) — Phase 1 in detail
- [Specification-Driven Development](specification-driven-development.md) — Phase 2 in detail
- [Harness Engineering](harness-engineering.md) — Phase 3 in detail
- [Agent Behavioral Contracts](agent-behavioral-contracts.md) — the theoretical framework that formalizes Phase 2 and Phase 3 together

## Sources

- [Signal Over Noise Issue #7](../summaries/signal-over-noise-issue-007.md)
