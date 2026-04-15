# create-vault

Create a new Knowledge Compiler vault — an independent knowledge base with its own directory structure, schema, and skills.

## Arguments

Optional: vault name (e.g., `"FastAPI Analysis"`)

## Steps

### 1 — Gather parameters

Ask the user for the following (or use the provided argument as the vault name):

1. **Name**: Display name for the vault (e.g., "FastAPI Analysis", "Signal Over Noise")
2. **Location**: Absolute directory path for the vault root (e.g., `/Users/me/vaults/fastapi-analysis`). The directory will be created if it does not exist. Must not already contain a `CLAUDE.md` file.
3. **Purpose**: One-paragraph description of the vault's domain and goal.
4. **Template**: List available templates by reading `.md` files from `.claude/vault-templates/` (excluding the `skills/` subdirectory). Present them to the user and ask which to use.

To list available templates:

```bash
ls .claude/vault-templates/*.md 2>/dev/null | xargs -I{} basename {} .md
```

### 2 — Derive vault ID

From the vault name:

- Lowercase all characters
- Replace spaces and non-alphanumeric characters with hyphens
- Remove leading and trailing hyphens

Example: `"FastAPI Analysis"` → `fastapi-analysis`

### 3 — Validate

**A. Check for existing CLAUDE.md at the vault location:**

```bash
ls "<vault-location>/CLAUDE.md" 2>&1
```

If the file exists, stop and report: "A vault already exists at `<location>` (CLAUDE.md found). Choose a different location or provide a path to an empty directory."

**B. Check for duplicate vault ID in `vaults.json`:**
Read `vaults.json` (if it exists). If an entry with the same `id` already exists, stop and report: "Vault ID `<id>` is already registered in vaults.json. Choose a different name."

### 4 — Create directory structure

Based on the chosen template's Directory Layout section, create the appropriate directories:

```bash
mkdir -p "<vault-location>/raw"
mkdir -p "<vault-location>/wiki/journal"
mkdir -p "<vault-location>/wiki/images"
mkdir -p "<vault-location>/.claude/commands"
```

For **research** template, also create:

```bash
mkdir -p "<vault-location>/wiki/summaries"
mkdir -p "<vault-location>/wiki/concepts"
mkdir -p "<vault-location>/wiki/entities"
mkdir -p "<vault-location>/wiki/synthesis"
mkdir -p "<vault-location>/wiki/newsletters"
mkdir -p "<vault-location>/wiki/presentations"
```

For **code-analysis** template, also create:

```bash
mkdir -p "<vault-location>/wiki/classes"
mkdir -p "<vault-location>/wiki/functions"
mkdir -p "<vault-location>/wiki/apis"
mkdir -p "<vault-location>/wiki/libraries"
mkdir -p "<vault-location>/wiki/patterns"
mkdir -p "<vault-location>/wiki/anti-patterns"
mkdir -p "<vault-location>/wiki/modules"
```

### 5 — Copy and customize CLAUDE.md

Read `.claude/vault-templates/<template>.md`.

Replace the `<!-- CUSTOMIZE: ... -->` comment block and the default purpose text in the Purpose section with the user's provided purpose description.

Write the customized content to `<vault-location>/CLAUDE.md`.

### 6 — Copy skills

**A. Copy vault-type-specific skills:**
Copy all files from `.claude/vault-templates/skills/<template>/` to `<vault-location>/.claude/commands/`.

```bash
cp .claude/vault-templates/skills/<template>/* "<vault-location>/.claude/commands/"
```

**B. Copy universal skills:**
Copy `journal.md`, `lint.md`, and `help.md` from the project-root `.claude/commands/` to the vault's `.claude/commands/`:

```bash
cp .claude/commands/journal.md "<vault-location>/.claude/commands/journal.md"
cp .claude/commands/lint.md "<vault-location>/.claude/commands/lint.md"
cp .claude/commands/help.md "<vault-location>/.claude/commands/help.md"
```

This ensures each vault is fully self-contained with all skills it needs.

**C. Copy reset script:**
Copy the template-specific reset script to the vault root and make it executable:

```bash
cp .claude/vault-templates/scripts/reset-wiki-<template>.sh "<vault-location>/reset-wiki.sh"
chmod +x "<vault-location>/reset-wiki.sh"
```

Replace `<template>` with the chosen template name (e.g., `research` or `code-analysis`).

### 7 — Create template wiki files

**A. Create `wiki/index.md`:**

For a **research** vault:

```markdown
---
title: "Knowledge Base Index"
type: index
updated: YYYY-MM-DD
---

# <Vault Name> — Master Catalog

Every page in the wiki must have an entry here.

## Concepts

| Page | Tags | Confidence | Updated |
| ---- | ---- | ---------- | ------- |

## Entities

| Page | Tags | Updated |
| ---- | ---- | ------- |

## Summaries

| Page | Source | Key Topics | Created |
| ---- | ------ | ---------- | ------- |

## Synthesis

| Page | Pages Compared | Created |
| ---- | -------------- | ------- |

## Newsletters

| Page | Topic | Created | Key Argument |
| ---- | ----- | ------- | ------------ |

## Journals

| Page | Session Type | Created | Outcome |
| ---- | ------------ | ------- | ------- |

## Statistics

- **Total pages**: 0
- **Concepts**: 0
- **Entities**: 0
- **Summaries**: 0
- **Synthesis**: 0
- **Newsletters**: 0
- **Journals**: 0
- **Sources ingested**: 0
```

For a **code-analysis** vault:

```markdown
---
title: "Knowledge Base Index"
type: index
updated: YYYY-MM-DD
---

# <Vault Name> — Master Catalog

Every page in the wiki must have an entry here.

## Classes

| Page | Language | Confidence | Updated |
| ---- | -------- | ---------- | ------- |

## Functions

| Page | Language | Confidence | Updated |
| ---- | -------- | ---------- | ------- |

## APIs

| Page | Endpoint | Updated |
| ---- | -------- | ------- |

## Libraries

| Page | Language | Updated |
| ---- | -------- | ------- |

## Patterns

| Page | Where Used | Updated |
| ---- | ---------- | ------- |

## Anti-Patterns

| Page | Impact | Updated |
| ---- | ------ | ------- |

## Modules

| Page | Language | Updated |
| ---- | -------- | ------- |

## Journals

| Page | Session Type | Created | Outcome |
| ---- | ------------ | ------- | ------- |

## Statistics

- **Total pages**: 0
- **Classes**: 0
- **Functions**: 0
- **APIs**: 0
- **Libraries**: 0
- **Patterns**: 0
- **Anti-Patterns**: 0
- **Modules**: 0
- **Journals**: 0
```

**B. Create `wiki/log.md`:**

```markdown
---
title: "Activity Log"
type: log
---

Append-only record of all wiki changes.

## Format

Each entry follows this format:

\`\`\`text
### YYYY-MM-DD HH:MM — [Action Type]
- **Source/Trigger**: what initiated the action
- **Pages created**: list of new pages
- **Pages updated**: list of updated pages
- **Notes**: any decisions made
\`\`\`

---

### YYYY-MM-DD — Setup

- **Source/Trigger**: Vault created via `create-vault` skill
- **Pages created**: index.md, log.md
- **Pages updated**: none
- **Notes**: Empty knowledge base ready for first source ingestion
```

### 8 — Register vault in vaults.json

Read `vaults.json` from the project root. If it does not exist, start with an empty array `[]`.

Add a new entry:

```json
{
  "id": "<vault-id>",
  "name": "<vault-name>",
  "template": "<template>",
  "path": "<absolute-vault-location>",
  "purpose": "<purpose>"
}
```

Write the updated array back to `vaults.json`.

### 9 — Report

Tell the user:

- Vault created at `<vault-location>`
- Template used: `<template>`
- Vault ID: `<vault-id>` (used in the UI vault selector and API calls)
- Skills installed: list the skills copied to `<vault-location>/.claude/commands/`
- Next step: refresh the Knowledge Compiler UI to see the new vault in the selector
