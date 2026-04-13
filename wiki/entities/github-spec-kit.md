---
title: "GitHub spec-kit"
type: entity
tags: [tool, agentic-ai, specification]
created: 2026-04-13
updated: 2026-04-13
sources: ["raw/signal-over-noise-issue-007.txt"]
confidence: high
---

# GitHub spec-kit

## Overview

GitHub spec-kit is GitHub's open-source tool for bringing [specification-driven development](../concepts/specification-driven-development.md) into existing developer workflows. Launched in early April 2026, spec-kit integrates specification discipline with existing repositories and CI/CD pipelines rather than requiring a new IDE or development environment.

## Characteristics

- **Integration model**: Works within existing repositories and CI/CD pipelines — no IDE migration required
- **Target use case**: Teams introducing AI agents incrementally into existing codebases where a full IDE switch (as required by [AWS Kiro](aws-kiro.md)) is not practical
- **Complementary positioning**: The source describes Kiro and spec-kit as complementary: "Kiro excels at greenfield agent-driven development; spec-kit retrofits specification discipline onto existing codebases where agents are being introduced incrementally."
- **Repository**: https://github.com/github/spec-kit

## Common Strategies

- [Specification-Driven Development](../concepts/specification-driven-development.md) — spec-kit's core purpose: bringing SDD natively into the developer workflow without changing the IDE

## Related Entities

- [AWS Kiro](aws-kiro.md) — complementary tool; Kiro is the full IDE for greenfield spec-first development; spec-kit integrates into existing repos
