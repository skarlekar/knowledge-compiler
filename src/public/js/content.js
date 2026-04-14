/* ==========================================================================
   content.js — Markdown content rendering & metadata bar
   TASK-032  FR-CR-001, FR-CR-002  (markdown to HTML)
   TASK-033  FR-CR-003  (frontmatter exclusion)
   TASK-034  FR-CR-004  (internal link interactivity)
   TASK-035  FR-CR-005  (external link handling)
   TASK-036  FR-CR-006  (metadata bar)
   TASK-038  NFR-SEC-002  (HTML sanitization)
   ========================================================================== */

const ContentRenderer = (() => {
  let graphNodes = null;     // Map<path, node>
  let onNavigate = null;     // callback(nodeId)
  let _currentRenderNode = '';   // tracks active node for image path resolution

  // ── Image path resolution ─────────────────────────────────────────────────
  // Rewrites relative <img src> paths to /api/wiki/image?path=... during
  // DOMPurify sanitization so the browser never fires requests to invalid paths.
  if (typeof DOMPurify !== 'undefined') {
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.tagName !== 'IMG') return;
      const src = node.getAttribute('src');
      if (!src) return;
      // Leave absolute URLs and data URIs unchanged
      if (src.startsWith('http://') || src.startsWith('https://') ||
          src.startsWith('/') || src.startsWith('data:')) return;
      // Resolve wiki-root-relative path, then rewrite to API URL
      const wikiPath = resolveLink(_currentRenderNode, src);
      node.setAttribute('src', '/api/wiki/image?path=' + encodeURIComponent(wikiPath));
    });
  }

  // ── Mermaid diagram support ───────────────────────────────────────────────
  // Registers a marked extension that converts ```mermaid blocks into
  // <div class="mermaid"> containers. mermaid.run() renders them into inline
  // SVG after content is injected into the DOM.
  if (typeof marked !== 'undefined' && typeof mermaid !== 'undefined') {
    marked.use({
      extensions: [{
        name: 'mermaid',
        level: 'block',
        start(src) { return src.indexOf('```mermaid'); },
        tokenizer(src) {
          const match = src.match(/^```mermaid\r?\n([\s\S]*?)```/);
          if (match) {
            return { type: 'mermaid', raw: match[0], text: match[1].trim() };
          }
        },
        renderer(token) {
          // Encode < > & so diagram syntax survives DOMPurify as text content;
          // the browser decodes entities back when mermaid reads textContent.
          const safe = token.text
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<div class="mermaid">${safe}</div>\n`;
        }
      }]
    });
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
  }

  /**
   * Initialize with graph data and navigation callback.
   */
  function init(nodes, navigateCallback) {
    graphNodes = nodes;
    onNavigate = navigateCallback;
  }

  /**
   * Render a node's content into the content panel.
   * TASK-032  FR-CR-001
   */
  function render(nodeId) {
    const node = graphNodes.get(nodeId);
    if (!node) return;

    // Handle file-read errors — NFR-REL-003
    if (node.error) {
      document.getElementById('metadata-bar').innerHTML = '';
      document.getElementById('content-body').innerHTML =
        `<div class="content-inner"><p style="color:#c0392b"><b>Unable to load file:</b> ${nodeId}. ${node.error}</p></div>`;
      return;
    }

    // Metadata bar — TASK-036  FR-CR-006
    renderMetadataBar(node);

    // Render markdown body (frontmatter already stripped by graph.js parser)
    // TASK-033  FR-CR-003 — FR-CR-002
    _currentRenderNode = nodeId;   // must be set before DOMPurify hook fires
    let html = marked.parse(node.body || '', { gfm: true, breaks: false });

    // TASK-038  NFR-SEC-002 — sanitize
    if (typeof DOMPurify !== 'undefined') {
      html = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'h1','h2','h3','h4','h5','h6','p','a','ul','ol','li','blockquote',
          'pre','code','em','strong','del','table','thead','tbody','tr','th','td',
          'hr','br','img','span','div','sup','sub'
        ],
        ALLOWED_ATTR: ['href','src','alt','title','class','id','target','rel'],
        FORBID_TAGS: ['script','style','iframe','object','embed','form','input'],
        FORBID_ATTR: ['onclick','onerror','onload','onmouseover','onfocus']
      });
    }

    // Wrap in content-inner for max-width — IR-CP-003
    const contentBody = document.getElementById('content-body');
    contentBody.innerHTML = `<div class="content-inner">${html}</div>`;
    contentBody.scrollTop = 0;

    // Post-process links — TASK-034  FR-CR-004, TASK-035  FR-CR-005
    processLinks(contentBody, nodeId);

    // Render Mermaid diagrams into inline SVG.
    // The marked extension converts ```mermaid blocks to <div class="mermaid">
    // before DOMPurify runs. As a fallback, also convert any fenced blocks that
    // marked rendered as <pre><code class="language-mermaid"> (happens when the
    // extension tokenizer doesn't match or is not registered in time).
    if (typeof mermaid !== 'undefined') {
      contentBody.querySelectorAll('pre > code.language-mermaid').forEach(code => {
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = code.textContent; // textContent decodes HTML entities
        code.closest('pre').replaceWith(div);
      });
      const diagrams = contentBody.querySelectorAll('.mermaid');
      if (diagrams.length > 0) mermaid.run({ nodes: diagrams });
    }
  }

  /**
   * Render the metadata bar above content.
   * TASK-036  FR-CR-006
   */
  function renderMetadataBar(node) {
    const bar = document.getElementById('metadata-bar');
    let html = '';

    // Title
    html += `<span class="meta-title">${escapeHtml(node.displayName)}</span>`;

    // Type badge with colour
    if (node.type) {
      const bg = getTypeColour(node.type);
      html += `<span class="meta-badge" style="background:${bg}">${node.type}</span>`;
    }

    // Tags
    if (node.tags && node.tags.length) {
      for (const tag of node.tags) {
        html += `<span class="meta-tag">${escapeHtml(tag)}</span>`;
      }
    }

    // Confidence
    if (node.confidence) {
      html += `<span class="meta-info">Confidence: ${node.confidence}</span>`;
    }

    // Updated
    if (node.updated) {
      html += `<span class="meta-info">Updated: ${node.updated}</span>`;
    }

    bar.innerHTML = html;
  }

  /**
   * Process rendered links to make internal links navigate in-app
   * and external links open in new tab.
   * TASK-034  FR-CR-004
   * TASK-035  FR-CR-005
   */
  function processLinks(container, currentNodeId) {
    const links = container.querySelectorAll('a[href]');
    for (const a of links) {
      const href = a.getAttribute('href');

      // External links — FR-CR-005
      if (href.startsWith('http://') || href.startsWith('https://')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        continue;
      }

      // Anchor-only links
      if (href.startsWith('#')) continue;

      // Internal .md links — FR-CR-004
      if (href.endsWith('.md')) {
        const resolved = resolveLink(currentNodeId, href);
        if (graphNodes.has(resolved)) {
          a.classList.add('wiki-link');
          a.removeAttribute('href');
          a.setAttribute('data-target', resolved);
          a.addEventListener('click', (e) => {
            e.preventDefault();
            if (onNavigate) onNavigate(resolved);
          });
        } else {
          // Broken link styling
          a.style.color = '#c0392b';
          a.style.textDecoration = 'line-through';
          a.title = `Broken link: ${href}`;
        }
      }
    }
  }

  /**
   * Simple HTML entity escaping.
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, render };
})();
