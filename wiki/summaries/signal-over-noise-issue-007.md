---
title: "Signal Over Noise Issue #7: The Model Is Commodity. The Harness Is Moat."
type: summary
tags: [agentic-ai, harness-engineering, specification, enterprise, reliability]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: high
---

# Signal Over Noise Issue #7: The Model Is Commodity. The Harness Is Moat.

**Author:** Srini Karlekar | **Published:** April 11, 2026
**Source:** https://signalovernoise.karlekar.cloud/issue-007.html

## Key Points

- **The harness is the moat, not the model.** Meta's ~$2B acquisition of Manus in December 2025 was not for its models (it used Anthropic and OpenAI APIs like everyone else) — it was for the harness: the agentic orchestration infrastructure that turns AI into a reliable autonomous worker.
- **Most enterprise teams are stuck between Phase 1 and Phase 2** of the [agent maturity arc](../concepts/agent-maturity-arc.md). They have moved past pure vibe coding but have not adopted systematic specification-driven development and have no harness infrastructure.
- **[Vibe coding](../concepts/vibe-coding.md)** (Phase 1, coined by [Andrej Karpathy](../entities/andrej-karpathy.md) in Feb 2025) — intuition-driven, no spec — is prototyping mistaken for production engineering. Suitable only for throwaway projects.
- **[Specification-driven development](../concepts/specification-driven-development.md)** (Phase 2) creates the traceability that vibe coding destroys: failures are traceable to spec error, design error, or implementation error. [AWS Kiro](../entities/aws-kiro.md) enforces a three-document workflow (requirements.md with [EARS notation](../concepts/ears-notation.md), design.md, tasks.md) with a mandatory human approval gate before any code is written.
- **[GitHub spec-kit](../entities/github-spec-kit.md)** (launched April 2026) brings SDD into existing repositories and CI/CD pipelines — complementary to Kiro's greenfield approach.
- **[Harness engineering](../concepts/harness-engineering.md)** (Phase 3) is the runtime infrastructure that constrains, verifies, and observes an agent in production. Phil Schmid of Hugging Face: "The model is the CPU; the harness is the operating system."
- **A production-grade harness has six components:** Context Management, Tool Access Control, Verification Layer, Retry and Recovery Logic, Observability, Safety Boundaries.
- **Four canonical failure modes** in harnessless deployments: the 3 AM Retry Loop, Silent Scope Creep, Spec Drift Bug, and Invisible Dependency Chain.
- **Build-vs-buy guidance:** Buy observability (LangSmith, Langfuse), buy sandboxing (E2B), buy orchestration (Temporal) — build the policy layer.
- **[Agent behavioral contracts](../concepts/agent-behavioral-contracts.md)** are the theoretical foundation: formal separation of specification (what) from runtime enforcement (how), extended to resource constraints (cost limits, time bounds, tool access).
- **[Stripe's Minions](../entities/stripe-minions.md)** architecture demonstrates the gold standard verification layer: the harness physically prevents the agent from advancing until deterministic tests pass.
- **Implementation playbook (5 steps):** Pick one workflow and specify it completely → write the harness contract → instrument before you ship → treat specs as versioned contracts in version control → close the audit loop.
- **In regulated industries** (mortgage finance, consumer banking, healthcare), the audit question — "what was this agent supposed to do and what did it actually do?" — is a legal question, not an engineering one. SDD and observability together constitute the required audit infrastructure.

## Relevant Concepts

- [Harness Engineering](../concepts/harness-engineering.md) — the central concept of the issue
- [Specification-Driven Development](../concepts/specification-driven-development.md) — Phase 2 of the maturity arc
- [Vibe Coding](../concepts/vibe-coding.md) — Phase 1 of the maturity arc
- [Agent Maturity Arc](../concepts/agent-maturity-arc.md) — the three-phase model
- [Agent Behavioral Contracts](../concepts/agent-behavioral-contracts.md) — theoretical foundation
- [EARS Notation](../concepts/ears-notation.md) — machine-testable requirements format

## Source Metadata

- **Type:** Newsletter issue (Signal Over Noise, Issue #7)
- **Author:** Srini Karlekar — enterprise technology leader and builder of agentic systems
- **Published:** April 11, 2026
- **URL:** https://signalovernoise.karlekar.cloud/issue-007.html
- **Audience:** Enterprise technology leaders and builders
- **Academic papers cited:** arxiv 2602.22302, 2601.08815, 2603.27355, 2512.07665
