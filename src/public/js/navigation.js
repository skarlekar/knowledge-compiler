/* ==========================================================================
   navigation.js — Breadcrumb, back, home, graph-content sync
   TASK-017  FR-NAV-004, IR-LAY-004  (breadcrumb trail)
   TASK-040  FR-NAV-002  (graph-content sync)
   TASK-041  FR-NAV-003  (content-to-graph nav)
   TASK-042  FR-NAV-005  (back)
   TASK-043  FR-NAV-006  (home)
   TASK-049  NFR-USE-003  (keyboard shortcuts)
   ========================================================================== */

const Navigation = (() => {
  const MAX_TRAIL = 10;
  let trail = [];            // breadcrumb history: { nodeId, scrollTop } (most recent last)
  let trailIndex = -1;       // pointer into trail for back navigation
  let onNavigate = null;     // callback(nodeId, skipRecord, skipCentre, restoreScrollTop) — wired by app.js
  let graphNodes = null;

  function init(nodes, navigateCallback) {
    graphNodes = nodes;
    onNavigate = navigateCallback;

    // Back button — TASK-042  FR-NAV-005
    document.getElementById('btn-back').addEventListener('click', goBack);

    // Home button — TASK-043  FR-NAV-006
    document.getElementById('btn-home').addEventListener('click', () => {
      if (onNavigate) onNavigate('index.md');
    });

    // Keyboard shortcuts — TASK-049  NFR-USE-003
    document.addEventListener('keydown', handleKeyboard);
  }

  /**
   * Record a navigation and update the breadcrumb bar.
   * Called whenever active node changes.
   * TASK-017  FR-NAV-004
   */
  function recordNavigation(nodeId, prevScrollTop) {
    // Store the previous page's scroll position (captured before render reset it)
    if (trail.length > 0 && trailIndex >= 0) {
      trail[trailIndex].scrollTop = prevScrollTop || 0;
    }

    // If navigating forward (not via back), trim trail ahead of current index
    if (trailIndex < trail.length - 1) {
      trail = trail.slice(0, trailIndex + 1);
    }

    // Avoid duplicate consecutive entries
    const last = trail.length > 0 ? trail[trail.length - 1].nodeId : null;
    if (trail.length === 0 || last !== nodeId) {
      trail.push({ nodeId, scrollTop: 0 });
      if (trail.length > MAX_TRAIL) trail.shift();
    }
    trailIndex = trail.length - 1;

    renderBreadcrumb();
    updateBackButton();
  }

  /**
   * Render the breadcrumb bar.
   */
  // Note: innerHTML is used here with the same escapeHtml() pattern as before.
  // All text is escaped; data attributes are internal state (index, nodeId).
  function renderBreadcrumb() {
    const bar = document.getElementById('breadcrumb-bar');
    const items = trail.map((entry, i) => {
      const node = graphNodes.get(entry.nodeId);
      const name = node ? node.displayName : entry.nodeId;
      if (i === trailIndex) {
        return `<span><b>${escapeHtml(name)}</b></span>`;
      }
      return `<a data-idx="${i}" data-node="${entry.nodeId}">${escapeHtml(name)}</a>`;
    });
    bar.innerHTML = items.join('<span class="sep">›</span>');

    // Wire clicks — save current scroll, jump to target entry, restore its scroll
    bar.querySelectorAll('a[data-node]').forEach(a => {
      a.addEventListener('click', () => {
        // Save scroll position of current page before jumping
        const contentBody = document.getElementById('content-body');
        if (contentBody && trail.length > 0 && trailIndex >= 0) {
          trail[trailIndex].scrollTop = contentBody.scrollTop;
        }
        const idx = parseInt(a.getAttribute('data-idx'), 10);
        if (idx >= 0 && idx < trail.length) trailIndex = idx;
        const entry = trail[trailIndex];
        renderBreadcrumb();
        updateBackButton();
        if (onNavigate) onNavigate(entry.nodeId, true, false, entry.scrollTop);
      });
    });
  }

  /**
   * Navigate back — TASK-042  FR-NAV-005
   */
  function goBack() {
    if (trailIndex <= 0) return;
    // Save scroll position of the page we're leaving
    const contentBody = document.getElementById('content-body');
    if (contentBody && trailIndex >= 0) {
      trail[trailIndex].scrollTop = contentBody.scrollTop;
    }
    trailIndex--;
    const entry = trail[trailIndex];
    renderBreadcrumb();
    updateBackButton();
    if (onNavigate) onNavigate(entry.nodeId, true, false, entry.scrollTop);
  }

  function updateBackButton() {
    document.getElementById('btn-back').disabled = trailIndex <= 0;
  }

  /**
   * Keyboard shortcuts — TASK-049  NFR-USE-003
   */
  function handleKeyboard(e) {
    const searchInput = document.getElementById('search-input');
    const searchFocused = document.activeElement === searchInput;

    // Suppress all keyboard shortcuts when any text input, textarea, or select is active
    const tag = document.activeElement && document.activeElement.tagName.toLowerCase();
    const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select'
      || (document.activeElement && document.activeElement.isContentEditable);
    if (isTyping) return;

    // Ctrl+/ or Cmd+/ — focus search
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      searchInput.focus();
      return;
    }

    // Escape — clear search
    if (e.key === 'Escape') {
      searchInput.value = '';
      searchInput.blur();
      document.getElementById('search-dropdown').classList.add('hidden');
      return;
    }

    // Backspace (when search not focused) — go back
    if (e.key === 'Backspace' && !searchFocused) {
      e.preventDefault();
      goBack();
      return;
    }

    // Home — navigate to index.md
    if (e.key === 'Home' && !searchFocused) {
      e.preventDefault();
      if (onNavigate) onNavigate('index.md');
      return;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, recordNavigation };
})();
