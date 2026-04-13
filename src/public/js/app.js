/* ==========================================================================
   app.js — Main application entry point
   TASK-022  FR-GV-006  (default selection — index.md)
   TASK-040  FR-NAV-002  (graph-content synchronization)
   TASK-041  FR-NAV-003  (content-to-graph navigation)
   TASK-050  NFR-REL-001  (empty wiki)
   TASK-014  IR-LAY-001, NFR-USE-002  (resizable divider)
   TASK-058  FR-RF-001  (refresh graph)
   TASK-059  FR-RF-002  (preserve active node)
   TASK-060  FR-RF-003  (refresh visual feedback)
   TASK-061  FR-UP-001  (upload button)
   TASK-063  FR-UP-003  (upload progress feedback)
   ========================================================================== */

// ---------------------------------------------------------------------------
// Toast notification helper — TASK-063  FR-UP-003
// ---------------------------------------------------------------------------
function showToast(message, type = 'info', durationMs = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, durationMs);
}

(async function main() {
  // --- Build graph model ---
  let data = await GraphBuilder.build();

  // NFR-REL-001 — empty wiki
  if (!data.nodeList.length) {
    document.getElementById('panels').classList.add('hidden');
    document.getElementById('empty-message').classList.remove('hidden');
    return;
  }

  // --- Central navigation function ---
  // TASK-040  FR-NAV-002 — synchronize graph highlight, content, breadcrumb
  let activeNodeId = null;

  function navigateTo(nodeId, skipRecord) {
    if (!data.nodes.has(nodeId)) return;
    activeNodeId = nodeId;

    // (a) Graph highlight — FR-GV-005
    Visualization.setActive(nodeId);

    // (b) Centre graph on node
    Visualization.centreOnNode(nodeId);

    // (c) Render content — FR-CR-001
    ContentRenderer.render(nodeId);

    // (d) Breadcrumb — FR-NAV-004
    if (!skipRecord) {
      Navigation.recordNavigation(nodeId);
    }
  }

  // --- Initialize modules ---
  // Content renderer needs graph nodes & navigate callback
  ContentRenderer.init(data.nodes, navigateTo);

  // Visualization needs graph data & click callback
  Visualization.init(data, navigateTo);

  // Navigation needs nodes & navigate callback
  Navigation.init(data.nodes, navigateTo);

  // Search needs node list, navigate, and filter callbacks
  Search.init(data.nodeList, navigateTo, (hiddenTypes) => {
    Visualization.applyFilter(hiddenTypes);
  });

  // --- Default selection — TASK-022  FR-GV-006 ---
  const defaultNode = data.nodes.has('index.md') ? 'index.md' : data.nodeList[0].id;
  navigateTo(defaultNode);

  // --- Refresh — TASK-058, TASK-059, TASK-060  FR-RF-001..003 ---
  const btnRefresh = document.getElementById('btn-refresh');

  btnRefresh.addEventListener('click', async () => {
    // FR-RF-003 — visual feedback
    btnRefresh.classList.add('refreshing');
    btnRefresh.disabled = true;
    // Wrap icon text in a span for animation
    const origHTML = btnRefresh.innerHTML;
    btnRefresh.innerHTML = '<span class="refresh-icon">&#10227;</span> Refreshing…';

    try {
      const previousActive = activeNodeId;

      // Re-build graph model
      data = await GraphBuilder.build();

      if (!data.nodeList.length) {
        document.getElementById('panels').classList.add('hidden');
        document.getElementById('empty-message').classList.remove('hidden');
        showToast('Wiki is empty after refresh.', 'info');
        return;
      }

      // Ensure panels visible (in case previously empty)
      document.getElementById('panels').classList.remove('hidden');
      document.getElementById('empty-message').classList.add('hidden');

      // Re-initialize modules with new data
      ContentRenderer.init(data.nodes, navigateTo);
      Visualization.destroy();
      Visualization.init(data, navigateTo);

      Search.init(data.nodeList, navigateTo, (hiddenTypes) => {
        Visualization.applyFilter(hiddenTypes);
      });

      // FR-RF-002 — preserve active node
      const restoreNode = data.nodes.has(previousActive) ? previousActive
        : data.nodes.has('index.md') ? 'index.md'
        : data.nodeList[0].id;
      navigateTo(restoreNode);

      showToast(`Graph refreshed — ${data.nodeList.length} nodes, ${data.edges.length} edges`, 'success');
    } catch (err) {
      console.error('Refresh failed:', err);
      showToast('Refresh failed: ' + err.message, 'error', 5000);
    } finally {
      btnRefresh.innerHTML = origHTML;
      btnRefresh.classList.remove('refreshing');
      btnRefresh.disabled = false;
    }
  });

  // --- Upload — TASK-061, TASK-063  FR-UP-001, FR-UP-003 ---
  const btnUpload = document.getElementById('btn-upload');
  const uploadInput = document.getElementById('upload-input');

  btnUpload.addEventListener('click', () => {
    uploadInput.click();
  });

  uploadInput.addEventListener('change', async () => {
    const files = uploadInput.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      showToast(`Uploading ${file.name}…`, 'info', 2000);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/raw/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();

        if (!res.ok) {
          showToast(result.error || `Upload failed: ${file.name}`, 'error', 5000);
        } else {
          showToast(`✓ Uploaded ${result.uploaded}`, 'success', 3000);
        }
      } catch (err) {
        showToast(`Upload failed: ${file.name} — ${err.message}`, 'error', 5000);
      }
    }

    // Reset input so the same file can be re-selected
    uploadInput.value = '';
  });

  // --- Resizable divider — TASK-014  NFR-USE-002 ---
  initDivider();

})();

// ---------------------------------------------------------------------------
// Resizable panel divider — TASK-014  NFR-USE-002
// ---------------------------------------------------------------------------
function initDivider() {
  const divider = document.getElementById('divider');
  const graphPanel = document.getElementById('graph-panel');
  const panels = document.getElementById('panels');
  let isDragging = false;

  divider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    divider.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = panels.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    const pct = (offset / rect.width) * 100;

    // Enforce minimum 300px equivalent
    const minPct = (300 / rect.width) * 100;
    const maxPct = 100 - minPct;

    if (pct >= minPct && pct <= maxPct) {
      graphPanel.style.flex = `0 0 ${pct}%`;
    }
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    divider.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}
