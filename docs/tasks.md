# Knowledge Compiler — Implementation Tasks

**Document ID:** TASK-WIKIGRAPH-001
**Version:** 1.0
**Date:** 2026-04-10
**Specification:** [specification.md](specification.md)
**Status:** Draft

---

## Table of Contents

1. [Task Legend](#1-task-legend)
2. [Phase 1 — Project Setup & Scaffolding](#2-phase-1--project-setup--scaffolding)
3. [Phase 2 — Server & API](#3-phase-2--server--api)
4. [Phase 3 — Graph Construction (Client Logic)](#4-phase-3--graph-construction-client-logic)
5. [Phase 4 — Application Layout](#5-phase-4--application-layout)
6. [Phase 5 — Graph Visualization](#6-phase-5--graph-visualization)
7. [Phase 6 — Content Rendering](#7-phase-6--content-rendering)
8. [Phase 7 — Navigation](#8-phase-7--navigation)
9. [Phase 8 — Search & Filter](#9-phase-8--search--filter)
10. [Phase 9 — Graph Statistics](#10-phase-9--graph-statistics)
11. [Phase 9a — Refresh](#11-phase-9a--refresh)
12. [Phase 9b — File Upload](#12-phase-9b--file-upload)
13. [Phase 10 — Keyboard Accessibility](#13-phase-10--keyboard-accessibility)
14. [Phase 11 — Error Handling & Edge Cases](#14-phase-11--error-handling--edge-cases)
15. [Phase 12 — Performance Optimization](#15-phase-12--performance-optimization)
16. [Phase 13 — Accessibility & Visual Polish](#16-phase-13--accessibility--visual-polish)
17. [Phase 14 — Portability & Cross-Browser Testing](#17-phase-14--portability--cross-browser-testing)
18. [Traceability Matrix — Requirements to Tasks](#18-traceability-matrix--requirements-to-tasks)

---

## 1. Task Legend

| Field | Description |
|-------|-------------|
| **ID** | Unique task identifier (`TASK-NNN`). |
| **Title** | Short description of the task. |
| **Spec Refs** | Specification requirement IDs addressed by this task. |
| **Depends On** | Tasks that must be completed before this task can begin. |
| **Priority** | `P0` (blocker), `P1` (high), `P2` (medium), `P3` (low). |
| **Status** | `not-started`, `in-progress`, `completed`, `blocked`. |

---

## 2. Phase 1 — Project Setup & Scaffolding

### TASK-001 — Initialize Node.js Project

| Field | Value |
|-------|-------|
| **Spec Refs** | CON-01, NFR-MAINT-002 |
| **Depends On** | — |
| **Priority** | P0 |
| **Status** | not-started |

Create the project root directory. Run `npm init` to generate `package.json`. Configure the `start` script so that `npm start` launches the application (NFR-MAINT-002). Set `"type": "module"` if using ES modules.

### TASK-002 — Install Runtime Dependencies

| Field | Value |
|-------|-------|
| **Spec Refs** | CON-01, NFR-MAINT-001, NFR-PORT-003 |
| **Depends On** | TASK-001 |
| **Priority** | P0 |
| **Status** | not-started |

Install no more than 3 major front-end runtime dependencies (NFR-MAINT-001). Recommended stack per the specification appendix:

- Graph visualization: D3.js (d3-force) or Cytoscape.js
- Markdown rendering: marked or markdown-it
- YAML parsing: js-yaml
- Server: Express (minimal)

All dependencies shall be bundled or served locally — no external CDNs at runtime (NFR-PORT-003).

### TASK-003 — Create Project Directory Structure

| Field | Value |
|-------|-------|
| **Spec Refs** | CON-02 |
| **Depends On** | TASK-001 |
| **Priority** | P0 |
| **Status** | not-started |

Create the following directory layout:

```
app/
├── server/          # Express server code
├── public/          # Static front-end files
│   ├── index.html   # Single-page application entry point
│   ├── css/         # Stylesheets
│   ├── js/          # Client-side JavaScript modules
│   └── lib/         # Bundled vendor libraries (if not using a bundler)
└── package.json
```

---

## 3. Phase 2 — Server & API

### TASK-004 — Implement Express Server

| Field | Value |
|-------|-------|
| **Spec Refs** | CON-02, NFR-SEC-003, NFR-MAINT-002 |
| **Depends On** | TASK-001, TASK-002, TASK-003 |
| **Priority** | P0 |
| **Status** | not-started |

Create an Express server that:

- Serves static files from `public/`.
- Binds to `localhost` (127.0.0.1) only (NFR-SEC-003).
- Starts with `npm start` (NFR-MAINT-002).

### TASK-005 — Implement Wiki File Discovery API

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GC-001 |
| **Depends On** | TASK-004 |
| **Priority** | P0 |
| **Status** | not-started |

Create an API endpoint (e.g., `GET /api/wiki/files`) that recursively scans the `wiki/` directory, returns a JSON array of all `.md` file paths relative to the `wiki/` root, and sends the list to the client.

### TASK-006 — Implement File Content API

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-CR-001, NFR-SEC-001, CON-03 |
| **Depends On** | TASK-004 |
| **Priority** | P0 |
| **Status** | not-started |

Create an API endpoint (e.g., `GET /api/wiki/file?path=<relative-path>`) that reads a wiki file and returns its raw Markdown content. The endpoint shall:

- Only serve files under the `wiki/` directory (path-traversal prevention).
- Be strictly read-only — no POST/PUT/DELETE operations (NFR-SEC-001, CON-03).

### TASK-007 — Bundle Dependencies Locally

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-PORT-003 |
| **Depends On** | TASK-002 |
| **Priority** | P1 |
| **Status** | not-started |

Ensure all front-end dependencies are served locally. Either:

- Copy vendor files into `public/lib/`, or
- Use a bundler (e.g., esbuild, rollup) to produce a single bundle.

No `<script>` tags shall reference external CDNs.

---

## 4. Phase 3 — Graph Construction (Client Logic)

### TASK-008 — Implement Client-Side File Fetching

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GC-001 |
| **Depends On** | TASK-005 |
| **Priority** | P0 |
| **Status** | not-started |

Write client-side code to call the file discovery API (TASK-005), receive the list of wiki file paths, and fetch the content of each file via the file content API (TASK-006).

### TASK-009 — Implement Frontmatter Parsing

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GC-009, NFR-REL-002 |
| **Depends On** | TASK-008, TASK-002 |
| **Priority** | P0 |
| **Status** | not-started |

For each fetched wiki file, parse YAML frontmatter (content between the first two `---` lines) using js-yaml and extract: `title`, `type`, `tags`, `confidence`, `created`, `updated`.

If frontmatter is malformed (unparseable YAML), use default values: title = filename, type = "other", tags = [], confidence = null. Log a warning to the browser console (NFR-REL-002).

### TASK-010 — Implement Link Extraction

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GC-002, FR-GC-007 |
| **Depends On** | TASK-008 |
| **Priority** | P0 |
| **Status** | not-started |

Parse each wiki file's Markdown content and extract all standard Markdown links matching `[display text](target-path.md)`. Exclude links whose target begins with `http://`, `https://`, or `#` (FR-GC-007).

### TASK-011 — Implement Link Resolution

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GC-003, CON-04 |
| **Depends On** | TASK-010 |
| **Priority** | P0 |
| **Status** | not-started |

Resolve each extracted link target relative to the directory of the source file, producing a normalized path within the `wiki/` directory tree. Handle `../` path segments correctly per the linking conventions in CLAUDE.md (CON-04).

### TASK-012 — Build Graph Model (Nodes & Edges)

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GC-004, FR-GC-005, FR-GC-006 |
| **Depends On** | TASK-009, TASK-011 |
| **Priority** | P0 |
| **Status** | not-started |

Construct an in-memory graph data structure:

- **Nodes**: One per discovered wiki file. Store: relative path, display name (from frontmatter `title` or filename), `type`, `tags`, `confidence` (FR-GC-004).
- **Edges**: One directed edge per resolved link from source to target (FR-GC-005). Suppress duplicate edges between the same source-target pair (FR-GC-006).

### TASK-013 — Implement Broken Link Detection

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GC-008 |
| **Depends On** | TASK-011, TASK-012 |
| **Priority** | P1 |
| **Status** | not-started |

If a resolved link target does not correspond to any discovered wiki file:

- Exclude that link from edge creation.
- Log the broken link to the browser console with source file path, link text, and unresolved target path.

---

## 5. Phase 4 — Application Layout

### TASK-014 — Implement Two-Panel Layout with Resizable Divider

| Field | Value |
|-------|-------|
| **Spec Refs** | IR-LAY-001, IR-LAY-002, NFR-USE-002 |
| **Depends On** | TASK-003 |
| **Priority** | P0 |
| **Status** | not-started |

Create the HTML/CSS structure for a two-panel layout:

- **Graph panel** on the left, **content panel** on the right (IR-LAY-001).
- Default split: 45% graph, 55% content (IR-LAY-002).
- A draggable divider between panels; minimum width of either panel is 300px (NFR-USE-002).

### TASK-015 — Implement Responsive Layout

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-USE-001 |
| **Depends On** | TASK-014 |
| **Priority** | P2 |
| **Status** | not-started |

Adapt the two-panel layout to viewport widths from 1024px to 2560px. At viewports below 1024px, stack panels vertically (graph on top, content below).

### TASK-016 — Implement Toolbar

| Field | Value |
|-------|-------|
| **Spec Refs** | IR-LAY-003 |
| **Depends On** | TASK-014 |
| **Priority** | P1 |
| **Status** | not-started |

Create a toolbar above the panels containing:

- (a) Application title "Knowledge Compiler"
- (b) Search input (placeholder; wired in TASK-043)
- (c) Type filter toggles (placeholder; wired in TASK-045)
- (d) "Home" button (placeholder; wired in TASK-042)
- (e) "Back" button (placeholder; wired in TASK-041)
- (f) "Fit" button (placeholder; wired in TASK-028)

### TASK-017 — Implement Breadcrumb Bar

| Field | Value |
|-------|-------|
| **Spec Refs** | IR-LAY-004, FR-NAV-004 |
| **Depends On** | TASK-016 |
| **Priority** | P1 |
| **Status** | not-started |

Create a breadcrumb bar between the toolbar and panels. Display the last 10 visited nodes as clickable entries. Each entry shows the node's display name. Clicking an entry sets that node as active.

---

## 6. Phase 5 — Graph Visualization

### TASK-018 — Implement Force-Directed Graph Rendering

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-001, FR-GV-002, IR-GP-002 |
| **Depends On** | TASK-012, TASK-014, TASK-002 |
| **Priority** | P0 |
| **Status** | not-started |

Using D3.js (d3-force) or Cytoscape.js, render the graph model as a 2D force-directed layout in the graph panel. Each node is a labeled shape displaying the node's display name (FR-GV-002). Set the graph panel background to `#F8F9FA` (IR-GP-002).

### TASK-019 — Implement Node Type Color Coding

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-003 |
| **Depends On** | TASK-018 |
| **Priority** | P1 |
| **Status** | not-started |

Assign fill colors to nodes based on their `type`:

| Type | Hex |
|------|-----|
| concept | `#4A90D9` |
| entity | `#50B86C` |
| summary | `#E8913A` |
| synthesis | `#9B59B6` |
| journal | `#17A2B8` |
| presentation | `#E85D75` |
| index | `#F1C40F` |
| log | `#6C757D` |
| dashboard | `#6610F2` |
| flashcards | `#E83E8C` |
| other | `#95A5A6` |

If `type` is absent in frontmatter, infer from parent directory name. If still unknown, assign `other`.

### TASK-020 — Implement Edge Rendering

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-004 |
| **Depends On** | TASK-018 |
| **Priority** | P0 |
| **Status** | not-started |

Render each edge as a directed line with an arrowhead pointing from the source node to the target node.

### TASK-021 — Implement Active Node Highlight

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-005 |
| **Depends On** | TASK-018 |
| **Priority** | P0 |
| **Status** | not-started |

When a node becomes active, apply a visual highlight: 3px solid border with color `#E74C3C`, scaled to 1.3× its default size. Remove the highlight from any previously active node.

### TASK-022 — Implement Default Selection

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-006 |
| **Depends On** | TASK-018, TASK-021 |
| **Priority** | P0 |
| **Status** | not-started |

On initial application load, set the node representing `wiki/index.md` as the active node, applying the highlight and rendering its content.

### TASK-023 — Implement Pan

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-007 |
| **Depends On** | TASK-018 |
| **Priority** | P0 |
| **Status** | not-started |

Enable panning the graph by clicking and dragging on the graph panel background.

### TASK-024 — Implement Zoom

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-008 |
| **Depends On** | TASK-018 |
| **Priority** | P0 |
| **Status** | not-started |

Enable zoom via mouse scroll wheel or trackpad pinch gesture. Constrain zoom range to 0.1× – 5× of the default scale.

### TASK-025 — Implement Node Drag

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-009 |
| **Depends On** | TASK-018 |
| **Priority** | P1 |
| **Status** | not-started |

Allow individual nodes to be repositioned by click-and-drag. While dragged, the node's position is fixed in the force simulation. On release, unfix the position.

### TASK-026 — Implement Hover Tooltip

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-010 |
| **Depends On** | TASK-018 |
| **Priority** | P1 |
| **Status** | not-started |

When the user hovers over a node for ≥300ms, display a tooltip showing:

- File path relative to `wiki/`
- Node type
- Number of inbound and outbound edges

### TASK-027 — Implement Edge Highlight on Hover

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-011 |
| **Depends On** | TASK-018, TASK-020 |
| **Priority** | P1 |
| **Status** | not-started |

When the user hovers over a node, highlight all connected edges (inbound and outbound) and dim all other edges.

### TASK-028 — Implement Fit-to-View Button

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-012 |
| **Depends On** | TASK-018, TASK-016 |
| **Priority** | P1 |
| **Status** | not-started |

Wire the toolbar "Fit" button to adjust zoom and pan so all nodes are visible within the graph panel with a 10% margin.

### TASK-029 — Implement Zoom Controls

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-013, IR-GP-001 |
| **Depends On** | TASK-024 |
| **Priority** | P1 |
| **Status** | not-started |

Add "+" and "−" floating buttons positioned in the bottom-right corner of the graph panel (IR-GP-001). Each click increases or decreases zoom by 20% of the current scale, centered on the panel midpoint.

### TASK-030 — Implement Node Type Legend

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GV-014, IR-GP-001 |
| **Depends On** | TASK-019 |
| **Priority** | P1 |
| **Status** | not-started |

Display a legend in the top-right corner of the graph panel (IR-GP-001). Each entry shows a color swatch and type label for every node type present in the graph. When a type filter hides all nodes of a type, that legend entry appears at 50% opacity. The legend shall not overlap graph nodes.

### TASK-031 — Implement Node Label Visibility by Zoom Level

| Field | Value |
|-------|-------|
| **Spec Refs** | IR-GP-003 |
| **Depends On** | TASK-024, TASK-018 |
| **Priority** | P2 |
| **Status** | not-started |

At zoom levels ≥ 0.5×, node labels are visible. At zoom levels below 0.5×, hide labels and render only node shapes.

---

## 7. Phase 6 — Content Rendering

### TASK-032 — Implement Markdown-to-HTML Rendering

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-CR-001, FR-CR-002 |
| **Depends On** | TASK-006, TASK-002 |
| **Priority** | P0 |
| **Status** | not-started |

When the active node is set, fetch the corresponding wiki file's raw Markdown content (via TASK-006 API) and render it as HTML in the content panel using marked or markdown-it. Ensure correct rendering of: headings (h1–h6), bold, italic, inline code, code blocks with syntax highlighting, lists (ordered and unordered), tables, blockquotes, horizontal rules, and images.

### TASK-033 — Implement Frontmatter Exclusion from Content

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-CR-003 |
| **Depends On** | TASK-032 |
| **Priority** | P0 |
| **Status** | not-started |

Strip the YAML frontmatter block (content between the opening and closing `---` lines) so it is not rendered as visible text in the content panel.

### TASK-034 — Implement Internal Link Interactivity

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-CR-004 |
| **Depends On** | TASK-032, TASK-011 |
| **Priority** | P0 |
| **Status** | not-started |

Intercept clicks on internal wiki links in the rendered content. Resolve the link target to a node in the graph model. On click, set the linked node as the active node (triggering FR-GV-005, FR-CR-001, FR-NAV-002).

### TASK-035 — Implement External Link Handling

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-CR-005 |
| **Depends On** | TASK-032 |
| **Priority** | P1 |
| **Status** | not-started |

Render links beginning with `http://` or `https://` as standard hyperlinks that open in a new browser tab (`target="_blank"`).

### TASK-036 — Implement Frontmatter Metadata Bar

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-CR-006 |
| **Depends On** | TASK-009, TASK-032 |
| **Priority** | P1 |
| **Status** | not-started |

Display a metadata bar above the rendered Markdown content showing: `title`, `type` (with color badge from FR-GV-003), `tags` (as individual badges), `confidence`, and `updated`.

### TASK-037 — Implement Content Panel Styling

| Field | Value |
|-------|-------|
| **Spec Refs** | IR-CP-001, IR-CP-002, IR-CP-003, IR-CP-004 |
| **Depends On** | TASK-032, TASK-014 |
| **Priority** | P1 |
| **Status** | not-started |

Style the content panel:

- **Structure**: Metadata bar at top, rendered Markdown below, no other elements (IR-CP-001).
- **Scrolling**: Independently scrollable when content exceeds panel height (IR-CP-002).
- **Typography**: Readable sans-serif font, 16px base size, 1.6 line height, max content width 800px centered (IR-CP-003).
- **Code blocks**: Monospace font, light gray background (`#F5F5F5`), contrasting border, horizontal scroll on overflow (IR-CP-004).

### TASK-038 — Implement HTML Sanitization

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-SEC-002 |
| **Depends On** | TASK-032 |
| **Priority** | P0 |
| **Status** | not-started |

Sanitize all Markdown-rendered HTML to prevent XSS. Strip `<script>` tags and event handler attributes (e.g., `onclick`, `onerror`) from rendered output. Use the Markdown library's built-in sanitization or add a sanitizer (e.g., DOMPurify — does not count toward the 3-library limit as it is a security utility).

---

## 8. Phase 7 — Navigation

### TASK-039 — Implement Node Click Selection

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-NAV-001 |
| **Depends On** | TASK-018 |
| **Priority** | P0 |
| **Status** | not-started |

When the user clicks a node in the graph panel, set that node as the active node.

### TASK-040 — Implement Graph-Content Synchronization

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-NAV-002 |
| **Depends On** | TASK-039, TASK-021, TASK-032 |
| **Priority** | P0 |
| **Status** | not-started |

When the active node changes:

- (a) Scroll/center the graph panel so the active node is visible.
- (b) Apply the active node highlight (FR-GV-005); remove highlight from the previous node.
- (c) Render the new active node's content in the content panel (FR-CR-001).

### TASK-041 — Implement Content-to-Graph Navigation

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-NAV-003 |
| **Depends On** | TASK-034, TASK-040 |
| **Priority** | P0 |
| **Status** | not-started |

When the user clicks an internal wiki link in the content panel, navigate to the linked node by triggering the active node change (TASK-040).

### TASK-042 — Implement Back Navigation

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-NAV-005 |
| **Depends On** | TASK-017, TASK-040 |
| **Priority** | P1 |
| **Status** | not-started |

Wire the toolbar "Back" button. On click, navigate to the previously active node in the breadcrumb trail. If there is no previous node, disable the button.

### TASK-043 — Implement Home Navigation

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-NAV-006 |
| **Depends On** | TASK-016, TASK-040 |
| **Priority** | P1 |
| **Status** | not-started |

Wire the toolbar "Home" button. On click, set the `wiki/index.md` node as the active node.

---

## 9. Phase 8 — Search & Filter

### TASK-044 — Implement Node Search

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-SF-001 |
| **Depends On** | TASK-016, TASK-012 |
| **Priority** | P1 |
| **Status** | not-started |

Wire the toolbar search input. When the user types ≥2 characters, display a dropdown list of nodes whose display name or file path contains the query string (case-insensitive).

### TASK-045 — Implement Search Result Selection

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-SF-002 |
| **Depends On** | TASK-044, TASK-040 |
| **Priority** | P1 |
| **Status** | not-started |

When the user selects an item from the search dropdown, set the corresponding node as the active node.

### TASK-046 — Implement Type Filter Toggles

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-SF-003 |
| **Depends On** | TASK-016, TASK-019 |
| **Priority** | P1 |
| **Status** | not-started |

Add toggle buttons to the toolbar — one per node type present in the graph (concept, entity, summary, synthesis, journal, presentation, index, log, dashboard, flashcards, other). Each toggle shows the type's color swatch. When deactivated, hide all nodes of that type and their connected edges. The active node is never hidden.

### TASK-047 — Implement Filter Persistence & Layout Re-stabilization

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-SF-004 |
| **Depends On** | TASK-046 |
| **Priority** | P2 |
| **Status** | not-started |

Maintain filter state across node selections. When a filter is toggled, re-stabilize the force-directed layout to account for the changed set of visible nodes.

---

## 10. Phase 9 — Graph Statistics

### TASK-048 — Implement Statistics Bar

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-GS-001, IR-GP-001 |
| **Depends On** | TASK-012, TASK-018 |
| **Priority** | P2 |
| **Status** | not-started |

Display a statistics bar at the bottom of the graph panel (IR-GP-001) showing:

- Total number of nodes
- Total number of edges
- Nodes per type (counts)
- Number of orphan nodes (zero inbound edges, excluding `index.md`)

---

## 11. Phase 9a — Refresh

### TASK-058 — Add Refresh Button to Toolbar

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-RF-001, IR-LAY-003 |
| **Depends On** | TASK-016 |
| **Priority** | P1 |
| **Status** | not-started |

Add a "Refresh" (⟳) button to the toolbar. On click, re-execute the full graph construction pipeline (call the file discovery API, re-fetch all files, rebuild the graph model). Replace the current graph data and re-render the visualization.

### TASK-059 — Preserve Active Node on Refresh

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-RF-002 |
| **Depends On** | TASK-058, TASK-040 |
| **Priority** | P1 |
| **Status** | not-started |

After the graph is rebuilt, check if the previously active node's file still exists in the new graph. If yes, re-select it. If not, fall back to `wiki/index.md` (FR-GV-006).

### TASK-060 — Refresh Visual Feedback

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-RF-003 |
| **Depends On** | TASK-058 |
| **Priority** | P1 |
| **Status** | not-started |

While the refresh operation is in progress, apply a spinning animation to the Refresh button icon (CSS `@keyframes` rotation) and disable the button to prevent multiple concurrent refreshes. Remove the animation on completion.

---

## 12. Phase 9b — File Upload

### TASK-061 — Add Upload Button to Toolbar

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-UP-001, IR-LAY-003 |
| **Depends On** | TASK-016, TASK-064 |
| **Priority** | P1 |
| **Status** | not-started |

Add an "Upload" (⬆) button to the toolbar. On click, open a file picker dialog (via a hidden `<input type="file" multiple>`). When the user selects file(s), POST them to the upload API endpoint (TASK-064). Display success or error feedback per FR-UP-003.

### TASK-062 — Upload Conflict Prevention

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-UP-002 |
| **Depends On** | TASK-064 |
| **Priority** | P1 |
| **Status** | not-started |

On the server side (within the upload endpoint), before writing a file, check if a file with the same name already exists in `raw/`. If it does, reject the upload with HTTP 409 and a JSON error: `{"error": "File already exists: <filename>. Rename the file and try again."}`. On the client side, display the error message to the user.

### TASK-063 — Upload Progress Feedback

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-UP-003 |
| **Depends On** | TASK-061 |
| **Priority** | P1 |
| **Status** | not-started |

While a file upload is in progress, display a toast notification / status message in the toolbar area showing "Uploading <filename>…". On success, show "✓ Uploaded <filename>" for 3 seconds. On failure, show the error message in red for 5 seconds.

### TASK-064 — Implement Upload Server Endpoint

| Field | Value |
|-------|-------|
| **Spec Refs** | FR-UP-004, CON-03, NFR-SEC-001 |
| **Depends On** | TASK-004 |
| **Priority** | P0 |
| **Status** | not-started |

Create a `POST /api/raw/upload` Express endpoint that:

1. Accepts `multipart/form-data` requests (use Express built-in or multer middleware).
2. Resolves the `raw/` directory path (sibling of `wiki/`).
3. Strips all directory separators from uploaded filenames (path-traversal prevention).
4. Checks if the file already exists — returns HTTP 409 if so.
5. Writes the file to `raw/<filename>`.
6. Returns HTTP 200 with `{"uploaded": "<filename>"}` on success.

---

## 13. Phase 10 — Keyboard Accessibility

### TASK-049 — Implement Keyboard Shortcuts

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-USE-003 |
| **Depends On** | TASK-044, TASK-042, TASK-043 |
| **Priority** | P2 |
| **Status** | not-started |

Implement the following keyboard shortcuts:

- `Ctrl+/` (or `Cmd+/` on macOS) — Focus the search input.
- `Escape` — Clear the search input and close the dropdown.
- `Backspace` (when search is not focused) — Navigate back (FR-NAV-005).
- `Home` — Navigate to `index.md` (FR-NAV-006).

---

## 14. Phase 11 — Error Handling & Edge Cases

### TASK-050 — Implement Empty Wiki Graceful Degradation

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-REL-001 |
| **Depends On** | TASK-005 |
| **Priority** | P1 |
| **Status** | not-started |

If `wiki/` contains no `.md` files, display: "No wiki files found. Add Markdown files to the wiki/ directory to get started." in place of the graph panel.

### TASK-051 — Implement File Read Error Handling

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-REL-003 |
| **Depends On** | TASK-006, TASK-018 |
| **Priority** | P1 |
| **Status** | not-started |

If the system fails to read a wiki file (permission error, encoding error):

- Display an error message in the content panel: "Unable to load file: \<file path\>. \<error message\>."
- Render the node in the graph with a red dashed border.

---

## 15. Phase 12 — Performance Optimization

### TASK-052 — Optimize Initial Load Time

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-PERF-001 |
| **Depends On** | TASK-018, TASK-012 |
| **Priority** | P2 |
| **Status** | not-started |

Ensure initial graph rendering (file discovery → link extraction → graph layout → first paint) completes within 3 seconds for a wiki of up to 200 Markdown files (localhost). Profile and optimize the pipeline as needed (parallel fetching, lazy content loading, efficient layout warm-up).

### TASK-053 — Optimize Node Selection Response

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-PERF-002 |
| **Depends On** | TASK-040 |
| **Priority** | P2 |
| **Status** | not-started |

Ensure that when the user clicks a node, the highlight update and content panel rendering begin within 200ms. Optimize content fetch (caching) and DOM updates.

### TASK-054 — Optimize Graph Interaction Frame Rate

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-PERF-003 |
| **Depends On** | TASK-023, TASK-024, TASK-025 |
| **Priority** | P2 |
| **Status** | not-started |

Maintain ≥30 FPS during pan, zoom, and node drag for graphs of up to 200 nodes and 1000 edges. Profile rendering; consider Canvas or WebGL rendering if SVG performance is insufficient.

---

## 16. Phase 13 — Accessibility & Visual Polish

### TASK-055 — Ensure Color Contrast Compliance

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-USE-004 |
| **Depends On** | TASK-019 |
| **Priority** | P2 |
| **Status** | not-started |

Verify that all text labels on nodes have a contrast ratio of ≥4.5:1 against the node fill color (WCAG 2.1 AA). Adjust label color (black or white) per node type as needed.

---

## 17. Phase 14 — Portability & Cross-Browser Testing

### TASK-056 — Cross-Browser Testing

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-PORT-001 |
| **Depends On** | All previous tasks |
| **Priority** | P2 |
| **Status** | not-started |

Verify the application functions correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari (desktop).

### TASK-057 — Cross-Platform Testing

| Field | Value |
|-------|-------|
| **Spec Refs** | NFR-PORT-002 |
| **Depends On** | All previous tasks |
| **Priority** | P2 |
| **Status** | not-started |

Verify the application functions correctly on macOS, Windows, and Linux with a supported browser and Node.js v18+.

---

## 18. Traceability Matrix — Requirements to Tasks

The following table maps every specification requirement to its implementing task(s). All 69 requirements plus 4 constraints are covered.

### Functional Requirements

| Requirement | Description | Task(s) |
|-------------|-------------|---------|
| FR-GC-001 | File Discovery | TASK-005, TASK-008 |
| FR-GC-002 | Link Extraction | TASK-010 |
| FR-GC-003 | Link Resolution | TASK-011 |
| FR-GC-004 | Node Creation | TASK-012 |
| FR-GC-005 | Edge Creation | TASK-012 |
| FR-GC-006 | Duplicate Edge Suppression | TASK-012 |
| FR-GC-007 | External Link Exclusion | TASK-010 |
| FR-GC-008 | Broken Link Handling | TASK-013 |
| FR-GC-009 | Frontmatter Parsing | TASK-009 |
| FR-GV-001 | Graph Rendering | TASK-018 |
| FR-GV-002 | Node Representation | TASK-018 |
| FR-GV-003 | Node Type Color Coding | TASK-019 |
| FR-GV-004 | Edge Rendering | TASK-020 |
| FR-GV-005 | Active Node Highlight | TASK-021 |
| FR-GV-006 | Default Selection | TASK-022 |
| FR-GV-007 | Pan | TASK-023 |
| FR-GV-008 | Zoom | TASK-024 |
| FR-GV-009 | Node Drag | TASK-025 |
| FR-GV-010 | Hover Tooltip | TASK-026 |
| FR-GV-011 | Edge Highlight on Hover | TASK-027 |
| FR-GV-012 | Fit-to-View | TASK-028 |
| FR-GV-013 | Zoom Controls | TASK-029 |
| FR-GV-014 | Node Type Legend | TASK-030 |
| FR-CR-001 | Markdown to HTML | TASK-032 |
| FR-CR-002 | HTML Rendering Fidelity | TASK-032 |
| FR-CR-003 | Frontmatter Exclusion | TASK-033 |
| FR-CR-004 | Internal Link Interactivity | TASK-034 |
| FR-CR-005 | External Link Handling | TASK-035 |
| FR-CR-006 | Frontmatter Metadata Bar | TASK-036 |
| FR-NAV-001 | Node Click Selection | TASK-039 |
| FR-NAV-002 | Graph-Content Synchronization | TASK-040 |
| FR-NAV-003 | Content-to-Graph Navigation | TASK-041 |
| FR-NAV-004 | Breadcrumb Trail | TASK-017 |
| FR-NAV-005 | Back Navigation | TASK-042 |
| FR-NAV-006 | Home Navigation | TASK-043 |
| FR-SF-001 | Node Search | TASK-044 |
| FR-SF-002 | Search Result Selection | TASK-045 |
| FR-SF-003 | Type Filter | TASK-046 |
| FR-SF-004 | Filter Persistence | TASK-047 |
| FR-RF-001 | Refresh Graph | TASK-058 |
| FR-RF-002 | Refresh State Preservation | TASK-059 |
| FR-RF-003 | Refresh Visual Feedback | TASK-060 |
| FR-UP-001 | Upload File to Raw Directory | TASK-061 |
| FR-UP-002 | Upload Conflict Prevention | TASK-062 |
| FR-UP-003 | Upload Progress Feedback | TASK-063 |
| FR-UP-004 | Upload Server Endpoint | TASK-064 |
| FR-GS-001 | Statistics Display | TASK-048 |

### Non-Functional Requirements

| Requirement | Description | Task(s) |
|-------------|-------------|---------|
| NFR-PERF-001 | Initial Load Time | TASK-052 |
| NFR-PERF-002 | Node Selection Response | TASK-053 |
| NFR-PERF-003 | Interaction Fluency | TASK-054 |
| NFR-USE-001 | Responsive Layout | TASK-015 |
| NFR-USE-002 | Panel Resize | TASK-014 |
| NFR-USE-003 | Keyboard Accessibility | TASK-049 |
| NFR-USE-004 | Color Contrast | TASK-055 |
| NFR-REL-001 | Empty Wiki Degradation | TASK-050 |
| NFR-REL-002 | Malformed Frontmatter | TASK-009 |
| NFR-REL-003 | File Read Error | TASK-051 |
| NFR-PORT-001 | Browser Support | TASK-056 |
| NFR-PORT-002 | OS Independence | TASK-057 |
| NFR-PORT-003 | No External Services | TASK-002, TASK-007 |
| NFR-SEC-001 | Read-Only Operation (Wiki) | TASK-006, TASK-064 |
| NFR-SEC-002 | HTML Sanitization | TASK-038 |
| NFR-SEC-003 | Local Network Only | TASK-004 |
| NFR-MAINT-001 | Dependency Minimization | TASK-002 |
| NFR-MAINT-002 | Single Command Start | TASK-001, TASK-004 |

### Interface Requirements

| Requirement | Description | Task(s) |
|-------------|-------------|---------|
| IR-LAY-001 | Two-Panel Layout | TASK-014 |
| IR-LAY-002 | Default Split Ratio | TASK-014 |
| IR-LAY-003 | Toolbar | TASK-016, TASK-058, TASK-061 |
| IR-LAY-004 | Breadcrumb Bar | TASK-017 |
| IR-GP-001 | Graph Panel Content | TASK-029, TASK-030, TASK-048 |
| IR-GP-002 | Graph Panel Background | TASK-018 |
| IR-GP-003 | Node Label Visibility | TASK-031 |
| IR-CP-001 | Content Panel Structure | TASK-037 |
| IR-CP-002 | Content Panel Scrollability | TASK-037 |
| IR-CP-003 | Content Panel Typography | TASK-037 |
| IR-CP-004 | Code Block Styling | TASK-037 |

### Constraints

| Constraint | Description | Task(s) |
|------------|-------------|---------|
| CON-01 | Node.js / JavaScript | TASK-001, TASK-002 |
| CON-02 | Client-Side Rendering | TASK-003, TASK-004 |
| CON-03 | No Wiki File Modification; Raw Upload Only | TASK-006, TASK-064 |
| CON-04 | Markdown Link Format | TASK-010, TASK-011 |

---

## Task Summary

| Metric | Count |
|--------|-------|
| Total tasks | 64 |
| Phase 1 — Setup | 3 |
| Phase 2 — Server | 4 |
| Phase 3 — Graph Construction | 6 |
| Phase 4 — Layout | 4 |
| Phase 5 — Graph Visualization | 14 |
| Phase 6 — Content Rendering | 7 |
| Phase 7 — Navigation | 5 |
| Phase 8 — Search & Filter | 4 |
| Phase 9 — Statistics | 1 |
| Phase 9a — Refresh | 3 |
| Phase 9b — File Upload | 4 |
| Phase 10 — Keyboard | 1 |
| Phase 11 — Error Handling | 2 |
| Phase 12 — Performance | 3 |
| Phase 13 — Accessibility | 1 |
| Phase 14 — Testing | 2 |

| Priority | Count |
|----------|-------|
| P0 (blocker) | 21 |
| P1 (high) | 28 |
| P2 (medium) | 15 |
| P3 (low) | 0 |

### Specification Coverage

All **76 requirements** and **4 constraints** from [specification.md](specification.md) are mapped to at least one task. No requirements are unaddressed.
