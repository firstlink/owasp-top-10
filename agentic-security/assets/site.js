(function () {
  const data = window.OWASP_ASI_DATA;
  if (!data) return;
  const ASSET_VERSION = "20260620f";

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
      scenario: params.get("scenario"),
      view: params.get("view")
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

  function createScenarioCard(category, scenario) {
    const link = scenario.href || "#";
    const disabled = !scenario.href;
    const linkLabel = disabled
      ? "Coming soon"
      : scenario.linkLabel
        ? scenario.linkLabel
        : category && category.scenarioLinkLabel
        ? category.scenarioLinkLabel
        : "Open";
    const toneClass = scenario.cardTone ? ` scenario-card-${scenario.cardTone}` : "";
    return `
      <article class="scenario-card${toneClass}">
        <p class="scenario-type">${scenario.type}</p>
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        <a class="card-link ${disabled ? "is-disabled" : ""}" href="${link}">
          ${linkLabel}
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

    const sharedDefenseRoot = document.getElementById("shared-defense-root");
    if (sharedDefenseRoot) {
      if (category.sharedDefense) {
        sharedDefenseRoot.hidden = false;
        sharedDefenseRoot.innerHTML = renderSharedDefense(category);
      } else {
        sharedDefenseRoot.hidden = true;
        sharedDefenseRoot.innerHTML = "";
      }
    }

    const scenarioGrid = document.getElementById("scenario-grid-root");
    if (scenarioGrid && category.scenarios) {
      scenarioGrid.innerHTML = category.scenarios
        .map((scenario) => createScenarioCard(category, scenario))
        .join("");
    }
  }

  function renderScenario() {
    const { asi, scenario, view } = getParams();
    const category = getCategory(asi);
    const scenarioData = getScenario(asi, scenario);
    if (!category || !scenarioData) return;

    document.title = `${category.id} · ${scenarioData.title}`;

    const title = document.getElementById("scenario-title");
    const type = document.getElementById("scenario-type");
    const bc = document.getElementById("scenario-breadcrumb-title");
    const asiLink = document.getElementById("scenario-asi-link");
    const hero = document.querySelector(".page-hero-scenario");
    const frame = document.getElementById("scenario-frame");
    const root = document.getElementById("scenario-diagram-root");
    const diagramSection = document.getElementById("scenario-diagram-section");
    const sharedDefenseRoot = document.getElementById("scenario-shared-defense-root");
    const tabs = document.querySelector(".scenario-tabs");
    const stepStrip = document.getElementById("scenario-step-strip");
    const stepMeta = document.getElementById("scenario-step-meta");
    const stepTitle = document.getElementById("scenario-step-title");
    const stepDetail = document.getElementById("scenario-step-detail");
    const stepReset = document.getElementById("scenario-step-reset");
    const stepNext = document.getElementById("scenario-step-next");
    const attackButton = document.querySelector('.scenario-tab[data-view="attack"]');
    const defenseButton = document.querySelector('.scenario-tab[data-view="defense"]');
    const isDefenseOnlyScenario = scenarioData.onlyView === "defense";
    const isStandardAttackScenario = !isDefenseOnlyScenario;
    let frameResizeObserver = null;
    let latestFrameState = null;
    let latestFrameHeight = 0;

    if (title) {
      title.textContent = isDefenseOnlyScenario
        ? `${category.id} · ${scenarioData.title}`
        : scenarioData.title;
    }
    if (type) type.textContent = scenarioData.type;
    if (bc) bc.textContent = scenarioData.title;
    if (asiLink) {
      asiLink.textContent = category.id;
      asiLink.href = category.href;
    }
    if (attackButton) {
      attackButton.hidden = isDefenseOnlyScenario;
      attackButton.textContent = scenarioData.viewLabels && scenarioData.viewLabels.attack
        ? scenarioData.viewLabels.attack
        : "Attack";
    }
    if (defenseButton) {
      defenseButton.hidden = isStandardAttackScenario;
      defenseButton.textContent = scenarioData.viewLabels && scenarioData.viewLabels.defense
        ? scenarioData.viewLabels.defense
        : "Defense";
    }
    if (hero) {
      hero.classList.toggle("page-hero-inline", false);
      hero.classList.toggle("page-hero-minimal", isDefenseOnlyScenario);
    }
    if (diagramSection) {
      diagramSection.classList.toggle("diagram-frame-bare", isDefenseOnlyScenario);
    }
    if (tabs && (scenarioData.onlyView || isStandardAttackScenario)) {
      tabs.remove();
    }

    const requestedView = isStandardAttackScenario ? "attack" : (view === "defense" ? "defense" : "attack");
    let activeView = scenarioData.onlyView || (scenarioData.views && scenarioData.views[requestedView] ? requestedView : "attack");
    if (!scenarioData.views || !scenarioData.views[activeView]) {
      activeView = scenarioData.views && scenarioData.views.defense ? "defense" : "attack";
    }

    function resizeScenarioFrame() {
      if (!frame || frame.hidden) return;
      const isCompactViewport = window.matchMedia("(max-width: 720px)").matches;
      const minHeight = getScenarioFrameMinHeight(isCompactViewport);
      let nextHeight = minHeight;
      try {
        const doc = frame.contentDocument;
        if (doc && doc.body) {
          const bodyStyles = window.getComputedStyle(doc.body);
          const bodyTop = doc.body.getBoundingClientRect().top;
          const paddingBottom = Number.parseFloat(bodyStyles.paddingBottom || "0") || 0;
          const contentBottom = Array.from(doc.body.children).reduce((max, child) => {
            return Math.max(max, child.getBoundingClientRect().bottom - bodyTop);
          }, 0);
          nextHeight = Math.max(
            minHeight,
            Math.ceil(contentBottom + paddingBottom),
            doc.body.scrollHeight
          );
        }
      } catch (error) {
        nextHeight = latestFrameHeight
          ? Math.max(minHeight, latestFrameHeight)
          : getScenarioFrameFallbackHeight(isCompactViewport);
      }
      frame.style.height = `${nextHeight}px`;
    }

    function bindScenarioFrameObserver() {
      if (frameResizeObserver) {
        frameResizeObserver.disconnect();
        frameResizeObserver = null;
      }
      try {
        const doc = frame && frame.contentDocument;
        if (!doc || !doc.body || typeof ResizeObserver === "undefined") return;
        frameResizeObserver = new ResizeObserver(() => resizeScenarioFrame());
        frameResizeObserver.observe(doc.body);
        if (doc.documentElement) {
          frameResizeObserver.observe(doc.documentElement);
        }
      } catch (error) {
        frameResizeObserver = null;
      }
    }

    function updateExternalStepStrip() {
      if (!frame || frame.hidden || !stepStrip) return;
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        const meta = doc.getElementById("ps");
        const heading = doc.getElementById("ph");
        const detail = doc.getElementById("pd");
        const nextButton = doc.getElementById("bnext");
        const resetButton = doc.getElementById("breset");
        const panel = doc.getElementById("panel");

        if (!meta || !heading || !detail || !nextButton || !resetButton || !panel) return;

        const metaText = (meta.textContent || "").trim().toLowerCase();
        const headingText = (heading.textContent || "").trim();
        const nextLabel = (nextButton.textContent || "").trim().toLowerCase();
        const isIntroState = metaText === "click to begin"
          || headingText.toLowerCase() === "walkthrough"
          || (nextLabel.includes("start") && !(detail.textContent || "").trim());
        stepStrip.hidden = false;
        stepStrip.classList.toggle("is-attack", panel.classList.contains("atk"));
        stepMeta.textContent = "";
        stepTitle.textContent = isIntroState ? "" : (headingText || scenarioData.title);
        stepTitle.hidden = isIntroState;
        stepDetail.textContent = isIntroState ? "" : (detail.textContent || "");
        stepDetail.hidden = isIntroState || !stepDetail.textContent;
        stepNext.textContent = nextButton.textContent || "▶ Start";
        stepNext.disabled = nextButton.disabled;
        stepReset.hidden = resetButton.style.display === "none";
      } catch (error) {
        if (latestFrameState) {
          applyExternalStepState(latestFrameState);
          return;
        }
        stepStrip.hidden = true;
      }
    }

    function runScenarioAction(action) {
      if (!frame || frame.hidden || !frame.contentWindow) return;
      let usedDirectCall = false;
      try {
        const runner = frame.contentWindow[action];
        if (typeof runner === "function") {
          runner();
          usedDirectCall = true;
        }
      } catch (error) {
        usedDirectCall = false;
      }
      if (!usedDirectCall) {
        frame.contentWindow.postMessage({ type: "asi:walkthrough-action", action }, "*");
      }
      window.setTimeout(() => {
        updateExternalStepStrip();
        resizeScenarioFrame();
      }, 0);
      window.setTimeout(() => {
        updateExternalStepStrip();
        resizeScenarioFrame();
      }, 120);
    }

    function updateTabs() {
      document.querySelectorAll(".scenario-tab").forEach((button) => {
        if (scenarioData.onlyView && button.dataset.view !== scenarioData.onlyView) return;
        button.classList.toggle("is-active", button.dataset.view === activeView);
      });
    }

    function updateView() {
      if (diagramSection) diagramSection.hidden = false;
      if (sharedDefenseRoot) {
        sharedDefenseRoot.hidden = true;
        sharedDefenseRoot.innerHTML = "";
      }

      const viewData = scenarioData.views[activeView];
      if (!viewData) return;
      if (viewData.href && frame) {
        frame.hidden = false;
        root.hidden = true;
        latestFrameState = null;
        latestFrameHeight = 0;
        if (frameResizeObserver) {
          frameResizeObserver.disconnect();
          frameResizeObserver = null;
        }
        frame.style.height = `${getScenarioFrameFallbackHeight(window.matchMedia("(max-width: 720px)").matches)}px`;
        const extraParams = ["embed=external-panel", `v=${ASSET_VERSION}`];
        if (isDefenseOnlyScenario) {
          extraParams.unshift("frame=bare");
        }
        frame.src = `${viewData.href}${viewData.href.includes("?") ? "&" : "?"}${extraParams.join("&")}`;
      } else if (root) {
        if (frameResizeObserver) {
          frameResizeObserver.disconnect();
          frameResizeObserver = null;
        }
        frame.hidden = true;
        root.hidden = false;
        if (stepStrip) {
          stepStrip.hidden = true;
        }
        root.innerHTML = renderDiagram(viewData.diagram);
      }
      updateTabs();
    }

    document.querySelectorAll(".scenario-tab").forEach((button) => {
      if (button.hidden) return;
      button.addEventListener("click", () => {
        activeView = button.dataset.view;
        updateView();
      });
    });

    if (frame) {
      window.addEventListener("message", (event) => {
        const message = event.data;
        if (!message || message.type !== "asi:walkthrough-state" || !message.state) return;
        latestFrameState = message.state;
        latestFrameHeight = Number(message.state.height) || 0;
        applyExternalStepState(message.state);
        resizeScenarioFrame();
      });

      frame.addEventListener("load", () => {
        resizeScenarioFrame();
        bindScenarioFrameObserver();
        updateExternalStepStrip();
        try {
          frame.contentWindow.postMessage({ type: "asi:walkthrough-action", action: "sync" }, "*");
        } catch (error) {
          // Ignore sync failures; same-origin pages will be read directly.
        }
        window.setTimeout(resizeScenarioFrame, 120);
        window.setTimeout(resizeScenarioFrame, 360);
        window.setTimeout(updateExternalStepStrip, 120);
      });
    }

    if (stepNext) {
      stepNext.addEventListener("click", () => runScenarioAction("advance"));
    }

    if (stepReset) {
      stepReset.addEventListener("click", () => runScenarioAction("reset"));
    }

    updateView();

    function applyExternalStepState(state) {
      if (!stepStrip || !stepMeta || !stepTitle || !stepDetail || !stepNext || !stepReset || !state) return;
      const metaText = (state.meta || "").trim().toLowerCase();
      const headingText = (state.heading || "").trim();
      const detailText = state.detail || "";
      const nextLabel = (state.nextLabel || "▶ Start").trim().toLowerCase();
      const isIntroState = metaText === "click to begin"
        || headingText.toLowerCase() === "walkthrough"
        || (nextLabel.includes("start") && !detailText.trim());
      stepStrip.hidden = false;
      stepStrip.classList.toggle("is-attack", Boolean(state.isAttack));
      stepMeta.textContent = "";
      stepTitle.textContent = isIntroState ? "" : (headingText || scenarioData.title);
      stepTitle.hidden = isIntroState;
      stepDetail.textContent = isIntroState ? "" : detailText;
      stepDetail.hidden = isIntroState || !stepDetail.textContent;
      stepNext.textContent = state.nextLabel || "▶ Start";
      stepNext.disabled = Boolean(state.nextDisabled);
      stepReset.hidden = Boolean(state.resetHidden);
    }

    function getScenarioFrameMinHeight(isCompactViewport) {
      if (isDefenseOnlyScenario) {
        return isCompactViewport ? 920 : 980;
      }
      return isCompactViewport ? 560 : 760;
    }

    function getScenarioFrameFallbackHeight(isCompactViewport) {
      if (isDefenseOnlyScenario) {
        return isCompactViewport ? 980 : 1120;
      }
      return isCompactViewport ? 720 : 1040;
    }
  }

  function renderSharedDefense(category) {
    const defense = category.sharedDefense;
    if (!defense) return "";
    const flowHeading = defense.flow.heading || "How the System Preserves Protected Intent";
    const flowIntro = defense.flow.intro || "The diagram reads top to bottom. The same layered checkpoints stop each variant of the attack without relying on one fragile prompt-only control.";
    const focusCard = defense.flow.focusCard || defense.flow.protectedContext || null;

    const laneCards = defense.flow.lanes.map((lane) => `
      <article class="flow-lane-card">
        <span class="step-badge">${escapeHtml(lane.step)}</span>
        <h3>${escapeHtml(lane.title)}</h3>
        <p>${escapeHtml(lane.detail)}</p>
      </article>
    `).join("");

    const stageCards = defense.flow.stages.map((stage, index) => `
      ${index === 0 ? '<div class="flow-drop-arrow" aria-hidden="true">↓</div>' : ""}
      <article class="flow-stage-card flow-stage-card-${stage.id.toLowerCase()}">
        <div class="flow-stage-head">
          <p class="flow-stage-id">${escapeHtml(stage.id)}</p>
          ${stage.step ? `<span class="step-badge">${escapeHtml(stage.step)}</span>` : ""}
        </div>
        <h3>${escapeHtml(stage.title)}</h3>
        <p>${escapeHtml(stage.summary)}</p>
        <ul class="flow-bullets">
          ${stage.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
        </ul>
      </article>
      ${index === 1 && focusCard ? `
        <div class="flow-transition">
          <span>${escapeHtml(stage.afterLabel)}</span>
        </div>
        <article class="flow-context-card">
          <p class="flow-context-title">${escapeHtml(focusCard.title)}</p>
          <p>${escapeHtml(focusCard.detail)}</p>
        </article>
      ` : `
        <div class="flow-transition">
          <span>${escapeHtml(stage.afterLabel)}</span>
        </div>
      `}
    `).join("");

    return `
      <section class="shared-defense-shell" id="shared-defense">
        <article class="shared-defense-intro">
          <p class="eyebrow">${escapeHtml(defense.eyebrow)}</p>
          <h2>${escapeHtml(defense.title)}</h2>
          <p class="hero-copy">${escapeHtml(defense.intro)}</p>
        </article>

        <div class="architect-grid">
          ${defense.principles.map((principle) => `
            <article class="architect-card">
              <p>${escapeHtml(principle)}</p>
            </article>
          `).join("")}
        </div>

        <section class="defense-flow-panel">
          <div class="defense-flow-header">
            <p class="eyebrow">Defended Flow</p>
            <h2>${escapeHtml(flowHeading)}</h2>
            <p class="hero-copy">
              ${escapeHtml(flowIntro)}
            </p>
          </div>

          <div class="flow-lane-grid">
            ${laneCards}
          </div>

          <div class="flow-stack">
            ${stageCards}

            <article class="flow-outcome-card">
              <p class="eyebrow">8. Execute approved action</p>
              <h3>${escapeHtml(defense.flow.outcome.title)}</h3>
              <ul class="flow-bullets">
                ${defense.flow.outcome.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
              </ul>
            </article>

            <article class="flow-audit-card">
              <p class="flow-stage-id">${escapeHtml(defense.flow.audit.title)}</p>
              <p>${escapeHtml(defense.flow.audit.detail)}</p>
            </article>
          </div>
        </section>

        <section class="defense-reference-grid">
          <article class="reference-panel">
            <p class="eyebrow">Checkpoints</p>
            <h2>What Each Layer Really Does</h2>
            <div class="checkpoint-grid">
              ${defense.checkpoints.map((item) => `
                <article class="checkpoint-card">
                  <p class="flow-stage-id">${escapeHtml(item.id)}</p>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="checkpoint-applies">${escapeHtml(item.applies)}</p>
                  <p>${escapeHtml(item.detail)}</p>
                </article>
              `).join("")}
            </div>
          </article>

          <article class="reference-panel">
            <p class="eyebrow">Coverage</p>
            <h2>Why One Defense View Covers All Three Attacks</h2>
            <div class="coverage-grid">
              ${defense.coverage.map((item) => `
                <article class="coverage-card">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="checkpoint-applies">${escapeHtml(item.channel)}</p>
                  <p>${escapeHtml(item.detail)}</p>
                </article>
              `).join("")}
            </div>
          </article>

          <article class="reference-panel">
            <p class="eyebrow">Implementation Options</p>
            <h2>Controls You Can Actually Build</h2>
            <div class="checkpoint-grid">
              ${defense.implementationOptions.map((item) => `
                <article class="checkpoint-card">
                  <p class="flow-stage-id">${escapeHtml(item.id)}</p>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.detail)}</p>
                </article>
              `).join("")}
            </div>
          </article>
        </section>
      </section>
    `;
  }

  function renderSharedDefenseTeaser(category, scenario) {
    const coverage = category.sharedDefense && category.sharedDefense.coverage
      ? category.sharedDefense.coverage.find((item) => item.scenarioId === scenario.id)
      : null;
    const defense = category.sharedDefense || {};
    const teaserTitle = defense.teaserTitle || `${category.id} uses one defense architecture across all three scenarios`;
    const teaserIntro = defense.teaserIntro || `${scenario.title} teaches how the attack begins. The defense lesson for ${category.id} is centralized so students learn one reusable architecture instead of memorizing three separate fixes.`;
    const teaserLinkLabel = defense.teaserLinkLabel || `Open the ${category.id} shared defense architecture`;

    return `
      <article class="shared-defense-teaser-card">
        <p class="eyebrow">Shared Defense View</p>
        <h2>${escapeHtml(teaserTitle)}</h2>
        <p class="hero-copy">
          ${escapeHtml(teaserIntro)}
        </p>
        ${coverage ? `
          <div class="shared-defense-teaser-focus">
            <h3>${escapeHtml(coverage.title)}</h3>
            <p class="checkpoint-applies">${escapeHtml(coverage.channel)}</p>
            <p>${escapeHtml(coverage.detail)}</p>
          </div>
        ` : ""}
        <div class="shared-defense-teaser-actions">
          <a class="card-link" href="${category.href}#shared-defense">${escapeHtml(teaserLinkLabel)}</a>
        </div>
      </article>
    `;
  }

  function renderDiagram(diagram) {
    const { width, height, nodes, edges } = diagram;
    return `
      <svg class="training-diagram" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Training scenario diagram">
        <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
        </marker>
        <rect width="${width}" height="${height}" fill="#fffdf8"></rect>
        ${edges.map((edge) => renderEdge(edge, nodes)).join("")}
        ${nodes.map(renderNode).join("")}
      </svg>
    `;
  }

  function renderNode(node) {
    const toneMap = {
      neutral: {
        fill: "#fcfbf8",
        stroke: "#aba294",
        title: "#38342f",
        subtitle: "#6b655c"
      },
      primary: {
        fill: "#f7f8ff",
        stroke: "#4452b8",
        title: "#33429f",
        subtitle: "#5360be"
      },
      danger: {
        fill: "#fff8f8",
        stroke: "#ad3535",
        title: "#7d2626",
        subtitle: "#ad3535"
      },
      safe: {
        fill: "#edf7f0",
        stroke: "#2d6a4f",
        title: "#24553f",
        subtitle: "#3d735a"
      }
    };
    const tone = toneMap[node.tone] || toneMap.neutral;
    const titleLayout = fitSingleLine(node.title, node.w - 36, 18, 15);
    const subtitleLayout = fitWrappedText(node.subtitle, node.w - 42, 14, 12, 2);
    return `
      <g class="diagram-node">
        <rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="22" fill="${tone.fill}" stroke="${tone.stroke}" stroke-width="2.8"></rect>
        <text x="${node.x + node.w / 2}" y="${node.y + 46}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${titleLayout.fontSize}" font-weight="700" fill="${tone.title}">${escapeHtml(titleLayout.text)}</text>
        <text x="${node.x + node.w / 2}" y="${node.y + 76}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${subtitleLayout.fontSize}" fill="${tone.subtitle}">
          ${renderTspans(node.x + node.w / 2, subtitleLayout.lines, subtitleLayout.fontSize * 1.18)}
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
      primary: { stroke: "#4452b8", marker: "url(#ar)", labelFill: "#ffffff", labelStroke: "#4452b8", labelText: "#4452b8" },
      danger: { stroke: "#ad3535", marker: "url(#ar)", labelFill: "#ffffff", labelStroke: "#ad3535", labelText: "#ad3535" },
      safe: { stroke: "#2d6a4f", marker: "url(#ar)", labelFill: "#ffffff", labelStroke: "#2d6a4f", labelText: "#2d6a4f" }
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
          <text x="${edge.labelX}" y="${edge.labelY}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${labelLayout.fontSize}" font-weight="700" fill="${tone.labelText}" stroke="#fffdf8" stroke-width="6" paint-order="stroke fill" stroke-linejoin="round">
            ${renderTspans(edge.labelX, labelLayout.lines, labelLayout.fontSize * 1.18)}
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
  if (page === "category") renderCategory();
  if (page === "scenario") renderScenario();
})();
