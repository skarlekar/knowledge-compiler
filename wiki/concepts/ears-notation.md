---
title: "EARS Notation"
type: concept
tags: [specification, agentic-ai, reliability]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: high
---

# EARS Notation

## Definition

EARS (Easy Approach to Requirements Syntax) is a structured natural-language notation for writing unambiguous, machine-testable software requirements. Developed by Alistair Mavin and colleagues at Rolls-Royce, EARS provides sentence templates that constrain how requirements are expressed — eliminating the vagueness and interpretive drift that plague prose requirements documents.

In the context of agentic AI systems, EARS notation has a critical property: because its templates are syntactically constrained, requirements written in EARS can be evaluated by a verification layer without human interpretation of vague prose. An agent can generate EARS-formatted acceptance criteria, and the [harness](harness-engineering.md) can test whether the implementation satisfies them mechanically.

## How It Works

EARS defines five sentence templates:

| Pattern | Template | Use |
| ------- | -------- | --- |
| **Ubiquitous** | The system shall [action]. | Always-active behavior |
| **Event-driven** | When [trigger], the system shall [response]. | Response to a specific event |
| **State-driven** | While [state], the system shall [behavior]. | Behavior during a condition |
| **Unwanted behavior** | If [unwanted condition], then the system shall [action]. | Error handling and edge cases |
| **Optional feature** | Where [feature is enabled], the system shall [action]. | Configurable behavior |

**Example requirements in EARS form:**
- "When the user submits a mortgage application, the system shall classify all attached documents within 5 seconds."
- "While document confidence is below 0.85, the system shall route the application to human review."
- "If the external classification API returns a 5xx error, then the system shall retry with exponential backoff up to 3 attempts."

Each requirement expressed in this form is directly testable: you can write an assertion that checks whether the system produces the specified response to the specified trigger. This is what makes EARS requirements machine-verifiable — a [verification layer](harness-engineering.md) can evaluate them without human judgment.

## Key Parameters

- **Template adherence**: Requirements are only machine-testable if they follow the template precisely — "the system should" or "it would be good if" do not produce testable assertions
- **Trigger precision**: Event-driven requirements are only meaningful if the trigger is unambiguous and detectable
- **Response specificity**: Vague responses ("the system shall handle it appropriately") defeat the purpose; responses must be specific and measurable
- **Coverage**: Every behavioral requirement should have an EARS-format acceptance criterion; coverage gaps are undefined behavior

## When To Use

EARS notation applies wherever [specification-driven development](specification-driven-development.md) is in use — specifically in the `requirements.md` document of the three-document system. Use EARS:

- When writing acceptance criteria that an AI agent will implement against
- When specifying behaviors that a verification layer will test automatically
- When documenting agent behavior for regulated industry audits
- When specifying error handling and edge cases (Unwanted behavior template)

The EARS templates are particularly valuable for specifying [harness](harness-engineering.md) behavior: "If per-task spend exceeds $10, then the system shall terminate the agent and route the task to the dead-letter queue" is a precise EARS requirement that can be enforced mechanically.

## Risks & Pitfalls

- **Template theater**: Writing "When X, the system shall do something" without making X detectable or the action verifiable produces requirements that look like EARS but aren't testable.
- **Over-specification**: Expressing implementation details as EARS requirements constrains the agent's design unnecessarily. EARS should capture *what* and *under what conditions*, not *how*.
- **Missing unwanted-behavior coverage**: Teams write happy-path EARS requirements but skip the "If [error condition]" patterns. The result: the agent has no spec for failure modes, and the harness has nothing to enforce in those cases.

## Related Concepts

- [Specification-Driven Development](specification-driven-development.md) — EARS is the notation used for acceptance criteria in the three-document system
- [Agent Behavioral Contracts](agent-behavioral-contracts.md) — EARS requirements are the specification layer of the behavioral contract
- [Harness Engineering](harness-engineering.md) — the verification layer of the harness tests EARS-formatted acceptance criteria

## Sources

- [Signal Over Noise Issue #7](../summaries/signal-over-noise-issue-007.md)
- Original EARS paper: Mavin et al., "Easy Approach to Requirements Syntax (EARS)", 2009
