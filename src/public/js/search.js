/* ==========================================================================
   search.js — Search input & type filter toggles
   TASK-044  FR-SF-001  (node search)
   TASK-045  FR-SF-002  (search result selection)
   TASK-046  FR-SF-003  (type filter toggles)
   TASK-047  FR-SF-004  (filter persistence & re-stabilization)
   ========================================================================== */

const Search = (() => {
  let nodeList = [];
  let onNavigate = null;
  let onFilterChange = null;
  const hiddenTypes = new Set();

  function init(nodes, navigateCallback, filterCallback) {
    nodeList = nodes;
    onNavigate = navigateCallback;
    onFilterChange = filterCallback;

    initSearch();
    initTypeFilters();
  }

  // -------------------------------------------------------------------------
  // Search — TASK-044  FR-SF-001, TASK-045  FR-SF-002
  // -------------------------------------------------------------------------
  function initSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-dropdown');

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      if (query.length < 2) {
        dropdown.classList.add('hidden');
        return;
      }

      const matches = nodeList.filter(n =>
        n.displayName.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query)
      ).slice(0, 20);

      if (!matches.length) {
        dropdown.innerHTML = '<div class="search-item" style="color:#999">No results</div>';
      } else {
        dropdown.innerHTML = matches.map(n =>
          `<div class="search-item" data-node="${n.id}">
            ${escapeHtml(n.displayName)}
            <span class="search-path">${n.id}</span>
          </div>`
        ).join('');
      }
      dropdown.classList.remove('hidden');

      // Wire clicks — TASK-045
      dropdown.querySelectorAll('.search-item[data-node]').forEach(item => {
        item.addEventListener('click', () => {
          const nodeId = item.getAttribute('data-node');
          input.value = '';
          dropdown.classList.add('hidden');
          if (onNavigate) onNavigate(nodeId);
        });
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        dropdown.classList.add('hidden');
      }
    });
  }

  // -------------------------------------------------------------------------
  // Type Filters — TASK-046  FR-SF-003, TASK-047  FR-SF-004
  // -------------------------------------------------------------------------
  function initTypeFilters() {
    // Collect unique types
    const types = [...new Set(nodeList.map(n => n.type))].sort();
    const container = document.getElementById('type-filters');

    container.innerHTML = types.map(type => {
      const color = getTypeColor(type);
      return `<button class="type-filter-btn" data-type="${type}" title="Toggle ${type}">
        <span class="swatch" style="background:${color}"></span>
        ${type}
      </button>`;
    }).join('');

    container.querySelectorAll('.type-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        if (hiddenTypes.has(type)) {
          hiddenTypes.delete(type);
          btn.classList.remove('inactive');
        } else {
          hiddenTypes.add(type);
          btn.classList.add('inactive');
        }
        if (onFilterChange) onFilterChange(new Set(hiddenTypes));
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };
})();
