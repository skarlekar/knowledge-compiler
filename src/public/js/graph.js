/* ==========================================================================
   graph.js — Graph construction: file fetch, parse, build model
   TASK-008  FR-GC-001   (client-side fetching)
   TASK-009  FR-GC-009   (frontmatter parsing)
   TASK-010  FR-GC-002, FR-GC-007  (link extraction, external exclusion)
   TASK-011  FR-GC-003   (link resolution)
   TASK-012  FR-GC-004, FR-GC-005, FR-GC-006  (nodes, edges, dedup)
   TASK-013  FR-GC-008   (broken link detection)
   ========================================================================== */

const GraphBuilder = (() => {

  /**
   * Parse YAML frontmatter from markdown content.
   * Returns { meta: {…}, body: "…" }
   * TASK-009  FR-GC-009, NFR-REL-002
   */
  function parseFrontmatter(content, filePath) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return { meta: {}, body: content };

    try {
      const meta = jsyaml.load(match[1]) || {};
      const body = content.slice(match[0].length).trim();
      return { meta, body };
    } catch (err) {
      // NFR-REL-002 — malformed frontmatter
      console.warn(`[WARN] Malformed frontmatter in ${filePath}:`, err.message);
      return {
        meta: {
          title: filePath.split('/').pop().replace('.md', ''),
          type: 'other',
          tags: [],
          confidence: null
        },
        body: content
      };
    }
  }

  /**
   * Extract internal markdown links from content.
   * Returns array of { text, target } for links pointing to other .md files.
   * TASK-010  FR-GC-002, FR-GC-007
   */
  function extractLinks(body) {
    const regex = /\[([^\]]*)\]\(([^)]+)\)/g;
    const links = [];
    let m;
    while ((m = regex.exec(body)) !== null) {
      const target = m[2];
      // FR-GC-007 — exclude external and anchor-only links
      if (target.startsWith('http://') || target.startsWith('https://') || target.startsWith('#')) {
        continue;
      }
      // Only consider .md targets
      if (target.endsWith('.md')) {
        links.push({ text: m[1], target });
      }
    }
    return links;
  }

  /**
   * Build the full graph model from the wiki API.
   * Returns { nodes: Map<path, node>, edges: [], nodeList: [] }
   */
  async function build() {
    // TASK-008 — Fetch file list
    const res = await fetch('/api/wiki/files');
    const filePaths = await res.json();

    if (!filePaths.length) return { nodes: new Map(), edges: [], nodeList: [] };

    // Fetch all file contents in parallel
    const fileContents = await Promise.all(
      filePaths.map(async (fp) => {
        try {
          const r = await fetch(`/api/wiki/file?path=${encodeURIComponent(fp)}`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const text = await r.text();
          return { path: fp, content: text, error: null };
        } catch (err) {
          // NFR-REL-003
          console.error(`[ERROR] Failed to read ${fp}:`, err.message);
          return { path: fp, content: '', error: err.message };
        }
      })
    );

    // Build nodes — TASK-012  FR-GC-004
    const nodes = new Map();
    for (const file of fileContents) {
      const { meta, body } = parseFrontmatter(file.content, file.path);
      const type = inferType(file.path, meta.type);
      const node = {
        id: file.path,
        displayName: displayName(file.path, meta.title),
        type,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        confidence: meta.confidence || null,
        created: meta.created || null,
        updated: meta.updated || null,
        body,
        rawContent: file.content,
        error: file.error,
        inbound: 0,
        outbound: 0,
        colour: getTypeColour(type),
        // D3 simulation will add x, y, vx, vy
      };
      nodes.set(file.path, node);
    }

    // Build edges — TASK-012  FR-GC-005, FR-GC-006, TASK-013  FR-GC-008
    const edgeSet = new Set();
    const edges = [];

    for (const file of fileContents) {
      if (file.error) continue;
      const { body } = parseFrontmatter(file.content, file.path);
      const links = extractLinks(body);

      for (const link of links) {
        const resolved = resolveLink(file.path, link.target);

        // FR-GC-008 — broken link
        if (!nodes.has(resolved)) {
          console.warn(`[BROKEN LINK] ${file.path} -> "${link.text}" (${link.target}) resolved to ${resolved} — not found`);
          continue;
        }

        // FR-GC-006 — deduplicate
        const edgeKey = `${file.path}||${resolved}`;
        if (edgeSet.has(edgeKey)) continue;
        edgeSet.add(edgeKey);

        edges.push({ source: file.path, target: resolved });
      }
    }

    // Calculate inbound/outbound counts
    for (const edge of edges) {
      const src = nodes.get(edge.source);
      const tgt = nodes.get(edge.target);
      if (src) src.outbound++;
      if (tgt) tgt.inbound++;
    }

    const nodeList = Array.from(nodes.values());
    return { nodes, edges, nodeList };
  }

  return { build, parseFrontmatter, extractLinks };
})();
