# Knowledge Compiler — Vault Management

This is the **project-level** configuration document. It governs vault management only.

For all schema, workflow, and page-type instructions, read the **active vault's `CLAUDE.md`** at `<vault-root>/CLAUDE.md`.

## What Is a Vault?

A vault is an independent knowledge base comprising:

- `<vault-root>/raw/` — immutable source documents
- `<vault-root>/wiki/` — LLM-maintained wiki pages
- `<vault-root>/CLAUDE.md` — the schema governing all LLM operations for this vault
- `<vault-root>/.claude/commands/` — vault-type-specific and universal skills

Each vault has its own page types, tagging taxonomy, workflows, and confidence definitions. The LLM must read the active vault's `CLAUDE.md` before performing any ingest, query, lint, or newsletter operation.

## Vault Registry

Vaults are registered in `vaults.json` at the project root. This file is gitignored (paths are machine-specific). A `vaults.example.json` is committed as documentation.

**Schema:**

```json
[
  {
    "id": "signal-over-noise",
    "name": "Signal Over Noise",
    "template": "research",
    "path": "/absolute/path/to/vault-root",
    "purpose": "LLM-maintained knowledge base on Signal Over Noise"
  }
]
```

- `id` — kebab-case slug used in API calls, localStorage, and URL parameters
- `name` — display name shown in the UI vault selector
- `template` — which template was used to create this vault (informational)
- `path` — absolute path to the vault root directory (machine-specific; never committed)
- `purpose` — one-paragraph description of the vault's domain

## Available Templates

Templates live in `.claude/vault-templates/`. To list available templates:

```bash
ls .claude/vault-templates/*.md | xargs -I{} basename {} .md
```

| Template | Description |
|----------|-------------|
| `research` | Knowledge base for research, articles, and domain concepts — page types: concept, entity, summary, synthesis, newsletter, journal |
| `code-analysis` | Knowledge base for analyzing software codebases — page types: class, function, api, library, pattern, anti-pattern, module, journal |

## Vault Creation

To create a new vault, invoke the `create-vault` skill:

```
/create-vault
```

Or ask Claude: "Create a new vault for [purpose]."

The skill will ask for name, location, purpose, and template, then create the full directory structure, copy the appropriate CLAUDE.md and skills, and register the vault in `vaults.json`.

## Skills Architecture

Three tiers:

1. **Universal skills** — live at project root `.claude/commands/`, work across all vault types:
   - `create-vault.md` — create a new vault interactively
   - `journal.md` — capture session reasoning as a journal entry
   - `lint.md` — run a vault-type-aware wiki health check

2. **Vault-type-specific skills** — live in `.claude/vault-templates/skills/<template>/`, copied into new vaults at creation:
   - Research: `ingest-url.md`, `ingest-pdf.md`, `research.md`, `newsletter.md`
   - Code-analysis: `analyze-code.md`

3. **Vault-local skills** — live in `<vault-root>/.claude/commands/`, the actual copies used at runtime

To discover which skills are available in the active vault:

```bash
ls <vault-root>/.claude/commands/
```

## Rules

- Never perform wiki operations without first reading the active vault's `CLAUDE.md`
- Never modify files in `raw/` in any vault
- Always update `index.md` and `log.md` after any wiki change
- The `vaults.json` file contains absolute paths — never commit it to git
- When the user says "ingest", "research", "newsletter", "lint", or "journal", read the active vault's `CLAUDE.md` to determine the correct workflow and page schema

