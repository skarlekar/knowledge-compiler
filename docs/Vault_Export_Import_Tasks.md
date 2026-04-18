# Vault Export & Import — Task List

**Document ID:** TASK-EXPORT-001
**Version:** 1.0
**Date:** 2026-04-18
**Plan:** [Vault_Export_Import_Plan.md](Vault_Export_Import_Plan.md)
**Status:** Draft

---

## Phase 1: Dependencies

### TASK-EI001 -- Add archiver and yauzl Dependencies

- **File:** `src/package.json`
- **Type:** Modify
- **Description:** Add `archiver` (^7.0.0) for streaming ZIP creation and `yauzl` (^3.2.0) for secure ZIP reading/extraction. Run `npm install archiver yauzl` in the `src/` directory to install and update `package-lock.json`.
- **Acceptance criteria:**
  - [ ] `archiver` appears in `dependencies` in `src/package.json`
  - [ ] `yauzl` appears in `dependencies` in `src/package.json`
  - [ ] `npm install` succeeds without errors
  - [ ] Both packages are importable: `import archiver from 'archiver'` and `import yauzl from 'yauzl'`
- **Dependencies:** None

---

## Phase 2: Server — Export

### TASK-EI002 -- Add Export Helper Functions

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Add two helper functions used by the export endpoint:
  1. `shouldExcludeFromExport(relativePath, entryName)` — returns `true` if the path matches any exclusion pattern: `.claude/settings.local.json`, any path segment named `.obsidian`, `node_modules`, or `.git`, and any file named `.DS_Store`.
  2. `addDirectoryToArchive(archive, dirPath, archivePath)` — recursively walks a directory and calls `archive.file()` for each file that passes the exclusion check. For directory entries matching `EXCLUDE_DIRS`, the entire subtree is skipped.
- **Acceptance criteria:**
  - [ ] `shouldExcludeFromExport('.claude/settings.local.json', 'settings.local.json')` returns `true`
  - [ ] `shouldExcludeFromExport('wiki/concepts/foo.md', 'foo.md')` returns `false`
  - [ ] `shouldExcludeFromExport('.obsidian/workspace.json', 'workspace.json')` returns `true`
  - [ ] `shouldExcludeFromExport('.DS_Store', '.DS_Store')` returns `true`
  - [ ] `shouldExcludeFromExport('.git/config', 'config')` returns `true`
  - [ ] `addDirectoryToArchive` recursively adds all non-excluded files with correct relative paths
- **Dependencies:** TASK-EI001
- **Can parallelize with:** TASK-EI006, TASK-EI007, TASK-EI008

### TASK-EI003 -- Implement Export Endpoint

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Add `GET /api/vault/export?vault=<vaultId>` endpoint. The handler:
  1. Validates `vault` query parameter is present (400 if missing)
  2. Looks up vault in registry via `loadVaultRegistry()` (404 if not found)
  3. Verifies vault root path exists via `access()` (404 if inaccessible)
  4. Builds manifest object: `{ version: 1, name, template, purpose, exportDate, exportedFrom }`
  5. Sets response headers: `Content-Type: application/zip`, `Content-Disposition: attachment; filename="{vaultId}_{YYYY-MM-DD}.kc.zip"`
  6. Creates `archiver('zip', { zlib: { level: 6 } })`, pipes to response
  7. Appends `vault-manifest.json` as in-memory buffer entry via `archive.append()`
  8. Calls `addDirectoryToArchive()` to add all vault files
  9. Calls `archive.finalize()`
  10. Handles `archive.on('error')` — sends 500 if headers not yet sent

  Add `import archiver from 'archiver';` at the top of the file.
  Place the endpoint after the `POST /api/vaults` block (after line ~696).

- **Acceptance criteria:**
  - [ ] `GET /api/vault/export?vault=signal-over-noise` returns a valid ZIP file
  - [ ] Response Content-Type is `application/zip`
  - [ ] Response Content-Disposition contains the correct filename pattern
  - [ ] ZIP contains `vault-manifest.json` with correct metadata
  - [ ] ZIP contains `wiki/`, `raw/`, `.claude/commands/`, `CLAUDE.md`, and `reset-wiki.sh` (if present in vault root)
  - [ ] ZIP does NOT contain `.claude/settings.local.json`
  - [ ] ZIP does NOT contain `.DS_Store` files or `.obsidian/` directories
  - [ ] `GET /api/vault/export` (no vault param) returns 400
  - [ ] `GET /api/vault/export?vault=nonexistent` returns 404
- **Dependencies:** TASK-EI001, TASK-EI002

---

## Phase 3: Server — Import

### TASK-EI004 -- Add Import Helper Functions

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Add four helper functions used by the import endpoint:

  1. `validateZipMagicBytes(filePath)` — reads first 4 bytes of the file using `fs/promises` `open()`, checks for `PK\x03\x04` (bytes `0x50, 0x4B, 0x03, 0x04`). Returns boolean. Closes file handle in all code paths.

  2. `readManifestFromZip(zipPath)` — opens ZIP with `yauzl.open()`, iterates entries looking for `vault-manifest.json`. When found, opens its read stream, concatenates chunks, parses as JSON, closes zipfile, resolves with parsed manifest. If not found, rejects with descriptive error. If JSON parsing fails, rejects with error.

  3. `extractZipToDirectory(zipPath, targetDir)` — opens ZIP with `yauzl.open({ lazyEntries: true })`, iterates all entries:
     - Skips `vault-manifest.json` (already processed)
     - For each entry, resolves full path via `path.resolve(targetDir, entry.fileName)`
     - **Zip-slip check**: verifies resolved path starts with `targetDir + path.sep` (skips and logs warning if not)
     - Skips entries matching exclusion patterns (`.DS_Store`, `.obsidian`)
     - For directory entries (fileName ends with `/`): creates directory with `mkdir({ recursive: true })`
     - For file entries: creates parent directory, opens read stream, pipes to `createWriteStream(resolvedPath)`
     - Returns count of extracted files

  4. `generateDefaultSettings(template)` — returns a default `settings.local.json` object with base permission grants for the given template type.

  Add required imports at top: `import yauzl from 'yauzl';`, `import { createWriteStream } from 'fs';`, and add `unlink` to the existing `fs/promises` import (add `chmod` as well for permission fix).

- **Acceptance criteria:**
  - [ ] `validateZipMagicBytes` returns `true` for valid ZIP files
  - [ ] `validateZipMagicBytes` returns `false` for non-ZIP files (e.g., a text file)
  - [ ] `readManifestFromZip` returns parsed manifest from a valid `.kc.zip`
  - [ ] `readManifestFromZip` rejects with error for ZIP without `vault-manifest.json`
  - [ ] `extractZipToDirectory` extracts files to correct relative paths
  - [ ] `extractZipToDirectory` skips entries that escape target directory (zip-slip)
  - [ ] `extractZipToDirectory` skips `.DS_Store` and `.obsidian` entries
  - [ ] `generateDefaultSettings` returns object with `permissions.allow` array
  - [ ] `readManifestFromZip` closes the zipfile handle in all code paths (success, error, not-found)
  - [ ] `extractZipToDirectory` closes the zipfile handle in all code paths (success, error, early return)
- **Dependencies:** TASK-EI001
- **Can parallelize with:** TASK-EI002, TASK-EI003, TASK-EI006, TASK-EI007, TASK-EI008

### TASK-EI005 -- Implement Import Endpoint

- **File:** `src/server/index.js`
- **Type:** Modify
- **Description:** Add `POST /api/vault/import` endpoint using multer disk storage. The handler:

  1. Creates multer instance with disk storage (`dest: os.tmpdir()`) and 100 MB limit:
     ```javascript
     const importUpload = multer({
       dest: os.tmpdir(),
       limits: { fileSize: 100 * 1024 * 1024 }
     });
     ```
  2. Route: `app.post('/api/vault/import', importUpload.single('archive'), async (req, res) => { ... })`
  3. Validates file provided (400)
  4. Validates `targetPath` body field is present and non-empty (400)
  5. Calls `validateZipMagicBytes(req.file.path)` (400 if invalid)
  6. Calls `readManifestFromZip(req.file.path)` (400 if missing/invalid)
  7. Validates manifest has `version`, `name`, `template` (400)
  8. Determines vault name: `req.body.name || manifest.name`
  9. Derives vault ID: same algorithm as `POST /api/vaults` (lowercase + hyphens)
  10. Checks duplicate ID in registry — returns 409 with message: `"Vault ID '{id}' already exists. Use the Name field to specify a different vault name."`
  11. Checks target path for existing `CLAUDE.md` (409)
  12. Wraps steps 12–17 in a try/catch that returns 500 with `err.message` on unexpected failures
  13. Creates target directory with `mkdir({ recursive: true })`
  14. Calls `extractZipToDirectory(tempFile, resolvedTarget)`
  15. Applies `chmod(0o755)` to `reset-wiki.sh` if it exists in the extracted vault
  16. Writes fresh `.claude/settings.local.json` via `generateDefaultSettings(manifest.template)`
  17. Appends new entry to `vaults.json`, sets `_vaultRegistry = null`
  18. Returns `{ id, name, template, purpose }` (same response shape as `POST /api/vaults`)
  19. Adds multer error-handling: catches `MulterError` with code `LIMIT_FILE_SIZE` and returns `res.status(413).json({ error: 'File exceeds the 100 MB upload limit.' })`. This can be inline in the route handler or via an error-handling middleware wrapper.
  20. `finally` block: deletes temp file via `unlink(req.file.path)`

  Place after the export endpoint.

- **Acceptance criteria:**
  - [ ] `POST /api/vault/import` with valid `.kc.zip` and target path creates vault at target
  - [ ] Vault is registered in `vaults.json` with correct metadata
  - [ ] `reset-wiki.sh` has execute permission after import
  - [ ] `.claude/settings.local.json` is generated fresh (not from archive)
  - [ ] Duplicate vault ID returns 409 with message guiding user to the Name override field
  - [ ] Existing vault at target path returns 409
  - [ ] Non-ZIP file returns 400
  - [ ] ZIP without manifest returns 400
  - [ ] Missing target path returns 400
  - [ ] Temp file is cleaned up after success
  - [ ] Temp file is cleaned up after failure
  - [ ] Files >100 MB are rejected with 413 status (multer `LIMIT_FILE_SIZE` error caught and translated)
  - [ ] Unexpected extraction or filesystem errors return 500 with error message
  - [ ] Response shape matches `POST /api/vaults` response
- **Dependencies:** TASK-EI001, TASK-EI004

---

## Phase 4: HTML

### TASK-EI006 -- Add Export and Import Toolbar Buttons

- **File:** `src/public/index.html`
- **Type:** Modify
- **Description:** Add three elements to the `<div class="toolbar-right">` section, after the Upload button and its hidden file input (after line 35):

  ```html
  <!-- TASK-EI006  Export vault -->
  <button id="btn-export" class="toolbar-btn" title="Export vault as .kc.zip">&#11015; Export</button>
  <!-- TASK-EI006  Import vault -->
  <button id="btn-import" class="toolbar-btn" title="Import vault from .kc.zip">&#128230; Import</button>
  <input type="file" id="import-input" class="hidden" accept=".zip,.kc.zip" />
  ```

- **Acceptance criteria:**
  - [ ] Export button visible in toolbar with down-arrow icon and "Export" text
  - [ ] Import button visible in toolbar with package icon and "Import" text
  - [ ] Hidden file input accepts `.zip` and `.kc.zip` extensions
  - [ ] Buttons are positioned between Upload and Back buttons
- **Dependencies:** None
- **Can parallelize with:** TASK-EI002, TASK-EI004, TASK-EI007, TASK-EI008

### TASK-EI007 -- Add Import Modal HTML

- **File:** `src/public/index.html`
- **Type:** Modify
- **Description:** Add the Import Vault modal after the existing "New Vault Modal" block (after line ~144). The modal follows the exact same structural pattern as the vault creation modal:

  - `#import-modal-overlay` — `.modal-overlay.hidden`, `role="dialog"`, `aria-modal="true"`, `aria-labelledby="import-modal-title"`
  - `#import-modal` — `.modal`
  - Modal header: title "Import Vault" + close button
  - Modal body with form groups:
    1. **Archive File** — read-only `.import-file-info` div (`#import-file-info`) showing "No file selected"
    2. **Vault Name** — text input (`#import-vault-name`), label marked `(override)`, hint text
    3. **Target Path** — text input (`#import-vault-path`) + Browse button (`#btn-import-browse-path`) + inline directory browser (`#import-dir-browser` with `#import-dir-browser-up`, `#import-dir-browser-current`, `#import-dir-browser-list`, `#import-dir-browser-select`, `#import-dir-browser-cancel`)
    4. **Purpose** — textarea (`#import-vault-purpose`), label marked `(override)`
    5. **Progress** — `#import-progress` (`.import-progress.hidden`) containing progress bar (`#import-progress-fill`) and status text (`#import-progress-text`)
    6. **Error** — `#import-error` (`.form-error.hidden`)
  - Modal footer: Cancel (`#import-modal-cancel`) and Import Vault (`#import-modal-import`, disabled by default)

- **Acceptance criteria:**
  - [ ] Modal is hidden by default (`.hidden` class on overlay)
  - [ ] All element IDs match the specification (see Section 7.3 of plan)
  - [ ] Directory browser follows same HTML structure as vault creation modal's browser
  - [ ] Progress bar and status text elements exist within `#import-progress`
  - [ ] Import button is disabled by default
  - [ ] Accessibility attributes present: `role="dialog"`, `aria-modal`, `aria-labelledby`
  - [ ] Close button has `aria-label="Close"`
- **Dependencies:** None
- **Can parallelize with:** TASK-EI002, TASK-EI004, TASK-EI006, TASK-EI008

### TASK-EI008 -- Bump Cache-Busting Version Strings

- **File:** `src/public/index.html`
- **Type:** Modify
- **Description:** Update all `?v=4` query strings on script and CSS tags to `?v=5` to force browser cache refresh. This affects:
  - `css/styles.css?v=4` → `css/styles.css?v=5`
  - `js/utils.js?v=4` → `js/utils.js?v=5`
  - `js/graph.js?v=4` → `js/graph.js?v=5`
  - `js/visualization.js?v=4` → `js/visualization.js?v=5`
  - `js/content.js?v=4` → `js/content.js?v=5`
  - `js/navigation.js?v=4` → `js/navigation.js?v=5`
  - `js/search.js?v=4` → `js/search.js?v=5`
  - `js/app.js?v=4` → `js/app.js?v=5`
- **Acceptance criteria:**
  - [ ] All 8 occurrences of `?v=4` are changed to `?v=5`
  - [ ] No `?v=4` remains in the file
- **Dependencies:** None
- **Can parallelize with:** TASK-EI002, TASK-EI004, TASK-EI006, TASK-EI007

---

## Phase 5: CSS

### TASK-EI009 -- Add Import-Specific Styles

- **File:** `src/public/css/styles.css`
- **Type:** Modify
- **Description:** Add styles for the import modal's unique elements. Place before the responsive media query section (if any) or at the end of the file:

  1. `.import-file-info` — styled read-only display for selected file info: 13px font, `#666` color, 1px `#ccc` border, `#fafafa` background, 4px border-radius, 7px 10px padding
  2. `.import-file-info.has-file` — active state when file is selected: `#222` color, `#f0f8ff` background, `#4A90D9` border
  3. `.import-progress` — flex column container with 6px gap
  4. `.import-progress-bar` — 6px height track, `#e0e0e0` background, 3px border-radius, overflow hidden
  5. `.import-progress-fill` — 100% height, `#4A90D9` blue fill, 3px border-radius, starts at 0% width, `transition: width 0.3s ease`
  6. `.import-progress-fill.indeterminate` — 30% width, animated with `progress-slide` keyframes
  7. `@keyframes progress-slide` — slides from `translateX(-100%)` to `translateX(400%)`, `1.5s ease-in-out infinite`
  8. `.import-progress-text` — 12px font, `#666` color

- **Acceptance criteria:**
  - [ ] File info display shows muted text on empty, blue-tinted when file selected
  - [ ] Progress bar renders as thin blue line on gray track
  - [ ] Indeterminate animation slides smoothly left to right
  - [ ] All styles use existing color palette and sizing conventions from the stylesheet
- **Dependencies:** None
- **Can parallelize with:** All Phase 2, 3, and 4 tasks

---

## Phase 6: Frontend — Export

### TASK-EI010 -- Implement Export Button Handler

- **File:** `src/public/js/app.js`
- **Type:** Modify
- **Description:** Add click handler for `#btn-export`. Place after the existing upload handler section. The handler:

  1. Checks `activeVaultId` exists — shows error toast if not
  2. Shows info toast: "Preparing export of {vault name}..."
  3. Disables button, changes inner HTML to "&#11015; Exporting..."
  4. Fetches `GET /api/vault/export?vault={activeVaultId}`
  5. On non-OK response: reads error JSON, throws Error
  6. Extracts filename from `Content-Disposition` header (regex: `/filename="?([^";\s]+)"?/`)
  7. Falls back to `{activeVaultId}_export.kc.zip` if header parsing fails
  8. Converts response to blob
  9. Creates temporary `<a>` element: sets `href` to `URL.createObjectURL(blob)`, sets `download` to filename, appends to body, clicks, removes, revokes URL
  10. Shows success toast: "Exported {vault name} successfully."
  11. `catch`: logs error, shows error toast with message (5 second duration)
  12. `finally`: restores button HTML and re-enables it

- **Acceptance criteria:**
  - [ ] Clicking Export with active vault triggers file download
  - [ ] Button shows "Exporting..." state during download
  - [ ] Info toast shown at start, success toast on completion
  - [ ] Error toast shown on failure with error message
  - [ ] Button re-enabled after success or failure
  - [ ] No vault selected → error toast, no network request
  - [ ] Downloaded filename matches `{vaultId}_{date}.kc.zip` pattern
- **Dependencies:** TASK-EI003, TASK-EI006

---

## Phase 7: Frontend — Import

### TASK-EI011 -- Implement Import Modal Logic

- **File:** `src/public/js/app.js`
- **Type:** Modify
- **Description:** Add import modal management code. Place after the export handler. This includes:

  1. **Element references**: Get all import modal elements by ID (overlay, close, cancel, import button, error, file info, name, path, purpose, progress bar/text, file input)
  2. **State variable**: `let _importFile = null;` to hold the selected File object
  3. **`openImportModal()`**: Resets all form fields (clears values, removes `.has-file`, hides error/progress, disables import button), shows overlay by removing `.hidden`
  4. **`closeImportModal()`**: Adds `.hidden` to overlay, sets `_importFile = null`
  5. **Import button click handler**: Calls `importInput.click()` to open file picker
  6. **File input change handler**: Captures selected file into `_importFile`, calls `openImportModal()`, populates file info display with filename and size in MB (`.toFixed(1)`), adds `.has-file` class, enables import button, resets input value (allows re-selection of same file)
  7. **Close/Cancel handlers**: Both call `closeImportModal()`
  8. **Overlay click handler**: Closes if click target is the overlay itself

- **Acceptance criteria:**
  - [ ] Clicking Import opens native file picker
  - [ ] Selecting a file opens the import modal with file info displayed
  - [ ] File info shows name and size (e.g., "vault_2026-04-18.kc.zip (5.8 MB)")
  - [ ] Import Vault button is disabled until file is selected
  - [ ] Cancel, X button, and overlay click all close the modal
  - [ ] Modal state fully resets on each open (no stale data from previous attempts)
  - [ ] Re-selecting the same file works (input value is reset)
- **Dependencies:** TASK-EI007

### TASK-EI012 -- Implement Import Directory Browser

- **File:** `src/public/js/app.js`
- **Type:** Modify
- **Description:** Add directory browser for the import modal's target path field. This is a separate instance from the vault creation modal's browser (different element IDs) but follows the exact same logic pattern:

  1. **Element references**: `#btn-import-browse-path`, `#import-dir-browser`, `#import-dir-browser-current`, `#import-dir-browser-list`, `#import-dir-browser-up`, `#import-dir-browser-select`, `#import-dir-browser-cancel`
  2. **State variable**: `let _importCurrentBrowsePath = '';`
  3. **`importBrowseDir(browsePath)`**: Fetches `/api/fs/ls?path={browsePath}`, populates `#import-dir-browser-list` with `<li>` elements for each subdirectory (click handler navigates into subdirectory), updates current path display, configures Up button's `data-parent`, handles empty directories with "No subdirectories" message, handles errors
  4. **Browse button click**: Shows `#import-dir-browser`, calls `importBrowseDir()` with current path input value or empty string (default to home)
  5. **Up button click**: Navigates to `data-parent` path
  6. **Select button click**: Sets `#import-vault-path` value to `_importCurrentBrowsePath`, hides browser
  7. **Cancel button click**: Hides browser without changing path input

- **Acceptance criteria:**
  - [ ] Browse button opens directory browser inline within the modal
  - [ ] Clicking a directory navigates into it
  - [ ] Up button navigates to parent directory
  - [ ] Select This Folder populates the path input and closes browser
  - [ ] Cancel closes browser without changing path
  - [ ] Empty directories show "No subdirectories" message
  - [ ] Error responses show error in current path display
  - [ ] Browser uses existing `/api/fs/ls` endpoint (no new API needed)
- **Dependencies:** TASK-EI007, TASK-EI011

### TASK-EI013 -- Implement Import Submit Handler

- **File:** `src/public/js/app.js`
- **Type:** Modify
- **Description:** Add click handler for `#import-modal-import` button. The handler:

  1. **Validates**: file exists (`_importFile`), target path is non-empty — shows inline error for each
  2. **Disables UI**: sets import button text to "Importing...", disables import and cancel buttons
  3. **Shows progress**: unhides `#import-progress`, adds `.indeterminate` to `#import-progress-fill`, sets text to "Uploading and extracting archive..."
  4. **Builds FormData**: appends `archive` (file), `targetPath` (string), optional `name` (if non-empty), optional `purpose` (if non-empty)
  5. **Fetches**: `POST /api/vault/import` with FormData body (no Content-Type header — browser sets multipart boundary)
  6. **On success** (`res.ok`):
     - Calls `closeImportModal()`
     - Shows success toast: `Vault "{name}" imported successfully.`
     - Re-fetches `/api/vaults`, updates `vaults` array
     - Rebuilds vault selector `<option>` elements (same pattern as vault creation success handler)
     - Toggles selector visibility (show dropdown if 2+ vaults, show name label if 1)
     - Attaches change listener if vault count reaches 2
     - Calls `switchToVault(result.id)` to switch to imported vault
  7. **On error** (`!res.ok`): shows error message in `#import-error` (unhides, sets text from response)
  8. **catch**: shows network error in `#import-error`
  9. **finally**: re-enables buttons, restores import button text, hides progress bar

- **Acceptance criteria:**
  - [ ] Empty target path shows inline validation error
  - [ ] Progress bar animates during upload
  - [ ] Successful import closes modal, shows toast, switches to imported vault
  - [ ] Vault selector updates with new vault entry
  - [ ] Failed import shows error message inline in modal
  - [ ] Network errors show descriptive message
  - [ ] Buttons and progress state reset after success or failure
  - [ ] Vault selector change listener attached when crossing from 1 to 2 vaults
- **Dependencies:** TASK-EI005, TASK-EI009, TASK-EI011, TASK-EI012

### TASK-EI014 -- Update Escape Key Handler for Import Modal

- **File:** `src/public/js/app.js`
- **Type:** Modify
- **Description:** Update the existing `keydown` event listener for Escape to also handle the import modal and its directory browser. The handler should check modals in this order:

  1. If vault creation modal is visible:
     - If its directory browser is visible → close browser only
     - Else → close vault creation modal
     - Return (don't check further)
  2. If import modal is visible:
     - If its directory browser (`#import-dir-browser`) is visible → close browser only
     - Else → call `closeImportModal()`
     - Return

  This follows the existing pattern of checking for open sub-panels before closing the parent modal.

- **Acceptance criteria:**
  - [ ] Escape closes import directory browser (if open) without closing modal
  - [ ] Escape closes import modal (if browser is closed)
  - [ ] Vault creation modal escape behavior is unchanged
  - [ ] If both modals were somehow visible (shouldn't happen), vault creation modal takes priority
- **Dependencies:** TASK-EI011

---

## Phase 8: Integration Testing

### TASK-EI015 -- End-to-End Export Test

- **Type:** Test
- **Description:** Start the server and test the export flow end-to-end:
  1. Select a vault in the UI (e.g., "Signal Over Noise")
  2. Click the Export button
  3. Verify browser downloads a file named `{vaultId}_{date}.kc.zip`
  4. Open the ZIP and verify it contains:
     - `vault-manifest.json` with correct name, template, purpose
     - `wiki/` directory with all expected subdirectories and files
     - `raw/` directory with source documents
     - `.claude/commands/` with vault skills
     - `CLAUDE.md`
  5. Verify it does NOT contain `.claude/settings.local.json`, `.DS_Store`, `.obsidian/`
  6. Test error case: switch to no-vault state, click Export → error toast
- **Acceptance criteria:**
  - [ ] ZIP downloads with correct filename
  - [ ] Manifest contains accurate metadata
  - [ ] All vault content directories are present
  - [ ] Excluded files are not in the archive
  - [ ] Error case shows appropriate toast
- **Dependencies:** TASK-EI003, TASK-EI010

### TASK-EI016 -- End-to-End Import Test

- **Type:** Test
- **Description:** Test the import flow end-to-end using the archive from TASK-EI015:
  1. Click Import, select the `.kc.zip` exported in TASK-EI015
  2. Use the directory browser to select a fresh target directory (e.g., `/tmp/test-import-vault/`)
  3. Optionally override the vault name (to avoid ID collision with original)
  4. Click Import Vault
  5. Verify success toast appears
  6. Verify vault selector updates and switches to the imported vault
  7. Verify graph renders with correct nodes and edges
  8. Verify content panel shows wiki pages correctly
  9. Verify the imported vault's `reset-wiki.sh` has execute permission
  10. Verify `.claude/settings.local.json` exists with default permissions
- **Acceptance criteria:**
  - [ ] Import completes without errors
  - [ ] Vault appears in selector and is switchable
  - [ ] Graph renders with correct node count
  - [ ] Wiki content is readable in the content panel
  - [ ] `reset-wiki.sh` is executable
  - [ ] `settings.local.json` exists and is valid JSON
- **Dependencies:** TASK-EI015

### TASK-EI017 -- Conflict and Error Case Testing

- **Type:** Test
- **Description:** Test error handling:
  1. **Duplicate ID**: Import the same archive again without renaming → verify 409 error in modal
  2. **Existing vault at path**: Import to a directory that already has `CLAUDE.md` → verify 409 error
  3. **Non-ZIP file**: Select a `.txt` file renamed to `.zip` → verify 400 error
  4. **ZIP without manifest**: Create a normal ZIP (not from export) → verify 400 error about missing manifest
  5. **Missing target path**: Clear the path field and click Import → verify inline validation error
  6. **Name override**: Import with a different name → verify vault registered under new name/ID
- **Acceptance criteria:**
  - [ ] All error cases show appropriate error messages in the modal
  - [ ] No partial state left behind on failed imports (no orphan registry entries, no half-extracted files)
  - [ ] Name override produces vault with overridden name and derived ID
- **Dependencies:** TASK-EI016

---

## Dependency Graph

```text
TASK-EI001 (Dependencies)
    ├── TASK-EI002 (Export Helpers) ──── TASK-EI003 (Export Endpoint) ──┐
    └── TASK-EI004 (Import Helpers) ─── TASK-EI005 (Import Endpoint) ──┤
                                                                        │
TASK-EI006 (Export Button HTML) ────────────────────────────────────────┤
TASK-EI007 (Import Modal HTML) ────────────────────────────────────────┤
TASK-EI008 (Cache-Bust Versions) ──────────────────────────────────────┤
TASK-EI009 (Import CSS) ───────────────────────────────────────────────┤
                                                                        │
TASK-EI003 + TASK-EI006 ───── TASK-EI010 (Export JS Handler) ──────────┤
TASK-EI007 ──── TASK-EI011 (Import Modal Logic) ───────────────────────┤
                    ├── TASK-EI012 (Import Dir Browser) ───────────────┤
                    ├── TASK-EI014 (Escape Key Update) ────────────────┤
                    └── EI005 + EI009 + EI012 ── TASK-EI013 (Import Submit) ─┤
                                                                              │
                                    TASK-EI015 (E2E Export Test) ─────────────┤
                                    TASK-EI016 (E2E Import Test) ─────────────┤
                                    TASK-EI017 (Error Case Test) ─────────────┘
```

## Parallelization Summary

| Parallel Group | Tasks |
| -------------- | ----- |
| After TASK-EI001 | TASK-EI002, TASK-EI004 (server helpers — export and import are independent) |
| Independent of server | TASK-EI006, TASK-EI007, TASK-EI008, TASK-EI009 (all HTML/CSS — no server dependency) |
| After HTML ready | TASK-EI010 (needs TASK-EI003 + EI006), TASK-EI011 (needs EI007) |
| After modal logic | TASK-EI012, TASK-EI014 (both depend on TASK-EI011) |
| Final | TASK-EI013 (needs EI005, EI009, EI011, EI012), then testing tasks sequentially |
