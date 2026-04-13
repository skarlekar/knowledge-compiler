import express from 'express';
import { readdir, readFile, stat, access, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve wiki directory — two levels up from src/server/
const WIKI_DIR = path.resolve(__dirname, '..', '..', 'wiki');
const RAW_DIR = path.resolve(__dirname, '..', '..', 'raw');

// --- Static files ---
app.use(express.static(path.join(__dirname, '..', 'public')));

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

app.get('/api/wiki/files', async (_req, res) => {
  try {
    const files = await discoverFiles(WIKI_DIR, '');
    res.json(files);
  } catch (err) {
    // NFR-REL-001 — empty wiki or missing directory
    if (err.code === 'ENOENT') {
      return res.json([]);
    }
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

  // Path-traversal prevention
  const resolved = path.resolve(WIKI_DIR, relPath);
  if (!resolved.startsWith(WIKI_DIR)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const content = await readFile(resolved, 'utf-8');
    res.type('text/plain').send(content);
  } catch (err) {
    // NFR-REL-003
    console.error(`File read error [${relPath}]:`, err.message);
    res.status(404).json({ error: `Unable to load file: ${relPath}. ${err.message}` });
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

    const destPath = path.join(RAW_DIR, safeName);

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
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Start server  NFR-SEC-003 (localhost only) ---
// TASK-004
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Knowledge Compiler running at http://127.0.0.1:${PORT}`);
  console.log(`Serving wiki from: ${WIKI_DIR}`);
});
