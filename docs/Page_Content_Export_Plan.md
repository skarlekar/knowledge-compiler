# Page Content Export — Implementation Plan

**Document ID:** PLAN-PAGEEXPORT-001
**Version:** 1.1
**Date:** 2026-04-18
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Design Decisions](#3-design-decisions)
4. [Link Resolution Specification](#4-link-resolution-specification)
5. [Server Specification](#5-server-specification)
6. [UI Specification](#6-ui-specification)
7. [CSS Specification](#7-css-specification)
8. [File Changes](#8-file-changes)
9. [Implementation Phases](#9-implementation-phases)
10. [Risks and Mitigations](#10-risks-and-mitigations)

---

## 1. Executive Summary

The Knowledge Compiler renders wiki pages in a content panel with interactive internal links and styled external links. Users — especially those writing newsletters — need to export individual page content as **Markdown** or **HTML** suitable for publishing on external sites (blogs, Substack, Ghost, Medium, etc.).

The core challenge is **link resolution**: internal wiki links (`[Concept](../concepts/harness-engineering.md)`) are meaningful only inside the Knowledge Compiler. When exporting, these must be resolved to **plain text** (the link label only), while external links (`[Neo4j](https://neo4j.com)`) must be preserved as working hyperlinks.

This feature adds:

- A **page export button** in the content panel's metadata bar
- A **format dropdown** (Markdown or HTML)
- **Server-side link resolution** that strips internal links to plain text and preserves external links
- **Frontmatter stripping** so the exported content is clean, publishable prose

The implementation is entirely client-server — no new dependencies required.

---

## 2. Architecture Overview

### 2.1 Export Flow

```
User clicks export button on content panel
        │
        ▼
Dropdown appears: Markdown | HTML
        │
        ▼
User selects format
        │
        ▼
Frontend sends GET /api/wiki/page/export
  ?path=<wiki-path>&vault=<vaultId>&format=md|html
        │
        ▼
Server reads raw markdown file from wiki/
        │
        ▼
Server strips YAML frontmatter
        │
        ▼
Server resolves links:
  ├─ Internal (.md links) → plain text (link label only)
  └─ External (http/https) → preserved as-is
        │
        ▼
If format=md: return processed markdown as text/markdown
If format=html: parse markdown → HTML, return as text/html
        │
        ▼
Frontend receives content
        │
        ▼
Browser triggers file download via blob + <a download>
```

### 2.2 Key Principle: Server-Side Processing

Link resolution happens **server-side**, not client-side. Reasons:

1. The client-side rendered HTML has already been sanitized by DOMPurify and post-processed by `processLinks()` — extracting clean content from the DOM would require reverse-engineering the rendering pipeline.
2. For Markdown export, the source markdown is the starting point — processing it server-side avoids a round-trip through marked → HTML → back to markdown.
3. Server-side processing is deterministic and testable independent of browser state.

---

## 3. Design Decisions

### 3.1 Why Not Client-Side Export?

| Approach | Pros | Cons |
|----------|------|------|
| Client-side (clone DOM, process) | No server changes | Lossy: DOM already sanitized, mermaid rendered to SVG, images rewritten to API URLs. Reversing is fragile. |
| Server-side (process raw markdown) | Clean source, deterministic, testable | Requires new endpoint. Needs markdown-to-HTML conversion server-side for HTML format. |

**Decision:** Server-side. The raw markdown is the canonical source, and processing it directly avoids DOM-scraping fragility.

### 3.2 Link Resolution Strategy

Internal links in wiki markdown take these forms:

```markdown
[Harness Engineering](../concepts/harness-engineering.md)
[Graph Database](entities/graph-database.md)
[see index](../index.md)
```

**Resolution rule:** Any link whose `href` ends with `.md` and does **not** start with `http://` or `https://` is an internal link. Internal links are replaced with their **link text only** — the `[label]` portion.

External links:

```markdown
[Neo4j](https://neo4j.com)
[arXiv:2401.00123](https://arxiv.org/abs/2401.00123)
```

**Resolution rule:** Any link whose `href` starts with `http://` or `https://` is external. These are **preserved unchanged** in both Markdown and HTML export.

Anchor links (`#section-heading`) are preserved as-is — they work within any rendered document.

### 3.3 Frontmatter Handling

Wiki pages include YAML frontmatter:

```yaml
---
title: "Newsletter Title"
type: newsletter
tags: [tag1, tag2]
created: 2026-04-18
---
```

**Decision:** Frontmatter is **always stripped** from exported content. The exported file contains only the body content. Rationale: frontmatter is Knowledge Compiler metadata, not publishable prose. The page title (from frontmatter `title` field) is used as the download filename.

### 3.4 Image Handling

Wiki pages may reference images via relative paths:

```markdown
![Diagram](images/architecture.png)
```

**Decision for Markdown export:** Image references are preserved as-is. The images are not bundled — the user is exporting text content for publishing, where they will typically re-upload images to their publishing platform.

**Decision for HTML export:** Images are converted to absolute data URIs or omitted. Since the export is a standalone HTML file, relative paths would break. Two options evaluated:

| Approach | Pros | Cons |
|----------|------|------|
| Inline as base64 data URIs | Self-contained HTML | Large file size, complex server logic |
| Omit images, leave alt text | Simple, small file | No images in export |
| Preserve relative paths | Simple | Broken images |

**Decision:** Preserve image references with relative paths and add an HTML comment noting that images must be uploaded separately. For the newsletter use case (the primary driver), images are rare — newsletters are text-heavy with occasional diagrams that would be re-created on the publishing platform anyway. This keeps the implementation simple. If image embedding becomes necessary, it can be added as a follow-up.

### 3.5 Mermaid Diagrams

```markdown
```mermaid
graph LR
  A --> B
```
```

**Decision:** Mermaid code blocks are preserved as fenced code blocks in Markdown export. In HTML export, they are rendered as `<pre><code>` blocks (not rendered to SVG). Rationale: Mermaid rendering requires the mermaid.js library in the browser — a static HTML export cannot execute JavaScript. Many publishing platforms (e.g., GitHub, some CMS tools) support Mermaid natively and will render it from the code block.

### 3.6 Filename Convention

**Markdown:** `{title-slug}.md`
**HTML:** `{title-slug}.html`

The slug is derived from the page's frontmatter `title` field (lowercased, non-alphanumeric characters replaced with hyphens, consecutive hyphens collapsed). If no title exists, the wiki filename is used.

### 3.7 HTML Wrapper

The HTML export is a minimal standalone document — not a raw HTML fragment. It includes:

- `<!DOCTYPE html>` declaration
- `<meta charset="UTF-8">`
- `<title>` from frontmatter
- A `<style>` block with basic typography (readable defaults, no Knowledge Compiler branding)
- The rendered content in a `<main>` element with `max-width: 800px`

This ensures the file opens correctly in any browser and is ready for copy-paste into publishing platforms.

---

## 4. Link Resolution Specification

### 4.1 Markdown Link Resolution

Operates on raw markdown text using regex. Two patterns to match:

**Pattern 1 — Standard markdown links:**

```
[link text](target)
```

Regex: `/\[([^\]]*)\]\(([^)]+)\)/g`

For each match:
- If target starts with `http://` or `https://` → **keep unchanged**
- If target starts with `#` → **keep unchanged** (anchor link)
- If target ends with `.md` → **replace entire match with link text only**
- Otherwise → **keep unchanged** (could be a relative URL to a non-wiki resource)

**Pattern 2 — Reference-style links:**

```
[link text][ref-id]

[ref-id]: target "optional title"
```

These are rare in Knowledge Compiler wiki pages (the markdown is LLM-generated and uses inline links exclusively). For safety, the resolver handles them:
- If the reference target is internal → replace `[link text][ref-id]` with link text, remove the reference definition line
- If external → keep both intact

### 4.2 HTML Link Resolution

After markdown-to-HTML conversion, a **safety pass** via `resolveHtmlLinksForExport(html)` operates on the HTML string. This catches any internal links that survived the markdown-level resolution (e.g., links generated by `marked` from patterns the markdown regex didn't match).

**Pattern:** `<a href="target">link text</a>`

For each `<a>` element:
- If `href` starts with `http://` or `https://` → add `target="_blank"` and `rel="noopener noreferrer"`, keep the element
- If `href` starts with `#` → keep unchanged
- If `href` ends with `.md` → **replace entire `<a>` element with its inner HTML content only**
- Otherwise → keep unchanged

This is implemented as a separate helper function (`resolveHtmlLinksForExport`) called in the endpoint handler between `marked.parse()` and `wrapInHtmlDocument()`.

### 4.3 Edge Cases

| Case | Behavior |
|------|----------|
| Nested formatting in link: `[**bold** text](page.md)` | Preserve inner formatting, strip link wrapper: `**bold** text` (Markdown) / `<strong>bold</strong> text` (HTML) |
| Image inside link: `[![alt](img.png)](page.md)` | Strip link wrapper, keep image: `![alt](img.png)` |
| Empty link text: `[](page.md)` | Remove entirely (empty text has no value) |
| Broken internal link (target doesn't exist) | Still strip to plain text — existence checking is not needed for export |
| Link with title: `[text](page.md "tooltip")` | Strip to plain text |
| Encoded characters in URL: `[text](my%20page.md)` | Recognized as internal link (ends with `.md`), stripped |

---

## 5. Server Specification

### 5.1 Endpoint

**`GET /api/wiki/page/export`**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Wiki-relative file path (e.g., `newsletters/newsletter-llm-wiki-2026-04-13.md`) |
| `vault` | string | No | Vault ID (defaults to first registered vault) |
| `format` | string | Yes | `md` or `html` |

**Success Response (format=md):**

```
HTTP 200
Content-Type: text/markdown; charset=utf-8
Content-Disposition: attachment; filename="newsletter-title-slug.md"

# Newsletter Title

Body content with internal links resolved to plain text
and [external links](https://example.com) preserved.
```

**Success Response (format=html):**

```
HTTP 200
Content-Type: text/html; charset=utf-8
Content-Disposition: attachment; filename="newsletter-title-slug.html"

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Newsletter Title</title>
  <style>/* minimal typography */</style>
</head>
<body>
  <main>
    <h1>Newsletter Title</h1>
    <p>Body content...</p>
  </main>
</body>
</html>
```

**Error Responses:**

| Code | Condition | Body |
|------|-----------|------|
| 400 | Missing `path` parameter | `{ "error": "Missing \"path\" query parameter." }` |
| 400 | Missing or invalid `format` | `{ "error": "Format must be \"md\" or \"html\"." }` |
| 403 | Path traversal attempt | `{ "error": "Access denied." }` |
| 404 | File not found | `{ "error": "File not found: <path>" }` |
| 404 | Vault not found | `{ "error": "Unknown vault: <id>" }` |
| 500 | Server error | `{ "error": "Export failed: <message>" }` |

### 5.2 Server-Side Processing Pipeline

```
1. Read raw markdown from wiki/<path>
2. Parse and strip YAML frontmatter (extract title for filename)
3. Resolve links in markdown body:
   a. Internal .md links → plain text
   b. External http/https links → preserved
   c. Anchor #links → preserved
4. If format=md:
   a. Set Content-Type: text/markdown
   b. Return processed markdown
5. If format=html:
   a. Parse processed markdown with marked (GFM enabled)
   b. Run resolveHtmlLinksForExport() safety pass — strips remaining internal <a> tags, adds target/rel to external links
   c. Wrap in standalone HTML document template via wrapInHtmlDocument()
   d. Set Content-Type: text/html
   e. Return wrapped HTML
```

### 5.3 Helper Functions

**`stripFrontmatter(raw)`**
- Detects leading `---` fence, finds closing `---`, returns `{ frontmatter: {parsed}, body: string }`
- Uses `js-yaml` (already a project dependency via client-side lib) — or simple regex extraction since we only need the `title` field

**`resolveLinksForExport(markdown)`**
- Regex-based replacement on the markdown string
- Handles both inline links and reference-style links
- Strips optional title suffixes from link targets before checking `.md` extension
- Returns processed markdown with internal links replaced by their text labels

**`resolveHtmlLinksForExport(html)`**

- Safety pass on HTML after `marked.parse()` — catches any internal links the markdown regex missed
- Strips internal `<a>` elements to their inner content, adds `target="_blank" rel="noopener noreferrer"` to external links

**`buildExportFilename(frontmatter, wikiPath, format)`**
- Derives slug from `frontmatter.title` or falls back to wiki filename stem
- Appends `.md` or `.html`

**`wrapInHtmlDocument(htmlBody, title)`**
- Returns a complete `<!DOCTYPE html>` document string with embedded stylesheet
- Includes HTML comment about images needing separate upload

### 5.4 Markdown-to-HTML Conversion (Server-Side)

The client uses `marked.min.js` (bundled in `src/public/lib/`). The server needs the same library for HTML export.

**Option A:** Add `marked` as an npm dependency in `src/package.json`.
**Option B:** Use a different CommonJS-compatible markdown parser.

**Decision:** Option A — add `marked` as a server dependency. This ensures rendering parity between the content panel and HTML export. The client uses a bundled minified copy for the browser; the server uses the npm package. Same library, same output.

### 5.5 Placement

The endpoint goes in `src/server/index.js` after the existing `GET /api/wiki/file` endpoint (after line 1062). It follows the same vault resolution and path-traversal protection patterns.

---

## 6. UI Specification

### 6.1 Export Button Placement

The export button is added to the **metadata bar** (`#metadata-bar`) — the bar above the content body that shows the page title, type badge, and tags. It appears at the right end of the metadata bar, visually grouped with the existing metadata but clearly a separate action.

### 6.2 Button and Dropdown Design

```
┌─────────────────────────────────────────────────────────────┐
│  Newsletter Title  [newsletter]  tag1  tag2     [↓ Export ▾]│
│─────────────────────────────────────────────────────────────│
│                                                             │
│  Page content...                                            │
│                                                             │
```

The button is a small dropdown trigger (not a modal). Clicking it reveals a two-option menu:

```
[↓ Export ▾]
┌──────────────┐
│ ↓ Markdown   │
│ ↓ HTML       │
└──────────────┘
```

Selecting an option immediately triggers the download — no confirmation step needed. The dropdown closes after selection.

### 6.3 HTML Elements

Add to the metadata bar rendering in `content.js` `renderMetadataBar()`:

```html
<div class="meta-export">
  <button id="btn-page-export" class="meta-export-btn" title="Export page content">
    ↓ Export &#9662;
  </button>
  <div id="page-export-dropdown" class="meta-export-dropdown hidden">
    <button class="meta-export-option" data-format="md">↓ Markdown</button>
    <button class="meta-export-option" data-format="html">↓ HTML</button>
  </div>
</div>
```

Since the metadata bar is rendered dynamically by `renderMetadataBar()` in `content.js`, the button is added in JavaScript, not in `index.html`.

### 6.4 Element IDs

| ID | Element | Purpose |
|----|---------|---------|
| `btn-page-export` | `<button>` | Dropdown trigger |
| `page-export-dropdown` | `<div>` | Dropdown menu container |

### 6.5 Interaction Flow

1. **Click** `btn-page-export` → toggle `hidden` class on `page-export-dropdown`
2. **Click** a format option → hide dropdown, trigger export:
   a. Fetch `GET /api/wiki/page/export?path=<activeNodeId>&vault=<activeVaultId>&format=<md|html>`
   b. Extract filename from `Content-Disposition` header
   c. Convert response to blob (`text/markdown` or `text/html`)
   d. Create temporary `<a>` element with `download` attribute, click it, clean up (same pattern as vault export in `app.js`)
   e. Show success toast: "Exported {filename}"
3. **Click** outside dropdown → close it
4. **Escape** key while dropdown open → close it

### 6.6 State Handling

- The export button is rendered fresh each time `renderMetadataBar()` is called (on every node navigation). Event listeners are attached inline or re-attached in the function.
- If no node is active or the node has an error, the export button is not rendered.

### 6.7 Accessibility

- Dropdown trigger has `aria-haspopup="true"` and `aria-expanded="false|true"`
- Dropdown menu has `role="menu"`
- Format options have `role="menuitem"`
- Keyboard: Enter/Space toggles dropdown, arrow keys navigate options, Escape closes

---

## 7. CSS Specification

### 7.1 New Styles

Add to `src/public/css/styles.css` in the metadata bar section:

**`.meta-export`**
- `position: relative` (anchor for dropdown)
- `display: inline-block`
- `margin-left: auto` (push to right side of metadata bar)

**`.meta-export-btn`**
- Matches existing `.toolbar-btn` aesthetic but smaller to fit the metadata bar
- `padding: 4px 10px`
- `font-size: 12px`
- `border: 1px solid #ccc`
- `border-radius: 4px`
- `background: #f5f5f5`
- `cursor: pointer`
- Hover: `background: #e8e8e8`

**`.meta-export-dropdown`**
- `position: absolute`
- `top: 100%`
- `right: 0`
- `z-index: 100`
- `min-width: 140px`
- `background: #fff`
- `border: 1px solid #ddd`
- `border-radius: 6px`
- `box-shadow: 0 4px 12px rgba(0,0,0,0.15)`
- `padding: 4px 0`

**`.meta-export-option`**
- `display: block`
- `width: 100%`
- `text-align: left`
- `padding: 8px 14px`
- `border: none`
- `background: none`
- `cursor: pointer`
- `font-size: 13px`
- Hover: `background: #f0f4ff`

**`.meta-export-dropdown.hidden`**
- `display: none`

---

## 8. File Changes

| File | Type | Description |
|------|------|-------------|
| `src/package.json` | Modify | Add `marked` as a server-side dependency |
| `src/server/index.js` | Modify | Add `GET /api/wiki/page/export` endpoint and helper functions |
| `src/public/js/content.js` | Modify | Add export button to `renderMetadataBar()`, add dropdown and download logic |
| `src/public/css/styles.css` | Modify | Add `.meta-export-*` styles |

No new files are created. No HTML changes needed (the button is rendered dynamically by `content.js`).

---

## 9. Implementation Phases

### Phase 1: Server-Side Export Endpoint (Tasks 1–4)

| Task | ID | Description | File |
|------|----|-------------|------|
| 1 | TASK-PE001 | Add `marked` npm dependency | `src/package.json` |
| 2 | TASK-PE002 | Add helper functions: `stripFrontmatter()`, `resolveLinksForExport()`, `buildExportFilename()`, `wrapInHtmlDocument()` | `src/server/index.js` |
| 3 | TASK-PE003 | Implement `GET /api/wiki/page/export` endpoint | `src/server/index.js` |
| 4 | TASK-PE004 | Verify endpoint via curl: test markdown export, HTML export, link resolution, error cases | — |

### Phase 2: Frontend UI (Tasks 5–7)

| Task | ID | Description | File |
|------|----|-------------|------|
| 5 | TASK-PE005 | Add `.meta-export-*` CSS styles | `src/public/css/styles.css` |
| 6 | TASK-PE006 | Add export button and dropdown to `renderMetadataBar()` in content.js | `src/public/js/content.js` |
| 7 | TASK-PE007 | Add dropdown interaction, fetch, and download logic in content.js | `src/public/js/content.js` |

### Phase 3: Testing (Task 8)

| Task | ID | Description | File |
|------|----|-------------|------|
| 8 | TASK-PE008 | End-to-end browser testing: export a newsletter as Markdown and HTML, verify internal links resolved, external links preserved, file downloads correctly | — |

### Dependency Graph

```
TASK-PE001 ──► TASK-PE002 ──► TASK-PE003 ──► TASK-PE004
                                                  │
               TASK-PE005 ──► TASK-PE006 ──► TASK-PE007
                                                  │
                                              TASK-PE008
```

Phase 1 (Tasks 1–4) and Task 5 (CSS) can run in parallel. Tasks 6–7 depend on both the endpoint (Task 3) and the styles (Task 5). Task 8 depends on everything.

---

## 10. Risks and Mitigations

### 10.1 Regex-Based Link Resolution

**Risk:** Regex-based markdown link replacement could break on edge cases — links inside code blocks, links with parentheses in URLs, nested brackets.

**Mitigation:** The regex operates on the markdown body *after* frontmatter stripping. Code blocks are handled by first extracting fenced code blocks (````...```` and ~~~...~~~), performing link resolution on the remaining text, then reinserting code blocks. Inline code (`` `...` ``) is handled similarly. This prevents false matches inside code.

### 10.2 Rendering Parity (Client vs Server)

**Risk:** The server-side `marked` package version may differ from the client-side bundled `marked.min.js`, producing subtly different HTML.

**Mitigation:** Pin the `marked` npm dependency to the same major version as the bundled client copy. The client copy is `marked.min.js` in `src/public/lib/` — check its version comment header and match.

### 10.3 Large Pages

**Risk:** Newsletters can be 4,000–5,500 words. Processing and downloading large pages could be slow.

**Mitigation:** This is a negligible concern — 5,500 words is ~35 KB of markdown. The entire processing pipeline (frontmatter strip, regex, marked parse) completes in single-digit milliseconds.

### 10.4 Publishing Platform Compatibility

**Risk:** Different publishing platforms (Substack, Ghost, Medium, WordPress) have different HTML/Markdown import capabilities and may strip or modify certain elements.

**Mitigation:** The HTML export uses deliberately minimal, semantic HTML — no custom classes, no JavaScript, no complex CSS. The inline `<style>` block uses only basic typography properties that platforms either use or harmlessly ignore. The Markdown export is standard GFM. This maximizes compatibility. Platform-specific quirks are the user's responsibility.

### 10.5 Click-Outside Closing

**Risk:** The dropdown close-on-outside-click handler could interfere with other UI elements.

**Mitigation:** The handler is a document-level click listener that checks `event.target` containment within `.meta-export`. It is added when the dropdown opens and removed when it closes, avoiding permanent global listeners.
