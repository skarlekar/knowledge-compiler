# Page Content Export — Task Breakdown

**Document ID:** TASKS-PAGEEXPORT-001
**Version:** 1.1
**Date:** 2026-04-18
**Plan Reference:** PLAN-PAGEEXPORT-001

---

## Phase 1: Server-Side Export Endpoint

### TASK-PE001: Add `marked` server-side dependency

**File:** `src/package.json`
**Type:** Dependency
**Description:** Add the `marked` npm package as a production dependency for server-side markdown-to-HTML conversion. Pin to the same major version as the bundled client copy in `src/public/lib/marked.min.js`.

**Acceptance Criteria:**
- [ ] Check version header in `src/public/lib/marked.min.js` to determine the bundled version
- [ ] Run `npm install marked@<matching-major>` in `src/`
- [ ] Verify `marked` appears in `package.json` dependencies
- [ ] Verify `import { marked } from 'marked';` loads without error in a Node.js context

**Dependencies:** None
**Parallelization:** Can run in parallel with TASK-PE005

---

### TASK-PE002: Add export helper functions

**File:** `src/server/index.js`
**Type:** Backend logic
**Description:** Implement five helper functions for page content export.

**Functions:**

1. **`stripFrontmatter(rawContent)`**
   - Detects leading `---` fence, finds closing `---`
   - Parses YAML frontmatter to extract `title` field
   - Returns `{ title: string|null, body: string }`
   - If no frontmatter detected, returns `{ title: null, body: rawContent }`

2. **`resolveLinksForExport(markdown)`**
   - Extracts fenced code blocks and inline code spans, replacing them with placeholders
   - Applies regex `/\[([^\]]*)\]\(([^)]+)\)/g` on remaining text
   - For each match: extract the target URL (strip optional `"title"` suffix first — e.g., `page.md "tooltip"` → `page.md`); if target starts with `http://` or `https://` or `#` → keep; if target ends with `.md` → replace with link text; otherwise → keep
   - Handles reference-style links: `[text][ref-id]` with `[ref-id]: target` definitions. If target is internal (`.md`), replace usage with text and remove definition line. If external, keep both.
   - Reinserts code blocks and inline code spans
   - Returns processed markdown string

3. **`buildExportFilename(title, wikiPath, format)`**
   - If `title` exists: lowercase, replace non-alphanumeric with hyphens, collapse consecutive hyphens, trim leading/trailing hyphens
   - If no `title`: use wiki filename stem (e.g., `newsletter-llm-wiki-2026-04-13`)
   - Append `.md` or `.html` based on format
   - Returns filename string

4. **`resolveHtmlLinksForExport(html)`**
   - Safety pass on the HTML string after `marked.parse()` converts markdown to HTML
   - Finds all `<a href="...">` elements via regex or DOM parsing
   - If `href` starts with `http://` or `https://` → add `target="_blank" rel="noopener noreferrer"`, keep the element
   - If `href` starts with `#` → keep unchanged (anchor link)
   - If `href` ends with `.md` → replace entire `<a>` element with its inner text/HTML content
   - Otherwise → keep unchanged
   - Returns processed HTML string

5. **`wrapInHtmlDocument(htmlBody, title)`**
   - Returns a complete `<!DOCTYPE html>` string with:
     - `<meta charset="UTF-8">`
     - `<title>` from title parameter
     - Inline `<style>` block with minimal typography: body font, heading sizes, max-width 800px container, blockquote styling, table borders, code background, link color
     - `<main>` wrapper with the htmlBody content
     - An HTML comment before `<main>`: `<!-- Images use relative paths from the wiki. Upload them separately to your publishing platform. -->`
   - No external dependencies, no JavaScript, no Knowledge Compiler branding

**Acceptance Criteria:**
- [ ] `stripFrontmatter` correctly parses standard YAML frontmatter with `---` fences
- [ ] `stripFrontmatter` returns full content as body when no frontmatter present
- [ ] `resolveLinksForExport` replaces `[text](page.md)` with `text`
- [ ] `resolveLinksForExport` replaces `[text](../concepts/page.md)` with `text`
- [ ] `resolveLinksForExport` preserves `[text](https://example.com)`
- [ ] `resolveLinksForExport` preserves `[text](#anchor)`
- [ ] `resolveLinksForExport` does not modify links inside fenced code blocks
- [ ] `resolveLinksForExport` does not modify links inside inline code spans
- [ ] `resolveLinksForExport` handles nested formatting: `[**bold** text](page.md)` → `**bold** text`
- [ ] `resolveLinksForExport` removes empty links: `[](page.md)` → (empty string)
- [ ] `resolveLinksForExport` handles image inside link: `[![alt](img.png)](page.md)` → `![alt](img.png)`
- [ ] `resolveLinksForExport` handles link with title: `[text](page.md "tooltip")` → `text` (regex must account for optional title after `.md`)
- [ ] `resolveLinksForExport` handles encoded URLs: `[text](my%20page.md)` → `text`
- [ ] `resolveLinksForExport` handles broken internal links (non-existent target) the same as valid ones — no existence check
- [ ] `resolveLinksForExport` handles reference-style links with internal targets: `[text][ref]` with `[ref]: page.md` → `text` (definition line removed)
- [ ] `resolveLinksForExport` preserves reference-style links with external targets
- [ ] `resolveLinksForExport` preserves Mermaid fenced code blocks unchanged
- [ ] `resolveLinksForExport` preserves image references (`![alt](path)`) unchanged
- [ ] `resolveHtmlLinksForExport` strips `<a href="page.md">text</a>` to `text` in HTML
- [ ] `resolveHtmlLinksForExport` adds `target="_blank" rel="noopener noreferrer"` to external `<a>` elements
- [ ] `resolveHtmlLinksForExport` preserves anchor (`#`) links unchanged
- [ ] `buildExportFilename` generates valid slug from title with special characters
- [ ] `buildExportFilename` falls back to wiki filename when title is null
- [ ] `wrapInHtmlDocument` produces valid HTML5 document
- [ ] `wrapInHtmlDocument` includes HTML comment about image uploads
- [ ] `wrapInHtmlDocument` renders Mermaid source as `<pre><code>` blocks (not rendered SVG)

**Dependencies:** TASK-PE001
**Parallelization:** Sequential after PE001

---

### TASK-PE003: Implement `GET /api/wiki/page/export` endpoint

**File:** `src/server/index.js`
**Type:** API endpoint
**Description:** Add a new endpoint for exporting individual wiki page content with resolved links.

**Endpoint:** `GET /api/wiki/page/export`

**Query Parameters:**
- `path` (required) — wiki-relative file path
- `vault` (optional) — vault ID
- `format` (required) — `md` or `html`

**Handler Flow:**
1. Validate `path` and `format` parameters (400 if missing/invalid)
2. Resolve vault root via `resolveVaultRoot(req.query.vault)`
3. Path-traversal prevention: resolved path must start with `wikiDir + path.sep`
4. Read raw file content from `wiki/<path>`
5. Strip frontmatter via `stripFrontmatter()`
6. Resolve links via `resolveLinksForExport()`
7. Build filename via `buildExportFilename()`
8. If `format=md`:
   - Set `Content-Type: text/markdown; charset=utf-8`
   - Set `Content-Disposition: attachment; filename="<slug>.md"`
   - Send processed markdown body
9. If `format=html`:
   - Parse markdown with `marked.parse()` (GFM enabled)
   - Run `resolveHtmlLinksForExport()` safety pass on the HTML (strips any remaining internal `<a>` tags, adds `target="_blank" rel="noopener noreferrer"` to external links)
   - Wrap with `wrapInHtmlDocument()`
   - Set `Content-Type: text/html; charset=utf-8`
   - Set `Content-Disposition: attachment; filename="<slug>.html"`
   - Send HTML document
10. Catch errors → 500 with message

**Placement:** After the existing `GET /api/wiki/file` endpoint (after line 1062 in current file).

**Acceptance Criteria:**
- [ ] `GET /api/wiki/page/export?path=index.md&format=md` returns 200 with markdown content
- [ ] `GET /api/wiki/page/export?path=index.md&format=html` returns 200 with HTML document
- [ ] Response includes correct `Content-Disposition` header with filename
- [ ] Internal `.md` links in response body are resolved to plain text
- [ ] External `https://` links in response body are preserved as hyperlinks
- [ ] YAML frontmatter is not present in the response body
- [ ] Missing `path` → 400
- [ ] Missing `format` → 400
- [ ] Invalid `format` (e.g., `pdf`) → 400
- [ ] Non-existent file → 404
- [ ] Path traversal attempt (`../../etc/passwd`) → 403
- [ ] Unknown vault → 404

**Dependencies:** TASK-PE002
**Parallelization:** Sequential after PE002

---

### TASK-PE004: Verify endpoint via curl

**Type:** Testing
**Description:** Test the export endpoint with curl commands against a running server.

**Test Cases:**

1. **Markdown export of a newsletter:**
   ```
   curl -s -D- "http://127.0.0.1:3000/api/wiki/page/export?path=newsletters/<file>.md&vault=signal-over-noise&format=md"
   ```
   Verify: 200 status, `Content-Type: text/markdown`, no frontmatter, internal links resolved, external links preserved.

2. **HTML export of a newsletter:**
   ```
   curl -s -D- "http://127.0.0.1:3000/api/wiki/page/export?path=newsletters/<file>.md&vault=signal-over-noise&format=html"
   ```
   Verify: 200 status, `Content-Type: text/html`, valid HTML5 document, `<style>` block present, internal links resolved, external links as `<a>` elements.

3. **Link resolution spot-check:**
   Pipe the markdown export through grep — confirm no `.md)` patterns remain (except in code blocks), confirm `https://` links are present.

4. **Error cases:** Missing path (400), invalid format (400), non-existent file (404), path traversal (403), unknown vault (404), server error (500).

**Acceptance Criteria:**
- [ ] All 4 test cases pass
- [ ] Markdown export of a newsletter with known internal links produces clean text without `.md` references
- [ ] HTML export opens correctly in a browser

**Dependencies:** TASK-PE003
**Parallelization:** Sequential after PE003

---

## Phase 2: Frontend UI

### TASK-PE005: Add `.meta-export-*` CSS styles

**File:** `src/public/css/styles.css`
**Type:** Styling
**Description:** Add styles for the page export button and dropdown in the metadata bar.

**Styles to add (in the metadata bar section, after existing `.meta-info` styles):**

- `.meta-export` — relative position container, `margin-left: auto`
- `.meta-export-btn` — small button matching toolbar aesthetic: `padding: 4px 10px`, `font-size: 12px`, `border: 1px solid #ccc`, `border-radius: 4px`, `background: #f5f5f5`, hover state
- `.meta-export-dropdown` — absolute positioned dropdown: `top: 100%`, `right: 0`, `z-index: 100`, white background, border, shadow, `min-width: 140px`
- `.meta-export-option` — full-width option buttons: `padding: 8px 14px`, hover highlight `background: #f0f4ff`
- `.meta-export-dropdown.hidden` — `display: none`

**Acceptance Criteria:**
- [ ] Button is visually consistent with toolbar buttons (smaller scale for metadata bar)
- [ ] Dropdown appears below and right-aligned to the button
- [ ] Dropdown has shadow and border for visual separation
- [ ] Hover states provide clear interactive feedback
- [ ] Hidden class correctly hides the dropdown

**Dependencies:** None
**Parallelization:** Can run in parallel with Phase 1 (TASK-PE001 through PE004)

---

### TASK-PE006: Add export button to `renderMetadataBar()`

**File:** `src/public/js/content.js`
**Type:** Frontend logic
**Description:** Modify the `renderMetadataBar(node)` function to include an export button with a format dropdown at the right end of the metadata bar.

**Changes to `renderMetadataBar()`:**
1. After the existing metadata content (title, badge, tags, info), append an export button container
2. The container includes the trigger button and a hidden dropdown with two options (Markdown, HTML)
3. Do not render the export button if the node has an error

**HTML to generate (appended to the metadata bar):**
```html
<div class="meta-export">
  <button id="btn-page-export" class="meta-export-btn"
          title="Export page content" aria-haspopup="true" aria-expanded="false">
    ↓ Export ▾
  </button>
  <div id="page-export-dropdown" class="meta-export-dropdown hidden" role="menu">
    <button class="meta-export-option" data-format="md" role="menuitem">↓ Markdown</button>
    <button class="meta-export-option" data-format="html" role="menuitem">↓ HTML</button>
  </div>
</div>
```

**Metadata bar layout:** The existing metadata bar uses inline elements. Add `display: flex; align-items: center` to `.metadata-bar` (if not already set) so the export button can be pushed to the right via `margin-left: auto` on `.meta-export`.

**Acceptance Criteria:**
- [ ] Export button appears in the metadata bar for every page
- [ ] Export button does not appear when a node has an error
- [ ] Export button does not appear when no node is active
- [ ] Dropdown is hidden by default
- [ ] Button uses the consistent thin arrow icon (↓) matching toolbar style
- [ ] Button has `aria-haspopup="true"` and `aria-expanded="false"` attributes
- [ ] Dropdown container has `role="menu"`
- [ ] Each format option has `role="menuitem"`

**Dependencies:** TASK-PE003, TASK-PE005
**Parallelization:** Sequential after PE003 and PE005

---

### TASK-PE007: Add dropdown interaction and download logic

**File:** `src/public/js/content.js`
**Type:** Frontend logic
**Description:** Wire up the export dropdown toggle, format selection, API call, and file download.

**Logic to implement:**

1. **Toggle dropdown:** Click `#btn-page-export` → toggle `hidden` on `#page-export-dropdown`, update `aria-expanded`
2. **Close on outside click:** Document-level click listener (added when dropdown opens, removed when closed) that closes dropdown if click target is outside `.meta-export`
3. **Close on Escape:** Keydown listener for Escape while dropdown is open
4. **Format selection:** Click `.meta-export-option` →
   a. Close dropdown
   b. Read `data-format` attribute (`md` or `html`)
   c. Fetch `GET /api/wiki/page/export?path=${activeNodeId}&vault=${activeVaultId}&format=${format}`
   d. On error response: show error toast
   e. On success: extract filename from `Content-Disposition` header, convert response to blob, create temporary `<a download>` element, trigger click, clean up
   f. Show success toast: "Exported {filename}"

**Note:** `activeNodeId` is available in `content.js` as `_currentRenderNode`. `activeVaultId` is available as `_activeVaultId`. Both are set during `ContentRenderer.init()` and `render()`.

**Acceptance Criteria:**
- [ ] Clicking the export button toggles the dropdown
- [ ] Clicking outside the dropdown closes it
- [ ] Pressing Escape closes the dropdown
- [ ] Selecting "Markdown" triggers download of a `.md` file
- [ ] Selecting "HTML" triggers download of a `.html` file
- [ ] Downloaded filename matches the page title slug
- [ ] Success toast appears after download
- [ ] Error toast appears if the API returns an error
- [ ] The dropdown re-attaches correctly after navigating to a different page (since `renderMetadataBar()` rebuilds the bar)
- [ ] Enter and Space keys toggle the dropdown when the button is focused
- [ ] Arrow keys navigate between menu options

**Dependencies:** TASK-PE006
**Parallelization:** Sequential after PE006

---

## Phase 3: Testing

### TASK-PE008: End-to-end browser testing

**Type:** Testing
**Description:** Verify the complete page export feature in the browser using Playwright.

**Test Scenarios:**

1. **Navigate to a newsletter page** → verify the export button appears in the metadata bar
2. **Click export button** → verify dropdown appears with Markdown and HTML options
3. **Export as Markdown:**
   - Click "Markdown" option
   - Verify file downloads with `.md` extension
   - Open downloaded file and verify:
     - No YAML frontmatter present
     - Internal wiki links resolved to plain text (no `.md)` patterns outside code blocks)
     - External links preserved as `[text](https://...)`
     - Content is clean, publishable markdown
4. **Export as HTML:**
   - Click "HTML" option
   - Verify file downloads with `.html` extension
   - Open downloaded file in browser and verify:
     - Valid HTML page renders with styled content
     - No internal wiki links present
     - External links are clickable and open correctly
     - Page title appears in browser tab
5. **Navigate to a different page type** (concept, entity) → verify export button works for non-newsletter pages
6. **Click outside dropdown** → verify it closes
7. **Press Escape** → verify dropdown closes

**Acceptance Criteria:**
- [ ] All 7 test scenarios pass
- [ ] Exported newsletter markdown can be pasted into a publishing platform preview without broken links
- [ ] Exported newsletter HTML opens as a standalone readable page in a browser

**Dependencies:** TASK-PE004, TASK-PE007
**Parallelization:** Sequential after PE004 and PE007

---

## Dependency Graph

```
TASK-PE001 ──► TASK-PE002 ──► TASK-PE003 ──► TASK-PE004
                                    │                │
               TASK-PE005 ──────────┤                │
                                    ▼                │
                              TASK-PE006             │
                                    │                │
                                    ▼                │
                              TASK-PE007             │
                                    │                │
                                    ▼                ▼
                              TASK-PE008 ◄───────────┘
```

## Parallelization Summary

| Phase | Tasks | Can Parallelize |
|-------|-------|-----------------|
| Phase 1 | PE001 → PE002 → PE003 → PE004 | PE001 and PE005 can run in parallel |
| Phase 2 | PE005 → PE006 → PE007 | PE005 can start during Phase 1 |
| Phase 3 | PE008 | Must wait for all others |
