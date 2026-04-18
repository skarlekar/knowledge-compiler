# Vault Export & Import — Implementation Plan

**Document ID:** PLAN-EXPORT-001
**Version:** 1.0
**Date:** 2026-04-18
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Design Decisions](#3-design-decisions)
4. [Export Specification](#4-export-specification)
5. [Import Specification](#5-import-specification)
6. [API Specification](#6-api-specification)
7. [UI Specification](#7-ui-specification)
8. [Security Considerations](#8-security-considerations)
9. [File Changes](#9-file-changes)
10. [Implementation Phases](#10-implementation-phases)
11. [Risks and Mitigations](#11-risks-and-mitigations)

---

## 1. Executive Summary

The Knowledge Compiler supports creating vaults through the UI, but has no way to share, back up, or transfer vaults between machines. This plan adds two complementary features:

- **Export**: Download any vault as a self-contained `.kc.zip` archive containing all wiki content, raw sources, skills, and metadata.
- **Import**: Upload a `.kc.zip` archive, specify a target directory, and have the vault extracted and registered automatically.

Together, these enable vault portability (move between machines), backup (download a snapshot), and sharing (send a vault to a colleague). The implementation follows existing patterns: the vault creation modal pattern for the import UI, the multer upload pattern for file handling, and the `vaults.json` registry pattern for vault registration.

---

## 2. Architecture Overview

### 2.1 Export Flow

```
User clicks Export → Browser fetches GET /api/vault/export?vault=<id>
→ Server resolves vault path → Walks directory tree → Generates vault-manifest.json
→ Streams ZIP via archiver → Browser receives blob → Triggers download
```

The server streams the ZIP directly to the response without creating intermediate temp files. The `archiver` library handles streaming ZIP creation with configurable compression.

### 2.2 Import Flow

```
User clicks Import → File picker opens → User selects .kc.zip
→ Import modal opens (pre-populated with file info) → User specifies target path via directory browser
→ User clicks "Import Vault" → Browser uploads via POST /api/vault/import (multipart)
→ Server validates ZIP (magic bytes + manifest) → Extracts to target directory
→ Registers vault in vaults.json → Returns vault metadata → Browser switches to imported vault
```

The server uses multer with disk storage (not memory) for the upload to handle large vaults. Extraction uses `yauzl` with zip-slip prevention. The vault is registered using the same `vaults.json` pattern as vault creation.

### 2.3 Archive Format

The archive is a standard ZIP file with the `.kc.zip` double extension. This makes the file recognizable as a Knowledge Compiler export while remaining openable as a normal ZIP by any file manager.

---

## 3. Design Decisions

### 3.1 Archive Format: ZIP

ZIP was chosen over tar.gz for several reasons:
- **Universal compatibility**: ZIP is natively supported by every OS file manager (Windows Explorer, macOS Finder, Linux file managers)
- **Browser support**: Browsers handle `application/zip` content-type natively and save with the correct extension
- **Library maturity**: `archiver` (creation) and `yauzl` (extraction) are mature, well-maintained Node.js libraries
- **Random access**: ZIP supports random access to entries, enabling manifest-first validation without extracting the entire archive
- **User familiarity**: Non-technical users (knowledge base authors) can inspect archive contents by simply double-clicking

### 3.2 Streaming vs Temp Files

Export uses streaming (archiver pipes directly to HTTP response) to keep memory usage low regardless of vault size. Import uses multer's disk storage (writes upload to `os.tmpdir()`) rather than memory storage to handle large vaults with many PDFs in `raw/`.

### 3.3 Export Scope: Active Vault Only

Export operates on the currently selected vault rather than offering a vault chooser. This is the simplest mental model — the user sees what they're exporting in the graph viewer — and avoids adding a vault chooser to an already-crowded UI.

### 3.4 Import Path Handling

Vault paths in `vaults.json` are absolute and machine-specific. When importing, the user specifies where to place the vault on their machine via the directory browser (same UI pattern as vault creation). The absolute path in `vaults.json` is set to this user-specified target, naturally handling cross-machine portability.

### 3.5 UI Placement

Both Export and Import buttons go in the `toolbar-right` section alongside existing buttons (Refresh, Upload, Back, Home, Fit). This keeps the toolbar pattern consistent and avoids complicating the vault selector area. Import opens a modal for path selection; Export is a direct-action button.

---

## 4. Export Specification

### 4.1 What's Included

| Item | Purpose |
|------|---------|
| `wiki/` | All wiki content (concepts, entities, newsletters, journals, images, etc.) |
| `raw/` | Immutable source documents (PDFs, fetched articles, research logs) |
| `.claude/commands/` | Vault skills (help.md, lint.md, journal.md, template-specific skills) |
| `CLAUDE.md` | Vault schema and LLM instructions |
| `reset-wiki.sh` | Wiki reset script |
| `vault-manifest.json` | Generated metadata file (not on disk — created in-memory during archive creation) |

### 4.2 What's Excluded

| Item | Reason |
|------|--------|
| `.claude/settings.local.json` | Machine-specific permission grants; regenerated on import |
| `.obsidian/` directories | Obsidian editor state, not vault content |
| `.DS_Store` files | macOS filesystem metadata |
| `node_modules/` directories | Dependencies, not content |
| `.git/` directories | Version control state, not content |

### 4.3 Vault Manifest

A `vault-manifest.json` file is generated in-memory and added to the archive root. It is not stored on disk in the vault.

```json
{
  "version": 1,
  "name": "Signal Over Noise",
  "template": "research",
  "purpose": "LLM-maintained knowledge base on Signal Over Noise",
  "exportDate": "2026-04-18T12:00:00.000Z",
  "exportedFrom": "knowledge-compiler"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | Yes | Manifest schema version (currently `1`) |
| `name` | string | Yes | Vault display name |
| `template` | string | Yes | Template type: `research`, `code-analysis`, or `portfolio` |
| `purpose` | string | No | One-paragraph vault description |
| `exportDate` | string | Yes | ISO 8601 timestamp of export |
| `exportedFrom` | string | Yes | Application identifier |

### 4.4 Filename Convention

```
{vaultId}_{YYYY-MM-DD}.kc.zip
```

Examples:
- `signal-over-noise_2026-04-18.kc.zip`
- `kcompilercodeanalysis_2026-04-18.kc.zip`

---

## 5. Import Specification

### 5.1 Required Input

| Field | Required | Source | Description |
|-------|----------|-------|-------------|
| Archive file | Yes | File picker | A `.zip` or `.kc.zip` file containing a valid vault export |
| Target path | Yes | Directory browser | Absolute path where the vault will be placed on disk |
| Vault name | No | Text input | Override the name from the manifest; if empty, uses manifest name |
| Purpose | No | Textarea | Override the purpose from the manifest |

### 5.2 Validation Steps

1. **File format**: Check ZIP magic bytes (`PK\x03\x04`) at the start of the file
2. **Manifest presence**: Archive must contain `vault-manifest.json` at root level
3. **Manifest validity**: Must have `version`, `name`, and `template` fields
4. **ID uniqueness**: Derived vault ID must not collide with existing registry entries (409)
5. **Path availability**: Target path must not already contain a `CLAUDE.md` (409)
6. **Zip-slip prevention**: Every extracted path is verified to be within the target directory
7. **Defensive exclusions**: OS metadata files (`.DS_Store`) and editor state directories (`.obsidian/`) are skipped during extraction as a defensive measure, even if present in the archive

### 5.3 Post-Extraction Steps

1. **Set file permissions**: `chmod 755` on `reset-wiki.sh` if it exists (yauzl does not preserve Unix permissions)
2. **Generate settings**: Write a fresh `.claude/settings.local.json` with default permissions for the vault's template type
3. **Register vault**: Append new entry to `vaults.json`, invalidate registry cache
4. **Switch to vault**: Frontend re-fetches vault list, rebuilds selector, and switches to the imported vault

### 5.4 Conflict Resolution

- **Duplicate vault ID**: Return 409 with message guiding the user to the name override field, e.g., `"Vault ID '{id}' already exists. Use the Name field to specify a different vault name."`
- **Existing vault at path**: Return 409 with message that a vault already exists at that location
- **Template mismatch**: No validation — the template field is informational; the vault's `CLAUDE.md` is authoritative

---

## 6. API Specification

### 6.1 Export Endpoint

```
GET /api/vault/export?vault=<vaultId>
```

**Parameters:**
| Parameter | Location | Required | Description |
|-----------|----------|----------|-------------|
| `vault` | Query | Yes | Vault ID to export |

**Success Response (200):**
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="signal-over-noise_2026-04-18.kc.zip"`
- Body: ZIP archive stream

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 400 | Missing `vault` query parameter |
| 404 | Unknown vault ID or vault path not accessible |
| 500 | Archive creation failure |

### 6.2 Import Endpoint

```
POST /api/vault/import
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `archive` | File | Yes | The `.kc.zip` file |
| `targetPath` | String | Yes | Absolute filesystem path for extraction |
| `name` | String | No | Vault name override |
| `purpose` | String | No | Purpose override |

**Size Limit:** 100 MB (enforced by multer). The limit can be adjusted by modifying the multer configuration in the server. Multer's `LIMIT_FILE_SIZE` error must be explicitly caught and translated to a 413 HTTP response.

**Success Response (200):**
```json
{
  "id": "signal-over-noise",
  "name": "Signal Over Noise",
  "template": "research",
  "purpose": "LLM-maintained knowledge base"
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 400 | No file provided, missing target path, not a valid ZIP, missing/invalid manifest |
| 409 | Vault ID already exists, target path already contains a vault |
| 413 | File exceeds 100 MB limit (multer `LIMIT_FILE_SIZE` caught and translated) |
| 500 | Extraction failure, filesystem errors (try/catch wrapping extraction and registration steps) |

---

## 7. UI Specification

### 7.1 Toolbar Buttons

Two new buttons in `toolbar-right`, placed after the Upload button:

| Button | ID | Icon | Title | Action |
|--------|----|------|-------|--------|
| Export | `#btn-export` | &#11015; | "Export vault as .kc.zip" | Initiates download of active vault |
| Import | `#btn-import` | &#128230; | "Import vault from .kc.zip" | Opens file picker, then import modal |

A hidden file input (`#import-input`, accept=`.zip,.kc.zip`) is paired with the Import button.

### 7.2 Export UX Flow

1. User clicks Export button
2. Button text changes to "Exporting...", button disabled
3. Info toast: "Preparing export of {vault name}..."
4. Browser downloads `{vaultId}_{date}.kc.zip`
5. Success toast: "Exported {vault name} successfully."
6. Button restored

If no vault is selected, error toast: "No vault selected to export."

### 7.3 Import Modal

Follows the existing vault creation modal pattern exactly.

**Modal ID:** `#import-modal-overlay`

**Form fields:**
1. **Archive File** (read-only display) — shows filename and size in MB
2. **Vault Name** (optional override) — text input with hint: "Leave blank to use name from archive"
3. **Target Path** (required) — text input + Browse button with inline directory browser (same pattern as vault creation: `#import-dir-browser` with Up/Select/Cancel buttons)
4. **Purpose** (optional override) — textarea with hint
5. **Progress indicator** — shown during upload (indeterminate animated progress bar)
6. **Error display** — `.form-error` pattern for inline error messages

**Footer buttons:** Cancel / Import Vault (primary, disabled until file selected)

**Key element IDs:**
- Modal: `#import-modal-overlay`, `#import-modal`, `#import-modal-close`
- Form: `#import-file-info`, `#import-vault-name`, `#import-vault-path`, `#import-vault-purpose`
- Browser: `#btn-import-browse-path`, `#import-dir-browser`, `#import-dir-browser-up`, `#import-dir-browser-current`, `#import-dir-browser-list`, `#import-dir-browser-select`, `#import-dir-browser-cancel`
- Progress: `#import-progress`, `#import-progress-fill`, `#import-progress-text`
- Actions: `#import-error`, `#import-modal-cancel`, `#import-modal-import`

### 7.4 Import UX Flow

1. User clicks Import button → file picker opens
2. User selects `.kc.zip` file → modal opens with file info displayed
3. User browses to target directory, optionally overrides name/purpose
4. User clicks "Import Vault"
5. Button text changes to "Importing...", progress bar animates
6. On success: modal closes, success toast, vault selector updates, switches to imported vault
7. On error: inline error message in modal, form remains open for correction

### 7.5 Keyboard and Accessibility

- **Escape key**: Closes import modal (checks directory browser first, then modal — same pattern as vault creation modal)
- **Overlay click**: Closes import modal
- **aria-modal="true"** and **aria-labelledby** on modal overlay
- **Disabled state**: Import button disabled until file selected; Export button disabled during export

---

## 8. Security Considerations

### 8.1 Zip-Slip Prevention

Every file path extracted from the ZIP is resolved to an absolute path via `path.resolve(targetDir, entry.fileName)` and verified to start with `targetDir + path.sep`. Any entry that escapes the target directory is logged and skipped silently.

### 8.2 Archive Size Limit

Multer enforces a 100 MB upload limit. This is generous enough for large vaults with PDFs in `raw/` but prevents abuse. The limit can be adjusted via server configuration if needed.

### 8.3 File Format Validation

The server reads the first 4 bytes of the uploaded file and verifies the ZIP magic bytes (`PK\x03\x04`) before attempting to process it. This prevents processing non-ZIP files that happen to have a `.zip` extension.

### 8.4 Manifest Validation

The archive must contain a `vault-manifest.json` at the root level with valid `version`, `name`, and `template` fields. Archives without a valid manifest are rejected with a 400 error.

### 8.5 Path Traversal in Manifest

The vault name from the manifest is sanitized through the same ID derivation algorithm used by vault creation (lowercase, replace non-alphanumeric with hyphens, strip leading/trailing hyphens). This prevents malicious manifest content from affecting the filesystem.

### 8.6 Temp File Cleanup

The uploaded archive is stored in `os.tmpdir()` during processing. A `finally` block ensures the temp file is deleted regardless of success or failure.

---

## 9. File Changes

### 9.1 Modified Files

| File | Changes |
|------|---------|
| `src/package.json` | Add `archiver` and `yauzl` dependencies |
| `src/server/index.js` | Add export endpoint, import endpoint, 5 helper functions |
| `src/public/index.html` | Add Export/Import toolbar buttons, hidden file input, Import modal |
| `src/public/css/styles.css` | Add import file-info, progress bar, and indeterminate animation styles |
| `src/public/js/app.js` | Add export handler, import modal logic, directory browser, escape key handling |

### 9.2 New Dependencies

| Package | Version | Purpose | Size Impact |
|---------|---------|---------|-------------|
| `archiver` | ^7.0.0 | Streaming ZIP creation for export | ~180 KB |
| `yauzl` | ^3.2.0 | Secure ZIP reading/extraction for import | ~45 KB |

### 9.3 No New Files Created

All changes are modifications to existing files or additions within existing files. No new source files are needed.

---

## 10. Implementation Phases

### Phase 1: Dependencies
Add `archiver` and `yauzl` to `src/package.json` and install.

### Phase 2: Server — Export
Add the export endpoint and its helper functions (exclusion checker, recursive directory walker) to `src/server/index.js`.

### Phase 3: Server — Import
Add import helper functions (ZIP validation, manifest reading, extraction, settings generation) and the import endpoint to `src/server/index.js`.

### Phase 4: HTML
Add Export/Import toolbar buttons, hidden file input, and the Import modal to `src/public/index.html`. Bump cache-busting version strings.

### Phase 5: CSS
Add import-specific styles (file info display, progress bar, indeterminate animation) to `src/public/css/styles.css`.

### Phase 6: Frontend — Export
Add export button handler (fetch, blob download, toast notifications) to `src/public/js/app.js`.

### Phase 7: Frontend — Import
Add import modal logic (file selection, directory browser, form submission, vault re-fetch, vault switch, escape handling) to `src/public/js/app.js`.

### Phase 8: Integration Testing
Export a vault, import on a fresh location, verify graph renders correctly with all nodes and edges.

---

## 11. Risks and Mitigations

### 11.1 Large Vaults with Many PDFs

**Risk:** Vaults with many PDFs in `raw/` could produce ZIP files exceeding 100 MB, or the browser blob could consume significant memory.

**Mitigation:** The streaming approach for export avoids server memory issues. The 100 MB upload limit can be adjusted by modifying the multer configuration in `src/server/index.js`. For current vault sizes (under 10 MB), this is not a concern. A future enhancement could add an option to exclude `raw/` from export if vaults grow significantly.

### 11.2 yauzl Callback Style

**Risk:** `yauzl` uses callbacks rather than promises, making error handling more complex.

**Mitigation:** All yauzl operations are wrapped in promise-based helper functions with proper error handling. The zipfile is closed in all code paths (success, error, early return).

### 11.3 File Permission Loss

**Risk:** `yauzl` does not preserve Unix file permissions. The `reset-wiki.sh` script needs execute permission.

**Mitigation:** After extraction, the import handler explicitly `chmod 755` the `reset-wiki.sh` file if it exists.

### 11.4 Concurrent Imports

**Risk:** Two simultaneous imports with the same derived vault ID could race on registry writes.

**Mitigation:** The current architecture (single-threaded Node.js, sequential registry writes) makes this unlikely. The existing vault creation code has the same theoretical race, so this is an accepted constraint for a local-only application.
