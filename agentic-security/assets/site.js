(function () {
  const data = window.OWASP_ASI_DATA;
  if (!data) return;

  const page = document.body.dataset.page;

  function getCategory(id) {
    return data.categories.find((item) => item.id === id);
  }

  function getScenario(asiId, scenarioId) {
    const category = getCategory(asiId);
    if (!category || !category.scenarios) return null;
    return category.scenarios.find((item) => item.id === scenarioId);
  }

  function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      asi: params.get("asi"),
      scenario: params.get("scenario")
    };
  }

  function createCard(category) {
    const link = category.href && category.href !== "#" ? category.href : "#";
    const disabled = link === "#";
    return `
      <article class="asi-card">
        <p class="card-id">${category.id}</p>
        <h3>${category.title}</h3>
        <p>${category.summary}</p>
        <a class="card-link ${disabled ? "is-disabled" : ""}" href="${link}">
          ${disabled ? "Coming soon" : "Open"}
        </a>
      </article>
    `;
  }

  function createScenarioCard(scenario) {
    const link = scenario.href || "#";
    const disabled = !scenario.href;
    return `
      <article class="scenario-card">
        <p class="scenario-type">${scenario.type}</p>
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        <a class="card-link ${disabled ? "is-disabled" : ""}" href="${link}">
          ${disabled ? "Coming soon" : "Open"}
        </a>
      </article>
    `;
  }

  function renderHome() {
    const grid = document.getElementById("asi-grid-root");
    if (grid) {
      grid.innerHTML = data.categories.map(createCard).join("");
    }
  }

  function renderCategory() {
    const asiId = document.body.dataset.asiId;
    const category = getCategory(asiId);
    if (!category) return;

    const summary = document.getElementById("asi-summary");
    if (summary) summary.textContent = category.summary;

    const scenarioGrid = document.getElementById("scenario-grid-root");
    if (scenarioGrid && category.scenarios) {
      scenarioGrid.innerHTML = category.scenarios.map(createScenarioCard).join("");
    }
  }

  function renderScenario() {
    const { asi, scenario } = getParams();
    const category = getCategory(asi);
    const scenarioData = getScenario(asi, scenario);
    if (!category || !scenarioData) return;

    document.title = `${category.id} · ${scenarioData.title}`;

    const title = document.getElementById("scenario-title");
    const type = document.getElementById("scenario-type");
    const bc = document.getElementById("scenario-breadcrumb-title");
    const asiLink = document.getElementById("scenario-asi-link");
    const frame = document.getElementById("scenario-frame");
    const root = document.getElementById("scenario-diagram-root");

    if (title) title.textContent = `${category.id} · ${scenarioData.title}`;
    if (type) type.textContent = scenarioData.type;
    if (bc) bc.textContent = scenarioData.title;
    if (asiLink) {
      asiLink.textContent = category.id;
      asiLink.href = category.href;
    }

    let activeView = "attack";

    function updateTabs() {
      document.querySelectorAll(".scenario-tab").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.view === activeView);
      });
    }

    function updateView() {
      const viewData = scenarioData.views[activeView];
      if (viewData.href && frame) {
        frame.hidden = false;
        root.hidden = true;
        frame.src = viewData.href;
      } else if (root) {
        frame.hidden = true;
        root.hidden = false;
        root.innerHTML = renderDiagram(viewData.diagram);
      }
      updateTabs();
    }

    document.querySelectorAll(".scenario-tab").forEach((button) => {
      button.addEventListener("click", () => {
        activeView = button.dataset.view;
        updateView();
      });
    });

    updateView();
  }

  function renderDiagram(diagram) {
    const { width, height, nodes, edges } = diagram;
    return `
      <svg class="training-diagram" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Training scenario diagram">
        <defs>
          <marker id="arrow-primary" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#3650b3" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
          </marker>
          <marker id="arrow-danger" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#a33333" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
          </marker>
          <marker id="arrow-safe" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#2e6a4d" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
          </marker>
        </defs>
        <rect width="${width}" height="${height}" fill="#fffdf8"></rect>
        ${edges.map((edge) => renderEdge(edge, nodes)).join("")}
        ${nodes.map(renderNode).join("")}
      </svg>
    `;
  }

  function renderNode(node) {
    const toneMap = {
      neutral: {
        fill: "#fffdf8",
        stroke: "#b9aa93",
        title: "#302923",
        subtitle: "#756c61"
      },
      primary: {
        fill: "#eef1ff",
        stroke: "#3650b3",
        title: "#2f4299",
        subtitle: "#4c5fb3"
      },
      danger: {
        fill: "#fff4f4",
        stroke: "#a33333",
        title: "#7a2626",
        subtitle: "#a33333"
      },
      safe: {
        fill: "#eef8f1",
        stroke: "#2e6a4d",
        title: "#275942",
        subtitle: "#437a61"
      }
    };
    const tone = toneMap[node.tone] || toneMap.neutral;
    const titleLayout = fitSingleLine(node.title, node.w - 36, 18, 15);
    const subtitleLayout = fitWrappedText(node.subtitle, node.w - 42, 14, 12, 2);
    return `
      <g class="diagram-node">
        <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="22" fill="${tone.fill}" stroke="${tone.stroke}" stroke-width="2.8"></rect>
        <text x="${node.x + node.w / 2}" y="${node.y + 46}" text-anchor="middle" font-family="Avenir Next, Segoe UI, sans-serif" font-size="${titleLayout.fontSize}" font-weight="700" fill="${tone.title}">${escapeHtml(titleLayout.text)}</text>
        <text x="${node.x + node.w / 2}" y="${node.y + 76}" text-anchor="middle" font-family="Avenir Next, Segoe UI, sans-serif" font-size="${subtitleLayout.fontSize}" fill="${tone.subtitle}">
          ${renderTspans(node.x + node.w / 2, subtitleLayout.lines, subtitleLayout.fontSize * 1.25)}
        </text>
      </g>
    `;
  }

  function renderEdge(edge, nodes) {
    const from = nodes.find((node) => node.id === edge.from);
    const to = nodes.find((node) => node.id === edge.to);
    if (!from || !to) return "";

    const fromPoint = anchorPoint(from, edge.fromSide);
    const toPoint = anchorPoint(to, edge.toSide);

    const toneMap = {
      primary: { stroke: "#3650b3", marker: "url(#arrow-primary)", labelFill: "#ffffff", labelStroke: "#3650b3", labelText: "#3650b3" },
      danger: { stroke: "#a33333", marker: "url(#arrow-danger)", labelFill: "#ffffff", labelStroke: "#a33333", labelText: "#a33333" },
      safe: { stroke: "#2e6a4d", marker: "url(#arrow-safe)", labelFill: "#ffffff", labelStroke: "#2e6a4d", labelText: "#2e6a4d" }
    };
    const tone = toneMap[edge.tone] || toneMap.primary;

    const path = edge.mode === "elbow"
      ? elbowPath(fromPoint, toPoint, edge.fromSide)
      : `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;

    const labelLayout = edge.label
      ? fitWrappedText(edge.label, edge.labelWidth || 220, 14, 11, 2)
      : null;
    const label = labelLayout
      ? `
        <g class="diagram-label">
          <text x="${edge.labelX}" y="${edge.labelY}" text-anchor="middle" font-family="Avenir Next, Segoe UI, sans-serif" font-size="${labelLayout.fontSize}" font-weight="800" fill="${tone.labelText}" stroke="#fffdf8" stroke-width="6" paint-order="stroke" stroke-linejoin="round">
            ${renderTspans(edge.labelX, labelLayout.lines, labelLayout.fontSize * 1.2)}
          </text>
        </g>
      `
      : "";

    return `
      <g class="diagram-edge">
        <path d="${path}" fill="none" stroke="${tone.stroke}" stroke-width="4" marker-end="${tone.marker}" stroke-linecap="round" stroke-linejoin="round"></path>
        ${label}
      </g>
    `;
  }

  function anchorPoint(node, side) {
    switch (side) {
      case "right":
        return { x: node.x + node.w, y: node.y + node.h / 2 };
      case "left":
        return { x: node.x, y: node.y + node.h / 2 };
      case "top":
        return { x: node.x + node.w / 2, y: node.y };
      case "bottom":
        return { x: node.x + node.w / 2, y: node.y + node.h };
      default:
        return { x: node.x + node.w, y: node.y + node.h / 2 };
    }
  }

  function elbowPath(fromPoint, toPoint, fromSide) {
    if (fromSide === "bottom" || fromSide === "top") {
      const midY = (fromPoint.y + toPoint.y) / 2;
      return `M ${fromPoint.x} ${fromPoint.y} L ${fromPoint.x} ${midY} L ${toPoint.x} ${midY} L ${toPoint.x} ${toPoint.y}`;
    }
    const midX = (fromPoint.x + toPoint.x) / 2;
    return `M ${fromPoint.x} ${fromPoint.y} L ${midX} ${fromPoint.y} L ${midX} ${toPoint.y} L ${toPoint.x} ${toPoint.y}`;
  }

  function fitSingleLine(text, maxWidth, startFontSize, minFontSize) {
    const value = String(text || "");
    for (let fontSize = startFontSize; fontSize >= minFontSize; fontSize -= 1) {
      if (estimateTextWidth(value, fontSize) <= maxWidth) {
        return { text: value, fontSize };
      }
    }

    let shortened = value;
    while (shortened.length > 1 && estimateTextWidth(`${shortened}\u2026`, minFontSize) > maxWidth) {
      shortened = shortened.slice(0, -1).trimEnd();
    }
    return { text: `${shortened}\u2026`, fontSize: minFontSize };
  }

  function fitWrappedText(text, maxWidth, startFontSize, minFontSize, maxLines) {
    const value = String(text || "");
    for (let fontSize = startFontSize; fontSize >= minFontSize; fontSize -= 1) {
      const lines = wrapText(value, maxWidth, fontSize, maxLines);
      if (lines.length <= maxLines && !lines.truncated) {
        return { lines, fontSize };
      }
    }
    return { lines: wrapText(value, maxWidth, minFontSize, maxLines, true), fontSize: minFontSize };
  }

  function wrapText(text, maxWidth, fontSize, maxLines, forceEllipsis) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return Object.assign([""], { truncated: false });

    const lines = [];
    let current = words.shift();

    words.forEach((word) => {
      const candidate = `${current} ${word}`;
      if (estimateTextWidth(candidate, fontSize) <= maxWidth) {
        current = candidate;
        return;
      }
      lines.push(current);
      current = word;
    });
    lines.push(current);

    if (lines.length <= maxLines && !forceEllipsis) {
      return Object.assign(lines, { truncated: false });
    }

    const trimmed = lines.slice(0, maxLines);
    const lastIndex = trimmed.length - 1;
    let lastLine = trimmed[lastIndex] || "";
    if (lines.length > maxLines || forceEllipsis) {
      while (lastLine.length > 1 && estimateTextWidth(`${lastLine}\u2026`, fontSize) > maxWidth) {
        lastLine = lastLine.slice(0, -1).trimEnd();
      }
      trimmed[lastIndex] = `${lastLine}\u2026`;
    }
    return Object.assign(trimmed, { truncated: true });
  }

  function estimateTextWidth(text, fontSize) {
    return Array.from(String(text || "")).reduce((width, char) => {
      if (char === " ") return width + fontSize * 0.33;
      if ("ilI1.,:'".includes(char)) return width + fontSize * 0.28;
      if ("mwMW@#".includes(char)) return width + fontSize * 0.9;
      return width + fontSize * 0.56;
    }, 0);
  }

  function renderTspans(x, lines, lineHeight) {
    return lines
      .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`)
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  if (page === "home") renderHome();
  if (page === "asi01") renderCategory();
  if (page === "scenario") renderScenario();
})();
