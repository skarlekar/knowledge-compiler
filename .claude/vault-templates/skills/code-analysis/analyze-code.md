# analyze-code

Analyze source code files or directories and populate the code-analysis vault's wiki with structured pages for classes, functions, API endpoints, libraries, patterns, and modules.

## Arguments

Path to file or directory: (e.g., `src/server/index.js` or `src/`)

## Steps

### 1 — Verify the path exists

Use Glob or Bash to verify the provided path exists.

```bash
ls "<path>" 2>&1
```

If the path does not exist, stop and report: "Path not found: `<path>`. Provide a valid file or directory path relative to the vault's root."

### 2 — Discover, classify, and read every source file

Single-file argument: read it with the Read tool and skip to Step 3.

Directory argument: run **four phased passes**. Each pass must complete (and its result reported to the user) before the next begins. Do **not** collapse this into a single read-as-you-go loop — that is the failure mode that causes the model to read 10 files and call it done.

#### 2a — Detect the framework / project type

Read whichever of these exist at `<path>` (or its nearest parent): `composer.json`, `package.json`, `Gemfile`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `*.csproj`, `Podfile`. Use them to infer the project type:

| Signal | Framework |
| --- | --- |
| `composer.json` mentions `drupal/core`, OR any `*.info.yml` / `*.module` files exist | **Drupal** |
| `composer.json` mentions `symfony/symfony` | **Symfony** |
| `Gemfile` mentions `rails` | **Rails** |
| `requirements.txt` / `pyproject.toml` mentions `django` | **Django** |
| `package.json` mentions `next` | **Next.js** |
| `package.json` mentions `express` | **Express** |
| (none of the above) | **Generic** |

Tell the user the detected framework before continuing. If it conflicts with the user's expectation, stop and ask.

#### 2b — Enumerate every candidate source file (Pass 1)

Run a single discovery pass with the **default extension list** below, plus framework-specific extensions where relevant. Use Bash + `find` (more reliable than Glob for large trees):

**Default extensions (always included):** `.js .jsx .ts .tsx .mjs .cjs .py .java .go .rs .rb .php .cs .kt .swift .scala .cpp .c .h .hpp .yml .yaml .toml`

**Framework-specific additions:**

- **Drupal:** `.module .inc .install .theme .profile .engine .twig` and Drupal config files (`*.info.yml`, `*.routing.yml`, `*.services.yml`, `*.libraries.yml`, `*.permissions.yml`, `*.menu.yml`, `*.links.*.yml`)
- **Rails:** `.erb .rake .ru`
- **Django:** `.html` (templates)
- **Next.js / Express:** `.mdx`

Example enumeration command (adjust extensions to the framework):

```bash
find <path> -type f \( \
  -name '*.php' -o -name '*.module' -o -name '*.inc' -o -name '*.install' \
  -o -name '*.theme' -o -name '*.profile' -o -name '*.engine' -o -name '*.twig' \
  -o -name '*.yml' -o -name '*.yaml' \
\) | wc -l
```

Then list the files:

```bash
find <path> -type f \( <same -name args> \) | sort
```

Report the **total count** to the user (`Files discovered: N`).

#### 2c — Classify every file (Pass 2)

Place each discovered file into exactly one bucket:

- **`exclude`** — third-party / generated / vendored. Default exclusions (apply unless the user says otherwise):
  - Always: `node_modules/`, `vendor/`, `.git/`, `dist/`, `build/`, `target/`, `__pycache__/`, `.venv/`, `*.min.js`, `*.lock`, `*.map`
  - **Drupal:** also `core/`, `web/core/`, `docroot/core/`, `web/sites/default/files/`, `web/sites/*/files/`
  - **Rails:** also `tmp/`, `log/`, `public/assets/`
  - **Django:** also `migrations/` (unless the user explicitly says include)
  - **Next.js:** also `.next/`
- **`defer`** — files the run will not analyze in this pass (e.g., over a soft cap, generated config, or out-of-scope subtrees). Each deferred file must be named individually — "deferred 200 files" is not allowed.
- **`analyze`** — everything else. **Every file in this bucket must be read in Pass 3.**

Report the breakdown to the user before reading anything:

```text
Coverage plan:
  Total discovered: N
  To analyze:       N_a
  To defer:         N_d  (listed below)
  To exclude:       N_e  (matched: vendor/, core/, ...)

Deferred files:
  - path/to/file1.module
  - path/to/file2.php
  ...
```

Pause here if the user wants to adjust the exclusion list or the deferral policy.

#### 2d — Read every file in the `analyze` bucket (Pass 3)

Read every file in the `analyze` bucket. Do not stop early. Track read files in a running list so Step 8b can verify coverage.

Reading order may be prioritised (entry points, controllers, routes first), but every file in the bucket must eventually be read. Soft cap: if the bucket is over 200 files and reading them all is genuinely infeasible in one session, move the lowest-priority files to `defer` (with an explicit user-visible note) — never silently truncate.

#### 2e — Persist deferrals (Pass 4)

If any file ended up in the `defer` bucket:

1. Append a `## Deferred Files` section to `wiki/index.md` (or refresh the existing one) listing each deferred file with a one-line reason.
2. Include the same list in the `wiki/log.md` entry for this run (Step 8B).
3. Surface it in the user-facing report (Step 11).

### 3 — Identify code elements

For each file, identify:

- **Classes** — class definitions, constructor functions used as classes, TypeScript interfaces used as data shapes
- **Functions** — exported functions, significant named functions (10+ lines or with complex logic), middleware handlers, route handlers
- **API endpoints** — Express/FastAPI/Flask routes, gRPC handlers, GraphQL resolvers — any HTTP endpoint definition
- **Imported libraries** — every `import`, `require`, `from ... import` statement referencing a third-party package
- **Design patterns** — middleware pattern, factory, singleton, observer, repository, strategy, decorator, etc.
- **Anti-patterns** — deeply nested callbacks, god objects (classes with 20+ methods), magic strings, raw SQL in business logic, etc.
- **Module boundaries** — the file's own exports and its imported modules

### 4 — Create or update wiki pages

For each identified element, check `wiki/index.md` to see if a page already exists.

**If it does not exist:** create the page in the appropriate directory with all required sections populated.

**If it does exist:** read the existing page, then update it with new information. Do not overwrite information that is still accurate — add to it.

Set frontmatter:

- `source_files`: list the analyzed file(s) with relative paths from vault root
- `language`: the file's language
- `confidence`: `high` if source directly read; `medium` if inferred from partial context; `low` if based on naming/comments only

Record file:line references as `filename.js:NNN` (not full paths) in Where Used, Calls, Called By sections.

### 5 — Create library pages

For each unique third-party import identified across all files:

- Check if a library page already exists
- If not, create `wiki/libraries/<library-slug>.md`
- Populate: Purpose (what it does), Version Pinned (check package.json/requirements.txt), Key APIs Used (which functions/methods the codebase actually uses), Why Chosen (write "Not documented" if unknown), Alternatives Considered (write "Unknown" if not documented)

### 6 — Identify and record patterns and anti-patterns

For each design pattern or anti-pattern identified:

- Check if a page exists in `wiki/patterns/` or `wiki/anti-patterns/`
- If not, create the page
- If it exists, add the new `Where Used` location to the existing page
- For anti-patterns, add a `Recommended Refactor` note if a clear fix is apparent

### 7 — Cross-link all touched pages

After creating/updating all pages:

- Each class page should link to its library dependencies, patterns it implements, and related classes
- Each function page should link to classes it belongs to (via Called By / Calls)
- Each API page should link to related endpoints
- Each module page should link to its internal and external dependencies
- Add back-links: if Class A links to Class B, ensure Class B's Related Classes section links back to Class A

### 8 — Update index and log

**A. Update `wiki/index.md`:**

Add new pages to the appropriate sections. Update the Statistics section counts. If any files were deferred in Step 2e, ensure the `## Deferred Files` section is present.

**B. Append to `wiki/log.md`:**

```text
### YYYY-MM-DD HH:MM — Analyze: <path>

- **Source analyzed**: `<path>`
- **Framework detected**: <Drupal | Generic | ...>
- **Files discovered**: N
- **Files analyzed**: N_a
- **Files deferred**: N_d (list)
- **Files excluded**: N_e (categories: vendor, core, ...)
- **Pages created**: list of new pages
- **Pages updated**: list of updated pages
- **Notes**: patterns found, anti-patterns flagged
```

### 8b — REQUIRED: verify coverage

The analyze run is **not** complete until every file in the `analyze` bucket from Step 2c is referenced in at least one wiki page's `source_files` frontmatter. Without this check, files can silently fall through the cracks.

```bash
# Build the set of files actually referenced in any wiki page
grep -rh "^source_files:" wiki/ | sed 's/source_files://; s/[][]//g; s/,/\n/g; s/"//g' | tr -d ' ' | sort -u > /tmp/analyzed_files.txt

# Compare against the analyze bucket from Step 2c
comm -23 <(printf '%s\n' "<analyze-bucket files>" | sort -u) /tmp/analyzed_files.txt
```

Every file emitted by `comm` is a coverage gap. For each gap:

1. If the file should have been analyzed: read it now, create/update the appropriate wiki pages, re-link, and re-run this verify step.
2. If the file is genuinely out of scope: explicitly move it to the `defer` bucket, document the reason in `## Deferred Files`, and re-run this verify step.

Do not proceed to Step 9 while any gap remains.

### 9 — Invoke journal skill

```javascript
Skill({ skill: "journal", args: "analyze: <path>" })
```

### 10 — REQUIRED: refresh the deep-dive document

The analyze run is **not complete** until the technical deep-dive has been regenerated. Do not skip this step, do not stop, and do not report results to the user before this step finishes.

Invoke the `document-project` skill:

```javascript
Skill({ skill: "document-project" })
```

### 10b — REQUIRED: verify the deep-dive was written AND indexed

After `document-project` returns, verify both the file and its index entry. The deep-dive page is invisible to the wiki UI without the index entry — checking only the file is not enough.

```bash
ls -la wiki/deep-dive/technical-deep-dive.md && \
grep -n "## Deep Dive" wiki/index.md && \
grep -n "deep-dive/technical-deep-dive.md" wiki/index.md && \
grep -n "| Deep Dive |" wiki/index.md
```

All four checks must pass:

1. The deep-dive file exists with an mtime from the current session.
2. `wiki/index.md` has a `## Deep Dive` section heading.
3. `wiki/index.md` links to `deep-dive/technical-deep-dive.md`.
4. `wiki/index.md`'s Statistics table has a `Deep Dive` row.

If any check fails, re-invoke `document-project` once. If still failing, report the specific gap to the user (e.g., "deep-dive file written but index `## Deep Dive` section missing") — do not silently move on.

### 11 — Report

Only after Steps 8b, 10, and 10b have completed, tell the user:

- **Coverage**: `Files discovered: N`, `analyzed: N_a`, `deferred: N_d`, `excluded: N_e`. If `N_a + N_d + N_e ≠ N`, that is a bug — investigate before reporting.
- **Framework detected**: <Drupal | Generic | ...>
- How many pages were created vs updated
- Any anti-patterns flagged (with file:line references)
- Deferred files (named individually, not just a count)
- Confirm the deep-dive was regenerated (`wiki/deep-dive/technical-deep-dive.md`, modified at HH:MM)
