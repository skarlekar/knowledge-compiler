/* ==========================================================================
   visualization.js — D3 force-directed graph rendering
   TASK-018  FR-GV-001, FR-GV-002, IR-GP-002
   TASK-019  FR-GV-003
   TASK-020  FR-GV-004
   TASK-021  FR-GV-005
   TASK-022  FR-GV-006
   TASK-023  FR-GV-007  (pan)
   TASK-024  FR-GV-008  (zoom)
   TASK-025  FR-GV-009  (node drag)
   TASK-026  FR-GV-010  (hover tooltip)
   TASK-027  FR-GV-011  (edge highlight on hover)
   TASK-028  FR-GV-012  (fit-to-view)
   TASK-029  FR-GV-013  (zoom controls)
   TASK-030  FR-GV-014  (legend)
   TASK-031  IR-GP-003  (label visibility by zoom)
   TASK-039  FR-NAV-001 (node click)
   ========================================================================== */

const Visualization = (() => {
  let svg, gRoot, gEdges, gNodes, gLabels;
  let simulation;
  let zoomBehaviour;
  let currentTransform = d3.zoomIdentity;
  let graphData = null;        // { nodes, edges, nodeList }
  let activeNodeId = null;
  let hiddenTypes = new Set();
  let hoverTimeout = null;

  const NODE_RADIUS = 8;
  const ACTIVE_SCALE = 1.3;

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  function init(data, onNodeClick) {
    graphData = data;

    svg = d3.select('#graph-svg');
    const svgEl = svg.node();
    const { width, height } = svgEl.getBoundingClientRect();

    // Arrow marker for directed edges — TASK-020  FR-GV-004
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', 'edge-arrowhead');

    // Highlighted arrow
    svg.select('defs').append('marker')
      .attr('id', 'arrowhead-hl')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', 'edge-arrowhead highlighted');

    // Root group for pan/zoom — TASK-023, TASK-024
    gRoot = svg.append('g').attr('class', 'graph-root');
    gEdges = gRoot.append('g').attr('class', 'edges-layer');
    gNodes = gRoot.append('g').attr('class', 'nodes-layer');
    gLabels = gRoot.append('g').attr('class', 'labels-layer');

    // Zoom — FR-GV-008 range 0.1× to 5×
    zoomBehaviour = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        currentTransform = event.transform;
        gRoot.attr('transform', currentTransform);
        updateLabelVisibility();
      });

    svg.call(zoomBehaviour);

    // Draw edges
    const edgeSelection = gEdges.selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('class', 'edge-line')
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes — TASK-018  FR-GV-002, TASK-019  FR-GV-003
    const nodeSelection = gNodes.selectAll('circle')
      .data(data.nodeList)
      .enter()
      .append('circle')
      .attr('class', d => {
        let cls = 'node-circle';
        if (d.error) cls += ' error-node';
        return cls;
      })
      .attr('r', NODE_RADIUS)
      .attr('fill', d => d.color)
      // TASK-039  FR-NAV-001 — click
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d.id);
      })
      // TASK-025  FR-GV-009 — drag
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)
      )
      // TASK-026, TASK-027 — hover
      .on('mouseenter', (event, d) => {
        hoverTimeout = setTimeout(() => showTooltip(event, d), 300);
        highlightEdges(d.id);
      })
      .on('mousemove', (event) => moveTooltip(event))
      .on('mouseleave', () => {
        clearTimeout(hoverTimeout);
        hideTooltip();
        unhighlightEdges();
      });

    // Draw labels — FR-GV-002
    const labelSelection = gLabels.selectAll('text')
      .data(data.nodeList)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .text(d => d.displayName)
      .attr('dy', NODE_RADIUS + 12);

    // Store selections for tick updates — must be set before ticked() is called
    svg.__edges = edgeSelection;
    svg.__nodes = nodeSelection;
    svg.__labels = labelSelection;

    // Force simulation — TASK-018  FR-GV-001
    // Stop immediately and pre-tick synchronously so node positions are stable
    // before the first paint.  The DOM selections above must exist first so that
    // the ticked() call below can write cx/cy/x1/y1 etc. into the elements.
    simulation = d3.forceSimulation(data.nodeList)
      .force('link', d3.forceLink(data.edges).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(NODE_RADIUS + 4))
      .stop();

    // Pre-compute stable positions synchronously — same tick count D3 would
    // normally run over time.  Runs in <50 ms for typical graph sizes.
    const totalTicks = Math.ceil(
      Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())
    );
    for (let i = 0; i < totalTicks; i++) simulation.tick();

    // Apply the pre-computed positions to the DOM immediately.
    ticked();

    // Restart with a tiny alpha for gentle micro-adjustment animation.
    simulation.on('tick', ticked).alpha(0.05).restart();

    // Render legend — TASK-030  FR-GV-014
    renderLegend(data.nodeList);

    // Statistics — TASK-048  FR-GS-001
    renderStats(data);

    // Zoom controls — TASK-029  FR-GV-013
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      svg.transition().duration(300).call(zoomBehaviour.scaleBy, 1.2);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      svg.transition().duration(300).call(zoomBehaviour.scaleBy, 1 / 1.2);
    });

    // Fit button — TASK-028  FR-GV-012
    document.getElementById('btn-fit').addEventListener('click', () => fitToView());
  }

  // ---------------------------------------------------------------------------
  // Simulation tick
  // ---------------------------------------------------------------------------
  function ticked() {
    svg.__edges
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    svg.__nodes
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    svg.__labels
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  }

  // ---------------------------------------------------------------------------
  // Drag handlers — TASK-025  FR-GV-009
  // ---------------------------------------------------------------------------
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // ---------------------------------------------------------------------------
  // Active node highlight — TASK-021  FR-GV-005
  // ---------------------------------------------------------------------------
  function setActive(nodeId) {
    activeNodeId = nodeId;
    svg.__nodes
      .classed('active', d => d.id === nodeId)
      .attr('r', d => d.id === nodeId ? NODE_RADIUS * ACTIVE_SCALE : NODE_RADIUS);
  }

  // ---------------------------------------------------------------------------
  // Center on node — part of TASK-040  FR-NAV-002
  // ---------------------------------------------------------------------------
  function centerOnNode(nodeId) {
    const node = graphData.nodeList.find(n => n.id === nodeId);
    if (!node || node.x == null) return;

    const svgEl = svg.node();
    const { width, height } = svgEl.getBoundingClientRect();
    const scale = currentTransform.k;

    const tx = width / 2 - node.x * scale;
    const ty = height / 2 - node.y * scale;

    svg.transition().duration(500)
      .call(zoomBehaviour.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  // ---------------------------------------------------------------------------
  // Fit to view — TASK-028  FR-GV-012
  // ---------------------------------------------------------------------------
  function fitToView() {
    if (!graphData || !graphData.nodeList.length) return;

    const svgEl = svg.node();
    const { width, height } = svgEl.getBoundingClientRect();

    const xs = graphData.nodeList.map(n => n.x).filter(v => v != null);
    const ys = graphData.nodeList.map(n => n.y).filter(v => v != null);
    if (!xs.length) return;

    const margin = 0.1; // 10%
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const gw = (xMax - xMin) || 1;
    const gh = (yMax - yMin) || 1;

    const scale = Math.min(width * (1 - 2 * margin) / gw, height * (1 - 2 * margin) / gh, 5);
    const tx = width / 2 - ((xMin + xMax) / 2) * scale;
    const ty = height / 2 - ((yMin + yMax) / 2) * scale;

    svg.transition().duration(500)
      .call(zoomBehaviour.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  // ---------------------------------------------------------------------------
  // Tooltip — TASK-026  FR-GV-010
  // ---------------------------------------------------------------------------
  function showTooltip(event, d) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = `
      <div class="tip-path">${d.id}</div>
      <div class="tip-type">Type: ${d.type}</div>
      <div>In: ${d.inbound} &nbsp; Out: ${d.outbound}</div>
    `;
    tooltip.classList.remove('hidden');
    moveTooltip(event);
  }
  function moveTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = (event.clientX + 14) + 'px';
    tooltip.style.top = (event.clientY + 14) + 'px';
  }
  function hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
  }

  // ---------------------------------------------------------------------------
  // Edge highlight — TASK-027  FR-GV-011
  // ---------------------------------------------------------------------------
  function highlightEdges(nodeId) {
    svg.__edges
      .classed('highlighted', d => (d.source.id || d.source) === nodeId || (d.target.id || d.target) === nodeId)
      .classed('dimmed', d => (d.source.id || d.source) !== nodeId && (d.target.id || d.target) !== nodeId)
      .attr('marker-end', d => {
        const connected = (d.source.id || d.source) === nodeId || (d.target.id || d.target) === nodeId;
        return connected ? 'url(#arrowhead-hl)' : 'url(#arrowhead)';
      });
  }
  function unhighlightEdges() {
    svg.__edges
      .classed('highlighted', false)
      .classed('dimmed', false)
      .attr('marker-end', 'url(#arrowhead)');
  }

  // ---------------------------------------------------------------------------
  // Label visibility by zoom — TASK-031  IR-GP-003
  // ---------------------------------------------------------------------------
  function updateLabelVisibility() {
    const show = currentTransform.k >= 0.5;
    gLabels.style('display', show ? null : 'none');
  }

  // ---------------------------------------------------------------------------
  // Legend — TASK-030  FR-GV-014
  // ---------------------------------------------------------------------------
  function renderLegend(nodeList) {
    const typeCounts = {};
    for (const n of nodeList) {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    }

    const legendEl = document.getElementById('legend');
    legendEl.innerHTML = Object.keys(typeCounts).sort().map(type => {
      const color = getTypeColor(type);
      const dimmed = hiddenTypes.has(type) ? 'dimmed' : '';
      return `<div class="legend-item ${dimmed}" data-type="${type}">
        <span class="legend-swatch" style="background:${color}"></span>
        <span>${type} (${typeCounts[type]})</span>
      </div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Statistics — TASK-048  FR-GS-001
  // ---------------------------------------------------------------------------
  function renderStats(data) {
    const typeCounts = {};
    for (const n of data.nodeList) {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    }
    const orphans = data.nodeList.filter(n => n.inbound === 0 && n.id !== 'index.md').length;

    const statsEl = document.getElementById('stats-bar');
    let html = `<span class="stat-item"><b>Nodes:</b> ${data.nodeList.length}</span>`;
    html += `<span class="stat-item"><b>Edges:</b> ${data.edges.length}</span>`;
    html += `<span class="stat-item"><b>Orphans:</b> ${orphans}</span>`;
    for (const [type, count] of Object.entries(typeCounts).sort()) {
      html += `<span class="stat-item">${type}: ${count}</span>`;
    }
    statsEl.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Type filter — TASK-046  FR-SF-003, TASK-047  FR-SF-004
  // ---------------------------------------------------------------------------
  function applyFilter(newHiddenTypes) {
    hiddenTypes = newHiddenTypes;

    // Hide/show nodes (active node never hidden)
    svg.__nodes
      .style('display', d => {
        if (d.id === activeNodeId) return null;
        return hiddenTypes.has(d.type) ? 'none' : null;
      });

    svg.__labels
      .style('display', d => {
        if (d.id === activeNodeId) return null;
        return hiddenTypes.has(d.type) ? 'none' : null;
      });

    // Hide edges connected to hidden nodes
    svg.__edges
      .style('display', d => {
        const srcType = (typeof d.source === 'object') ? d.source.type : graphData.nodes.get(d.source)?.type;
        const tgtType = (typeof d.target === 'object') ? d.target.type : graphData.nodes.get(d.target)?.type;
        const srcId = (typeof d.source === 'object') ? d.source.id : d.source;
        const tgtId = (typeof d.target === 'object') ? d.target.id : d.target;
        const srcHidden = hiddenTypes.has(srcType) && srcId !== activeNodeId;
        const tgtHidden = hiddenTypes.has(tgtType) && tgtId !== activeNodeId;
        return (srcHidden || tgtHidden) ? 'none' : null;
      });

    // Re-stabilize simulation — FR-SF-004
    simulation.alpha(0.3).restart();

    // Update legend
    if (graphData) renderLegend(graphData.nodeList);
  }

  // ---------------------------------------------------------------------------
  // Destroy — tear down for refresh  TASK-058  FR-RF-001
  // ---------------------------------------------------------------------------
  function destroy() {
    if (simulation) {
      simulation.stop();
      simulation = null;
    }
    if (svg) {
      svg.selectAll('*').remove();
    }
    graphData = null;
    activeNodeId = null;
    hiddenTypes = new Set();
    currentTransform = d3.zoomIdentity;
  }

  return { init, setActive, centerOnNode, fitToView, applyFilter, destroy };
})();
