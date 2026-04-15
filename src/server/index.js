import express from 'express';
import { readdir, readFile, stat, access, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Legacy single-vault directories (used when no vaults.json or in legacy fallback mode)
const LEGACY_ROOT = path.resolve(__dirname, '..', '..');
const LEGACY_WIKI_DIR = path.join(LEGACY_ROOT, 'wiki');
const LEGACY_RAW_DIR = path.join(LEGACY_ROOT, 'raw');
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
 * - If no vaultId, return the first vault's path, or fall back to LEGACY_ROOT.
 * Throws a 404-style error if the vault ID is unknown.
 */
async function resolveVaultRoot(vaultId) {
  const registry = await loadVaultRegistry();
  if (vaultId) {
    const vault = registry.find(v => v.id === vaultId);
    if (!vault) throw Object.assign(new Error(`Unknown vault: ${vaultId}`), { status: 404 });
    return vault.path;
  }
  if (registry.length > 0) return registry[0].path;
  return LEGACY_ROOT;
}

// --- Static files ---
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

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
  if (template === 'code-analysis') {
    return `---
title: "Index — ${vaultName}"
type: concept
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
type: concept
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
  return `# ${vaultName} — Activity Log\n\n### ${date} — Vault Created\n\n- **Source/Trigger**: New vault created via UI\n- **Template**: ${template}\n- **Pages created**: wiki/index.md, wiki/log.md\n`;
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
    const subdirs = template.trim() === 'code-analysis' ? CODE_SUBDIRS : RESEARCH_SUBDIRS;
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

    // Write wiki/index.md and wiki/log.md
    const today = new Date().toISOString().slice(0, 10);
    await writeFile(path.join(resolvedVaultPath, 'wiki', 'index.md'), buildVaultIndex(name.trim(), template.trim(), today));
    await writeFile(path.join(resolvedVaultPath, 'wiki', 'log.md'), buildVaultLog(name.trim(), template.trim(), today));

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
  const registry = await loadVaultRegistry();
  if (registry.length > 0) {
    const ids = registry.map(v => v.id).join(', ');
    console.log(`Registered vaults: ${ids}`);
    console.log(`Default wiki: ${registry[0].path}/wiki`);
  } else {
    console.log('No vault registry found; using legacy wiki directory.');
    console.log(`Serving wiki from: ${LEGACY_WIKI_DIR}`);
  }
});
