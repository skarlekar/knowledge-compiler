/* ==========================================================================
   utils.js — Shared constants and helpers
   ========================================================================== */

// TASK-019  FR-GV-003 — Node type color map (research + code-analysis + portfolio types)
const TYPE_COLORS = {
  // Research vault types
  concept:                '#4A90D9',
  entity:                 '#50B86C',
  summary:                '#E8913A',
  synthesis:              '#9B59B6',
  journal:                '#17A2B8',
  presentation:           '#E85D75',
  index:                  '#F1C40F',
  log:                    '#6C757D',
  dashboard:              '#6610F2',
  flashcards:             '#E83E8C',
  // Code-analysis vault types
  class:                  '#2ECC71',
  function:               '#3498DB',
  api:                    '#E67E22',
  library:                '#1ABC9C',
  pattern:                '#8E44AD',
  'anti-pattern':         '#E74C3C',
  module:                 '#F39C12',
  // Portfolio vault types
  holding:                '#27AE60',
  watchlist:              '#85C1E9',
  thesis:                 '#F7DC6F',
  decision:               '#A9CCE3',
  sector:                 '#FAD7A0',
  'asset-class':          '#D2B4DE',
  'performance-snapshot': '#A3E4D7',
  asset:                  '#82E0AA',
  liability:              '#F1948A',
  'net-worth-snapshot':   '#5DADE2',
  // Fallback
  other:                  '#95A5A6'
};

// TASK-055  NFR-USE-004 — Label color for WCAG 4.5:1 contrast
const TYPE_LABEL_COLOURS = {
  concept:                '#fff',
  entity:                 '#fff',
  summary:                '#fff',
  synthesis:              '#fff',
  journal:                '#fff',
  presentation:           '#fff',
  index:                  '#000',   // Gold needs dark text
  log:                    '#fff',
  dashboard:              '#fff',
  flashcards:             '#fff',
  class:                  '#fff',
  function:               '#fff',
  api:                    '#fff',
  library:                '#fff',
  pattern:                '#fff',
  'anti-pattern':         '#fff',
  module:                 '#fff',
  // Portfolio types
  holding:                '#fff',
  watchlist:              '#000',   // Light blue — needs dark text
  thesis:                 '#000',   // Yellow — needs dark text
  decision:               '#000',   // Light blue — needs dark text
  sector:                 '#000',   // Light orange — needs dark text
  'asset-class':          '#000',   // Light purple — needs dark text
  'performance-snapshot': '#000',   // Light teal — needs dark text
  asset:                  '#000',   // Light green — needs dark text
  liability:              '#fff',
  'net-worth-snapshot':   '#fff',
  other:                  '#fff'
};

/**
 * Infer node type from parent directory if frontmatter type is missing.
 * TASK-019  FR-GV-003
 */
function inferType(filePath, frontmatterType) {
  if (frontmatterType && TYPE_COLORS[frontmatterType]) return frontmatterType;
  if (frontmatterType) return frontmatterType;              // unknown but present

  // Infer from directory
  const parts = filePath.split('/');
  if (parts.length >= 2) {
    const dir = parts[parts.length - 2];     // parent folder name
    if (TYPE_COLORS[dir]) return dir;
    // Explicit mappings for code-analysis and portfolio plural directories
    const PLURAL_MAP = {
      'classes':             'class',
      'functions':           'function',
      'apis':                'api',
      'libraries':           'library',
      'patterns':            'pattern',
      'anti-patterns':       'anti-pattern',
      'modules':             'module',
      // Portfolio vault directories
      'holdings':            'holding',
      'watchlist':           'watchlist',
      'theses':              'thesis',
      'decisions':           'decision',
      'sectors':             'sector',
      'asset-classes':       'asset-class',
      'performance':         'performance-snapshot',
      'assets':              'asset',
      'liabilities':         'liability',
      'net-worth':           'net-worth-snapshot',
    };
    if (PLURAL_MAP[dir]) return PLURAL_MAP[dir];
    // Handle generic plural directory names (concepts -> concept, entities -> entity, etc.)
    const singular = dir.replace(/s$/, '').replace(/ie$/, 'y');
    if (TYPE_COLORS[singular]) return singular;
  }

  // Special root-level files
  const filename = parts[parts.length - 1].replace('.md', '');
  if (TYPE_COLORS[filename]) return filename;               // e.g., "index", "log"

  return 'other';
}

/**
 * Get fill color for a node type.
 */
function getTypeColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.other;
}

/**
 * Resolve a relative link target from the directory of the source file.
 * TASK-011  FR-GC-003, CON-04
 *
 * @param {string} sourceFilePath — relative path of the file containing the link (from wiki root)
 * @param {string} linkTarget — raw href from the markdown link
 * @returns {string} normalized path relative to wiki root
 */
function resolveLink(sourceFilePath, linkTarget) {
  // Determine directory of source file
  const parts = sourceFilePath.split('/');
  parts.pop();                                 // remove filename
  const sourceDir = parts.join('/');

  // Combine and normalize
  const combined = sourceDir ? sourceDir + '/' + linkTarget : linkTarget;
  const segments = combined.split('/');
  const resolved = [];
  for (const seg of segments) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') { resolved.pop(); continue; }
    resolved.push(seg);
  }
  return resolved.join('/');
}

/**
 * Extract display name from frontmatter title or filename.
 * TASK-012  FR-GC-004
 */
function displayName(filePath, frontmatterTitle) {
  if (frontmatterTitle) return frontmatterTitle;
  const name = filePath.split('/').pop().replace('.md', '');
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
