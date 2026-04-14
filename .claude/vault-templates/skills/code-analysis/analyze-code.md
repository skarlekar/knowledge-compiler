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

### 2 — Read all source files

If the argument is a single file, read it with the Read tool.

If the argument is a directory, use Glob to discover all source files recursively:

```
**/*.js, **/*.ts, **/*.py, **/*.java, **/*.go, **/*.rs
```

Read each file. For very large directories (50+ files), process the most significant files first (entry points, main modules) and note which files were deferred.

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

Add new pages to the appropriate sections. Update the Statistics section counts.

**B. Append to `wiki/log.md`:**

```
### YYYY-MM-DD HH:MM — Analyze: <path>

- **Source analyzed**: `<path>`
- **Pages created**: list of new pages
- **Pages updated**: list of updated pages
- **Notes**: patterns found, anti-patterns flagged, files deferred
```

### 9 — Invoke journal skill

```
Skill({ skill: "journal", args: "analyze: <path>" })
```

### 10 — Report

Tell the user:
- How many files were analyzed
- How many pages were created vs updated
- Any anti-patterns flagged (with file:line references)
- Any files that were deferred due to size
