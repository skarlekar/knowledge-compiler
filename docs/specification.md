# Knowledge Compiler — Software Requirements Specification

**Document ID:** SPEC-WIKIGRAPH-001
**Version:** 1.0
**Date:** 2026-04-10
**Author:** LLM (generated per user request)
**Status:** Draft

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Interface Requirements](#5-interface-requirements)
6. [Traceability Matrix](#6-traceability-matrix)
7. [Appendix](#7-appendix)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for the **Knowledge Compiler**, an interactive web application that visualizes the link structure of a Markdown-based knowledge base as a navigable graph and renders the content of selected files in a companion panel. The specification follows the **EARS (Easy Approach to Requirements Syntax)** format to minimize ambiguity.

### 1.2 Scope

The Knowledge Compiler shall:

- Parse all Markdown files under the `wiki/` directory and extract inter-file links.
- Render the resulting link structure as an interactive node-edge graph.
- Display the rendered Markdown content of the currently selected node in a content panel.
- Default to selecting `wiki/index.md` on initial load.

The application is a read-only viewer. It shall not create, edit, or delete Markdown files.

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| **Wiki file** | Any file with a `.md` extension located under the `wiki/` directory or its subdirectories. |
| **Node** | A visual element in the graph representing exactly one wiki file. |
| **Edge** | A visual element in the graph representing a hyperlink from one wiki file to another wiki file. |
| **Active node** | The single node currently selected by the user; its content is displayed in the content panel. |
| **Content panel** | The UI panel that renders the Markdown content of the active node. |
| **Graph panel** | The UI panel that displays the interactive node-edge graph. |
| **Frontmatter** | YAML metadata between `---` delimiters at the top of a Markdown file. |
| **EARS** | Easy Approach to Requirements Syntax — a structured natural language notation for requirements. Uses templates: *Ubiquitous* ("The \<system\> shall …"), *Event-driven* ("When \<trigger\>, the \<system\> shall …"), *State-driven* ("While \<state\>, the \<system\> shall …"), *Unwanted behaviour* ("If \<condition\>, then the \<system\> shall …"), *Optional* ("Where \<feature\>, the \<system\> shall …"). |
| **Graph layout** | The algorithm that determines the spatial positions of nodes and edges (e.g., force-directed). |
| **Relative link** | A standard Markdown link of the form `[text](relative/path.md)` where the path is relative to the file containing the link. |

### 1.4 References

| ID | Title | Description |
|----|-------|------------|
| REF-01 | `CLAUDE.md` | Knowledge base schema — defines wiki directory layout, linking conventions, page types, and frontmatter format. |
| REF-02 | `wiki/index.md` | Master catalog of all wiki pages — the default selected node. |
| REF-03 | EARS Specification | Mavin et al., "Easy Approach to Requirements Syntax (EARS)", 2009 — the requirements notation used in this document. |

### 1.5 EARS Template Key

Requirements in this document use the following EARS sentence patterns:

| Pattern | Template | Use |
|---------|----------|-----|
| **Ubiquitous** | The system shall \<action\>. | Always-active behaviour. |
| **Event-driven** | When \<trigger\>, the system shall \<action\>. | Response to a specific event. |
| **State-driven** | While \<condition\>, the system shall \<action\>. | Behaviour during a state. |
| **Unwanted** | If \<unwanted condition\>, then the system shall \<action\>. | Handling of error or edge case. |
| **Optional** | Where \<feature is enabled\>, the system shall \<action\>. | Configurable behaviour. |

---

## 2. System Overview

### 2.1 User Personas

| Persona | Description | Goals |
|---------|-------------|-------|
| **Knowledge Consumer** | A team member (business or technical) who reads the knowledge base to understand concepts, decisions, and their relationships. | Visually explore how wiki pages connect; quickly navigate to and read specific pages. |
| **Knowledge Curator** | The human who curates raw sources and directs the LLM to build the wiki (see REF-01). | Validate wiki structure: identify orphan pages, broken links, heavily connected hubs, and overall graph health. |

### 2.2 Product Functions

| Function | Description |
|----------|------------|
| F1. Graph Construction | Parse wiki files, extract links, and build an in-memory graph model. |
| F2. Graph Visualization | Render the graph model as an interactive node-edge diagram. |
| F3. Content Rendering | Render the Markdown content of the active node as formatted HTML. |
| F4. Navigation | Allow the user to select nodes, follow links, and traverse the graph. |
| F5. Visual Encoding | Encode page metadata (type, tags, confidence) as visual properties of nodes. |
| F6. Refresh | Re-scan wiki files and rebuild the graph without a full page reload. |
| F7. File Upload | Upload files from the local filesystem to the `raw/` directory. |

### 2.3 Constraints

| ID | Constraint |
|----|-----------|
| CON-01 | The application shall be implemented using Node.js and/or JavaScript for the front-end. |
| CON-02 | The application shall run entirely in the browser after initial page load (client-side rendering). A lightweight Node.js server may serve static files and provide an API to read wiki files. |
| CON-03 | The application shall not modify any files in the `wiki/` directory. The application may add files to the `raw/` directory via the upload feature (FR-UP-001) but shall not modify or delete existing files in `raw/`. |
| CON-04 | The application shall support the Markdown link format defined in REF-01: standard Markdown relative links `[text](relative/path.md)` with `.md` extensions relative to the current file's location. |

---

## 3. Functional Requirements

### 3.1 Graph Construction

#### FR-GC-001 — File Discovery

The system shall recursively scan the `wiki/` directory and identify all files with the `.md` extension as wiki files.

#### FR-GC-002 — Link Extraction

The system shall parse each wiki file and extract all standard Markdown links matching the pattern `[display text](target-path.md)` where `target-path.md` is a relative path to another file under `wiki/`.

#### FR-GC-003 — Link Resolution

The system shall resolve each extracted link target relative to the directory of the file containing the link, producing an absolute path within the `wiki/` directory tree.

#### FR-GC-004 — Node Creation

The system shall create exactly one node for each discovered wiki file. Each node shall store the file's relative path (from the `wiki/` root), the file's display name (derived from the frontmatter `title` field if present, otherwise from the filename without extension), and the file's `type` and `tags` from frontmatter if present.

#### FR-GC-005 — Edge Creation

The system shall create one directed edge for each resolved link from a source wiki file to a target wiki file. The edge shall point from the source node to the target node.

#### FR-GC-006 — Duplicate Edge Suppression

If a source file contains multiple links to the same target file, the system shall create only one edge between those two nodes.

#### FR-GC-007 — External Link Exclusion

The system shall exclude links whose target begins with `http://`, `https://`, or `#` (anchor-only) from graph edge creation.

#### FR-GC-008 — Broken Link Handling

If a resolved link target does not correspond to any discovered wiki file, then the system shall exclude that link from edge creation and shall log the broken link to the browser console with the source file path, link text, and unresolved target path.

#### FR-GC-009 — Frontmatter Parsing

The system shall parse YAML frontmatter (content between the first two `---` lines) from each wiki file and extract the following fields when present: `title`, `type`, `tags`, `confidence`, `created`, `updated`.

### 3.2 Graph Visualization

#### FR-GV-001 — Graph Rendering

The system shall render the graph model as a 2D interactive node-edge diagram within the graph panel using a force-directed layout algorithm.

#### FR-GV-002 — Node Representation

The system shall render each node as a labeled shape. The label shall display the node's display name (from FR-GC-004).

#### FR-GV-003 — Node Type Colour Coding

The system shall assign a distinct fill colour to each node based on its `type` frontmatter value. The following mappings shall be used:

| Type | Colour | Hex |
|------|--------|-----|
| `concept` | Blue | `#4A90D9` |
| `entity` | Green | `#50B86C` |
| `summary` | Orange | `#E8913A` |
| `synthesis` | Purple | `#9B59B6` |
| `journal` | Teal | `#17A2B8` |
| `presentation` | Coral | `#E85D75` |
| `index` | Gold | `#F1C40F` |
| `log` | Dark Grey | `#6C757D` |
| `dashboard` | Indigo | `#6610F2` |
| `flashcards` | Pink | `#E83E8C` |
| Other / missing | Light Grey | `#95A5A6` |

If a wiki file's `type` frontmatter value is absent, the system shall infer the type from the file's parent directory name (e.g., a file in `wiki/concepts/` shall be treated as type `concept`). If neither frontmatter type nor parent directory yields a known type, the system shall assign the type `other`.

#### FR-GV-014 — Node Type Legend

The system shall display a legend within the graph panel that lists every node type present in the current graph. Each legend entry shall show the type's colour swatch (a filled square or circle matching the node fill colour from FR-GV-003) and the type label. The legend shall update dynamically: when a type filter (FR-SF-003) hides all nodes of a given type, that type's legend entry shall appear dimmed (50% opacity). The legend shall be positioned in the top-right corner of the graph panel and shall not overlap with graph nodes.

#### FR-GV-004 — Edge Rendering

The system shall render each edge as a directed line (with arrowhead) from the source node to the target node.

#### FR-GV-005 — Active Node Highlight

When a node is the active node, the system shall visually distinguish it from other nodes by applying a highlight border (3px solid, colour `#E74C3C`) and scaling the node to 1.3× its default size.

#### FR-GV-006 — Default Selection

When the application loads, the system shall set the node representing `wiki/index.md` as the active node.

#### FR-GV-007 — Pan

The system shall allow the user to pan the graph view by clicking and dragging on the graph panel background.

#### FR-GV-008 — Zoom

The system shall allow the user to zoom the graph view in and out using the mouse scroll wheel or trackpad pinch gesture. The zoom range shall be between 0.1× and 5× of the default scale.

#### FR-GV-009 — Node Drag

The system shall allow the user to reposition individual nodes by clicking and dragging them. When a node is dragged, the force-directed layout shall treat the dragged node's position as fixed until it is released.

#### FR-GV-010 — Hover Tooltip

When the user hovers the mouse pointer over a node for at least 300 milliseconds, the system shall display a tooltip containing: (a) the node's file path relative to `wiki/`, (b) the node's `type`, and (c) the number of inbound and outbound edges.

#### FR-GV-011 — Edge Highlight on Hover

When the user hovers the mouse pointer over a node, the system shall visually highlight all edges connected to that node (both inbound and outbound) and dim all other edges.

#### FR-GV-012 — Fit-to-View

The system shall provide a "Fit" button that, when clicked, adjusts the zoom and pan so that all nodes are visible within the graph panel with a 10% margin.

#### FR-GV-013 — Zoom Controls

The system shall provide "Zoom In" (+) and "Zoom Out" (−) buttons that, when clicked, increase or decrease the zoom level by 20% of the current scale, respectively, centred on the graph panel's midpoint.

### 3.3 Content Rendering

#### FR-CR-001 — Markdown to HTML

While the active node is set, the system shall read the corresponding wiki file's content and render it as formatted HTML in the content panel.

#### FR-CR-002 — HTML Rendering Fidelity

The system shall render the following Markdown elements correctly as HTML: headings (h1–h6), bold, italic, inline code, code blocks with syntax highlighting, unordered lists, ordered lists, tables, blockquotes, horizontal rules, and images (if present).

#### FR-CR-003 — Frontmatter Exclusion

The system shall not render the YAML frontmatter block (content between the opening and closing `---` lines) as visible text in the content panel.

#### FR-CR-004 — Internal Link Interactivity

When the rendered content contains a Markdown link that resolves to another wiki file, the system shall render that link as a clickable element. When the user clicks such a link, the system shall set the linked wiki file's node as the active node (triggering FR-GV-005, FR-CR-001, and FR-NAV-002).

#### FR-CR-005 — External Link Handling

When the rendered content contains a link whose target begins with `http://` or `https://`, the system shall render it as a standard hyperlink that opens in a new browser tab.

#### FR-CR-006 — Frontmatter Metadata Bar

The system shall display a metadata bar above the rendered Markdown content showing the following frontmatter fields when present: `title`, `type` (with the corresponding colour badge from FR-GV-003), `tags` (as individual badges), `confidence`, and `updated`.

### 3.4 Navigation

#### FR-NAV-001 — Node Click Selection

When the user clicks a node in the graph panel, the system shall set that node as the active node.

#### FR-NAV-002 — Graph-Content Synchronization

When the active node changes, the system shall: (a) scroll or center the graph panel so the active node is visible, (b) apply the active node highlight (FR-GV-005) and remove the highlight from the previously active node, and (c) render the new active node's content in the content panel (FR-CR-001).

#### FR-NAV-003 — Content-to-Graph Navigation

When the user clicks an internal wiki link in the content panel (FR-CR-004), the system shall set the linked node as the active node, triggering FR-NAV-002.

#### FR-NAV-004 — Breadcrumb Trail

The system shall maintain and display a breadcrumb trail of the last 10 active nodes visited in the current session. Each breadcrumb entry shall display the node's display name as a clickable link that, when clicked, sets that node as the active node.

#### FR-NAV-005 — Back Navigation

The system shall provide a "Back" button that, when clicked, sets the previously active node as the current active node (navigating backward through the breadcrumb trail). If there is no previous node, the "Back" button shall be disabled.

#### FR-NAV-006 — Home Navigation

The system shall provide a "Home" button that, when clicked, sets the `wiki/index.md` node as the active node.

### 3.5 Search and Filter

#### FR-SF-001 — Node Search

The system shall provide a text search input field. When the user types a query of at least 2 characters, the system shall display a dropdown list of all nodes whose display name or file path contains the query string (case-insensitive match).

#### FR-SF-002 — Search Result Selection

When the user selects an item from the search dropdown, the system shall set the corresponding node as the active node.

#### FR-SF-003 — Type Filter

The system shall provide a set of toggle buttons (one per node `type` value present in the graph: concept, entity, summary, synthesis, journal, presentation, index, log, dashboard, flashcards, other). When a type toggle is deactivated, the system shall hide all nodes of that type and their connected edges from the graph panel. The active node shall not be hidden regardless of filter state. Each toggle button shall display the corresponding colour swatch from FR-GV-003 beside the type label.

#### FR-SF-004 — Filter Persistence

While a type filter is active, the system shall maintain the filter state across node selections. When a filter is toggled, the graph layout shall re-stabilize to account for the changed set of visible nodes.

### 3.6 Refresh

#### FR-RF-001 — Refresh Graph

The system shall provide a "Refresh" button in the toolbar. When clicked, the system shall re-execute the full graph construction pipeline (FR-GC-001 through FR-GC-009) to discover any new, modified, or deleted wiki files and rebuild the graph model accordingly.

#### FR-RF-002 — Refresh State Preservation

When the graph is refreshed (FR-RF-001), the system shall preserve the user's current active node selection if the corresponding file still exists. If the previously active node's file has been deleted, the system shall fall back to `wiki/index.md` (FR-GV-006).

#### FR-RF-003 — Refresh Visual Feedback

While the refresh operation is in progress, the system shall display a visual indicator (e.g., spinner or pulsing icon on the Refresh button) to inform the user that the graph is being rebuilt.

### 3.7 File Upload

#### FR-UP-001 — Upload File to Raw Directory

The system shall provide an "Upload" button in the toolbar. When clicked, the system shall present a file picker dialog allowing the user to select one or more files from their local filesystem. The system shall upload each selected file to the `raw/` directory on the server.

#### FR-UP-002 — Upload Conflict Prevention

If a file with the same name already exists in the `raw/` directory, then the system shall reject the upload for that file and display an error message: "File already exists: \<filename\>. Rename the file and try again."

#### FR-UP-003 — Upload Progress Feedback

While a file upload is in progress, the system shall display a progress indicator. On successful completion, the system shall display a confirmation message showing the uploaded filename(s). On failure, the system shall display an error message with the reason.

#### FR-UP-004 — Upload Server Endpoint

The server shall provide a `POST /api/raw/upload` endpoint that accepts `multipart/form-data` file uploads and writes the file(s) to the `raw/` directory. The endpoint shall enforce: (a) the `raw/` directory as the sole write target, (b) no path traversal (filename only, no directory separators), and (c) rejection of uploads that would overwrite existing files.

### 3.8 Graph Statistics

#### FR-GS-001 — Statistics Display

The system shall display a statistics bar (either in the graph panel footer or as a collapsible sidebar section) showing: (a) total number of nodes, (b) total number of edges, (c) number of nodes per type, and (d) number of orphan nodes (nodes with zero inbound edges, excluding `index.md`).

---

## 4. Non-Functional Requirements

### 4.1 Performance

#### NFR-PERF-001 — Initial Load Time

The system shall complete initial graph rendering (file discovery, link extraction, graph layout, and first paint) within 3 seconds for a wiki of up to 200 Markdown files, when served from localhost.

#### NFR-PERF-002 — Node Selection Response

When the user clicks a node, the system shall update the active node highlight and begin rendering the content panel within 200 milliseconds.

#### NFR-PERF-003 — Interaction Fluency

While the user pans, zooms, or drags nodes, the system shall maintain a frame rate of at least 30 frames per second for a graph of up to 200 nodes and 1000 edges.

### 4.2 Usability

#### NFR-USE-001 — Responsive Layout

The system shall adapt the two-panel layout to viewport widths from 1024px to 2560px. At viewports below 1024px, the system shall stack the panels vertically (graph panel on top, content panel below).

#### NFR-USE-002 — Panel Resize

The system shall allow the user to resize the relative width of the graph panel and content panel by dragging a divider between them. The minimum width of either panel shall be 300px.

#### NFR-USE-003 — Keyboard Accessibility

The system shall support the following keyboard shortcuts:
- `Ctrl+/` (or `Cmd+/` on macOS) — Focus the search input.
- `Escape` — Clear the search input and close the dropdown.
- `Backspace` (when search is not focused) — Navigate back (FR-NAV-005).
- `Home` — Navigate to index.md (FR-NAV-006).

#### NFR-USE-004 — Colour Contrast

All text labels on nodes shall have a contrast ratio of at least 4.5:1 against the node fill colour, per WCAG 2.1 AA.

### 4.3 Reliability

#### NFR-REL-001 — Graceful Degradation on Empty Wiki

If the `wiki/` directory contains no `.md` files, then the system shall display an informational message: "No wiki files found. Add Markdown files to the wiki/ directory to get started." in place of the graph panel.

#### NFR-REL-002 — Malformed Frontmatter Handling

If a wiki file contains malformed YAML frontmatter (unparseable YAML), then the system shall use default values (title = filename, type = "other", tags = [], confidence = null) and shall log a warning to the browser console.

#### NFR-REL-003 — File Read Error

If the system fails to read a wiki file (permission error, encoding error), then the system shall display an error message in the content panel: "Unable to load file: \<file path\>. \<error message\>." and shall render the node in the graph with a red dashed border.

### 4.4 Portability

#### NFR-PORT-001 — Browser Support

The system shall function correctly in the latest stable versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari (desktop).

#### NFR-PORT-002 — Operating System Independence

The system shall function correctly on macOS, Windows, and Linux, provided a supported browser and Node.js (v18 or later) are available.

#### NFR-PORT-003 — No External Services

The system shall not depend on any external web services, APIs, or CDNs at runtime. All dependencies shall be bundled or served locally.

### 4.5 Security

#### NFR-SEC-001 — Read-Only Operation (Wiki)

The system shall not provide any mechanism to create, modify, or delete files in the `wiki/` directory. The system may accept file uploads to the `raw/` directory (FR-UP-001) but shall not modify or delete existing `raw/` files.

#### NFR-SEC-002 — HTML Sanitization

The system shall sanitize all user-controlled input and Markdown-rendered HTML to prevent Cross-Site Scripting (XSS). Script tags and event handler attributes shall be stripped from rendered content.

#### NFR-SEC-003 — Local Network Only

The default server configuration shall bind to `localhost` (127.0.0.1) only.

### 4.6 Maintainability

#### NFR-MAINT-001 — Dependency Minimization

The front-end shall use no more than 3 major runtime dependencies (e.g., a graph visualization library, a Markdown rendering library, and a YAML parsing library).

#### NFR-MAINT-002 — Single Command Start

The system shall be startable with a single terminal command (e.g., `npm start`) after initial dependency installation (`npm install`).

---

## 5. Interface Requirements

### 5.1 Layout

#### IR-LAY-001 — Two-Panel Layout

The system shall present a two-panel layout: a **graph panel** on the left and a **content panel** on the right, separated by a draggable divider.

#### IR-LAY-002 — Default Split Ratio

When the application loads, the system shall allocate 45% of the viewport width to the graph panel and 55% to the content panel.

#### IR-LAY-003 — Toolbar

The system shall display a toolbar above the panels containing: (a) the application title "Knowledge Compiler", (b) the search input (FR-SF-001), (c) type filter toggles (FR-SF-003), (d) the "Refresh" button (FR-RF-001), (e) the "Upload" button (FR-UP-001), (f) the "Home" button (FR-NAV-006), (g) the "Back" button (FR-NAV-005), and (h) the "Fit" button (FR-GV-012).

#### IR-LAY-004 — Breadcrumb Bar

The system shall display the breadcrumb trail (FR-NAV-004) horizontally between the toolbar and the panels.

### 5.2 Graph Panel

#### IR-GP-001 — Panel Content

The graph panel shall contain: (a) the interactive graph visualization, (b) the node type legend (FR-GV-014) positioned in the top-right corner, (c) zoom controls (FR-GV-013) positioned in the bottom-right corner as floating buttons, and (d) the statistics bar (FR-GS-001) positioned at the bottom.

#### IR-GP-002 — Background

The graph panel shall have a light neutral background (colour `#F8F9FA`).

#### IR-GP-003 — Node Label Visibility

Node labels shall be visible at zoom levels ≥ 0.5×. At zoom levels below 0.5×, node labels shall be hidden to avoid visual clutter; only node shapes shall be rendered.

### 5.3 Content Panel

#### IR-CP-001 — Panel Structure

The content panel shall contain, from top to bottom: (a) the metadata bar (FR-CR-006), (b) the rendered Markdown content, and (c) no other elements.

#### IR-CP-002 — Scrollability

The content panel shall be independently scrollable when the rendered content exceeds the panel height.

#### IR-CP-003 — Typography

The content panel shall render text using a readable sans-serif font (system default or a bundled web font), with a base font size of 16px, line height of 1.6, and a maximum content width of 800px centred within the panel.

#### IR-CP-004 — Code Block Styling

Code blocks in the content panel shall use a monospace font, have a light grey background (`#F5F5F5`), contrasting border, and horizontal scrolling if the content overflows.

### 5.4 Interaction Summary

The following table summarizes all user actions and corresponding system responses, connecting back to the functional requirements.

| # | User Action | UI Location | System Response | Requirement(s) |
|---|-------------|-------------|-----------------|-----------------|
| 1 | Application loads | — | Graph renders with `index.md` selected; content panel shows `index.md` content. | FR-GV-001, FR-GV-006, FR-CR-001 |
| 2 | Click a node | Graph panel | Node becomes active; content panel updates. | FR-NAV-001, FR-NAV-002, FR-CR-001 |
| 3 | Click an internal link in content | Content panel | Linked node becomes active; graph centres on it; content updates. | FR-CR-004, FR-NAV-003, FR-NAV-002 |
| 4 | Click an external link in content | Content panel | Link opens in a new browser tab. | FR-CR-005 |
| 5 | Drag on graph background | Graph panel | Graph view pans. | FR-GV-007 |
| 6 | Scroll wheel on graph | Graph panel | Graph view zooms in/out. | FR-GV-008 |
| 7 | Drag a node | Graph panel | Node repositions; layout adjusts. | FR-GV-009 |
| 8 | Hover over a node (300ms) | Graph panel | Tooltip appears; connected edges highlight. | FR-GV-010, FR-GV-011 |
| 9 | Click "Fit" button | Toolbar | View adjusts to show all nodes. | FR-GV-012 |
| 10 | Click "+" or "−" buttons | Graph panel | Zoom level increases or decreases by 20%. | FR-GV-013 |
| 11 | Type in search input | Toolbar | Dropdown shows matching nodes. | FR-SF-001 |
| 12 | Select search result | Toolbar | Corresponding node becomes active. | FR-SF-002 |
| 13 | Toggle a type filter | Toolbar | Nodes of that type are shown/hidden. | FR-SF-003, FR-SF-004 |
| 14 | Click "Back" button | Toolbar | Previous node in breadcrumb becomes active. | FR-NAV-005 |
| 15 | Click "Home" button | Toolbar | `index.md` becomes active. | FR-NAV-006 |
| 16 | Click a breadcrumb entry | Breadcrumb bar | That node becomes active. | FR-NAV-004 |
| 17 | Drag the panel divider | Between panels | Panel widths adjust. | NFR-USE-002 |
| 18 | Click "Refresh" button | Toolbar | Graph rebuilds from wiki/ directory; active node preserved if still exists. | FR-RF-001, FR-RF-002, FR-RF-003 |
| 19 | Click "Upload" button | Toolbar | File picker opens; selected files uploaded to raw/. | FR-UP-001, FR-UP-002, FR-UP-003, FR-UP-004 |

---

## 6. Traceability Matrix

### 6.1 Requirements to Source

| Requirement ID | Source | Notes |
|----------------|--------|-------|
| FR-GC-001 through FR-GC-009 | User request; REF-01 (CLAUDE.md linking conventions) | Wiki structure and linking rules per CLAUDE.md |
| FR-GV-001 through FR-GV-013 | User request ("interactive graph") | Graph visualization features |
| FR-CR-001 through FR-CR-006 | User request ("content panel … rendered") | Content rendering features |
| FR-NAV-001 through FR-NAV-006 | User request ("active node"); implied usability | Navigation between graph and content |
| FR-SF-001 through FR-SF-004 | Implied usability (curator persona) | Search and filter features |
| FR-RF-001 through FR-RF-003 | User request ("refresh button") | Live graph rebuild without page reload |
| FR-UP-001 through FR-UP-004 | User request ("upload button to raw folder") | File upload to raw/ directory |
| FR-GS-001 | Implied usability (curator persona) | Graph health visibility |
| NFR-PERF-001 through NFR-PERF-003 | Implied quality | Performance targets |
| NFR-USE-001 through NFR-USE-004 | Implied quality | Usability targets |
| NFR-REL-001 through NFR-REL-003 | Implied quality | Error handling |
| NFR-PORT-001 through NFR-PORT-003 | Implied quality; user request ("node.js … javascript") | Portability targets |
| NFR-SEC-001 through NFR-SEC-003 | REF-01 ("never modify files in raw/"); implied security; user request (upload) | Security constraints |
| NFR-MAINT-001, NFR-MAINT-002 | Implied quality | Maintainability targets |
| IR-LAY-001 through IR-LAY-004 | User request ("at least two panels") | Layout structure |
| IR-GP-001 through IR-GP-003 | Implied from FR-GV-*; user request (legend) | Graph panel details |
| IR-CP-001 through IR-CP-004 | Implied from FR-CR-* | Content panel details |

### 6.2 Requirements ID Index

| Category | ID Range | Count |
|----------|----------|-------|
| Graph Construction | FR-GC-001 to FR-GC-009 | 9 |
| Graph Visualization | FR-GV-001 to FR-GV-014 | 14 |
| Content Rendering | FR-CR-001 to FR-CR-006 | 6 |
| Navigation | FR-NAV-001 to FR-NAV-006 | 6 |
| Search & Filter | FR-SF-001 to FR-SF-004 | 4 |
| Refresh | FR-RF-001 to FR-RF-003 | 3 |
| File Upload | FR-UP-001 to FR-UP-004 | 4 |
| Graph Statistics | FR-GS-001 | 1 |
| Performance | NFR-PERF-001 to NFR-PERF-003 | 3 |
| Usability | NFR-USE-001 to NFR-USE-004 | 4 |
| Reliability | NFR-REL-001 to NFR-REL-003 | 3 |
| Portability | NFR-PORT-001 to NFR-PORT-003 | 3 |
| Security | NFR-SEC-001 to NFR-SEC-003 | 3 |
| Maintainability | NFR-MAINT-001 to NFR-MAINT-002 | 2 |
| Interface — Layout | IR-LAY-001 to IR-LAY-004 | 4 |
| Interface — Graph Panel | IR-GP-001 to IR-GP-003 | 3 |
| Interface — Content Panel | IR-CP-001 to IR-CP-004 | 4 |
| **Total** | | **76** |

---

## 7. Appendix

### 7.1 Current Wiki File Inventory

The following files exist under `wiki/` as of 2026-04-10 and constitute the initial dataset:

| File Path (relative to `wiki/`) | Type | Outbound Links |
|--------------------------------|------|----------------|
| `index.md` | index | 11 |
| `concepts/context-graph.md` | concept | 7 |
| `concepts/decision-trace.md` | concept | 4 |
| `concepts/graph-database.md` | concept | 5 |
| `concepts/vector-embedding.md` | concept | 5 |
| `concepts/community-detection.md` | concept | 5 |
| `concepts/node-similarity.md` | concept | 5 |
| `entities/aws-neptune.md` | entity | 7 |
| `entities/pgvector.md` | entity | 5 |
| `summaries/context-graphs.md` | summary | 12 |
| `synthesis/community-detection-vs-node-similarity.md` | synthesis | 4 |
| `synthesis/graph-vs-vector-similarity.md` | synthesis | 5 |
| `log.md` | log | 0 |
| `dashboard.md` | dashboard | 0 |
| `analytics.md` | — | 0 |
| `flashcards.md` | flashcards | 1 |
| `journal/template.md` | journal | 0 |

### 7.2 Node Colour Reference

```
Concept      ████  #4A90D9
Entity       ████  #50B86C
Summary      ████  #E8913A
Synthesis    ████  #9B59B6
Journal      ████  #17A2B8
Presentation ████  #E85D75
Index        ████  #F1C40F
Log          ████  #6C757D
Dashboard    ████  #6610F2
Flashcards   ████  #E83E8C
Other        ████  #95A5A6
```

### 7.3 Suggested Technology Stack

This appendix is informative, not normative. The following libraries satisfy the constraints in CON-01 and NFR-MAINT-001:

| Role | Library | Rationale |
|------|---------|-----------|
| Graph visualization | [D3.js](https://d3js.org/) (d3-force) or [Cytoscape.js](https://js.cytoscape.org/) | Mature, dependency-free, force-directed layout built-in |
| Markdown rendering | [marked](https://marked.js.org/) or [markdown-it](https://github.com/markdown-it/markdown-it) | Lightweight, extensible, tables supported |
| YAML parsing | [js-yaml](https://github.com/nodeca/js-yaml) | Standard YAML parser for frontmatter extraction |
| Static server | [Express](https://expressjs.com/) (minimal) | Serve files + provide file-listing API endpoint |
