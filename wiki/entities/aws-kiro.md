---
title: "AWS Kiro"
type: entity
tags: [tool, agentic-ai, specification]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: high
---

# AWS Kiro

## Overview

AWS Kiro is Amazon's agentic IDE, announced in mid-2025 and described as the most complete spec-to-implementation pipeline available within a single IDE as of early 2026. Kiro is the clearest industry signal of the shift toward [specification-driven development](../concepts/specification-driven-development.md) — it enforces a three-document specification workflow with a mandatory human approval gate before any code is generated.

## Characteristics

**Spec mode** — Kiro's defining feature. The agent operates in a two-stage pipeline:

Stage 1 (Specification): The agent generates three documents:
- `requirements.md` — User stories with [EARS-notation](../concepts/ears-notation.md) acceptance criteria: "When [trigger], the system shall [response]"
- `design.md` — Technical architecture: components, interfaces, data flows
- `tasks.md` — Ordered implementation plan with dependency tracking, each task traceable to a requirement

Stage 2 (Implementation): Begins only after a human reviews and approves the spec. This is not a workflow suggestion — it is an architectural constraint. The agent cannot write a single line of implementation code until the approval gate is cleared.

**Agent Hooks** — Lifecycle hooks that fire before and after agent actions, enabling custom validation, logging, and constraint enforcement within the IDE. This is a [harness engineering](../concepts/harness-engineering.md) primitive baked into a specification tool — the direction the broader toolscape is moving: not spec and harness as separate categories, but integrated environments where specification and constraint enforcement are two sides of the same workflow.

**Use case fit**: Kiro excels at **greenfield** agent-driven development, where the specification and implementation are being created together from scratch.

## Common Strategies

- [Specification-Driven Development](../concepts/specification-driven-development.md) — Kiro is the primary tool enforcing the three-document SDD workflow
- [EARS Notation](../concepts/ears-notation.md) — Kiro's `requirements.md` uses EARS-format acceptance criteria
- [Harness Engineering](../concepts/harness-engineering.md) — Kiro's Agent Hooks provide harness primitives within the IDE

## Related Entities

- [GitHub spec-kit](github-spec-kit.md) — complementary tool: where Kiro is a full IDE for greenfield development, spec-kit retrofits SDD into existing repositories
