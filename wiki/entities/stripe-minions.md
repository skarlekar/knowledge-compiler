---
title: "Stripe Minions"
type: entity
tags: [agentic-ai, harness-engineering, reliability]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: medium
---

# Stripe Minions

## Overview

Stripe Minions is Stripe's internal agentic architecture, cited in Signal Over Noise Issue #7 as the gold standard implementation of a harness [verification layer](../concepts/harness-engineering.md). It demonstrates that deterministic verification gates can make agent-shipped features trustworthy at scale.

## Characteristics

- **Verification approach**: The harness enforces test execution before the agent can proceed to the next step. Workflow cannot progress without deterministic verification passing.
- **Key property**: "The agent physically cannot move forward until the tests pass." This is not "run tests after implementation" — it is an architectural constraint where the harness gates workflow progression on verification outcome.
- **Proof point**: Stripe's Minions demonstrated that deterministic verification gates make agent-shipped features trustworthy — not merely that agents can ship features.
- **Source**: https://stripe.com/blog/minions

## Common Strategies

- [Harness Engineering](../concepts/harness-engineering.md) — specifically the Verification Layer component: the harness enforces test gates as a precondition for workflow progression

## Related Entities

No directly related entity pages yet.
