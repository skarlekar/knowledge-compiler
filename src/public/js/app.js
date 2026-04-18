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

  // -------------------------------------------------------------------------
  // Vault setup — fetch registry, populate selector, determine active vault
  // -------------------------------------------------------------------------
  let activeVaultId = null;

  const vaultSelectorContainer = document.getElementById('vault-selector-container');
  const vaultSelect = document.getElementById('vault-select');
  const vaultNameEl = document.getElementById('vault-name');

  let vaults = [];
  try {
    const vr = await fetch('/api/vaults');
    vaults = await vr.json();
  } catch (err) {
    console.warn('Could not fetch vault registry:', err.message);
    vaults = [];
  }

  if (vaults.length === 0) {
    // No vaults — hide selector and name label but keep "+" button visible
    vaultSelect.classList.add('hidden');
    vaultNameEl.classList.add('hidden');
    activeVaultId = null;
  } else {
    const stored = localStorage.getItem('kc-active-vault');
    const storedVault = vaults.find(v => v.id === stored);

    if (stored && !storedVault) {
      const firstName = vaults[0].name;
      showToast(`Vault '${stored}' no longer registered. Switched to ${firstName}.`, 'info', 5000);
    }

    activeVaultId = storedVault ? storedVault.id : vaults[0].id;

    // Populate selector options
    vaultSelect.textContent = '';
    for (const v of vaults) {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.name;
      vaultSelect.appendChild(opt);
    }
    vaultSelect.value = activeVaultId;

    if (vaults.length === 1) {
      vaultSelect.classList.add('hidden');
      vaultNameEl.textContent = vaults[0].name;
    } else {
      vaultNameEl.classList.add('hidden');
    }

    const activeVaultName = vaults.find(v => v.id === activeVaultId)?.name;
    if (activeVaultName) document.title = `Knowledge Compiler — ${activeVaultName}`;
  }

  // -------------------------------------------------------------------------
  // Shared state — accessible by graph init, switchToVault, refresh, etc.
  // -------------------------------------------------------------------------
  let data = { nodes: new Map(), nodeList: [], edges: [] };
  let activeNodeId = null;

  // --- Central navigation function ---
  // TASK-040  FR-NAV-002 — synchronize graph highlight, content, breadcrumb
  function navigateTo(nodeId, skipRecord, skipCentre, restoreScrollTop) {
    if (!data.nodes.has(nodeId)) return;
    activeNodeId = nodeId;
    // Capture scroll position of the current page BEFORE render() resets it
    const contentBody = document.getElementById('content-body');
    const prevScrollTop = contentBody ? contentBody.scrollTop : 0;
    Visualization.setActive(nodeId);
    if (!skipCentre) Visualization.centreOnNode(nodeId);
    ContentRenderer.render(nodeId, restoreScrollTop);
    if (!skipRecord) {
      Navigation.recordNavigation(nodeId, prevScrollTop);
    }
  }

  // -------------------------------------------------------------------------
  // Vault switching
  // -------------------------------------------------------------------------
  async function switchToVault(newVaultId) {
    const newVaultName = vaults.find(v => v.id === newVaultId)?.name || newVaultId;
    showToast(`Switching to ${newVaultName}…`, 'info', 2000);
    activeVaultId = newVaultId;
    localStorage.setItem('kc-active-vault', newVaultId);
    vaultSelect.value = newVaultId;
    vaultNameEl.textContent = newVaultName;
    document.title = `Knowledge Compiler — ${newVaultName}`;
    try {
      data = await GraphBuilder.build(activeVaultId);
      if (!data.nodeList.length) {
        document.getElementById('panels').classList.add('hidden');
        document.getElementById('empty-message').classList.remove('hidden');
        document.getElementById('empty-message').textContent =
          'No wiki files found in this vault. Add Markdown files to the wiki/ directory to get started.';
        showToast(`${newVaultName} — no wiki files found.`, 'info');
        return;
      }
      document.getElementById('panels').classList.remove('hidden');
      document.getElementById('empty-message').classList.add('hidden');
      ContentRenderer.init(data.nodes, navigateTo, activeVaultId);
      Visualization.destroy();
      Visualization.init(data, navigateTo);
      Navigation.init(data.nodes, navigateTo);
      Search.init(data.nodeList, navigateTo, (hiddenTypes) => {
        Visualization.applyFilter(hiddenTypes);
      });
      const indexNode = data.nodes.has('index.md') ? 'index.md' : data.nodeList[0].id;
      navigateTo(indexNode, false, true);  // skipCentre
      Visualization.fitToView();
      showToast(`Switched to ${newVaultName} — ${data.nodeList.length} nodes, ${data.edges.length} edges`, 'success');
    } catch (err) {
      console.error('Vault switch failed:', err);
      showToast('Vault switch failed: ' + err.message, 'error', 5000);
    }
  }

  if (vaults.length > 1) {
    vaultSelect.addEventListener('change', () => {
      switchToVault(vaultSelect.value);
    });
  }

  // -------------------------------------------------------------------------
  // New Vault modal — always wired up so "+" works even on a fresh clone
  // -------------------------------------------------------------------------
  const btnNewVault = document.getElementById('btn-new-vault');
  const modalOverlay = document.getElementById('vault-modal-overlay');
  const modalClose = document.getElementById('vault-modal-close');
  const modalCancel = document.getElementById('vault-modal-cancel');
  const modalCreate = document.getElementById('vault-modal-create');
  const modalError = document.getElementById('vault-create-error');
  const inputName = document.getElementById('vault-new-name');
  const inputPath = document.getElementById('vault-new-path');
  const selectTemplate = document.getElementById('vault-new-template');
  const inputPurpose = document.getElementById('vault-new-purpose');

  // Fetch available templates once and populate the select
  let _templatesLoaded = false;
  async function ensureTemplatesLoaded() {
    if (_templatesLoaded) return;
    try {
      const tr = await fetch('/api/vault-templates');
      const templates = await tr.json();
      selectTemplate.textContent = '';
      for (const t of templates) {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        selectTemplate.appendChild(opt);
      }
      _templatesLoaded = true;
    } catch (err) {
      console.warn('Could not load vault templates:', err.message);
    }
  }

  function openVaultModal() {
    ensureTemplatesLoaded();
    // Reset form
    inputName.value = '';
    inputPath.value = '';
    inputPurpose.value = '';
    modalError.classList.add('hidden');
    modalError.textContent = '';
    modalCreate.disabled = false;
    modalOverlay.classList.remove('hidden');
    setTimeout(() => inputName.focus(), 50);
  }

  function closeVaultModal() {
    modalOverlay.classList.add('hidden');
  }

  btnNewVault.addEventListener('click', openVaultModal);
  modalClose.addEventListener('click', closeVaultModal);
  modalCancel.addEventListener('click', closeVaultModal);

  // Close on overlay click (outside modal box)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeVaultModal();
  });

  // Close on Escape — TASK-EI014: handles both create-vault and import modals
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    // Check create-vault modal first
    if (!modalOverlay.classList.contains('hidden')) {
      const dirBrowser = document.getElementById('dir-browser');
      if (!dirBrowser.classList.contains('hidden')) {
        dirBrowser.classList.add('hidden');
      } else {
        closeVaultModal();
      }
      return;
    }
    // Check import modal
    const importOverlay = document.getElementById('import-modal-overlay');
    if (importOverlay && !importOverlay.classList.contains('hidden')) {
      const impDirBrowser = document.getElementById('import-dir-browser');
      if (impDirBrowser && !impDirBrowser.classList.contains('hidden')) {
        impDirBrowser.classList.add('hidden');
      } else {
        closeImportModal();
      }
    }
  });

  // --- Inline directory browser ---
  const btnBrowsePath = document.getElementById('btn-browse-path');
  const dirBrowser = document.getElementById('dir-browser');
  const dirBrowserCurrent = document.getElementById('dir-browser-current');
  const dirBrowserList = document.getElementById('dir-browser-list');
  const dirBrowserUp = document.getElementById('dir-browser-up');
  const dirBrowserSelect = document.getElementById('dir-browser-select');
  const dirBrowserCancel = document.getElementById('dir-browser-cancel');

  let _currentBrowsePath = '';

  async function browseDir(browsePath) {
    try {
      const r = await fetch(`/api/fs/ls?path=${encodeURIComponent(browsePath)}`);
      const dirData = await r.json();
      if (!r.ok) {
        dirBrowserCurrent.textContent = 'Error: ' + (dirData.error || 'Could not read directory');
        dirBrowserList.textContent = '';
        return;
      }
      _currentBrowsePath = dirData.path;
      dirBrowserUp.disabled = dirData.path === dirData.parent;
      dirBrowserUp.dataset.parent = dirData.parent;
      dirBrowserCurrent.textContent = dirData.path;
      dirBrowserList.textContent = '';
      if (dirData.dirs.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'No subdirectories';
        dirBrowserList.appendChild(li);
      } else {
        for (const name of dirData.dirs) {
          const li = document.createElement('li');
          li.textContent = name;
          li.addEventListener('click', () => {
            browseDir(dirData.path + '/' + name);
          });
          dirBrowserList.appendChild(li);
        }
      }
    } catch (err) {
      dirBrowserCurrent.textContent = 'Error: ' + err.message;
    }
  }

  btnBrowsePath.addEventListener('click', async () => {
    const existingPath = inputPath.value.trim();
    const startPath = existingPath || '';
    dirBrowser.classList.remove('hidden');
    await browseDir(startPath);
  });

  dirBrowserUp.addEventListener('click', () => {
    const parent = dirBrowserUp.dataset.parent;
    if (parent) browseDir(parent);
  });

  dirBrowserSelect.addEventListener('click', () => {
    inputPath.value = _currentBrowsePath;
    dirBrowser.classList.add('hidden');
  });

  dirBrowserCancel.addEventListener('click', () => {
    dirBrowser.classList.add('hidden');
  });

  modalCreate.addEventListener('click', async () => {
    const name = inputName.value.trim();
    const vaultPath = inputPath.value.trim();
    const template = selectTemplate.value;
    const purpose = inputPurpose.value.trim();

    // Client-side validation
    if (!name) {
      modalError.textContent = 'Vault name is required.';
      modalError.classList.remove('hidden');
      inputName.focus();
      return;
    }
    if (!vaultPath) {
      modalError.textContent = 'Filesystem path is required.';
      modalError.classList.remove('hidden');
      inputPath.focus();
      return;
    }

    modalError.classList.add('hidden');
    modalCreate.disabled = true;
    modalCreate.textContent = 'Creating…';

    try {
      const res = await fetch('/api/vaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, path: vaultPath, template, purpose })
      });

      const result = await res.json();

      if (!res.ok) {
        modalError.textContent = result.error || 'Vault creation failed.';
        modalError.classList.remove('hidden');
        return;
      }

      // Success — close modal, reload vault list, switch to new vault
      closeVaultModal();
      showToast(`Vault "${result.name}" created.`, 'success', 3000);

      // Re-fetch vault registry and rebuild UI
      const vr2 = await fetch('/api/vaults');
      vaults = await vr2.json();

      // Rebuild vault selector options
      vaultSelect.textContent = '';
      for (const v of vaults) {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        vaultSelect.appendChild(opt);
      }

      // Show dropdown when 2+ vaults exist; show plain name for single vault
      if (vaults.length === 1) {
        vaultSelect.classList.add('hidden');
        vaultNameEl.classList.remove('hidden');
      } else {
        vaultSelect.classList.remove('hidden');
        vaultNameEl.classList.add('hidden');
      }
      vaultSelectorContainer.classList.remove('hidden');

      // Attach change listener if this is the first time we have 2+ vaults
      if (vaults.length === 2) {
        vaultSelect.addEventListener('change', () => {
          switchToVault(vaultSelect.value);
        });
      }

      // Switch to the newly created vault
      await switchToVault(result.id);

    } catch (err) {
      modalError.textContent = 'Network error: ' + err.message;
      modalError.classList.remove('hidden');
    } finally {
      modalCreate.disabled = false;
      modalCreate.textContent = 'Create Vault';
    }
  });

  // -------------------------------------------------------------------------
  // Build initial graph
  // -------------------------------------------------------------------------
  if (activeVaultId) {
    data = await GraphBuilder.build(activeVaultId);
  }

  // NFR-REL-001 — empty wiki or no vaults
  if (!data.nodeList.length) {
    document.getElementById('panels').classList.add('hidden');
    const emptyMsg = document.getElementById('empty-message');
    if (vaults.length === 0) {
      emptyMsg.innerHTML =
        '<div class="welcome-content">' +
        '<h2>Welcome to Knowledge Compiler</h2>' +
        '<p>No vaults registered yet. Click the <strong>+</strong> button in the toolbar to create your first vault.</p>' +
        '<p class="welcome-hint">A vault is a directory where your Markdown knowledge base lives.</p>' +
        '</div>';
    } else {
      emptyMsg.textContent =
        'No wiki files found in this vault. Add Markdown files to the wiki/ directory to get started.';
    }
    emptyMsg.classList.remove('hidden');
  } else {
    // --- Initialize modules ---
    ContentRenderer.init(data.nodes, navigateTo, activeVaultId);
    Visualization.init(data, navigateTo);
    Navigation.init(data.nodes, navigateTo);
    Search.init(data.nodeList, navigateTo, (hiddenTypes) => {
      Visualization.applyFilter(hiddenTypes);
    });

    // --- Default selection — TASK-022  FR-GV-006 ---
    const defaultNode = data.nodes.has('index.md') ? 'index.md' : data.nodeList[0].id;
    navigateTo(defaultNode, false, true);  // skipCentre — fitToView handles framing
    Visualization.fitToView();
  }

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

      // Re-build graph model (preserve vault context)
      data = await GraphBuilder.build(activeVaultId);

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
      ContentRenderer.init(data.nodes, navigateTo, activeVaultId);
      Visualization.destroy();
      Visualization.init(data, navigateTo);

      Search.init(data.nodeList, navigateTo, (hiddenTypes) => {
        Visualization.applyFilter(hiddenTypes);
      });

      // FR-RF-002 — preserve active node
      const restoreNode = data.nodes.has(previousActive) ? previousActive
        : data.nodes.has('index.md') ? 'index.md'
        : data.nodeList[0].id;
      navigateTo(restoreNode, false, true);  // skipCentre
      Visualization.fitToView();

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

        const vaultParam = activeVaultId ? `?vault=${encodeURIComponent(activeVaultId)}` : '';
        const res = await fetch(`/api/raw/upload${vaultParam}`, {
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

  // --- Export Vault — TASK-EI010 ---
  const btnExport = document.getElementById('btn-export');

  btnExport.addEventListener('click', async () => {
    if (!activeVaultId) {
      showToast('No vault selected to export.', 'error');
      return;
    }
    const vaultName = vaults.find(v => v.id === activeVaultId)?.name || activeVaultId;
    showToast(`Preparing export of ${vaultName}...`, 'info', 3000);
    btnExport.disabled = true;
    const origHTML = btnExport.innerHTML;
    btnExport.innerHTML = '&#11015; Exporting\u2026';
    try {
      const response = await fetch(`/api/vault/export?vault=${encodeURIComponent(activeVaultId)}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(err.error || `Export failed with status ${response.status}`);
      }
      const disposition = response.headers.get('Content-Disposition');
      let filename = `${activeVaultId}_export.kc.zip`;
      if (disposition) {
        const match = disposition.match(/filename="?([^";\s]+)"?/);
        if (match) filename = match[1];
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${vaultName} successfully.`, 'success');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed: ' + err.message, 'error', 5000);
    } finally {
      btnExport.innerHTML = origHTML;
      btnExport.disabled = false;
    }
  });

  // --- Import Vault — TASK-EI011, TASK-EI012, TASK-EI013, TASK-EI014 ---
  const btnImport = document.getElementById('btn-import');
  const importInput = document.getElementById('import-input');
  const importModalOverlay = document.getElementById('import-modal-overlay');
  const importModalClose = document.getElementById('import-modal-close');
  const importModalCancel = document.getElementById('import-modal-cancel');
  const importModalImport = document.getElementById('import-modal-import');
  const importError = document.getElementById('import-error');
  const importFileInfo = document.getElementById('import-file-info');
  const importVaultName = document.getElementById('import-vault-name');
  const importVaultPath = document.getElementById('import-vault-path');
  const importVaultPurpose = document.getElementById('import-vault-purpose');
  const importProgress = document.getElementById('import-progress');
  const importProgressFill = document.getElementById('import-progress-fill');
  const importProgressText = document.getElementById('import-progress-text');

  let _importFile = null;

  function openImportModal() {
    _importFile = null;
    importFileInfo.textContent = 'No file selected';
    importFileInfo.classList.remove('has-file');
    importVaultName.value = '';
    importVaultPath.value = '';
    importVaultPurpose.value = '';
    importError.classList.add('hidden');
    importError.textContent = '';
    importProgress.classList.add('hidden');
    importProgressFill.classList.remove('indeterminate');
    importModalImport.disabled = true;
    importModalImport.textContent = 'Import Vault';
    importModalOverlay.classList.remove('hidden');
  }

  function closeImportModal() {
    importModalOverlay.classList.add('hidden');
    _importFile = null;
  }

  btnImport.addEventListener('click', () => { importInput.click(); });

  importInput.addEventListener('change', () => {
    const files = importInput.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    importInput.value = '';
    openImportModal();
    _importFile = file;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    importFileInfo.textContent = `${file.name} (${sizeMB} MB)`;
    importFileInfo.classList.add('has-file');
    importModalImport.disabled = false;
  });

  importModalClose.addEventListener('click', closeImportModal);
  importModalCancel.addEventListener('click', closeImportModal);
  importModalOverlay.addEventListener('click', (e) => {
    if (e.target === importModalOverlay) closeImportModal();
  });

  // --- Import directory browser (TASK-EI012) ---
  const btnImportBrowsePath = document.getElementById('btn-import-browse-path');
  const importDirBrowser = document.getElementById('import-dir-browser');
  const importDirBrowserCurrent = document.getElementById('import-dir-browser-current');
  const importDirBrowserList = document.getElementById('import-dir-browser-list');
  const importDirBrowserUp = document.getElementById('import-dir-browser-up');
  const importDirBrowserSelect = document.getElementById('import-dir-browser-select');
  const importDirBrowserCancel = document.getElementById('import-dir-browser-cancel');

  let _importCurrentBrowsePath = '';

  async function importBrowseDir(browsePath) {
    try {
      const r = await fetch(`/api/fs/ls?path=${encodeURIComponent(browsePath)}`);
      const dirData = await r.json();
      if (!r.ok) {
        importDirBrowserCurrent.textContent = 'Error: ' + (dirData.error || 'Could not read directory');
        importDirBrowserList.textContent = '';
        return;
      }
      _importCurrentBrowsePath = dirData.path;
      importDirBrowserUp.disabled = dirData.path === dirData.parent;
      importDirBrowserUp.dataset.parent = dirData.parent;
      importDirBrowserCurrent.textContent = dirData.path;
      importDirBrowserList.textContent = '';
      if (dirData.dirs.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'No subdirectories';
        importDirBrowserList.appendChild(li);
      } else {
        for (const name of dirData.dirs) {
          const li = document.createElement('li');
          li.textContent = name;
          li.addEventListener('click', () => importBrowseDir(dirData.path + '/' + name));
          importDirBrowserList.appendChild(li);
        }
      }
    } catch (err) {
      importDirBrowserCurrent.textContent = 'Error: ' + err.message;
    }
  }

  btnImportBrowsePath.addEventListener('click', async () => {
    const existing = importVaultPath.value.trim();
    importDirBrowser.classList.remove('hidden');
    await importBrowseDir(existing || '');
  });

  importDirBrowserUp.addEventListener('click', () => {
    const parent = importDirBrowserUp.dataset.parent;
    if (parent) importBrowseDir(parent);
  });

  importDirBrowserSelect.addEventListener('click', () => {
    importVaultPath.value = _importCurrentBrowsePath;
    importDirBrowser.classList.add('hidden');
  });

  importDirBrowserCancel.addEventListener('click', () => {
    importDirBrowser.classList.add('hidden');
  });

  // --- Import submit handler (TASK-EI013) ---
  importModalImport.addEventListener('click', async () => {
    if (!_importFile) {
      importError.textContent = 'No archive file selected.';
      importError.classList.remove('hidden');
      return;
    }
    const targetPath = importVaultPath.value.trim();
    if (!targetPath) {
      importError.textContent = 'Target path is required.';
      importError.classList.remove('hidden');
      importVaultPath.focus();
      return;
    }
    importError.classList.add('hidden');
    importModalImport.disabled = true;
    importModalImport.textContent = 'Importing\u2026';
    importModalCancel.disabled = true;
    importProgress.classList.remove('hidden');
    importProgressFill.classList.add('indeterminate');
    importProgressText.textContent = 'Uploading and extracting archive\u2026';

    try {
      const formData = new FormData();
      formData.append('archive', _importFile);
      formData.append('targetPath', targetPath);
      const nameOverride = importVaultName.value.trim();
      if (nameOverride) formData.append('name', nameOverride);
      const purposeOverride = importVaultPurpose.value.trim();
      if (purposeOverride) formData.append('purpose', purposeOverride);

      const res = await fetch('/api/vault/import', { method: 'POST', body: formData });
      const result = await res.json();

      if (!res.ok) {
        importError.textContent = result.error || 'Import failed.';
        importError.classList.remove('hidden');
        return;
      }

      closeImportModal();
      showToast(`Vault "${result.name}" imported successfully.`, 'success', 3000);

      // Re-fetch vaults and rebuild selector
      const vr2 = await fetch('/api/vaults');
      vaults = await vr2.json();

      vaultSelect.textContent = '';
      for (const v of vaults) {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        vaultSelect.appendChild(opt);
      }
      if (vaults.length === 1) {
        vaultSelect.classList.add('hidden');
        vaultNameEl.classList.remove('hidden');
      } else {
        vaultSelect.classList.remove('hidden');
        vaultNameEl.classList.add('hidden');
      }
      vaultSelectorContainer.classList.remove('hidden');

      if (vaults.length === 2) {
        vaultSelect.addEventListener('change', () => switchToVault(vaultSelect.value));
      }

      await switchToVault(result.id);
    } catch (err) {
      importError.textContent = 'Network error: ' + err.message;
      importError.classList.remove('hidden');
    } finally {
      importModalImport.disabled = false;
      importModalImport.textContent = 'Import Vault';
      importModalCancel.disabled = false;
      importProgress.classList.add('hidden');
      importProgressFill.classList.remove('indeterminate');
    }
  });

  // --- Resizable divider — TASK-014  NFR-USE-002 ---
  initDivider();

  // --- Content panel zoom controls ---
  const contentBody = document.getElementById('content-body');
  const DEFAULT_ZOOM = 1;
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2.0;
  let contentZoom = DEFAULT_ZOOM;

  function applyContentZoom() {
    contentBody.style.transformOrigin = 'top left';
    contentBody.style.transform = `scale(${contentZoom})`;
    contentBody.style.width = `${100 / contentZoom}%`;
  }

  document.getElementById('btn-content-zoom-in').addEventListener('click', () => {
    contentZoom = Math.min(MAX_ZOOM, +(contentZoom + ZOOM_STEP).toFixed(2));
    applyContentZoom();
  });

  document.getElementById('btn-content-zoom-out').addEventListener('click', () => {
    contentZoom = Math.max(MIN_ZOOM, +(contentZoom - ZOOM_STEP).toFixed(2));
    applyContentZoom();
  });

  document.getElementById('btn-content-zoom-reset').addEventListener('click', () => {
    contentZoom = DEFAULT_ZOOM;
    applyContentZoom();
  });

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
