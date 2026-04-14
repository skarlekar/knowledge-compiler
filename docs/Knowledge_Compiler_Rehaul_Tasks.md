# Knowledge Compiler Rehaul -- Task List

**Document ID:** TASK-REHAUL-001
**Version:** 1.1
**Date:** 2026-04-14
**Plan:** [Knowledge_Compiler_Rehaul_Plan.md](Knowledge_Compiler_Rehaul_Plan.md)
**Status:** Draft — v1.1 adds tasks for 11 orphan requirements identified in coverage audit (TASK-R006b, TASK-R025b, TASK-R028b; updates to TASK-R002, TASK-R007, TASK-R014, TASK-R017, TASK-R018, TASK-R022, TASK-R024)

---

## Phase 1: Template Extraction and Vault Registry

### TASK-R001 -- Create Research Vault Template

- **File:** `.claude/vault-templates/research.md`
- **Type:** New
- **Description:** Copy the current `CLAUDE.md` (all 346 lines) verbatim into `.claude/vault-templates/research.md`. This becomes the canonical research vault template. Verify that the `<!-- CUSTOMIZE -->` comments already present in the Purpose and Tagging Taxonomy sections are preserved.
- **Acceptance criteria:**
  - [ ] File exists at `.claude/vault-templates/research.md`
  - [ ] Content is identical to current `CLAUDE.md`
  - [ ] `<!-- CUSTOMIZE -->` comments are present in Purpose and Tagging Taxonomy sections
- **Dependencies:** None

### TASK-R002 -- Create Code-Analysis Vault Template

- **File:** `.claude/vault-templates/code-analysis.md`
- **Type:** New
- **Description:** Write a complete CLAUDE.md template for code-analysis vaults. Include all sections: Purpose (with `<!-- CUSTOMIZE -->` placeholder), Directory Layout (classes, functions, apis, libraries, patterns, anti-patterns, modules, journal, images, index, log), File Naming conventions, Page Format (frontmatter with source_files and language fields), Required Sections by Page Type (all 7 code page types plus journal), Image and Diagram Conventions, Linking Conventions, Tagging Taxonomy (Language, Layer, Concern, Quality, Status), Confidence Levels, Workflows (Analyze, Analyze Dependencies, Query, Lint, Journal), Contradiction Handling, and Rules. Follow the schema detailed in Section 3.2 of the plan. The Lint workflow must be explicitly adapted for code-analysis: check for orphan pages, missing cross-links, stale function signatures (source_files reference files that have changed), broken file:line references, incomplete sections, and modules without dependency links (not the research-vault checks for contradictions or confidence levels).
- **Acceptance criteria:**
  - [ ] File exists at `.claude/vault-templates/code-analysis.md`
  - [ ] Contains all page types: class, function, api, library, pattern, anti-pattern, module, journal
  - [ ] Each page type has complete required sections documented
  - [ ] Tagging taxonomy covers Language, Layer, Concern, Quality, Status
  - [ ] Workflows section defines Analyze, Analyze Dependencies, Query, Lint, Journal
  - [ ] Lint workflow checks for stale `source_files` references and broken file:line references (not research-vault contradiction checks)
  - [ ] `<!-- CUSTOMIZE -->` comment present in Purpose section
  - [ ] Structure mirrors the research template's section organization
- **Dependencies:** None
- **Can parallelize with:** TASK-R001, TASK-R003, TASK-R004

### TASK-R003 -- Create vaults.example.json

- **File:** `vaults.example.json` (project root)
- **Type:** New
- **Description:** Create an example vault registry file at the project root showing the expected schema. Include one example entry with placeholder path. This file is committed to git as documentation; the actual `vaults.json` is gitignored.
- **Acceptance criteria:**
  - [ ] File exists at project root as `vaults.example.json`
  - [ ] Contains valid JSON array with one example vault entry
  - [ ] Example entry includes all fields: id, name, template, path, purpose
  - [ ] Path field contains a clearly-placeholder value
- **Dependencies:** None
- **Can parallelize with:** TASK-R001, TASK-R002, TASK-R004

### TASK-R004 -- Add vaults.json to .gitignore

- **File:** `.gitignore`
- **Type:** Modify
- **Description:** Add `vaults.json` to the `.gitignore` file. Place it near the existing gitignore entries for machine-specific files (near `.env` entries). This ensures vault registrations (which contain absolute paths) are not committed.
- **Acceptance criteria:**
  - [ ] `vaults.json` appears in `.gitignore`
  - [ ] Existing gitignore entries are preserved
- **Dependencies:** None
- **Can parallelize with:** TASK-R001, TASK-R002, TASK-R003

### TASK-R005 -- Copy Research Skills to Template Library

- **Files:**
  - `.claude/vault-templates/skills/research/ingest-url.md`
  - `.claude/vault-templates/skills/research/ingest-pdf.md`
  - `.claude/vault-templates/skills/research/research.md`
  - `.claude/vault-templates/skills/research/newsletter.md`
- **Type:** New
- **Description:** Copy the four research-specific skills from `.claude/commands/` into the template library at `.claude/vault-templates/skills/research/`. These are exact copies -- no content changes. They serve as the source-of-truth copies that get installed into new research vaults during creation.
- **Acceptance criteria:**
  - [ ] All four files exist in `.claude/vault-templates/skills/research/`
  - [ ] Content of each matches its source in `.claude/commands/`
  - [ ] Directory structure `.claude/vault-templates/skills/research/` is created
- **Dependencies:** None
- **Can parallelize with:** TASK-R006

### TASK-R006 -- Create Code-Analysis Skill: analyze-code.md

- **File:** `.claude/vault-templates/skills/code-analysis/analyze-code.md`
- **Type:** New
- **Description:** Create the `analyze-code` skill for code-analysis vaults. This skill reads source code files (or directories of source files), identifies classes, functions, API endpoints, and patterns, and creates/updates corresponding wiki pages. It is analogous to `ingest-url` for research vaults. Include: name, description, argument-hint, allowed-tools (Read, Write, Edit, Glob, Bash), and step-by-step instructions for: (1) verify path exists, (2) read all source files (recursively for directories), (3) identify elements (classes, functions, exported APIs), (4) for each element create or update the appropriate wiki page with all required sections, (5) identify imported libraries and create/update library pages, (6) identify design patterns and anti-patterns, (7) cross-link all touched pages, (8) update index.md and log.md, (9) invoke journal skill.
- **Acceptance criteria:**
  - [ ] File exists at `.claude/vault-templates/skills/code-analysis/analyze-code.md`
  - [ ] Frontmatter includes name, description, argument-hint, allowed-tools
  - [ ] Steps cover file reading, element identification, page creation/update, cross-linking, index/log updates
  - [ ] Handles both single file and directory arguments
  - [ ] References correct page types (class, function, api, library, pattern, anti-pattern, module)
  - [ ] Invokes journal skill at the end
- **Dependencies:** TASK-R002 (needs to know the code-analysis schema)
- **Can parallelize with:** TASK-R005

### TASK-R006b -- Create Universal Skill: lint.md (Multi-Vault Aware)

- **File:** `.claude/commands/lint.md`
- **Type:** New (replaces any informal lint guidance)
- **Description:** Create the `lint` universal skill that performs wiki health checks in a vault-type-aware manner. Include: name, description, allowed-tools (Read, Write, Edit, Glob, Grep). As the first step, read the active vault's `CLAUDE.md` to determine the vault type and its page types. Then run health checks appropriate for that vault type: for **research vaults** — check orphan pages, stale claims, contradictions, missing cross-links, incomplete sections, low-confidence pages; for **code-analysis vaults** — check orphan pages, missing cross-links, stale `source_files` references (source file changed since page was written), broken file:line references, incomplete sections, modules without dependency links. Auto-fix what can be fixed automatically (broken links, missing cross-references). Report issues requiring human judgment. Update `wiki/log.md` after the health check. Invoke the `journal` skill at the end.
- **Acceptance criteria:**
  - [ ] File exists at `.claude/commands/lint.md`
  - [ ] Frontmatter includes name, description, allowed-tools
  - [ ] First step reads active vault's CLAUDE.md to determine vault type
  - [ ] Research vault checks: orphan pages, stale claims, contradictions, missing cross-links, incomplete sections
  - [ ] Code-analysis vault checks: stale source_files, broken file:line references, modules without dependency links
  - [ ] Auto-fixes applied for fixable issues; human-judgment issues reported
  - [ ] Appends to wiki/log.md after health check
  - [ ] Invokes journal skill at end
- **Dependencies:** TASK-R002 (needs to know code-analysis checks)
- **Can parallelize with:** TASK-R005, TASK-R006

### TASK-R007 -- Create Universal Skill: create-vault.md

- **File:** `.claude/commands/create-vault.md`
- **Type:** New
- **Description:** Create the `create-vault` skill that guides vault creation. Include: name, description, argument-hint (optional vault name), allowed-tools (Read, Write, Bash, Glob). Steps: (1) gather parameters (name, location, purpose, template), (2) derive kebab-case vault ID, (3) validate (no existing CLAUDE.md at location, no duplicate ID in vaults.json), (4) create directory structure based on template's Directory Layout, (5) copy and customize CLAUDE.md from template, (6) copy vault-type-specific skills from `.claude/vault-templates/skills/<template>/` to vault's `.claude/commands/`, (7) copy universal skills (`journal.md`, `lint.md`) from project-root `.claude/commands/` to vault's `.claude/commands/` so each vault is self-contained, (8) create template index.md and log.md, (9) register vault in vaults.json, (10) report results. Include template listing step that reads available `.md` files from `.claude/vault-templates/` (excluding the `skills/` subdirectory).
- **Acceptance criteria:**
  - [ ] File exists at `.claude/commands/create-vault.md`
  - [ ] Frontmatter includes name, description, argument-hint, allowed-tools
  - [ ] Template listing step discovers templates from `.claude/vault-templates/`
  - [ ] Creates correct directory structure based on chosen template
  - [ ] Copies CLAUDE.md and customizes Purpose section
  - [ ] Copies vault-type-specific skills to vault's `.claude/commands/`
  - [ ] Copies universal skills (`journal.md`, `lint.md`) to vault's `.claude/commands/`
  - [ ] Creates template index.md and log.md
  - [ ] Registers vault in vaults.json with correct schema
  - [ ] Validates against duplicate IDs and existing vaults
- **Dependencies:** TASK-R001, TASK-R002, TASK-R005, TASK-R006, TASK-R006b

### TASK-R008 -- Phase 1 Verification

- **File:** None (verification task)
- **Type:** Verification
- **Description:** Verify that Phase 1 is complete and non-breaking. Check: (1) all template files exist and are well-formed, (2) all skill files exist and have correct frontmatter, (3) `vaults.example.json` is valid JSON, (4) `.gitignore` includes `vaults.json`, (5) existing app functionality is unchanged (start the server, load the UI, verify graph renders, verify content panel works), (6) existing skills in `.claude/commands/` still work.
- **Acceptance criteria:**
  - [ ] Server starts without errors
  - [ ] UI loads and renders graph correctly
  - [ ] All existing features work (search, filter, navigation, upload, refresh)
  - [ ] No changes to `src/` directory files
  - [ ] All new files are in `.claude/vault-templates/` or `.claude/commands/`
- **Dependencies:** TASK-R001 through TASK-R007

---

## Phase 2: Server-Side Vault Awareness

### TASK-R009 -- Add Vault Registry Loader to Server

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Add a function to load and parse `vaults.json` from the project root. The function should: (1) read `vaults.json` from `path.resolve(__dirname, '..', '..', 'vaults.json')`, (2) parse as JSON, (3) return the array of vault entries, (4) if file doesn't exist or is malformed, return `[]` and log a warning. Cache the result. Add a helper `resolveVaultPath(vaultId)` that takes an optional vault ID, looks it up in the registry, and returns the vault's root path. If no vaultId is provided, return the first vault's path or fall back to the legacy project root (two levels up from `src/server/`).
- **Acceptance criteria:**
  - [ ] `loadVaultRegistry()` function reads and parses `vaults.json`
  - [ ] Returns `[]` when file is missing
  - [ ] Returns `[]` when file contains invalid JSON (with console warning)
  - [ ] `resolveVaultPath(vaultId)` returns correct path for known vault ID
  - [ ] `resolveVaultPath(null)` returns first vault's path or legacy root
  - [ ] `resolveVaultPath('unknown-id')` throws/returns an error
- **Dependencies:** TASK-R008

### TASK-R010 -- Add GET /api/vaults Endpoint

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Add a new `GET /api/vaults` endpoint that returns the vault registry as JSON. The endpoint calls `loadVaultRegistry()` and returns the result. Strip the `path` field from the response for security (the client doesn't need filesystem paths). Return: array of `{ id, name, template, purpose }` objects.
- **Acceptance criteria:**
  - [ ] `GET /api/vaults` returns 200 with JSON array
  - [ ] Response does not include `path` field
  - [ ] Response includes `id`, `name`, `template`, `purpose` for each vault
  - [ ] Returns `[]` when no `vaults.json` exists
  - [ ] Returns `[]` when `vaults.json` is empty
- **Dependencies:** TASK-R009

### TASK-R011 -- Make GET /api/wiki/files Vault-Aware

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Modify the `GET /api/wiki/files` endpoint to accept an optional `?vault=<id>` query parameter. Use `resolveVaultPath(req.query.vault)` to determine the wiki directory. Replace the hardcoded `WIKI_DIR` with the resolved path + `/wiki/`. If the vault ID is unknown, return `404 { error: "Unknown vault: <id>" }`. If no `?vault` parameter is provided, use the legacy fallback.
- **Acceptance criteria:**
  - [ ] Endpoint accepts `?vault=<id>` parameter
  - [ ] Returns files from the correct vault's wiki directory
  - [ ] Returns 404 for unknown vault IDs
  - [ ] Without `?vault`, returns same results as before (backward compatible)
  - [ ] Path-traversal prevention applies to vault-resolved paths
- **Dependencies:** TASK-R009

### TASK-R012 -- Make GET /api/wiki/file Vault-Aware

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Modify the `GET /api/wiki/file` endpoint to accept `?vault=<id>`. Resolve the wiki directory from the vault registry. Update path-traversal check to verify the resolved path starts with the vault's wiki directory (not the hardcoded `WIKI_DIR`).
- **Acceptance criteria:**
  - [ ] Endpoint accepts `?vault=<id>` parameter
  - [ ] Reads file from the correct vault's wiki directory
  - [ ] Path-traversal prevention uses vault-specific wiki directory
  - [ ] Returns 404 for unknown vault IDs
  - [ ] Backward compatible when `?vault` is absent
- **Dependencies:** TASK-R009

### TASK-R013 -- Make GET /api/wiki/image Vault-Aware

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Modify the `GET /api/wiki/image` endpoint to accept `?vault=<id>`. Resolve the images directory from the vault registry (`<vault-root>/wiki/images/`). Update path-traversal check to use vault-specific images directory.
- **Acceptance criteria:**
  - [ ] Endpoint accepts `?vault=<id>` parameter
  - [ ] Serves images from the correct vault's wiki/images directory
  - [ ] Path-traversal prevention uses vault-specific images directory
  - [ ] Backward compatible when `?vault` is absent
- **Dependencies:** TASK-R009

### TASK-R014 -- Make POST /api/raw/upload Vault-Aware

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Modify the `POST /api/raw/upload` endpoint to accept `?vault=<id>`. Resolve the raw directory from the vault registry (`<vault-root>/raw/`). Write uploaded files to the vault's raw directory. All existing validation (filename sanitization, conflict prevention) applies to the vault-resolved path. Path-traversal prevention must explicitly verify the resolved upload path starts with the vault's `raw/` directory before writing (analogous to the wiki file endpoint's traversal check).
- **Acceptance criteria:**
  - [ ] Endpoint accepts `?vault=<id>` parameter
  - [ ] Uploads file to the correct vault's raw directory
  - [ ] Conflict prevention checks against the vault's raw directory
  - [ ] Path-traversal prevention verifies resolved path starts with `<vault-root>/raw/` before writing
  - [ ] Backward compatible when `?vault` is absent
- **Dependencies:** TASK-R009

### TASK-R015 -- Server Startup Logging for Vaults

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Update the server startup log message to include vault information. If vaults are registered, log: "Registered vaults: [vault-id-1], [vault-id-2], ...". If no vaults.json, log: "No vault registry found; using legacy wiki directory." Also log which wiki directory will be used as the default.
- **Acceptance criteria:**
  - [ ] Startup log shows registered vault IDs when vaults.json exists
  - [ ] Startup log indicates legacy mode when vaults.json is missing
  - [ ] Default wiki directory path is logged
- **Dependencies:** TASK-R009

### TASK-R016 -- Phase 2 Verification

- **File:** None (verification task)
- **Type:** Verification
- **Description:** Verify server-side vault awareness: (1) Start server with no `vaults.json` -- all existing endpoints return same data, `GET /api/vaults` returns `[]`. (2) Create a `vaults.json` with one entry pointing to the project root -- all endpoints with `?vault=signal-over-noise` return correct data. (3) Call endpoints with `?vault=nonexistent` -- returns 404. (4) Verify path-traversal prevention still works. (5) Verify upload works with `?vault` parameter.
- **Acceptance criteria:**
  - [ ] Legacy mode (no vaults.json) works identically to pre-rehaul
  - [ ] Vault-aware mode returns correct data per vault
  - [ ] Unknown vault IDs return 404
  - [ ] Path traversal attempts are blocked
  - [ ] Upload to vault raw/ directory works
- **Dependencies:** TASK-R009 through TASK-R015

---

## Phase 3: UI Vault Switcher

### TASK-R017 -- Add Vault Selector and Vault Name Display HTML

- **File:** `src/public/index.html`
- **Type:** Modify
- **Description:** Add two vault UI elements to the toolbar. (1) Vault selector dropdown: insert a `<div class="vault-selector-container">` in the `toolbar-left` section, after the `<h1 class="app-title">` element. Inside it, place a `<select id="vault-select" class="vault-selector" title="Switch vault"></select>`. The options will be populated dynamically by JavaScript. (2) Vault name display: add a `<span id="vault-name" class="vault-name"></span>` element inside the same `vault-selector-container` div, after the `<select>` element, to show the active vault's name as a read-only label when only one vault exists or as supplemental context.
- **Acceptance criteria:**
  - [ ] `<select id="vault-select">` element exists in the toolbar-left section
  - [ ] Element is inside a `<div class="vault-selector-container">`
  - [ ] `<span id="vault-name" class="vault-name">` element exists inside the same container
  - [ ] Position is after the app title
- **Dependencies:** TASK-R016
- **Can parallelize with:** TASK-R018

### TASK-R018 -- Add Vault Selector and Vault Name Display CSS

- **File:** `src/public/css/styles.css`
- **Type:** Modify
- **Description:** Add styles for the vault selector, vault name display, and their container. `.vault-selector-container`: margin-left 12px, flex 0 0 auto. `.vault-selector`: background rgba(255,255,255,0.12), color #fff, border 1px solid rgba(255,255,255,0.2), border-radius 4px, padding 4px 8px, font-size 13px, cursor pointer, max-width 200px, text-overflow ellipsis, outline none. `.vault-selector:hover`: background rgba(255,255,255,0.25). `.vault-selector option`: color #222, background #fff (for dropdown readability). `.vault-name`: color rgba(255,255,255,0.85), font-size 13px, margin-left 8px, font-weight 400 (read-only label for active vault name; hidden when vault selector has more than one option).
- **Acceptance criteria:**
  - [ ] `.vault-selector-container` styles defined
  - [ ] `.vault-selector` styles match toolbar button aesthetic
  - [ ] Dropdown options are readable (dark text on white background)
  - [ ] `.vault-name` styles defined (muted white, consistent with toolbar)
  - [ ] Selector is visually consistent with existing toolbar elements
- **Dependencies:** TASK-R016
- **Can parallelize with:** TASK-R017

### TASK-R019 -- Add Vault-Aware API Calls to graph.js

- **File:** `src/public/js/graph.js`
- **Type:** Modify
- **Description:** Modify `GraphBuilder.build()` to accept an optional `vaultId` parameter. When provided, append `?vault=<vaultId>` to the `/api/wiki/files` fetch URL. For individual file fetches, append `&vault=<vaultId>` (or `?vault=<vaultId>` if no other params). If `vaultId` is null/undefined, make requests without the parameter (backward compatible).
- **Acceptance criteria:**
  - [ ] `GraphBuilder.build(vaultId)` signature accepts optional vault ID
  - [ ] `/api/wiki/files` request includes `?vault=<id>` when provided
  - [ ] `/api/wiki/file` requests include `vault` parameter when provided
  - [ ] Without vault ID, requests are unchanged (backward compatible)
- **Dependencies:** TASK-R016

### TASK-R020 -- Add Vault-Aware Image Resolution to content.js

- **File:** `src/public/js/content.js`
- **Type:** Modify
- **Description:** Update `ContentRenderer.init()` to accept an optional `vaultId` parameter and store it in a module-level variable. Update the DOMPurify `afterSanitizeAttributes` hook to append `&vault=<vaultId>` to the `/api/wiki/image` URL when a vault ID is set. This ensures images in vault-specific wikis are resolved correctly.
- **Acceptance criteria:**
  - [ ] `ContentRenderer.init(nodes, navigateCallback, vaultId)` accepts vault ID
  - [ ] Image URLs include `&vault=<vaultId>` when vault is set
  - [ ] Without vault ID, image resolution is unchanged
- **Dependencies:** TASK-R016

### TASK-R021 -- Add Code-Analysis Type Colours to utils.js

- **File:** `src/public/js/utils.js`
- **Type:** Modify
- **Description:** Add new entries to `TYPE_COLOURS` and `TYPE_LABEL_COLOURS` for code-analysis page types: `class` (#2ECC71, label #fff), `function` (#3498DB, label #fff), `api` (#E67E22, label #fff), `library` (#1ABC9C, label #fff), `pattern` (#8E44AD, label #fff), `'anti-pattern'` (#E74C3C, label #fff), `module` (#F39C12, label #fff). Update `inferType()` to handle directory names: `classes` -> `class`, `functions` -> `function`, `apis` -> `api`, `libraries` -> `library`, `patterns` -> `pattern`, `anti-patterns` -> `anti-pattern`, `modules` -> `module`. The existing singular-stripping logic handles most cases but `anti-patterns` -> `anti-pattern` needs explicit handling.
- **Acceptance criteria:**
  - [ ] All 7 new type colours added to `TYPE_COLOURS`
  - [ ] All 7 new label colours added to `TYPE_LABEL_COLOURS`
  - [ ] `inferType('classes/my-class.md', undefined)` returns `'class'`
  - [ ] `inferType('anti-patterns/god-object.md', undefined)` returns `'anti-pattern'`
  - [ ] Existing type inference is unchanged
- **Dependencies:** TASK-R016
- **Can parallelize with:** TASK-R017, TASK-R018, TASK-R019, TASK-R020

### TASK-R022 -- Implement Vault Switching Logic in app.js

- **File:** `src/public/js/app.js`
- **Type:** Modify
- **Description:** Major update to the main application entry point. Add the following logic at the top of the `main()` function: (1) Fetch `GET /api/vaults` to get the vault list. (2) If vault list is empty, hide `vault-selector-container` and proceed with legacy mode (no vault ID passed anywhere). (3) If vaults exist: populate the `<select>` with options (value = vault.id, text = vault.name). (4) Read `localStorage.getItem('kc-active-vault')`. If it matches a vault ID in the list, select that option; otherwise select the first vault. (5) Store the active vault ID in a variable. (6) Pass the active vault ID to `GraphBuilder.build(activeVaultId)`. (7) Pass the active vault ID to `ContentRenderer.init(data.nodes, navigateTo, activeVaultId)`. (8) Add an event listener on the vault selector's `change` event that: saves new vault ID to localStorage, shows "Switching..." toast, destroys Visualization, calls `GraphBuilder.build(newVaultId)`, reinitializes all modules, navigates to index.md, shows success toast. (9) Update `document.title` to include the active vault name. (10) Update the refresh handler to pass vault ID through the rebuild process.
- **Acceptance criteria:**
  - [ ] On startup, fetches vault list from `/api/vaults`
  - [ ] Vault selector populated with vault names
  - [ ] Active vault restored from localStorage
  - [ ] Falls back to first vault if localStorage value is invalid
  - [ ] If localStorage vault ID is not in the registry, shows warning toast: "Vault '[id]' no longer registered. Switched to [first vault name]."
  - [ ] Vault selector hidden when no vaults exist
  - [ ] Switching vaults rebuilds graph with new vault's data
  - [ ] Switching vaults resets navigation (navigates to index.md)
  - [ ] Success toast after vault switch shows: "Switched to [Vault Name] — N nodes, M edges"
  - [ ] Vault selection persisted in localStorage as `kc-active-vault`
  - [ ] Browser tab title includes vault name
  - [ ] Refresh preserves vault context
  - [ ] Legacy mode (no vaults) works identically to pre-rehaul
- **Dependencies:** TASK-R017, TASK-R018, TASK-R019, TASK-R020, TASK-R021

### TASK-R023 -- Phase 3 Verification

- **File:** None (verification task)
- **Type:** Verification
- **Description:** End-to-end UI verification: (1) No vaults.json: start server, load UI -- vault selector hidden, app works as before. (2) Create vaults.json with one vault pointing to project root: reload -- vault selector shows with one entry, graph renders correctly. (3) Create a second vault (manually create directory with some .md files), add to vaults.json: reload -- selector shows both vaults, switching between them rebuilds graph with correct data. (4) Verify localStorage persistence: switch to vault 2, reload page -- vault 2 is still selected. (5) Verify images load correctly with vault parameter. (6) Verify code-analysis page types show correct colours in the graph.
- **Acceptance criteria:**
  - [ ] Legacy mode works
  - [ ] Single vault mode works
  - [ ] Multi-vault switching works
  - [ ] localStorage persistence works
  - [ ] Images resolve correctly per vault
  - [ ] New type colours appear for code-analysis types
  - [ ] Refresh works correctly within a vault context
- **Dependencies:** TASK-R022

---

## Phase 4: Root CLAUDE.md Transformation

### TASK-R024 -- Rewrite Root CLAUDE.md as Vault Management Document

- **File:** `CLAUDE.md` (project root)
- **Type:** Modify
- **Description:** Replace the entire content of the root `CLAUDE.md` with a vault-management meta-document. The new content should include: (1) Purpose section explaining that this is a multi-vault knowledge compiler, (2) Vault Concept section explaining what a vault is, (3) Vault Registry section explaining `vaults.json` schema and location, (4) Active Vault section with instruction: "For all schema, workflow, and page-type instructions, read the active vault's `CLAUDE.md`", (5) Available Templates section listing templates in `.claude/vault-templates/`, (6) Vault Creation section referencing the `create-vault` skill, (7) Skills section explaining the three-tier skill architecture (universal, vault-type-specific, vault-local), (8) Rules section with vault-level invariants (never modify raw/, always update index and log, etc.). The document should be approximately 50-80 lines. It must NOT contain any page schema, workflow instructions, tagging taxonomy, or confidence definitions.
- **Acceptance criteria:**
  - [ ] Root CLAUDE.md describes vault management only
  - [ ] Contains NO page schema (no page types, no required sections)
  - [ ] Contains NO workflow instructions (no ingest, research, newsletter steps)
  - [ ] Contains NO tagging taxonomy
  - [ ] Contains NO confidence level definitions
  - [ ] Points to active vault's CLAUDE.md for all schema instructions
  - [ ] Lists available templates (research, code-analysis) with one-line descriptions
  - [ ] Describes vaults.json schema (id, name, template, path, purpose fields)
  - [ ] Explains three-tier skill architecture: universal (`.claude/commands/`), vault-type-specific (`.claude/vault-templates/skills/<template>/`), vault-local (`<vault-root>/.claude/commands/`)
  - [ ] Instructs the LLM how to discover available templates (list `.md` files in `.claude/vault-templates/` excluding `skills/`)
  - [ ] Approximately 50-80 lines
- **Dependencies:** TASK-R008 (templates must exist first)

### TASK-R025 -- Update Universal Journal Skill for Multi-Vault Awareness

- **File:** `.claude/commands/journal.md`
- **Type:** Modify
- **Description:** Update the journal skill to be vault-type-aware. Add a preliminary step: "Read the active vault's `CLAUDE.md` to discover the page types used in this vault." Modify the frontmatter guidance so that `wiki_pages_consulted` lists use the page types relevant to the vault (e.g., `concepts/`, `entities/` for research vaults; `classes/`, `functions/` for code-analysis vaults). The core journal structure (Setup, Process, Result, What Went Well, What Could Improve) remains unchanged. Add a note that the `session_type` field should include `analyze` for code-analysis vault sessions.
- **Acceptance criteria:**
  - [ ] Skill includes step to read active vault's CLAUDE.md
  - [ ] Page type references are dynamic (not hardcoded to research types)
  - [ ] Core journal structure unchanged
  - [ ] `session_type` includes `analyze` as a valid value
  - [ ] Works correctly for both research and code-analysis vaults
- **Dependencies:** TASK-R002 (needs to know code-analysis page types)

### TASK-R025b -- Install lint.md into Template Skills Libraries

- **File:** `.claude/vault-templates/skills/research/lint.md` and `.claude/vault-templates/skills/code-analysis/lint.md`
- **Type:** New
- **Description:** Place the universal `lint.md` skill (created in TASK-R006b) into both template skill libraries so that `create-vault` can copy it into new vaults during creation. This is a copy operation — the canonical source is `.claude/commands/lint.md`. Create `.claude/vault-templates/skills/research/lint.md` and `.claude/vault-templates/skills/code-analysis/lint.md` as identical copies of `.claude/commands/lint.md`. (The `create-vault` skill also copies it from the project root; this ensures the template library is self-contained for future packaging.)
- **Acceptance criteria:**
  - [ ] `.claude/vault-templates/skills/research/lint.md` exists and matches `.claude/commands/lint.md`
  - [ ] `.claude/vault-templates/skills/code-analysis/lint.md` exists and matches `.claude/commands/lint.md`
- **Dependencies:** TASK-R006b

### TASK-R026 -- Create Initial vaults.json for Existing Wiki

- **File:** `vaults.json` (project root)
- **Type:** New
- **Description:** Create the initial `vaults.json` at the project root, registering the existing `wiki/` and `raw/` directories as the first vault. Use the project root as the vault path. Entry: `{ "id": "signal-over-noise", "name": "Signal Over Noise", "template": "research", "path": "<absolute-path-to-project-root>", "purpose": "LLM-maintained knowledge base on Signal Over Noise" }`. Since this file is gitignored and machine-specific, it must be created manually or by the create-vault skill.
- **Acceptance criteria:**
  - [ ] `vaults.json` exists at project root
  - [ ] Contains one entry for the existing wiki
  - [ ] Vault ID is `signal-over-noise`
  - [ ] Path points to the project root directory
  - [ ] Template is `research`
  - [ ] File is valid JSON
- **Dependencies:** TASK-R009 (server must be able to read it)

### TASK-R027 -- Phase 4 Verification

- **File:** None (verification task)
- **Type:** Verification
- **Description:** Verify the full multi-vault system end-to-end: (1) Root CLAUDE.md is the vault-management meta-document. (2) Server starts and loads vaults.json with signal-over-noise vault. (3) UI shows vault selector with "Signal Over Noise". (4) All existing wiki pages render correctly. (5) LLM can read the vault's CLAUDE.md and understand the research schema. (6) The create-vault skill can be invoked to create a new code-analysis vault. (7) After creating a code-analysis vault, switching to it in the UI shows an empty graph (with index.md and log.md only). (8) The journal skill works within both vault types.
- **Acceptance criteria:**
  - [ ] Existing wiki accessible as "Signal Over Noise" vault
  - [ ] Root CLAUDE.md correctly directs to vault CLAUDE.md
  - [ ] Create-vault skill produces a valid new vault
  - [ ] New vault visible in UI after page refresh
  - [ ] Vault switching works between research and code-analysis vaults
  - [ ] Journal skill adapts to vault type
- **Dependencies:** TASK-R024, TASK-R025, TASK-R026

---

## Phase 5: Testing and Polish

### TASK-R028 -- End-to-End Test: Create Code-Analysis Vault

- **File:** None (test task)
- **Type:** Verification
- **Description:** Perform a complete end-to-end test of creating a code-analysis vault: (1) Invoke `/create-vault` or ask Claude to create a vault. (2) Provide name "Knowledge Compiler Code", location as a temp directory, purpose "Analyzing the Knowledge Compiler codebase", template "code-analysis". (3) Verify directory structure is created correctly (all 7 page-type directories plus journal, images). (4) Verify CLAUDE.md is customized with the purpose. (5) Verify analyze-code.md skill is copied to vault's .claude/commands/. (6) Verify index.md and log.md are created with correct structure. (7) Verify vault is registered in vaults.json. (8) Refresh the UI and verify the new vault appears in the selector.
- **Acceptance criteria:**
  - [ ] Vault directory structure matches code-analysis template
  - [ ] CLAUDE.md Purpose section contains provided purpose
  - [ ] Skills copied correctly
  - [ ] index.md has correct table structure for code-analysis types
  - [ ] log.md has creation entry
  - [ ] vaults.json updated with new entry
  - [ ] UI shows new vault in selector
- **Dependencies:** TASK-R027

### TASK-R028b -- Verify Template Completeness Against Schema Checklist

- **File:** None (verification task)
- **Type:** Verification
- **Description:** Verify that both vault templates (research and code-analysis) contain all 10 required sections defined in Section 3.3 of the plan. For each template, confirm the presence and content of: (1) Purpose (with `<!-- CUSTOMIZE -->` comment), (2) Directory Layout, (3) File Naming, (4) Page Format (frontmatter schema), (5) Required Sections by Page Type (one entry per page type), (6) Linking Conventions, (7) Tagging Taxonomy, (8) Confidence Levels, (9) Workflows (one entry per workflow verb), (10) Rules. Any missing section is a blocking defect — the template is unusable until the section is present.
- **Acceptance criteria:**
  - [ ] `research.md` has all 10 required sections
  - [ ] `code-analysis.md` has all 10 required sections
  - [ ] Each Required Sections entry lists all mandatory H2 headings for that page type
  - [ ] Each Workflows entry includes a complete numbered step list
  - [ ] `<!-- CUSTOMIZE -->` present in Purpose of both templates
- **Dependencies:** TASK-R028

### TASK-R029 -- End-to-End Test: Analyze Code in Code-Analysis Vault

- **File:** None (test task)
- **Type:** Verification
- **Description:** Test the analyze-code skill within a code-analysis vault: (1) Switch to the code-analysis vault created in TASK-R028. (2) Invoke the analyze-code skill on a source file (e.g., `src/server/index.js`). (3) Verify wiki pages are created for identified elements (functions like `discoverFiles`, API endpoints like `GET /api/wiki/files`). (4) Verify pages have correct required sections. (5) Verify cross-links between pages. (6) Verify index.md and log.md are updated. (7) Verify the UI graph shows the new pages with correct type colours.
- **Acceptance criteria:**
  - [ ] analyze-code skill runs successfully
  - [ ] Wiki pages created for identified code elements
  - [ ] Pages have correct frontmatter and required sections
  - [ ] Cross-links are present
  - [ ] index.md and log.md updated
  - [ ] UI graph renders code-analysis pages with correct colours
- **Dependencies:** TASK-R028

### TASK-R030 -- Edge Case Test: Legacy Mode

- **File:** None (test task)
- **Type:** Verification
- **Description:** Delete or rename `vaults.json` and verify the application works in legacy mode: (1) Server starts without errors. (2) `GET /api/vaults` returns `[]`. (3) UI hides vault selector. (4) All existing functionality works (graph, content, search, filter, navigation, upload, refresh). (5) LLM workflows work using root-level CLAUDE.md guidance.
- **Acceptance criteria:**
  - [ ] Server starts without errors
  - [ ] No vault selector visible
  - [ ] All features functional
  - [ ] No console errors related to missing vaults
- **Dependencies:** TASK-R027

### TASK-R031 -- Edge Case Test: Vault Directory Missing

- **File:** None (test task)
- **Type:** Verification
- **Description:** Add a vault entry to vaults.json pointing to a non-existent directory. Verify: (1) Server starts without errors. (2) `GET /api/vaults` returns the vault in the list. (3) Switching to the vault in the UI shows the empty-wiki message. (4) Other vaults continue to work normally.
- **Acceptance criteria:**
  - [ ] Server does not crash
  - [ ] Missing vault shows empty-wiki message
  - [ ] Other vaults unaffected
  - [ ] Appropriate error logged to server console
- **Dependencies:** TASK-R027

### TASK-R032 -- Edge Case Test: Malformed vaults.json

- **File:** None (test task)
- **Type:** Verification
- **Description:** Replace vaults.json with invalid JSON. Verify: (1) Server starts without errors. (2) `GET /api/vaults` returns `[]`. (3) Warning logged to server console. (4) UI works in legacy mode.
- **Acceptance criteria:**
  - [ ] Server does not crash
  - [ ] Graceful fallback to legacy mode
  - [ ] Warning logged
- **Dependencies:** TASK-R027

### TASK-R033 -- Documentation Update: README.md

- **File:** `README.md`
- **Type:** Modify
- **Description:** Update the README.md to document multi-vault support: (1) Add a "Vaults" section explaining the concept. (2) Document `vaults.json` setup (copy from `vaults.example.json`, edit paths). (3) Document available templates (research, code-analysis). (4) Document the create-vault skill. (5) Document the vault selector UI. (6) Update the "Getting Started" section to mention vault setup.
- **Acceptance criteria:**
  - [ ] Vaults concept explained
  - [ ] vaults.json setup documented
  - [ ] Templates documented
  - [ ] create-vault skill documented
  - [ ] Vault selector documented
- **Dependencies:** TASK-R027

---
