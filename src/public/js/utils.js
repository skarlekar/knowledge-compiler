/* ==========================================================================
   utils.js — Shared constants and helpers
   ========================================================================== */

// TASK-019  FR-GV-003 — Node type colour map (11 types)
const TYPE_COLOURS = {
  concept:      '#4A90D9',
  entity:       '#50B86C',
  summary:      '#E8913A',
  synthesis:    '#9B59B6',
  journal:      '#17A2B8',
  presentation: '#E85D75',
  index:        '#F1C40F',
  log:          '#6C757D',
  dashboard:    '#6610F2',
  flashcards:   '#E83E8C',
  other:        '#95A5A6'
};

// TASK-055  NFR-USE-004 — Label colour for WCAG 4.5:1 contrast
const TYPE_LABEL_COLOURS = {
  concept:      '#fff',
  entity:       '#fff',
  summary:      '#fff',
  synthesis:    '#fff',
  journal:      '#fff',
  presentation: '#fff',
  index:        '#000',   // Gold needs dark text
  log:          '#fff',
  dashboard:    '#fff',
  flashcards:   '#fff',
  other:        '#fff'
};

/**
 * Infer node type from parent directory if frontmatter type is missing.
 * TASK-019  FR-GV-003
 */
function inferType(filePath, frontmatterType) {
  if (frontmatterType && TYPE_COLOURS[frontmatterType]) return frontmatterType;
  if (frontmatterType) return frontmatterType;              // unknown but present

  // Infer from directory
  const parts = filePath.split('/');
  if (parts.length >= 2) {
    const dir = parts[parts.length - 2];     // parent folder name
    if (TYPE_COLOURS[dir]) return dir;
    // Handle plural directory names (concepts -> concept, entities -> entity, etc.)
    const singular = dir.replace(/s$/, '').replace(/ie$/, 'y');
    if (TYPE_COLOURS[singular]) return singular;
  }

  // Special root-level files
  const filename = parts[parts.length - 1].replace('.md', '');
  if (TYPE_COLOURS[filename]) return filename;               // e.g., "index", "log"

  return 'other';
}

/**
 * Get fill colour for a node type.
 */
function getTypeColour(type) {
  return TYPE_COLOURS[type] || TYPE_COLOURS.other;
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
