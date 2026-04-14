# lint

Perform a wiki health check. Reads the active vault's `CLAUDE.md` to determine the vault type, then runs vault-type-appropriate checks. Auto-fixes what it can. Reports issues requiring human judgment.

## Arguments

None (operates on the entire wiki).

## Steps

### 1 — Determine vault type

Read the active vault's `CLAUDE.md` (look for it at the vault root — the directory containing `wiki/` and `raw/`).

Determine the vault type by inspecting the Directory Layout section:
- If `wiki/concepts/` and `wiki/entities/` appear → **research** vault
- If `wiki/classes/` and `wiki/functions/` appear → **code-analysis** vault

### 2 — Read all wiki pages

Read every page listed in `wiki/index.md`. Also read `wiki/index.md` and `wiki/log.md` themselves.

### 3 — Run checks

Run the appropriate checks for the vault type:

---

**Research vault checks:**

**Orphan pages** — pages with no inbound links from any other wiki page
- Fix: add a link from the most closely related page's Related Concepts/Entities section

**Missing cross-links** — a page body mentions a concept or entity by name that has a wiki page, but does not link to it
- Fix: add the missing link inline

**Contradictions** — two pages make conflicting claims about the same topic
- Cannot auto-fix: report to user with specific page names and contradicting claims

**Stale claims** — claims marked as `confidence: low` that could potentially be upgraded based on other pages
- Cannot auto-fix: flag for human review with suggested upgrade if warranted

**Incomplete sections** — required sections are empty or contain only placeholder text (e.g., "TBD", "TODO", "N/A" without explanation)
- Cannot auto-fix: report the section and page

**Missing index entries** — wiki files that exist on disk but are not listed in `wiki/index.md`
- Fix: add the missing entry to `wiki/index.md`

---

**Code-analysis vault checks:**

**Orphan pages** — pages with no inbound links from any other wiki page
- Fix: add a link from the most closely related module or class page

**Missing cross-links** — a page body mentions a class, function, or library by name that has a wiki page, but does not link to it
- Fix: add the missing link inline

**Stale source_files references** — a page's `source_files` frontmatter lists a file path that no longer exists in the codebase
- Check with Glob/Bash: `ls "<source_file_path>" 2>&1`
- Cannot auto-fix: report the stale path and the page — the file may have been renamed, moved, or deleted

**Broken file:line references** — Where Found, Calls, Called By sections cite `file.js:NNN`; use Bash to verify the file exists and has at least N lines
- Cannot auto-fix: report for human review (file may have been refactored)

**Incomplete sections** — required sections are empty or contain only placeholder text
- Cannot auto-fix: report the section and page

**Modules without dependency links** — module pages where both Internal Dependencies and External Dependencies sections are empty despite the source file clearly importing other modules
- Cannot auto-fix: flag for human review

**Missing index entries** — wiki files that exist on disk but are not listed in `wiki/index.md`
- Fix: add the missing entry

---

### 4 — Apply auto-fixes

For each fixable issue found in Step 3:
- Apply the fix using Edit
- Record the fix in a running list

### 5 — Report human-judgment issues

After applying auto-fixes, report all issues that require human review:

```
## Lint Report — YYYY-MM-DD

### Auto-fixes applied (N)
- [Page] — [what was fixed]

### Issues requiring human judgment (N)
- [Page] — [issue type] — [specific description]

### No issues found
- [category if clean]
```

### 6 — Update log

Append to `wiki/log.md`:

```
### YYYY-MM-DD — Lint: Full Wiki Health Check

- **Pages reviewed**: N total
- **Auto-fixes applied**: N (list)
- **Issues requiring human judgment**: N (list)
- **Contradictions found**: N
- **Stale references**: N
```

### 7 — Invoke journal skill

```
Skill({ skill: "journal", args: "lint" })
```
