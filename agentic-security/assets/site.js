(function () {
  const data = window.OWASP_ASI_DATA;
  const referenceData = window.OWASP_ASI_REFERENCE_DATA || {};
  const briefingData = window.OWASP_ASI_BRIEFING_DATA || {};
  if (!data) return;
  const ASSET_VERSION = "20260621a";
  const OFFICIAL_ASI_SOURCE = {
    href: "https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/",
    label: "OWASP Top 10 for Agentic Applications 2026"
  };
  const EDGE_LABEL_TOKENS = {
    fontSize: {
      horizontal: 13,
      vertical: 13
    },
    minFontSize: {
      horizontal: 11,
      vertical: 11
    },
    maxWidth: {
      horizontal: 210,
      vertical: 230
    }
  };

  const page = document.body.dataset.page;

  function getCategory(id) {
    return data.categories.find((item) => item.id === id);
  }

  function getScenario(asiId, scenarioId) {
    const category = getCategory(asiId);
    if (!category || !category.scenarios) return null;
    return category.scenarios.find((item) => item.id === scenarioId);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      asi: params.get("asi"),
      scenario: params.get("scenario"),
      view: params.get("view"),
      topic: params.get("topic")
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

  function createBriefingNavCard(category, topic) {
    const isOverview = topic === "overview";
    const title = isOverview ? `${category.id} overview` : `${category.id} terminology map`;
    const description = isOverview
      ? `Definition, concept flow, and scope for ${category.id}.`
      : `Key vocabulary placed across the ${category.id} attack chain.`;
    const href = `./briefing.html?asi=${encodeURIComponent(category.id)}&topic=${encodeURIComponent(topic)}`;
    const toneClass = isOverview ? " briefing-nav-card-overview" : " briefing-nav-card-terms";
    const linkLabel = isOverview ? "View overview" : "View terminology map";

    return `
      <article class="scenario-card briefing-nav-card${toneClass}">
        <p class="scenario-type">${isOverview ? "Category Overview" : "Terminology Recap"}</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
        <a class="card-link" href="${href}">
          ${escapeHtml(linkLabel)}
        </a>
      </article>
    `;
  }

  function createOverviewFlow(reference) {
    const terms = reference && reference.terminology ? reference.terminology : [];
    const entry = terms[0] ? terms[0].term : "Risk enters the system";
    const change = terms[1] ? terms[1].term : "Agent behavior changes";
    const impact = terms[2] ? terms[2].term : "Business impact follows";
    return [
      {
        eyebrow: "1. Entry point",
        title: entry,
        detail: "This is where the risky signal, condition, or trust mistake first reaches the workflow."
      },
      {
        eyebrow: "2. What changes",
        title: change,
        detail: "The agent, workflow, or human decision path shifts in a way that the system should have constrained."
      },
      {
        eyebrow: "3. Why it matters",
        title: impact,
        detail: "The result is a business outcome that looks valid operationally but becomes unsafe, misleading, or damaging."
      }
    ];
  }

  function toneClassFor(kind, tone) {
    return `${kind}-${tone || "neutral"}`;
  }

  function renderLegend(items) {
    if (!items || !items.length) return "";
    return `
      <div class="asi-legend" aria-label="Color legend">
        ${items.map((item) => `
          <span class="asi-legend-item">
            <span class="asi-legend-swatch asi-legend-swatch-${escapeHtml(item.tone || "neutral")}" aria-hidden="true"></span>
            ${escapeHtml(item.label)}
          </span>
        `).join("")}
      </div>
    `;
  }

  function initTerminologyReveal(root) {
    const layout = root && root.querySelector("[data-terminology-reveal]");
    if (!layout) return;

    const cards = Array.from(layout.querySelectorAll(".asi-term-card"));
    if (!cards.length) return;

    let activeIndex = 0;

    function applyRevealState() {
      const isComplete = activeIndex >= cards.length;
      layout.classList.toggle("is-complete", isComplete);

      cards.forEach((card, index) => {
        const isActive = !isComplete && index === activeIndex;
        const isUpcoming = !isComplete && index > activeIndex;
        const isRevealed = isComplete || index < activeIndex;

        card.classList.toggle("is-active", isActive);
        card.classList.toggle("is-upcoming", isUpcoming);
        card.classList.toggle("is-revealed", isRevealed);
        card.setAttribute("aria-hidden", isUpcoming ? "true" : "false");
      });
    }

    function advanceReveal() {
      if (activeIndex < cards.length) {
        activeIndex += 1;
        applyRevealState();
      }
    }

    layout.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      advanceReveal();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== " " && event.key !== "Enter") return;
      if (event.target && /input|textarea|select/i.test(event.target.tagName || "")) return;
      event.preventDefault();
      advanceReveal();
    });

    applyRevealState();
  }

  function createTerminologySection(category, reference) {
    const briefing = briefingData[category.id] && briefingData[category.id].terminology;
    if (!briefing || !reference || !reference.terminology || !reference.terminology.length) return "";
    const termsMarkup = reference.terminology
      .map((item, index) => `
        <article class="asi-term-card ${toneClassFor("asi-term-card", briefing.termTones && briefing.termTones[index])}">
          <p class="asi-term-kicker">${escapeHtml((briefing.termRoles && briefing.termRoles[index]) || "Key term")}</p>
          <h3>${escapeHtml(item.term)}</h3>
          <p class="asi-term-detail">${escapeHtml(item.detail)}</p>
        </article>
      `)
      .join("");

    const chainMarkup = briefing.chain
      .map((node, index) => `
        <div class="asi-chain-node ${toneClassFor("asi-chain-node", node.tone)}">${escapeHtml(node.title)}</div>
        ${index < briefing.chain.length - 1 ? '<div class="asi-chain-link" aria-hidden="true">→</div>' : ""}
      `)
      .join("");

    return `
      <div class="asi-briefing-shell">
        <article class="asi-briefing-panel">
          <section class="asi-briefing-section" aria-label="${escapeHtml(category.id)} attack chain">
            <div class="category-section-heading">
              <p class="eyebrow">Attack Chain</p>
              <h2>Where the terms fit</h2>
            </div>
            <div class="asi-chain-row">
              ${chainMarkup}
            </div>
            ${renderLegend(briefing.legend)}
          </section>

          <section class="asi-briefing-section" aria-label="${escapeHtml(category.id)} terminology">
            <div class="asi-terms-layout" data-terminology-reveal>
              ${termsMarkup}
            </div>
          </section>

          <div class="asi-insight-box">
            <strong>Key insight</strong>
            <p>${escapeHtml(briefing.keyInsight)}</p>
          </div>
        </article>
      </div>
    `;
  }

  function createOverviewSection(category, reference) {
    const briefing = briefingData[category.id] && briefingData[category.id].overview;
    if (!briefing || !reference) return "";
    const flow = briefing.flow || {};
    const primaryScenario = category && category.scenarios && category.scenarios.length
      ? category.scenarios[0]
      : null;
    const pillarsMarkup = (briefing.whyMatters || [])
      .map((item) => `
        <article class="asi-pillar-card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </article>
      `)
      .join("");

    const chipsMarkup = (briefing.channels || [])
      .map((item) => `<span class="asi-chip">${escapeHtml(item)}</span>`)
      .join("");

    return `
      <div class="asi-briefing-shell">
        <article class="asi-briefing-panel asi-overview-panel">
          <section class="asi-overview-hook" aria-label="${escapeHtml(category.id)} overview focus">
            <p class="eyebrow">In One Sentence</p>
            <p class="asi-overview-hook-copy">${escapeHtml(briefing.band)}</p>
          </section>

          <section class="asi-briefing-section" aria-label="${escapeHtml(category.id)} mechanism">
            <div class="category-section-heading">
              <p class="eyebrow">How It Breaks</p>
              <h2>A normal workflow, wrong decision</h2>
              <p>${escapeHtml(briefing.mechanismIntro)}</p>
            </div>

            <div class="asi-mechanism-grid">
              <article class="asi-mechanism-card ${toneClassFor("asi-mechanism-card", flow.leftTone)}">
                <p class="asi-node-label">${escapeHtml(flow.leftLabel)}</p>
                <h3>${escapeHtml(flow.leftTitle)}</h3>
                <p>${escapeHtml(flow.leftText)}</p>
              </article>
              <div class="asi-mechanism-arrow" aria-hidden="true">→</div>
              <article class="asi-mechanism-card ${toneClassFor("asi-mechanism-card", flow.centerTone)}">
                <p class="asi-node-label">${escapeHtml(flow.centerLabel)}</p>
                <h3>${escapeHtml(flow.centerTitle)}</h3>
                <p>${escapeHtml(flow.centerText)}</p>
              </article>
              <div class="asi-mechanism-arrow" aria-hidden="true">←</div>
              <article class="asi-mechanism-card ${toneClassFor("asi-mechanism-card", flow.rightTone)}">
                <p class="asi-node-label">${escapeHtml(flow.rightLabel)}</p>
                <h3>${escapeHtml(flow.rightTitle)}</h3>
                <p>${escapeHtml(flow.rightText)}</p>
              </article>
            </div>

            <article class="asi-outcome-card ${toneClassFor("asi-outcome-card", flow.outcomeTone)}">
              <p class="asi-node-label">${escapeHtml(flow.outcomeLabel)}</p>
              <h3>${escapeHtml(flow.outcomeTitle)}</h3>
              <p>${escapeHtml(flow.outcomeText)}</p>
            </article>

            <p class="asi-overview-caption"><strong>${escapeHtml(flow.boundaryTitle)}:</strong> ${escapeHtml(flow.boundaryText)}</p>
          </section>

          <section class="asi-briefing-section" aria-label="${escapeHtml(category.id)} significance">
            <div class="category-section-heading">
              <p class="eyebrow">Why This Matters</p>
              <h2>Why this is easy to miss</h2>
            </div>
            <div class="asi-pillars-grid">
              ${pillarsMarkup}
            </div>
          </section>

          <section class="asi-briefing-section" aria-label="${escapeHtml(category.id)} scope">
            <div class="category-section-heading">
              <p class="eyebrow">Where It Enters</p>
              <h2>Typical entry points</h2>
            </div>
            <div class="asi-chip-row">
              ${chipsMarkup}
            </div>
          </section>

          <section class="asi-overview-bridge" aria-label="${escapeHtml(category.id)} scenario handoff">
            <div class="asi-overview-bridge-copy">
              <p class="eyebrow">Next</p>
              <h2>Watch it happen in a real workflow</h2>
              <p>${primaryScenario ? escapeHtml(primaryScenario.description) : "Open the first scenario to see how this category shows up in a real workflow."}</p>
            </div>
            <div class="asi-overview-bridge-actions">
              ${primaryScenario && primaryScenario.href ? `<a class="card-link" href="${primaryScenario.href}">Open first scenario</a>` : ""}
              <a class="briefing-card-source" href="${OFFICIAL_ASI_SOURCE.href}" target="_blank" rel="noreferrer">Source: ${escapeHtml(OFFICIAL_ASI_SOURCE.label)}</a>
            </div>
          </section>
        </article>
      </div>
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
    const scenarioSection = scenarioGrid ? scenarioGrid.closest(".section") : null;
    const briefingGrid = document.getElementById("category-briefing-grid");
    let activeBriefingGrid = briefingGrid;
    if (!activeBriefingGrid && scenarioSection) {
      const briefingSection = document.createElement("section");
      briefingSection.className = "section section-plain category-briefing-section";
      briefingSection.innerHTML = `
        <div class="category-section-heading">
          <p class="eyebrow">Category Pages</p>
          <h2>Overview and terminology</h2>
          <p>Two supporting pages provide the category summary and the terminology map.</p>
        </div>
        <div class="scenario-grid" id="category-briefing-grid"></div>
      `;
      scenarioSection.parentNode.insertBefore(briefingSection, scenarioSection);
      activeBriefingGrid = briefingSection.querySelector("#category-briefing-grid");
    }
    if (activeBriefingGrid) {
      activeBriefingGrid.innerHTML = [
        createBriefingNavCard(category, "overview"),
        createBriefingNavCard(category, "terminology")
      ].join("");
    }

    let scenarioHeading = document.getElementById("category-scenario-heading");
    if (!scenarioHeading && scenarioGrid) {
      scenarioHeading = document.createElement("div");
      scenarioHeading.id = "category-scenario-heading";
      scenarioHeading.className = "category-section-heading";
      scenarioGrid.parentNode.insertBefore(scenarioHeading, scenarioGrid);
    }
    if (scenarioHeading) {
      scenarioHeading.innerHTML = `
        <p class="eyebrow">Scenario Walkthroughs</p>
        <h2>Open the scenarios for ${escapeHtml(category.id)}</h2>
        <p>Each scenario below shows how this risk can appear inside a realistic workflow.</p>
      `;
    }

    if (scenarioGrid && category.scenarios) {
      scenarioGrid.innerHTML = category.scenarios
        .map((scenario) => createScenarioCard(category, scenario))
        .join("");
    }
  }

  function renderBriefing() {
    const { asi, topic } = getParams();
    const category = getCategory(asi);
    const reference = referenceData[asi];
    const briefing = briefingData[asi];
    if (!category || !reference || !briefing) return;

    const topicName = topic === "terminology" ? "Terminology Recap" : "Category Overview";
    document.title = `${category.id} · ${topicName}`;

    const asiLink = document.getElementById("briefing-asi-link");
    const topicLabel = document.getElementById("briefing-topic-label");
    const topicLabelMobile = document.getElementById("briefing-topic-label-mobile");
    const title = document.getElementById("briefing-title");
    const intro = document.getElementById("briefing-intro");
    const root = document.getElementById("briefing-root");

    if (asiLink) {
      asiLink.textContent = category.id;
      asiLink.href = category.href;
    }
    if (topicLabel) topicLabel.textContent = topicName;
    if (topicLabelMobile) {
      topicLabelMobile.textContent = "";
      topicLabelMobile.hidden = true;
    }
    if (title) {
      title.textContent = topic === "terminology"
        ? "Terminology Map"
        : category.title;
    }
    if (intro) {
      intro.textContent = topic === "terminology"
        ? briefing.terminology.hero
        : briefing.overview.hero;
    }
    if (root) {
      root.innerHTML = topic === "terminology"
        ? createTerminologySection(category, reference)
        : createOverviewSection(category, reference);

      if (topic === "terminology") {
        initTerminologyReveal(root);
      }
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

    document.addEventListener("click", (e) => {
      if (e.target.closest("button, a, input, select, textarea, .scenario-tab")) return;
      if (!stepStrip || stepStrip.hidden) return;
      runScenarioAction("advance");
    });

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
      payload: {
        fill: "#fff3de",
        stroke: "#ef9f21",
        title: "#8a5200",
        subtitle: "#9a7748"
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

    const orientation = edge.fromSide === "top" || edge.fromSide === "bottom"
      ? "vertical"
      : "horizontal";
    const labelLayout = edge.label
      ? fitWrappedText(
          edge.label,
          edge.labelWidth || EDGE_LABEL_TOKENS.maxWidth[orientation],
          Math.max(EDGE_LABEL_TOKENS.fontSize[orientation], 12),
          EDGE_LABEL_TOKENS.minFontSize[orientation],
          2
        )
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
  if (page === "briefing") renderBriefing();
  if (page === "scenario") renderScenario();
})();
