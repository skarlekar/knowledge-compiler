import express from 'express';
import { readdir, readFile, stat, access, writeFile, mkdir, unlink, chmod, open as fsOpen } from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import multer from 'multer';
import archiver from 'archiver';
import yauzl from 'yauzl';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOW_WRITE = process.argv.includes('--allow-write')
  || (process.env.ALLOW_WRITE || '').toLowerCase() === 'true';

const LEGACY_ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATES_DIR = path.join(LEGACY_ROOT, '.claude', 'vault-templates');

// --- Vault registry ---
const VAULTS_JSON_PATH = path.join(LEGACY_ROOT, 'vaults.json');
let _vaultRegistry = null;   // cached after first load

async function loadVaultRegistry() {
  if (_vaultRegistry !== null) return _vaultRegistry;
  try {
    const raw = await readFile(VAULTS_JSON_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('vaults.json must be a JSON array');
    _vaultRegistry = parsed;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[VAULTS] Could not load vaults.json:', err.message);
    }
    _vaultRegistry = [];
  }
  return _vaultRegistry;
}

/**
 * Resolve the vault root path for a given vault ID.
 * - If vaultId is provided, look it up in the registry.
 * - If no vaultId, return the first vault's path.
 * Throws a 404-style error if the vault ID is unknown or no vaults are registered.
 */
async function resolveVaultRoot(vaultId) {
  const registry = await loadVaultRegistry();
  if (vaultId) {
    const vault = registry.find(v => v.id === vaultId);
    if (!vault) throw Object.assign(new Error(`Unknown vault: ${vaultId}`), { status: 404 });
    return vault.path;
  }
  if (registry.length > 0) return registry[0].path;
  throw Object.assign(new Error('No vaults registered. Create one via the UI.'), { status: 404 });
}

// --- Static files (no-cache in dev to avoid stale JS/CSS) ---
app.use(express.static(path.join(__dirname, '..', 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));
app.use(express.json());

// --- API: Server configuration ---
app.get('/api/config', (_req, res) => {
  res.json({ allowWrite: ALLOW_WRITE });
});

// --- API: Vault registry (client receives id/name/template/purpose — path is stripped) ---
app.get('/api/vaults', async (_req, res) => {
  try {
    const registry = await loadVaultRegistry();
    const safe = registry.map(({ id, name, template, purpose }) => ({ id, name, template, purpose }));
    res.json(safe);
  } catch (err) {
    console.error('Vault registry error:', err);
    res.json([]);
  }
});

// --- API: Filesystem directory listing (for vault path picker) ---
app.get('/api/fs/ls', async (req, res) => {
  const requestedPath = req.query.path ? req.query.path : os.homedir();
  const resolved = path.resolve(requestedPath);
  try {
    const entries = await readdir(resolved, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    res.json({ path: resolved, parent: path.dirname(resolved), dirs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- API: List available vault templates ---
app.get('/api/vault-templates', async (_req, res) => {
  try {
    const entries = await readdir(TEMPLATES_DIR, { withFileTypes: true });
    const templates = entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => {
        const id = e.name.replace(/\.md$/, '');
        const name = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return { id, name };
      });
    res.json(templates);
  } catch (err) {
    if (err.code === 'ENOENT') return res.json([]);
    res.status(500).json({ error: err.message });
  }
});

// Helper: build a minimal index.md for a new vault
function buildVaultIndex(vaultName, template, date) {
  if (template === 'portfolio') {
    return `---
title: "Index — ${vaultName}"
type: index
tags: [index]
created: ${date}
updated: ${date}
---

# ${vaultName} — Index

## Statistics

| Type | Count |
| --- | --- |
| Holdings | 0 |
| Watchlist | 0 |
| Theses | 0 |
| Decisions | 0 |
| Sectors | 0 |
| Asset Classes | 0 |
| Performance Snapshots | 0 |
| Assets | 0 |
| Liabilities | 0 |
| Research | 0 |
| Journals | 0 |

## Holdings

| Page | Ticker | Type | Account | Updated |
| --- | --- | --- | --- | --- |

## Watchlist

| Page | Ticker | Trigger Criteria | Added |
| --- | --- | --- | --- |

## Theses

| Page | Ticker | Conviction | Last Validated |
| --- | --- | --- | --- |

## Decisions

| Page | Ticker | Action | Date |
| --- | --- | --- | --- |

## Sectors

| Page | Holdings | Updated |
| --- | --- | --- |

## Asset Classes

| Page | Current Allocation | Updated |
| --- | --- | --- |

## Performance

| Page | Date | Total Value | Unrealized G/L |
| --- | --- | --- | --- |

## Assets

| Page | Type | Estimated Value | Updated |
| --- | --- | --- | --- |

## Liabilities

| Page | Type | Outstanding Balance | Updated |
| --- | --- | --- | --- |

## Net Worth

| Page | Date | Net Worth |
| --- | --- | --- |

## Research

| Page | Topic | Created |
| --- | --- | --- |

## Journals

| Page | Session Type | Created | Outcome |
| --- | --- | --- | --- |
`;
  }
  if (template === 'code-analysis') {
    return `---
title: "Index — ${vaultName}"
type: index
tags: [index]
created: ${date}
updated: ${date}
---

# ${vaultName} — Index

## Statistics

| Type | Count |
| --- | --- |
| Classes | 0 |
| Functions | 0 |
| APIs | 0 |
| Libraries | 0 |
| Patterns | 0 |
| Anti-Patterns | 0 |
| Modules | 0 |
| Journals | 0 |

## Classes

| Page | Description | Updated |
| --- | --- | --- |

## Functions

| Page | Description | Updated |
| --- | --- | --- |

## APIs

| Page | Description | Updated |
| --- | --- | --- |

## Libraries

| Page | Description | Updated |
| --- | --- | --- |

## Patterns

| Page | Description | Updated |
| --- | --- | --- |

## Anti-Patterns

| Page | Description | Updated |
| --- | --- | --- |

## Modules

| Page | Description | Updated |
| --- | --- | --- |

## Journals

| Page | Session Type | Created | Outcome |
| --- | --- | --- | --- |
`;
  }
  return `---
title: "Index — ${vaultName}"
type: index
tags: [index]
created: ${date}
updated: ${date}
---

# ${vaultName} — Index

## Statistics

| Type | Count |
| --- | --- |
| Summaries | 0 |
| Concepts | 0 |
| Entities | 0 |
| Synthesis | 0 |
| Newsletters | 0 |
| Journals | 0 |

## Summaries

| Page | Source | Created |
| --- | --- | --- |

## Concepts

| Page | Tags | Confidence | Updated |
| --- | --- | --- | --- |

## Entities

| Page | Tags | Confidence | Updated |
| --- | --- | --- | --- |

## Synthesis

| Page | Tags | Updated |
| --- | --- | --- |

## Newsletters

| Page | Topic | Created | Key Argument |
| --- | --- | --- | --- |

## Journals

| Page | Session Type | Created | Outcome |
| --- | --- | --- | --- |
`;
}

// Helper: build a minimal log.md for a new vault
function buildVaultLog(vaultName, template, date) {
  return `---
title: "Activity Log"
type: log
---

# ${vaultName} — Activity Log

Append-only record of all wiki changes.

## Format

Each entry follows this format:

\`\`\`text
### YYYY-MM-DD — [Action Type]
- **Source/Trigger**: what initiated the action
- **Pages created**: list of new pages
- **Pages updated**: list of updated pages
- **Notes**: any decisions made
\`\`\`

---

### ${date} — Vault Created

- **Source/Trigger**: New vault created via UI
- **Template**: ${template}
- **Pages created**: wiki/index.md, wiki/log.md
`;
}

// Helper: build research meta-pages (dashboard, analytics, flashcards)
function buildResearchDashboard(date) {
  return `---
title: "Dashboard"
type: dashboard
tags: [meta]
updated: ${date}
---

# Dashboard

Live queries powered by the [Dataview](https://github.com/blacksmithgu/obsidian-dataview) Obsidian plugin.

## Low Confidence Pages

Pages that need more sources or evidence to strengthen.

\`\`\`dataview
TABLE confidence, sources, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE confidence = "low"
SORT updated DESC
\`\`\`

## All Concepts by Tag

\`\`\`dataview
TABLE tags, confidence, updated
FROM "wiki/concepts"
SORT file.name ASC
\`\`\`

## Recently Updated Pages

The 15 most recently modified wiki pages.

\`\`\`dataview
TABLE type, tags, updated
FROM "wiki/"
SORT updated DESC
LIMIT 15
\`\`\`

## Pages with Most Sources

Pages informed by the greatest number of raw sources.

\`\`\`dataview
TABLE length(sources) AS "Source Count", confidence, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE sources
SORT length(sources) DESC
LIMIT 10
\`\`\`

## Orphan Check

Pages that may lack inbound links (review manually).

\`\`\`dataview
TABLE type, tags, updated
FROM "wiki/concepts" OR "wiki/entities"
WHERE length(file.inlinks) = 0
SORT updated ASC
\`\`\`

## Entity Overview

\`\`\`dataview
TABLE tags, updated
FROM "wiki/entities"
SORT file.name ASC
\`\`\`
`;
}

function buildResearchAnalytics(date) {
  return `---
title: "Analytics"
type: dashboard
tags: [meta]
updated: ${date}
---

# Analytics

Visual analytics powered by the [Charts View](https://github.com/caronchen/obsidian-chartsview-plugin) Obsidian plugin.

## Page Distribution by Type

\`\`\`chartsview
type: pie
options:
  legend:
    display: true
    position: right
data:
  - label: Concepts
    value: 0
  - label: Entities
    value: 0
  - label: Summaries
    value: 0
  - label: Syntheses
    value: 0
\`\`\`

## Confidence Distribution

\`\`\`chartsview
type: bar
options:
  legend:
    display: false
  indexAxis: y
data:
  - label: High
    value: 0
    backgroundColor: "#4caf50"
  - label: Medium
    value: 0
    backgroundColor: "#ff9800"
  - label: Low
    value: 0
    backgroundColor: "#f44336"
\`\`\`

## Top Tags

\`\`\`chartsview
type: wordcloud
options:
  maxRotation: 0
  minRotation: 0
data:
  - tag: placeholder-tag-1
    value: 1
  - tag: placeholder-tag-2
    value: 1
  - tag: placeholder-tag-3
    value: 1
\`\`\`
`;
}

function buildResearchFlashcards(date) {
  return `---
title: "Flashcards"
type: flashcards
tags: [meta, flashcards]
updated: ${date}
---

# Flashcards

Spaced repetition cards for the [Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) Obsidian plugin.

## Format

Each flashcard uses this format:

\`\`\`text
Question text goes here
?
Answer text goes here
\`\`\`

Separate cards with blank lines. The \\\`?\\\` on its own line separates question from answer.

Ask the LLM to generate flashcards from any wiki page:

\`\`\`text
Generate flashcards from [[concepts/concept-name]]
\`\`\`

---

## Cards

What is the purpose of the "ingest" workflow?
?
The ingest workflow reads a raw source document, creates a summary page, identifies and creates/updates concept and entity pages, adds cross-links between all touched pages, and updates the index and log.

What are the three confidence levels and when is each used?
?
**High** — well-established idea with multiple corroborating sources and concrete examples. **Medium** — supported by sources but limited examples or single-source. **Low** — single mention, anecdotal, or speculative.

What does the "lint" operation check for?
?
Orphan pages (no inbound links), stale claims, contradictions between pages, missing cross-links, incomplete sections, and low-confidence pages that could be strengthened.
`;
}

// --- API: Create a new vault ---
app.post('/api/vaults', async (req, res) => {
  try {
    const { name, path: vaultPath, purpose, template } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Vault name is required.' });
    }
    if (!vaultPath || typeof vaultPath !== 'string' || !vaultPath.trim()) {
      return res.status(400).json({ error: 'Vault path is required.' });
    }
    if (!template || typeof template !== 'string' || !template.trim()) {
      return res.status(400).json({ error: 'Template is required.' });
    }

    // Validate template file exists
    const templateFilePath = path.join(TEMPLATES_DIR, `${template.trim()}.md`);
    try {
      await access(templateFilePath);
    } catch {
      return res.status(400).json({ error: `Unknown template: ${template}` });
    }

    // Derive vault ID: lowercase, hyphens for non-alphanumeric
    const vaultId = name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!vaultId) {
      return res.status(400).json({ error: 'Could not derive a valid vault ID from the name provided.' });
    }

    // Resolve to absolute path
    const resolvedVaultPath = path.resolve(vaultPath.trim());

    // Check for duplicate ID in registry
    const registry = await loadVaultRegistry();
    if (registry.find(v => v.id === vaultId)) {
      return res.status(409).json({ error: `A vault with ID "${vaultId}" already exists. Choose a different name.` });
    }

    // Reject if path already has CLAUDE.md (already initialised as a vault)
    const existingClaude = path.join(resolvedVaultPath, 'CLAUDE.md');
    try {
      await access(existingClaude);
      return res.status(409).json({ error: 'A vault already exists at that path (CLAUDE.md found).' });
    } catch {
      // Expected — no existing vault at this path
    }

    // Create directory structure
    const RESEARCH_SUBDIRS = [
      'raw', 'wiki', 'wiki/summaries', 'wiki/concepts', 'wiki/entities',
      'wiki/synthesis', 'wiki/newsletters', 'wiki/journal', 'wiki/presentations', 'wiki/images'
    ];
    const CODE_SUBDIRS = [
      'raw', 'wiki', 'wiki/classes', 'wiki/functions', 'wiki/apis',
      'wiki/libraries', 'wiki/patterns', 'wiki/anti-patterns', 'wiki/modules',
      'wiki/journal', 'wiki/deep-dive', 'wiki/images'
    ];
    const PORTFOLIO_SUBDIRS = [
      'raw', 'wiki', 'wiki/holdings', 'wiki/watchlist', 'wiki/theses',
      'wiki/decisions', 'wiki/sectors', 'wiki/asset-classes', 'wiki/performance',
      'wiki/research', 'wiki/journal', 'wiki/net-worth', 'wiki/assets',
      'wiki/liabilities', 'wiki/images'
    ];
    const t = template.trim();
    const subdirs = t === 'code-analysis' ? CODE_SUBDIRS
                  : t === 'portfolio'     ? PORTFOLIO_SUBDIRS
                  : RESEARCH_SUBDIRS;
    for (const d of subdirs) {
      await mkdir(path.join(resolvedVaultPath, d), { recursive: true });
    }

    // Write CLAUDE.md from template
    const templateContent = await readFile(templateFilePath, 'utf-8');
    await writeFile(path.join(resolvedVaultPath, 'CLAUDE.md'), templateContent);

    // Copy skills into .claude/commands/ so the vault is fully self-contained
    const vaultCommandsDir = path.join(resolvedVaultPath, '.claude', 'commands');
    await mkdir(vaultCommandsDir, { recursive: true });

    // Vault-type-specific skills
    const typeSkillsDir = path.join(TEMPLATES_DIR, 'skills', template.trim());
    try {
      const skillFiles = await readdir(typeSkillsDir);
      for (const f of skillFiles) {
        if (f.endsWith('.md')) {
          const content = await readFile(path.join(typeSkillsDir, f), 'utf-8');
          await writeFile(path.join(vaultCommandsDir, f), content);
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`[VAULTS] Could not copy type skills: ${err.message}`);
    }

    // Universal skills: journal, lint, help
    const UNIVERSAL_SKILLS = ['journal.md', 'lint.md', 'help.md'];
    const universalCommandsDir = path.join(LEGACY_ROOT, '.claude', 'commands');
    for (const f of UNIVERSAL_SKILLS) {
      try {
        const content = await readFile(path.join(universalCommandsDir, f), 'utf-8');
        await writeFile(path.join(vaultCommandsDir, f), content);
      } catch (err) {
        if (err.code !== 'ENOENT') console.warn(`[VAULTS] Could not copy ${f}: ${err.message}`);
      }
    }

    // Copy reset-wiki.sh to vault root
    const resetScriptSrc = path.join(TEMPLATES_DIR, 'scripts', `reset-wiki-${template.trim()}.sh`);
    const resetScriptDest = path.join(resolvedVaultPath, 'reset-wiki.sh');
    try {
      const resetContent = await readFile(resetScriptSrc, 'utf-8');
      await writeFile(resetScriptDest, resetContent, { mode: 0o755 });
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`[VAULTS] Could not copy reset script: ${err.message}`);
    }

    // Write wiki/index.md, wiki/log.md, and template-specific meta-pages
    const today = new Date().toISOString().slice(0, 10);
    await writeFile(path.join(resolvedVaultPath, 'wiki', 'index.md'), buildVaultIndex(name.trim(), template.trim(), today));
    await writeFile(path.join(resolvedVaultPath, 'wiki', 'log.md'), buildVaultLog(name.trim(), template.trim(), today));

    // Research vaults get additional meta-pages: dashboard, analytics, flashcards
    if (template.trim() === 'research') {
      await writeFile(path.join(resolvedVaultPath, 'wiki', 'dashboard.md'), buildResearchDashboard(today));
      await writeFile(path.join(resolvedVaultPath, 'wiki', 'analytics.md'), buildResearchAnalytics(today));
      await writeFile(path.join(resolvedVaultPath, 'wiki', 'flashcards.md'), buildResearchFlashcards(today));
    }

    // Update vaults.json
    const newEntry = {
      id: vaultId,
      name: name.trim(),
      template: template.trim(),
      path: resolvedVaultPath,
      purpose: (purpose || '').trim() || undefined
    };
    if (newEntry.purpose === undefined) delete newEntry.purpose;
    const updatedRegistry = [...registry, newEntry];
    await writeFile(VAULTS_JSON_PATH, JSON.stringify(updatedRegistry, null, 2));

    // Invalidate registry cache so next request picks up the new entry
    _vaultRegistry = null;

    console.log(`[VAULTS] Created vault "${vaultId}" at ${resolvedVaultPath}`);
    res.json({ id: vaultId, name: newEntry.name, template: newEntry.template, purpose: newEntry.purpose || '' });
  } catch (err) {
    console.error('Vault creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- API: Export vault as ZIP archive ---
// TASK-EI002, TASK-EI003

const EXPORT_EXCLUDE_DIRS = new Set(['.obsidian', 'node_modules', '.git']);

function shouldExcludeFromExport(relativePath, entryName) {
  if (relativePath === '.claude/settings.local.json') return true;
  if (entryName === '.DS_Store') return true;
  const segments = relativePath.split('/');
  return segments.some(seg => EXPORT_EXCLUDE_DIRS.has(seg));
}

async function addDirectoryToArchive(archive, dirPath, archivePath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = archivePath ? `${archivePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (EXPORT_EXCLUDE_DIRS.has(entry.name)) continue;
      await addDirectoryToArchive(archive, fullPath, relativePath);
    } else {
      if (shouldExcludeFromExport(relativePath, entry.name)) continue;
      archive.file(fullPath, { name: relativePath });
    }
  }
}

app.get('/api/vault/export', async (req, res) => {
  try {
    const vaultId = req.query.vault;
    if (!vaultId) {
      return res.status(400).json({ error: 'Missing "vault" query parameter.' });
    }

    const registry = await loadVaultRegistry();
    const vaultEntry = registry.find(v => v.id === vaultId);
    if (!vaultEntry) {
      return res.status(404).json({ error: `Unknown vault: ${vaultId}` });
    }

    const vaultRoot = vaultEntry.path;
    try {
      await access(vaultRoot);
    } catch {
      return res.status(404).json({ error: `Vault path not accessible: ${vaultRoot}` });
    }

    const manifest = {
      version: 1,
      name: vaultEntry.name,
      template: vaultEntry.template,
      purpose: vaultEntry.purpose || '',
      exportDate: new Date().toISOString(),
      exportedFrom: 'knowledge-compiler'
    };

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${vaultId}_${dateStr}.kc.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', (err) => {
      console.error('[EXPORT] Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Archive creation failed.' });
      }
    });

    archive.pipe(res);
    archive.append(JSON.stringify(manifest, null, 2), { name: 'vault-manifest.json' });
    await addDirectoryToArchive(archive, vaultRoot, '');
    await archive.finalize();
  } catch (err) {
    console.error('[EXPORT] Error:', err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({ error: err.message });
    }
  }
});

// --- API: Import vault from ZIP archive ---
// TASK-EI004, TASK-EI005

async function validateZipMagicBytes(filePath) {
  const fh = await fsOpen(filePath, 'r');
  try {
    const buf = Buffer.alloc(4);
    await fh.read(buf, 0, 4, 0);
    return buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04;
  } finally {
    await fh.close();
  }
}

function readManifestFromZip(zipPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      let found = false;
      zipfile.readEntry();
      zipfile.on('entry', (entry) => {
        if (entry.fileName === 'vault-manifest.json') {
          found = true;
          zipfile.openReadStream(entry, (err2, readStream) => {
            if (err2) { zipfile.close(); return reject(err2); }
            const chunks = [];
            readStream.on('data', (chunk) => chunks.push(chunk));
            readStream.on('end', () => {
              zipfile.close();
              try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
              } catch (parseErr) {
                reject(new Error('Invalid vault-manifest.json: ' + parseErr.message));
              }
            });
          });
        } else {
          zipfile.readEntry();
        }
      });
      zipfile.on('end', () => {
        if (!found) {
          zipfile.close();
          reject(new Error('Archive does not contain vault-manifest.json. Not a valid vault export.'));
        }
      });
      zipfile.on('error', (e) => { zipfile.close(); reject(e); });
    });
  });
}

function extractZipToDirectory(zipPath, targetDir) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      let extractedCount = 0;
      zipfile.readEntry();

      zipfile.on('entry', (entry) => {
        if (entry.fileName === 'vault-manifest.json') { zipfile.readEntry(); return; }

        const resolvedPath = path.resolve(targetDir, entry.fileName);
        // Zip-slip prevention
        if (!resolvedPath.startsWith(targetDir + path.sep) && resolvedPath !== targetDir) {
          console.warn(`[IMPORT] Skipping zip-slip attempt: ${entry.fileName}`);
          zipfile.readEntry();
          return;
        }
        // Skip OS metadata and editor state
        const baseName = path.basename(entry.fileName);
        if (baseName === '.DS_Store' || entry.fileName.split('/').some(seg => seg === '.obsidian')) {
          zipfile.readEntry();
          return;
        }

        // Directory entry
        if (/\/$/.test(entry.fileName)) {
          mkdir(resolvedPath, { recursive: true })
            .then(() => zipfile.readEntry())
            .catch(() => zipfile.readEntry());
          return;
        }

        // File entry
        mkdir(path.dirname(resolvedPath), { recursive: true })
          .then(() => {
            zipfile.openReadStream(entry, (err2, readStream) => {
              if (err2) { console.warn(`[IMPORT] Read error ${entry.fileName}:`, err2.message); zipfile.readEntry(); return; }
              const ws = createWriteStream(resolvedPath);
              readStream.pipe(ws);
              ws.on('finish', () => { extractedCount++; zipfile.readEntry(); });
              ws.on('error', (we) => { console.warn(`[IMPORT] Write error ${entry.fileName}:`, we.message); zipfile.readEntry(); });
            });
          })
          .catch(() => zipfile.readEntry());
      });

      zipfile.on('end', () => { zipfile.close(); resolve(extractedCount); });
      zipfile.on('error', (e) => { zipfile.close(); reject(e); });
    });
  });
}

function generateDefaultSettings(template) {
  const baseSkills = ['Skill(journal)', 'Skill(lint)', 'Skill(help)'];
  const templateSkills = {
    research: ['Skill(research)', 'Skill(newsletter)'],
    'code-analysis': [],
    portfolio: ['Skill(rebalance)']
  };
  return { permissions: { allow: [...baseSkills, ...(templateSkills[template] || [])] } };
}

const importUpload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 }   // 100 MB
});

app.post('/api/vault/import', importUpload.single('archive'), async (req, res) => {
  if (!ALLOW_WRITE) return res.status(403).json({ error: 'Imports are disabled. Start the server with --allow-write to enable.' });
  const tempFile = req.file?.path;
  try {
    // Catch multer size-limit error
    if (req.fileValidationError) {
      return res.status(413).json({ error: 'File exceeds the 100 MB upload limit.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No archive file provided.' });
    }

    const targetPath = req.body.targetPath;
    if (!targetPath || typeof targetPath !== 'string' || !targetPath.trim()) {
      return res.status(400).json({ error: 'Target path is required.' });
    }
    const resolvedTarget = path.resolve(targetPath.trim());

    // Validate ZIP format
    const isZip = await validateZipMagicBytes(tempFile);
    if (!isZip) {
      return res.status(400).json({ error: 'The uploaded file is not a valid ZIP archive.' });
    }

    // Read and validate manifest
    let manifest;
    try {
      manifest = await readManifestFromZip(tempFile);
    } catch (manifestErr) {
      return res.status(400).json({ error: manifestErr.message });
    }
    if (!manifest.version || !manifest.name || !manifest.template) {
      return res.status(400).json({ error: 'Invalid vault manifest: missing required fields (version, name, template).' });
    }

    // Determine vault name/purpose
    const vaultName = (req.body.name && req.body.name.trim()) || manifest.name;
    const vaultPurpose = (req.body.purpose && req.body.purpose.trim()) || manifest.purpose || '';

    // Derive vault ID
    const vaultId = vaultName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!vaultId) {
      return res.status(400).json({ error: 'Could not derive a valid vault ID from the vault name.' });
    }

    // Check for duplicate ID
    const registry = await loadVaultRegistry();
    if (registry.find(v => v.id === vaultId)) {
      return res.status(409).json({ error: `Vault ID "${vaultId}" already exists. Use the Name field to specify a different vault name.` });
    }

    // Check target path for existing vault
    try {
      await access(path.join(resolvedTarget, 'CLAUDE.md'));
      return res.status(409).json({ error: 'A vault already exists at that path (CLAUDE.md found).' });
    } catch {
      // Expected — no existing vault
    }

    // Extract archive
    await mkdir(resolvedTarget, { recursive: true });
    const extractedCount = await extractZipToDirectory(tempFile, resolvedTarget);

    // Fix reset-wiki.sh permissions
    const resetScript = path.join(resolvedTarget, 'reset-wiki.sh');
    try {
      await access(resetScript);
      await chmod(resetScript, 0o755);
    } catch { /* not present — fine */ }

    // Generate fresh settings.local.json
    const settingsDir = path.join(resolvedTarget, '.claude');
    await mkdir(settingsDir, { recursive: true });
    await writeFile(
      path.join(settingsDir, 'settings.local.json'),
      JSON.stringify(generateDefaultSettings(manifest.template), null, 2)
    );

    // Register in vaults.json
    const newEntry = { id: vaultId, name: vaultName, template: manifest.template, path: resolvedTarget };
    if (vaultPurpose) newEntry.purpose = vaultPurpose;
    const updatedRegistry = [...registry, newEntry];
    await writeFile(VAULTS_JSON_PATH, JSON.stringify(updatedRegistry, null, 2));
    _vaultRegistry = null;

    console.log(`[IMPORT] Imported vault "${vaultId}" (${extractedCount} files) to ${resolvedTarget}`);
    res.json({ id: vaultId, name: vaultName, template: manifest.template, purpose: vaultPurpose });
  } catch (err) {
    console.error('[IMPORT] Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (tempFile) { try { await unlink(tempFile); } catch { /* ignore */ } }
  }
});

// Multer error handler for file size limit
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File exceeds the 100 MB upload limit.' });
  }
  next(err);
});

// --- API: List all .md files recursively ---
// TASK-005  FR-GC-001
async function discoverFiles(dir, base) {
  const entries = await readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await discoverFiles(full, rel));
    } else if (entry.name.endsWith('.md')) {
      files.push(rel.replace(/\\/g, '/'));   // normalize to forward slashes
    }
  }
  return files;
}

app.get('/api/wiki/files', async (req, res) => {
  try {
    const vaultRoot = await resolveVaultRoot(req.query.vault);
    const wikiDir = path.join(vaultRoot, 'wiki');
    const files = await discoverFiles(wikiDir, '');
    res.json(files);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    // NFR-REL-001 — empty wiki or missing directory
    if (err.code === 'ENOENT') return res.json([]);
    console.error('File discovery error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- API: Read a single wiki file ---
// TASK-006  FR-CR-001, NFR-SEC-001, CON-03
app.get('/api/wiki/file', async (req, res) => {
  const relPath = req.query.path;
  if (!relPath) {
    return res.status(400).json({ error: 'Missing "path" query parameter.' });
  }

  try {
    const vaultRoot = await resolveVaultRoot(req.query.vault);
    const wikiDir = path.join(vaultRoot, 'wiki');

    // Path-traversal prevention
    const resolved = path.resolve(wikiDir, relPath);
    if (!resolved.startsWith(wikiDir + path.sep) && resolved !== wikiDir) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const content = await readFile(resolved, 'utf-8');
    res.type('text/plain').send(content);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    // NFR-REL-003
    console.error(`File read error [${relPath}]:`, err.message);
    res.status(404).json({ error: `Unable to load file: ${relPath}. ${err.message}` });
  }
});

// --- Page content export helpers (TASK-PE002) ---

/**
 * Strip YAML frontmatter from raw markdown.
 * Returns { title, body } where title is extracted from frontmatter or null.
 */
function stripFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { title: null, body: raw };
  const fm = match[1];
  const body = match[2];
  // Extract title from frontmatter without a YAML parser — just grab the title line
  const titleMatch = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1] : null;
  return { title, body };
}

/**
 * Resolve internal wiki links to plain text in markdown source.
 * Internal = href ends with .md (after stripping optional "title").
 * External (http/https) and anchor (#) links are preserved.
 */
function resolveLinksForExport(markdown) {
  // 1. Extract fenced code blocks to protect them from regex
  const codeBlocks = [];
  let processed = markdown.replace(/^(```[\s\S]*?^```|~~~[\s\S]*?^~~~)/gm, (m) => {
    codeBlocks.push(m);
    return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`;
  });

  // 2. Extract inline code spans
  const inlineCode = [];
  processed = processed.replace(/`[^`]+`/g, (m) => {
    inlineCode.push(m);
    return `\x00INLINE${inlineCode.length - 1}\x00`;
  });

  // 3. Handle reference-style link definitions: [ref-id]: target "title"
  const refDefs = {};
  processed = processed.replace(/^\[([^\]]+)\]:\s+(\S+)(?:\s+"[^"]*")?\s*$/gm, (m, id, target) => {
    const cleanTarget = target.replace(/\s+"[^"]*"$/, '');
    refDefs[id.toLowerCase()] = cleanTarget;
    // Check if internal — if so, mark definition for removal
    if (!cleanTarget.startsWith('http://') && !cleanTarget.startsWith('https://') && !cleanTarget.startsWith('#') && cleanTarget.endsWith('.md')) {
      return ''; // remove definition line
    }
    return m; // keep external definitions
  });

  // 4. Handle reference-style link usages: [text][ref-id]
  processed = processed.replace(/\[([^\]]*)\]\[([^\]]+)\]/g, (m, text, refId) => {
    const target = refDefs[refId.toLowerCase()];
    if (!target) return m; // unknown ref, keep as-is
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('#')) return m;
    if (target.endsWith('.md')) return text || '';
    return m;
  });

  // 5. Handle inline links: [text](target "optional title")
  processed = processed.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (m, text, rawTarget) => {
    // Strip optional title: page.md "tooltip" → page.md
    const target = rawTarget.replace(/\s+"[^"]*"$/, '').trim();
    if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('#')) return m;
    if (target.endsWith('.md')) return text || '';
    return m;
  });

  // 6. Reinsert inline code and code blocks
  processed = processed.replace(/\x00INLINE(\d+)\x00/g, (_, i) => inlineCode[i]);
  processed = processed.replace(/\x00CODEBLOCK(\d+)\x00/g, (_, i) => codeBlocks[i]);

  return processed;
}

/**
 * Safety pass on HTML: strip internal <a> tags to their text content,
 * add target/rel to external links.
 */
function resolveHtmlLinksForExport(html) {
  // Process <a> tags — handles nested HTML inside the link
  return html.replace(/<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi, (m, attrs, inner) => {
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/);
    if (!hrefMatch) return m;
    const href = hrefMatch[1];

    if (href.startsWith('http://') || href.startsWith('https://')) {
      // External: add target and rel
      let newAttrs = attrs;
      if (!attrs.includes('target=')) newAttrs += ' target="_blank"';
      if (!attrs.includes('rel=')) newAttrs += ' rel="noopener noreferrer"';
      return `<a ${newAttrs}>${inner}</a>`;
    }
    if (href.startsWith('#')) return m; // anchor — keep
    if (href.endsWith('.md') || href.match(/\.md[?"#]/)) {
      // Internal link — replace with inner content only
      return inner || '';
    }
    return m;
  });
}

/**
 * Build an export filename from the page title or wiki path.
 */
function buildExportFilename(title, wikiPath, format) {
  let slug;
  if (title) {
    slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  } else {
    slug = path.basename(wikiPath, '.md');
  }
  return `${slug}.${format === 'html' ? 'html' : 'md'}`;
}

/**
 * Wrap HTML body in a minimal standalone HTML document.
 */
function wrapInHtmlDocument(htmlBody, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Exported Page'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #fff; }
    main { max-width: 800px; margin: 0 auto; padding: 24px 32px; }
    h1 { font-size: 2em; margin-top: 0.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; margin-top: 1.5em; }
    h3 { font-size: 1.25em; margin-top: 1.3em; }
    a { color: #4A90D9; text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote { border-left: 4px solid #4A90D9; margin: 1em 0; padding: 0.5em 1em; background: #f0f5ff; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    pre { background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px; overflow-x: auto; }
    code { font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 0.9em; }
    p code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
    hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <!-- Images use relative paths from the wiki. Upload them separately to your publishing platform. -->
  <main>
${htmlBody}
  </main>
</body>
</html>`;
}

// --- API: Export a single wiki page as Markdown or HTML (TASK-PE003) ---
app.get('/api/wiki/page/export', async (req, res) => {
  const relPath = req.query.path;
  const format = req.query.format;

  if (!relPath) {
    return res.status(400).json({ error: 'Missing "path" query parameter.' });
  }
  if (!format || (format !== 'md' && format !== 'html')) {
    return res.status(400).json({ error: 'Format must be "md" or "html".' });
  }

  try {
    const vaultRoot = await resolveVaultRoot(req.query.vault);
    const wikiDir = path.join(vaultRoot, 'wiki');

    // Path-traversal prevention
    const resolved = path.resolve(wikiDir, relPath);
    if (!resolved.startsWith(wikiDir + path.sep) && resolved !== wikiDir) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const raw = await readFile(resolved, 'utf-8');
    const { title, body } = stripFrontmatter(raw);
    const resolvedBody = resolveLinksForExport(body);
    const filename = buildExportFilename(title, relPath, format);

    if (format === 'md') {
      res.set('Content-Type', 'text/markdown; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(resolvedBody);
    }

    // HTML format
    let html = marked.parse(resolvedBody, { gfm: true, breaks: false });
    html = resolveHtmlLinksForExport(html);
    const doc = wrapInHtmlDocument(html, title);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(doc);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    if (err.code === 'ENOENT') return res.status(404).json({ error: `File not found: ${relPath}` });
    console.error(`Page export error [${relPath}]:`, err.message);
    res.status(500).json({ error: `Export failed: ${err.message}` });
  }
});

// --- API: Serve image from wiki/images/ ---
// Restricted to wiki/images/ subtree; supports SVG, PNG, JPG, GIF, WebP.
app.get('/api/wiki/image', async (req, res) => {
  const relPath = req.query.path;
  if (!relPath) {
    return res.status(400).json({ error: 'Missing "path" query parameter.' });
  }

  try {
    const vaultRoot = await resolveVaultRoot(req.query.vault);
    const wikiDir = path.join(vaultRoot, 'wiki');
    const imagesDir = path.join(wikiDir, 'images');
    const resolved = path.resolve(wikiDir, relPath);

    // Path-traversal prevention — must stay inside wiki/images/
    if (!resolved.startsWith(imagesDir + path.sep)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const data = await readFile(resolved);
    const ext = path.extname(relPath).toLowerCase();
    const MIME = {
      '.svg':  'image/svg+xml',
      '.png':  'image/png',
      '.jpg':  'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif':  'image/gif',
      '.webp': 'image/webp'
    };
    res.type(MIME[ext] || 'application/octet-stream').send(data);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    res.status(404).json({ error: `Image not found: ${relPath}` });
  }
});

// --- API: Upload file to raw/ directory ---
// TASK-064  FR-UP-004, CON-03, NFR-SEC-001
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/raw/upload', upload.single('file'), async (req, res) => {
  if (!ALLOW_WRITE) return res.status(403).json({ error: 'Uploads are disabled. Start the server with --allow-write to enable.' });
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    // Strip directory separators — path-traversal prevention
    const safeName = path.basename(req.file.originalname).replace(/[\/\\]/g, '');
    if (!safeName) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }

    const vaultRoot = await resolveVaultRoot(req.query.vault);
    const rawDir = path.join(vaultRoot, 'raw');

    // Path-traversal prevention — verify destination stays within vault's raw/
    const destPath = path.resolve(rawDir, safeName);
    if (!destPath.startsWith(rawDir + path.sep) && destPath !== rawDir) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // FR-UP-002 — conflict prevention
    try {
      await access(destPath);
      // File exists
      return res.status(409).json({ error: `File already exists: ${safeName}. Rename the file and try again.` });
    } catch {
      // File does not exist — proceed
    }

    await writeFile(destPath, req.file.buffer);
    console.log(`Uploaded: raw/${safeName} (${req.file.size} bytes)`);
    res.json({ uploaded: safeName });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Start server  NFR-SEC-003 (localhost only) ---
// TASK-004
app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Knowledge Compiler running at http://127.0.0.1:${PORT}`);
  console.log(`Write mode: ${ALLOW_WRITE ? 'ENABLED (--allow-write)' : 'disabled (read-only)'}`);
  if (!ALLOW_WRITE) console.log('  Tip: start with --allow-write or ALLOW_WRITE=true to enable uploads and imports');
  const registry = await loadVaultRegistry();
  if (registry.length > 0) {
    const ids = registry.map(v => v.id).join(', ');
    console.log(`Registered vaults: ${ids}`);
    console.log(`Default wiki: ${registry[0].path}/wiki`);
  } else {
    console.log('No vaults registered. Create one via the UI at http://127.0.0.1:' + PORT);
  }
});
