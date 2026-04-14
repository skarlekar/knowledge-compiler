import express from 'express';
import { readdir, readFile, stat, access, writeFile } from 'fs/promises';
import path from 'path';
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
