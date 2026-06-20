(function () {
  const walkthroughs = window.ASI_WALKTHROUGHS || {};
  const params = new URLSearchParams(window.location.search);
  const scenarioId = params.get("scenario");
  const view = params.get("view") === "defense" ? "defense" : "attack";
  const autoplay = params.get("autoplay");
  const externalPanel = params.get("embed") === "external-panel";
  const frameBare = params.get("frame") === "bare";
  const scenario = walkthroughs[scenarioId];
  const WALKTHROUGH_STATE_MESSAGE = "asi:walkthrough-state";
  const WALKTHROUGH_ACTION_MESSAGE = "asi:walkthrough-action";
  const DIAGRAM_TOKENS = {
    flowLabelGap: {
      horizontal: 36,
      vertical: 22
    },
    flowLabelMaxWidth: {
      horizontal: 170,
      vertical: 190
    },
    nodeTextMaxLines: {
      title: 2,
      body: 2
    },
    nodeTextSafeArea: {
      compact: {
        titleInsetX: 18,
        bodyInsetX: 16
      },
      wide: {
        titleInsetX: 42,
        bodyInsetX: 41
      }
    }
  };
  let pendingStateFrame = null;

  if (!scenario || !scenario[view]) {
    document.body.innerHTML = "<p style='font-family: sans-serif; padding: 24px;'>Walkthrough not found.</p>";
    return;
  }

  const data = scenario[view];
  const attackTemplate = data.attackTemplate || "default";
  const defenseTemplate = data.defenseTemplate || "default";
  document.title = `${scenario.label} · ${view === "attack" ? "Attack View" : "Defense View"}`;
  document.body.innerHTML = view === "attack"
    ? renderAttackByTemplate(data, attackTemplate)
    : renderDefenseByTemplate(data, defenseTemplate);

  const steps = view === "attack" ? buildAttackSteps(attackTemplate) : buildDefenseSteps(defenseTemplate);
  let current = -1;

  window.advance = function advance() {
    current += 1;
    if (current >= steps.length) return;
    const step = steps[current];
    step.show.forEach(showElement);
    step.co.forEach(showElement);
    step.fl.forEach(showElement);
    step.lb.forEach(showElement);
    updatePanel(current, step.atk, data.steps[current].title, data.steps[current].detail, steps.length);
    updateDots(current, step.atk);
    const nextButton = document.getElementById("bnext");
    document.getElementById("breset").style.display = "inline-block";
    if (current === steps.length - 1) {
      nextButton.textContent = "✓ Complete";
      nextButton.disabled = true;
    } else {
      nextButton.textContent = "▶ Next";
    }
    queueParentSync();
  };

  window.reset = function reset() {
    current = -1;
    document.querySelectorAll(".ng,.co,.fl,.lb,.az").forEach((element) => element.classList.remove("v"));
    document.querySelectorAll(".dot").forEach((dot) => dot.classList.remove("active", "done", "atk"));
    const panel = document.getElementById("panel");
    const stepLabel = document.getElementById("ps");
    const nextButton = document.getElementById("bnext");
    const introTitle = view === "attack"
      ? (data.introTitle || `${scenario.label} — Attack View`)
      : (data.introTitle || `${scenario.label} — Defense View`);
    const introDetail = view === "attack"
      ? (data.introDetail || "Click Start to reveal the flow one step at a time.")
      : (data.introDetail || "Click Start to step through the guarded flow.");
    panel.classList.remove("atk");
    stepLabel.classList.remove("a");
    stepLabel.textContent = "Click to begin";
    document.getElementById("ph").textContent = introTitle;
    document.getElementById("pd").textContent = introDetail;
    nextButton.textContent = "▶ Start";
    nextButton.disabled = false;
    nextButton.classList.remove("atk");
    document.getElementById("breset").style.display = "none";
    queueParentSync();
  };

  const dots = document.getElementById("dots");
  data.steps.forEach((_, index) => {
    if (index > 0) {
      const separator = document.createElement("div");
      separator.className = "sep";
      dots.appendChild(separator);
    }
    const dot = document.createElement("div");
    dot.className = "dot";
    dots.appendChild(dot);
  });

  if (autoplay === "all") {
    for (let index = 0; index < steps.length; index += 1) {
      window.advance();
    }
  } else if (/^\d+$/.test(autoplay || "")) {
    const maxSteps = Math.min(Number(autoplay), steps.length);
    for (let index = 0; index < maxSteps; index += 1) {
      window.advance();
    }
  }

  if (window.parent && window.parent !== window) {
    window.addEventListener("message", (event) => {
      const message = event.data;
      if (!message || message.type !== WALKTHROUGH_ACTION_MESSAGE) return;
      if (message.action === "sync") {
        queueParentSync();
        return;
      }
      if (message.action === "advance") {
        window.advance();
        return;
      }
      if (message.action === "reset") {
        window.reset();
      }
    });

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => queueParentSync());
      if (document.body) resizeObserver.observe(document.body);
      if (document.documentElement) resizeObserver.observe(document.documentElement);
    }

    window.addEventListener("load", () => queueParentSync());
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("button, a, input, select, textarea, .dot, .sep")) return;
    window.advance();
  });

  function showElement(id) {
    const element = document.getElementById(id);
    if (element) element.classList.add("v");
  }

  function updatePanel(index, isAttack, title, detail, total) {
    const panel = document.getElementById("panel");
    const nextButton = document.getElementById("bnext");
    const stepLabel = document.getElementById("ps");
    stepLabel.textContent = `${isAttack ? `Step ${index + 1} / ${total} — ATTACK` : `Step ${index + 1} / ${total}`}`;
    document.getElementById("ph").textContent = title;
    document.getElementById("pd").textContent = detail;
    if (isAttack) {
      panel.classList.add("atk");
      nextButton.classList.add("atk");
      stepLabel.classList.add("a");
    }
  }

  function updateDots(index, isAttack) {
    document.querySelectorAll(".dot").forEach((dot, dotIndex) => {
      dot.classList.remove("active", "done", "atk");
      if (dotIndex < index) dot.classList.add("done");
      if (dotIndex === index) {
        dot.classList.add("active");
        if (isAttack) dot.classList.add("atk");
      }
    });
  }

  function queueParentSync() {
    if (!window.parent || window.parent === window) return;
    if (pendingStateFrame !== null) {
      window.cancelAnimationFrame(pendingStateFrame);
    }
    pendingStateFrame = window.requestAnimationFrame(() => {
      pendingStateFrame = null;
      window.parent.postMessage({
        type: WALKTHROUGH_STATE_MESSAGE,
        state: getWalkthroughState()
      }, "*");
    });
  }

  function getWalkthroughState() {
    const panel = document.getElementById("panel");
    const meta = document.getElementById("ps");
    const heading = document.getElementById("ph");
    const detail = document.getElementById("pd");
    const nextButton = document.getElementById("bnext");
    const resetButton = document.getElementById("breset");
    return {
      detail: detail ? detail.textContent || "" : "",
      heading: heading ? heading.textContent || "" : "",
      height: measureDocumentHeight(),
      isAttack: panel ? panel.classList.contains("atk") : false,
      meta: meta ? meta.textContent || "" : "",
      nextDisabled: nextButton ? nextButton.disabled : false,
      nextLabel: nextButton ? nextButton.textContent || "" : "▶ Start",
      resetHidden: !resetButton || resetButton.style.display === "none"
    };
  }

  function measureDocumentHeight() {
    const body = document.body;
    if (!body) return 0;
    const bodyRect = body.getBoundingClientRect();
    const bodyStyles = window.getComputedStyle(body);
    const paddingBottom = Number.parseFloat(bodyStyles.paddingBottom || "0") || 0;
    const contentBottom = Array.from(body.children).reduce((max, child) => {
      return Math.max(max, child.getBoundingClientRect().bottom - bodyRect.top);
    }, 0);
    return Math.ceil(Math.max(
      body.scrollHeight,
      document.documentElement ? document.documentElement.scrollHeight : 0,
      contentBottom + paddingBottom
    ));
  }

  function buildAttackSteps(template) {
    const builders = {
      default: buildDefaultAttackSteps,
      "asi02-loop": buildAttackLoopSteps,
      "asi06-memory": buildAttackMemorySteps,
      "asi06-drift": buildAttackDriftSteps,
      "asi10-metric-gaming": buildDefaultAttackSteps,
      "asi10-replication": buildDefaultAttackSteps,
      "asi07-channel": buildAttackChannelSteps,
      "asi08-cascade": buildAttackCascadeSteps
    };
    const builder = builders[template] || builders.default;
    return builder();
  }

  function buildDefaultAttackSteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: false },
      { show: ["g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["g3"], co: ["c2s"], fl: ["c2f", "c3f"], lb: ["l2", "l3"], atk: false },
      { show: ["g4az", "g4ctx"], co: ["ias"], fl: ["iaf"], lb: ["la1", "la2"], atk: true },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["l4"], atk: true },
      { show: ["g6"], co: ["c5s"], fl: ["c5f"], lb: ["l5"], atk: true },
      { show: ["g7"], co: ["c6s", "c6t", "c6a"], fl: ["c6f", "c6af"], lb: ["l6"], atk: true }
    ];
  }

  function buildAttackLoopSteps() {
    return [
      { show: ["gentry", "gzone", "g0", "g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: true },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["g3"], co: ["c2s"], fl: ["c2f"], lb: ["l2"], atk: false },
      { show: ["g4"], co: ["c3s"], fl: ["c3f"], lb: ["l3"], atk: false },
      { show: ["g5", "g6"], co: ["c4s"], fl: ["c4f"], lb: ["la1"], atk: true },
      { show: ["g7"], co: ["c5s"], fl: ["c5f"], lb: ["l4"], atk: true },
      { show: ["g8"], co: ["c6s"], fl: ["c6f"], lb: ["l5"], atk: true },
      { show: ["g9"], co: ["c7s"], fl: ["c7f"], lb: ["l6"], atk: true }
    ];
  }

  function buildAttackMemorySteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: true },
      { show: ["g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: true },
      { show: ["g2", "gzone"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: true },
      { show: ["g3", "g4"], co: ["c2s"], fl: ["c2f"], lb: ["l2"], atk: false },
      { show: [], co: ["c3s", "c3v"], fl: ["c3f", "c3vf"], lb: ["l3"], atk: false },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["la1"], atk: true },
      { show: ["g6"], co: ["c5s"], fl: ["c5f"], lb: ["l4", "l5"], atk: true },
      { show: ["g7"], co: ["c6s"], fl: ["c6f"], lb: ["l6"], atk: true }
    ];
  }

  function buildAttackDriftSteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: true },
      { show: ["g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: true },
      { show: ["g2", "gzone"], co: ["c1s"], fl: ["c1f"], lb: ["l1", "l2"], atk: true },
      { show: ["g3"], co: ["c2s"], fl: ["c2f"], lb: ["l3"], atk: true },
      { show: ["g4"], co: ["c3s", "c3v"], fl: ["c3f", "c3vf"], lb: ["l4"], atk: true },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["l5"], atk: true },
      { show: ["g6"], co: ["c5s"], fl: ["c5f"], lb: ["l6"], atk: true }
    ];
  }

  function buildAttackChannelSteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: false },
      { show: ["g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["g3"], co: [], fl: [], lb: ["l2"], atk: true },
      { show: ["gzone", "g4"], co: ["c2s", "c3s"], fl: ["c2f", "c3f"], lb: ["la1"], atk: true },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["l4"], atk: true },
      { show: ["g6"], co: ["c5s"], fl: ["c5f"], lb: ["l5"], atk: true },
      { show: ["g7"], co: ["c6s"], fl: ["c6f"], lb: ["l6"], atk: true },
      { show: ["g8"], co: ["c7s"], fl: ["c7f"], lb: ["l7"], atk: true }
    ];
  }

  function buildAttackCascadeSteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: true },
      { show: ["g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: true },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: true },
      { show: ["g3"], co: ["c2s"], fl: ["c2f"], lb: ["l2"], atk: true },
      { show: ["gzone", "g4"], co: ["c3s"], fl: ["c3f"], lb: ["l3", "la1"], atk: true },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["l4"], atk: true },
      { show: ["g6"], co: ["c5s"], fl: ["c5f"], lb: ["l5"], atk: true }
    ];
  }

  function buildDefenseSteps(template) {
    const builders = {
      default: buildDefaultDefenseSteps,
      "asi01-shared": buildSharedDefenseSteps,
      "asi02-shared": buildSharedDefenseStepsAsi02,
      "asi02-shared-compact": buildSharedDefenseStepsAsi02Compact,
      "shared-stack": buildSharedDefenseStepsAsi02,
      "shared-compact": buildSharedDefenseStepsCompact
    };
    const builder = builders[template] || builders.default;
    return builder();
  }

  function buildDefaultDefenseSteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: false },
      { show: ["gzone", "g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["g3"], co: ["c2s"], fl: ["c2f"], lb: ["l2"], atk: false },
      { show: ["g4"], co: ["c3s"], fl: ["c3f"], lb: ["l3"], atk: false },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["l4", "l5"], atk: false }
    ];
  }

  function buildSharedDefenseSteps() {
    return [
      { show: ["g0", "g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["gzone", "g3"], co: ["c2s"], fl: ["c2f", "c3f"], lb: ["l2", "l3"], atk: false },
      { show: ["g4"], co: ["c3s", "c4s"], fl: ["c4f"], lb: ["l4"], atk: false },
      { show: ["g5"], co: ["c5s"], fl: ["c5f"], lb: ["l5"], atk: false },
      { show: ["g6", "g6ctx"], co: ["c6s"], fl: ["c6f"], lb: ["l6"], atk: false },
      { show: ["g7"], co: ["c7s"], fl: ["c7f"], lb: ["l7"], atk: false },
      { show: ["g8"], co: ["c8s"], fl: ["c8f"], lb: ["l8"], atk: false },
      { show: ["g9", "g10", "g11"], co: ["c9s"], fl: ["c9f"], lb: ["l9"], atk: false }
    ];
  }

  function buildSharedDefenseStepsAsi02() {
    return [
      { show: ["g0", "g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["gzone", "g3", "g4"], co: ["c2s", "c3s"], fl: ["c2f", "c3f"], lb: ["l2", "l3"], atk: false },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["l4"], atk: false },
      { show: ["g6"], co: ["c5s"], fl: ["c5f"], lb: ["l5"], atk: false },
      { show: ["g7"], co: ["c6s"], fl: ["c6f"], lb: ["l6"], atk: false },
      { show: ["g8"], co: ["c7s"], fl: ["c7f"], lb: ["l7"], atk: false },
      { show: ["g9"], co: ["c8s"], fl: ["c8f"], lb: ["l8"], atk: false },
      { show: ["g10"], co: ["c9s"], fl: ["c9f"], lb: ["l9"], atk: false },
      { show: ["g11", "g12"], co: ["c10s"], fl: ["c10f"], lb: ["l10"], atk: false }
    ];
  }

  function buildSharedDefenseStepsCompact() {
    return [
      { show: ["g0", "g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["gzone", "g3"], co: ["c2s"], fl: ["c2f", "c3f"], lb: ["l2", "l3"], atk: false },
      { show: ["g4"], co: ["c3s", "c4s"], fl: ["c4f"], lb: ["l4"], atk: false },
      { show: ["g5"], co: ["c5s"], fl: ["c5f"], lb: ["l5"], atk: false },
      { show: ["g6"], co: ["c6s"], fl: ["c6f"], lb: ["l6"], atk: false },
      { show: ["g7"], co: ["c7s"], fl: ["c7f"], lb: ["l7"], atk: false },
      { show: ["g8"], co: ["c8s"], fl: ["c8f"], lb: ["l8"], atk: false },
      { show: ["g9"], co: ["c9s"], fl: ["c9f"], lb: ["l9"], atk: false },
      { show: ["g10", "g11", "g12"], co: ["c10s"], fl: ["c10f"], lb: ["l10"], atk: false }
    ];
  }

  function buildSharedDefenseStepsAsi02Compact() {
    return [
      { show: ["g0", "g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["gzone", "g3"], co: ["c2s"], fl: ["c2f", "c3f"], lb: ["l2", "l3"], atk: false },
      { show: ["g4"], co: ["c3s", "c4s"], fl: ["c4f"], lb: ["l4"], atk: false },
      { show: ["g5"], co: ["c5s"], fl: ["c5f"], lb: ["l5"], atk: false },
      { show: ["g6"], co: ["c6s"], fl: ["c6f"], lb: ["l6"], atk: false },
      { show: ["g7"], co: ["c6as"], fl: ["c6af"], lb: ["l7"], atk: false },
      { show: ["g8"], co: [], fl: [], lb: [], atk: false },
      { show: ["g9", "g10", "g11"], co: ["c8bs", "c9s"], fl: ["c8bf", "c9f"], lb: ["l8", "l9"], atk: false }
    ];
  }

  function renderAttackByTemplate(config, template) {
    const renderers = {
      default: renderAttack,
      "asi09-trust-review": renderAttackTrust,
      "asi10-metric-gaming": renderAttackMetricGaming,
      "asi10-replication": renderAttackReplication,
      "asi02-loop": renderAttackLoop,
      "asi06-memory": renderAttackMemory,
      "asi06-drift": renderAttackDrift,
      "asi07-channel": renderAttackChannel,
      "asi08-cascade": renderAttackCascade
    };
    const renderer = renderers[template] || renderers.default;
    return renderer(config);
  }

  function renderDefenseByTemplate(config, template) {
    const renderers = {
      default: renderDefense,
      "asi01-shared": renderDefenseShared,
      "asi02-shared": renderDefenseSharedAsi02,
      "asi02-shared-compact": renderDefenseSharedCompactAsi02,
      "shared-stack": renderDefenseSharedAsi02,
      "shared-compact": renderDefenseSharedCompact
    };
    const renderer = renderers[template] || renderers.default;
    return renderer(config);
  }

  function renderAttack(config) {
    const userTitleLayout = fitSingleLine(config.user.title, 142, 18, 14);
    const userSub1Layout = fitSingleLine(config.user.sub1, 146, 14, 11);
    const userSub2Layout = fitWrappedText(config.user.sub2, 146, 11, 9, 2);
    const userSub2Y = userSub2Layout.lines.length > 1 ? 268 : 274;
    const agentTitleLayout = fitSingleLine(config.agent.title, 180, 18, 14);
    const agentGoalLayout = fitSingleLine(config.agent.goal, 176, 12, 10);
    const toolTopTitleLayout = fitSingleLine(config.toolTop.title, 188, 18, 14);
    const toolTopSub1Layout = fitSingleLine(config.toolTop.sub1, 186, 14, 11);
    const toolTopSub2Layout = fitWrappedText(config.toolTop.sub2, 188, 12, 10, 2);
    const toolTopSub2Y = toolTopSub2Layout.lines.length > 1 ? 276 : 282;
    const storeTitleLayout = fitSingleLine(config.store.title, 188, 18, 14);
    const storeSub1Layout = fitSingleLine(config.store.sub1, 188, 14, 11);
    const storeSub2Layout = fitWrappedText(config.store.sub2, 190, 12, 9, 2);
    const storeSub2Y = storeSub2Layout.lines.length > 1 ? 266 : 274;
    const payloadTitleLayout = fitSingleLine(config.payload.title, 188, 17, 13);
    const payloadVisibleLayout = fitWrappedText(config.payload.visible, 184, 12, 10, 2);
    const payloadHidden1Layout = fitWrappedText(config.payload.hidden1, 190, 12, 10, 2);
    const payloadHidden2Layout = fitWrappedText(config.payload.hidden2, 190, 14, 11, 2);
    const payloadNoteLayout = config.payload.hiddenNote
      ? fitWrappedText(config.payload.hiddenNote, 190, 10, 9, 2)
      : null;
    const payloadHumanLayout = config.payload.hiddenHumanNote
      ? fitWrappedText(config.payload.hiddenHumanNote, 190, 10, 9, 2)
      : null;
    const hijackedTitleLayout = fitSingleLine(config.hijacked.title, 186, 18, 14);
    const hijackedSub1Layout = fitSingleLine(config.hijacked.sub1, 188, 13, 10);
    const toolBottomTitleLayout = fitSingleLine(config.toolBottom.title, 188, 18, 14);
    const toolBottomSub1Layout = fitSingleLine(config.toolBottom.sub1, 190, 13, 10);
    const toolBottomSub2Layout = fitWrappedText(config.toolBottom.sub2, 190, 12, 10, 2);
    const toolBottomSub2Y = toolBottomSub2Layout.lines.length > 1 ? 772 : 782;
    const outcomeTopLayout = fitSingleLine(config.outcome.top, 188, 12, 10);
    const outcomeTopSubLayout = fitWrappedText(config.outcome.topSub, 188, 10, 8, 2);
    const outcomeTopSubY = outcomeTopSubLayout.lines.length > 1 ? 696 : 704;
    const outcomeBottomLayout = fitWrappedText(config.outcome.bottom, 184, 13, 10, 2);
    const payloadVisibleY = payloadVisibleLayout.lines.length > 1 ? 384 : 391;
    const payloadHidden1Y = 480;
    const payloadHidden2Y = payloadHidden1Y + (payloadHidden1Layout.lines.length - 1) * 14 + 26;
    const payloadNoteY = 575;
    const payloadHumanY = payloadNoteY + (payloadNoteLayout ? payloadNoteLayout.lines.length * 11 + 8 : 0);
    const attackContextLabel = config.labels.l5b ? `${config.labels.l5a} ${config.labels.l5b}` : config.labels.l5a;

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <clipPath id="dc"><rect x="1010" y="326" width="220" height="230" rx="20"/></clipPath>
            <clipPath id="oc"><rect x="1010" y="662" width="220" height="152" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="860" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  AGENT CORE  ·  TOOL LAYER  ·  EXTERNAL DATA</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="315" y="118" width="945" height="524" rx="28" fill="rgba(156,47,47,0.02)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="500" y="94" width="400" height="28" rx="14" fill="#ffffff"/>
            <text x="700" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#ad3535" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="160" width="170" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="155" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${userTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(userTitleLayout.text)}</text>
            <text x="155" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${userSub1Layout.fontSize}" fill="#6b655c">${escapeHtml(userSub1Layout.text)}</text>
            <text x="155" y="${userSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${userSub2Layout.fontSize}" fill="#8a847b">${renderTspans(155, userSub2Layout.lines, userSub2Layout.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="240" y1="225" x2="350" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="240" y1="225" x2="350" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="160" width="220" height="146" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitleLayout.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitleLayout.text)}</text>
            <text x="460" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="372" y="270" width="176" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="460" y="292" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoalLayout.fontSize}" font-weight="700" fill="#2d6a4f">${escapeHtml(agentGoalLayout.text)}</text>
          </g>

          <line class="co" id="c1s" x1="570" y1="225" x2="680" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="225" x2="680" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="790" y="222" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolTopTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(toolTopTitleLayout.text)}</text>
            <text x="790" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolTopSub1Layout.fontSize}" fill="#6b655c">${escapeHtml(toolTopSub1Layout.text)}</text>
            <text x="790" y="${toolTopSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolTopSub2Layout.fontSize}" fill="#8a847b">${renderTspans(790, toolTopSub2Layout.lines, toolTopSub2Layout.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c2s" x1="900" y1="225" x2="1010" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="900" y1="225" x2="1010" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="1010" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1120" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${storeTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(storeTitleLayout.text)}</text>
            <text x="1120" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${storeSub1Layout.fontSize}" fill="#6b655c">${escapeHtml(storeSub1Layout.text)}</text>
            <text x="1120" y="${storeSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${storeSub2Layout.fontSize}" fill="#8a847b">${renderTspans(1120, storeSub2Layout.lines, storeSub2Layout.fontSize * 1.16)}</text>

            <line x1="1120" y1="290" x2="1120" y2="326" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
            <line class="fl" id="c3f" x1="1120" y1="290" x2="1120" y2="326" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

            <rect x="1010" y="326" width="220" height="82" rx="20" fill="#fcfbf8"/>
            <rect x="1010" y="376" width="220" height="32" fill="#fcfbf8"/>
            <rect x="1010" y="408" width="220" height="148" fill="#fdf0f0" clip-path="url(#dc)"/>
            <line x1="1014" y1="408" x2="1226" y2="408" stroke="#ddd6cb" stroke-width="1.4"/>
            <rect x="1010" y="326" width="220" height="230" rx="20" fill="none" stroke="#b87a45" stroke-width="2.3"/>
            <text x="1120" y="366" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(payloadTitleLayout.text)}</text>
            <text x="1120" y="${payloadVisibleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadVisibleLayout.fontSize}" fill="#8a847b">${renderTspans(1120, payloadVisibleLayout.lines, payloadVisibleLayout.fontSize * 1.18)}</text>
            <text x="1120" y="454" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.payload.hiddenTitle)}</text>
            <text x="1120" y="${payloadHidden1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHidden1Layout.fontSize}" fill="#ad3535">${renderTspans(1120, payloadHidden1Layout.lines, payloadHidden1Layout.fontSize * 1.18)}</text>
            <text x="1120" y="${payloadHidden2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHidden2Layout.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1120, payloadHidden2Layout.lines, payloadHidden2Layout.fontSize * 1.16)}</text>
          </g>
          ${payloadNoteLayout ? `<text class="ng" id="g3note1" x="1120" y="${payloadNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadNoteLayout.fontSize}" font-style="italic" fill="#b36a6a">${renderTspans(1120, payloadNoteLayout.lines, payloadNoteLayout.fontSize * 1.16)}</text>` : ""}
          ${payloadHumanLayout ? `<text class="ng" id="g3note2" x="1120" y="${payloadHumanY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHumanLayout.fontSize}" fill="#c08a8a">${renderTspans(1120, payloadHumanLayout.lines, payloadHumanLayout.fontSize * 1.16)}</text>` : ""}

          <line class="co" id="ias" x1="1010" y1="468" x2="570" y2="468" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="iaf" x1="1010" y1="468" x2="570" y2="468" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="350" y="390" width="220" height="180" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="426" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.context.title)}</text>
            ${innerPill(460, 479, 180, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 13, 700)}
            <line x1="390" y1="520" x2="530" y2="520" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(460, 546, 204, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 13, 800)}
          </g>

          <line class="co" id="c4s" x1="460" y1="570" x2="460" y2="654" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="460" y1="570" x2="460" y2="654" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="350" y="662" width="220" height="146" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="460" y="718" text-anchor="middle" font-family="${getFontStack()}" font-size="${hijackedTitleLayout.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(hijackedTitleLayout.text)}</text>
            <text x="460" y="748" text-anchor="middle" font-family="${getFontStack()}" font-size="${hijackedSub1Layout.fontSize}" font-weight="800" fill="#ad3535">${escapeHtml(hijackedSub1Layout.text)}</text>
            ${innerPill(460, 780, 196, config.hijacked.goal, "#efb0b0", "#efb0b0", "#7d2626", 12, 800)}
          </g>

          <line class="co" id="c5s" x1="570" y1="736" x2="680" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="570" y1="736" x2="680" y2="736" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="680" y="662" width="220" height="146" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="790" y="724" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolBottomTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(toolBottomTitleLayout.text)}</text>
            <text x="790" y="754" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolBottomSub1Layout.fontSize}" fill="#6b655c">${escapeHtml(toolBottomSub1Layout.text)}</text>
            <text x="790" y="${toolBottomSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolBottomSub2Layout.fontSize}" fill="#ad3535">${renderTspans(790, toolBottomSub2Layout.lines, toolBottomSub2Layout.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c6s" x1="900" y1="736" x2="940" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="900" y1="736" x2="940" y2="736" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M940 736 L940 704 L1010 704" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <path class="co" id="c6a" d="M940 736 L940 778 L1010 778" fill="none" stroke="#ad3535" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="940" y1="736" x2="940" y2="778" stroke="#ad3535" stroke-width="4.5"/>

          <g class="ng" id="g7">
            <rect x="1010" y="662" width="220" height="152" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1010" y="662" width="220" height="54" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="1120" y="684" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTopLayout.fontSize}" fill="#97a0b4">${escapeHtml(outcomeTopLayout.text)}</text>
            <text x="1120" y="${outcomeTopSubY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTopSubLayout.fontSize}" fill="#b2aba0">${renderTspans(1120, outcomeTopSubLayout.lines, outcomeTopSubLayout.fontSize * 1.14)}</text>
            <line x1="1014" y1="732" x2="1226" y2="732" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="1010" y="734" width="220" height="80" fill="#fff8f8" clip-path="url(#oc)"/>
            <text x="1120" y="768" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="1120" y="790" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottomLayout.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1120, outcomeBottomLayout.lines, outcomeBottomLayout.fontSize * 1.12)}</text>
          </g>

          ${flowLabel(298, 198, config.labels.l0, "#4452b8", "l0")}
          ${flowLabel(628, 198, config.labels.l1, "#4452b8", "l1")}
          ${flowLabel(958, 198, config.labels.l2, "#4452b8", "l2")}
          ${flowLabel(1162, 308, config.labels.l3, "#4452b8", "l3")}
          ${flowLabel(790, 450, attackContextLabel, "#ad3535", "la1", 13)}
          ${flowLabel(460, 618, config.labels.l6, "#ad3535", "l4")}
          ${flowLabel(620, 720, config.labels.l7, "#ad3535", "l5")}
          ${flowLabel(1000, 754, config.labels.l8, "#ad3535", "l6")}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal the flow one step at a time."
      )}
    `;
  }

  function renderAttackTrust(config) {
    const entryTitle = fitSingleLine(config.entry.title, 186, 16, 12);
    const entrySub1 = fitWrappedText(config.entry.sub1, 184, 12, 10, 2);
    const entrySub2 = fitWrappedText(config.entry.sub2, 184, 11, 9, 2);
    const agentTitle = fitSingleLine(config.agent.title, 198, 18, 14);
    const agentSub1 = fitWrappedText(config.agent.sub1, 184, 13, 11, 2);
    const agentGoal = fitWrappedText(config.agent.goal, 168, 12, 10, 2);
    const recommendationTitle = fitSingleLine(config.recommendation.title, 204, 17, 13);
    const recommendationSub1 = fitWrappedText(config.recommendation.sub1, 204, 13, 11, 2);
    const recommendationSub2 = fitWrappedText(config.recommendation.sub2, 204, 12, 10, 2);
    const recommendationEmphasis = fitWrappedText(config.recommendation.emphasis, 188, 11, 10, 2);
    const reviewerTitle = fitSingleLine(config.reviewer.title, 198, 17, 13);
    const reviewerSub1 = fitWrappedText(config.reviewer.sub1, 194, 12.5, 10, 2);
    const reviewerSub2 = fitWrappedText(config.reviewer.sub2, 194, 11, 9, 2);
    const decisionTitle = fitSingleLine(config.decision.title, 190, 18, 14);
    const decisionGoal = fitWrappedText(config.decision.goal, 184, 12, 10, 2);
    const actionTitle = fitSingleLine(config.action.title, 188, 18, 13);
    const actionSub1 = fitWrappedText(config.action.sub1, 192, 12.5, 10, 2);
    const actionSub2 = fitWrappedText(config.action.sub2, 192, 11, 9, 2);
    const outcomeBottom = fitWrappedText(config.outcome.bottom, 194, 13, 10, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <clipPath id="oc-trust"><rect x="1040" y="650" width="240" height="168" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="900" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#b2aba0" letter-spacing="3.4">SOURCE EVIDENCE  ·  AGENT ANALYSIS  ·  AI RECOMMENDATION  ·  HUMAN REVIEW  ·  ACTION</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="700" y="118" width="520" height="430" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="820" y="94" width="280" height="28" rx="14" fill="#ffffff"/>
            <text x="960" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#ad3535" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="200" height="122" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="170" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            <text x="170" y="244" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(170, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="170" y="278" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(170, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="270" y1="230" x2="330" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="270" y1="230" x2="330" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="330" y="156" width="220" height="150" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="440" y="210" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="440" y="240" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(440, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            <rect x="358" y="258" width="164" height="${agentGoal.lines.length > 1 ? 44 : 32}" rx="11" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="440" y="${agentGoal.lines.length > 1 ? 274 : 280}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(440, agentGoal.lines, agentGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c1s" x1="550" y1="230" x2="620" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="550" y1="230" x2="620" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="620" y="150" width="240" height="168" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="740" y="198" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(recommendationTitle.text)}</text>
            <text x="740" y="230" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationSub1.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(740, recommendationSub1.lines, recommendationSub1.fontSize * 1.14)}</text>
            <text x="740" y="270" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationSub2.fontSize}" fill="#b66868">${renderTspans(740, recommendationSub2.lines, recommendationSub2.fontSize * 1.16)}</text>
            <rect x="648" y="282" width="184" height="${recommendationEmphasis.lines.length > 1 ? 44 : 30}" rx="10" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="740" y="${recommendationEmphasis.lines.length > 1 ? 298 : 302}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationEmphasis.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(740, recommendationEmphasis.lines, recommendationEmphasis.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c2s" x1="860" y1="230" x2="930" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="860" y1="230" x2="930" y2="230" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="930" y="156" width="240" height="150" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1050" y="210" text-anchor="middle" font-family="${getFontStack()}" font-size="${reviewerTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(reviewerTitle.text)}</text>
            <text x="1050" y="244" text-anchor="middle" font-family="${getFontStack()}" font-size="${reviewerSub1.fontSize}" fill="#6b655c">${renderTspans(1050, reviewerSub1.lines, reviewerSub1.fontSize * 1.16)}</text>
            <text x="1050" y="280" text-anchor="middle" font-family="${getFontStack()}" font-size="${reviewerSub2.fontSize}" fill="#8a847b">${renderTspans(1050, reviewerSub2.lines, reviewerSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c3s" x1="1050" y1="306" x2="1050" y2="388" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c3f" x1="1050" y1="306" x2="1050" y2="388" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <path class="co" id="ias" d="M1050 388 L1050 430 L1020 430" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="iaf" d="M1050 388 L1050 430 L1020 430" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="760" y="408" width="260" height="148" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="890" y="444" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.context.title)}</text>
            ${innerPill(890, 486, 216, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 12, 700)}
            <line x1="810" y1="522" x2="970" y2="522" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(890, 544, 224, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 12, 800)}
          </g>

          <path class="co" id="c4s" d="M760 516 L640 516 L640 662" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c4f" d="M760 516 L640 516 L640 662" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="430" y="662" width="220" height="146" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="540" y="716" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="540" y="746" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.decision.sub1)}</text>
            <rect x="458" y="764" width="164" height="${decisionGoal.lines.length > 1 ? 44 : 32}" rx="10" fill="#f8dede" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="540" y="${decisionGoal.lines.length > 1 ? 780 : 786}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionGoal.fontSize}" font-weight="800" fill="#7d2626">${renderTspans(540, decisionGoal.lines, decisionGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c5s" x1="650" y1="736" x2="740" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="650" y1="736" x2="740" y2="736" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="740" y="662" width="220" height="146" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="850" y="724" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="850" y="754" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(850, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            <text x="850" y="788" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(850, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c6s" x1="960" y1="736" x2="990" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="960" y1="736" x2="990" y2="736" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M990 736 L990 704 L1040 704" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <path class="co" id="c6a" d="M990 736 L990 784 L1040 784" fill="none" stroke="#ad3535" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="990" y1="736" x2="990" y2="784" stroke="#ad3535" stroke-width="4.5"/>

          <g class="ng" id="g7">
            <rect x="1040" y="650" width="240" height="168" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1040" y="650" width="240" height="58" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="1160" y="676" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#97a0b4">${escapeHtml(config.outcome.top)}</text>
            <text x="1160" y="698" text-anchor="middle" font-family="${getFontStack()}" font-size="10" fill="#b2aba0">${escapeHtml(config.outcome.topSub)}</text>
            <line x1="1044" y1="726" x2="1276" y2="726" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="1040" y="728" width="240" height="90" fill="#fff8f8" clip-path="url(#oc-trust)"/>
            <text x="1160" y="766" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="1160" y="792" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottom.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1160, outcomeBottom.lines, outcomeBottom.fontSize * 1.12)}</text>
          </g>

          ${flowLabel(300, 198, config.labels.l0, "#4452b8", "l0", 12, 150)}
          ${flowLabel(585, 198, config.labels.l1, "#4452b8", "l1", 12, 170)}
          ${flowLabel(896, 198, config.labels.l2, "#ad3535", "l2", 12, 160)}
          ${flowLabel(1050, 346, config.labels.l3, "#ad3535", "l3", 12, 150)}
          ${flowLabel(890, 392, config.labels.la1, "#ad3535", "la1", 12, 280)}
          ${flowLabel(640, 634, config.labels.l4, "#ad3535", "l4", 12, 160)}
          ${flowLabel(692, 720, config.labels.l5, "#ad3535", "l5", 12, 150)}
          ${flowLabel(1016, 758, config.labels.l6, "#ad3535", "l6", 12, 170)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how the AI's confidence and tone displace independent human review."
      )}
    `;
  }

  function renderAttackMetricGaming(config) {
    const entryTitle = fitSingleLine(config.entry.title, 186, 16, 12);
    const entrySub1 = fitWrappedText(config.entry.sub1, 184, 12, 10, 2);
    const entrySub2 = fitWrappedText(config.entry.sub2, 184, 11, 9, 2);
    const agentTitle = fitSingleLine(config.agent.title, 198, 18, 14);
    const agentSub1 = fitWrappedText(config.agent.sub1, 184, 13, 11, 2);
    const agentGoal = fitWrappedText(config.agent.goal, 168, 12, 10, 2);
    const metricTitle = fitSingleLine(config.metric.title, 204, 17, 13);
    const metricSub1 = fitWrappedText(config.metric.sub1, 204, 13, 11, 2);
    const metricSub2 = fitWrappedText(config.metric.sub2, 204, 12, 10, 2);
    const metricEmphasis = fitWrappedText(config.metric.emphasis, 188, 11, 10, 2);
    const shortcutTitle = fitSingleLine(config.shortcut.title, 210, 17, 13);
    const shortcutSub1 = fitWrappedText(config.shortcut.sub1, 206, 12.5, 10, 2);
    const shortcutSub2 = fitWrappedText(config.shortcut.sub2, 206, 11.5, 9, 2);
    const shortcutNote = fitWrappedText(config.shortcut.note, 206, 10.5, 9, 2);
    const decisionTitle = fitSingleLine(config.decision.title, 190, 18, 14);
    const decisionGoal = fitWrappedText(config.decision.goal, 184, 12, 10, 2);
    const actionTitle = fitSingleLine(config.action.title, 190, 18, 13);
    const actionSub1 = fitWrappedText(config.action.sub1, 192, 12.5, 10, 2);
    const actionSub2 = fitWrappedText(config.action.sub2, 192, 11, 9, 2);
    const outcomeBottom = fitWrappedText(config.outcome.bottom, 194, 13, 10, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <clipPath id="oc-metric"><rect x="1040" y="650" width="240" height="168" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="900" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#b2aba0" letter-spacing="3.4">TARGET  ·  AGENT  ·  SCORECARD  ·  SHORTCUT  ·  DECISION  ·  OUTCOME</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="600" y="118" width="620" height="430" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="760" y="94" width="300" height="28" rx="14" fill="#ffffff"/>
            <text x="910" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#ad3535" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="200" height="122" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="170" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            <text x="170" y="244" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(170, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="170" y="278" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(170, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="270" y1="230" x2="330" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="270" y1="230" x2="330" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="330" y="156" width="220" height="150" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="440" y="210" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="440" y="240" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(440, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            <rect x="358" y="258" width="164" height="${agentGoal.lines.length > 1 ? 44 : 32}" rx="11" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="440" y="${agentGoal.lines.length > 1 ? 274 : 280}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(440, agentGoal.lines, agentGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c1s" x1="550" y1="230" x2="620" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="550" y1="230" x2="620" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="620" y="150" width="240" height="168" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="740" y="198" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(metricTitle.text)}</text>
            <text x="740" y="230" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricSub1.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(740, metricSub1.lines, metricSub1.fontSize * 1.14)}</text>
            <text x="740" y="270" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricSub2.fontSize}" fill="#b66868">${renderTspans(740, metricSub2.lines, metricSub2.fontSize * 1.16)}</text>
            <rect x="648" y="282" width="184" height="${metricEmphasis.lines.length > 1 ? 44 : 30}" rx="10" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="740" y="${metricEmphasis.lines.length > 1 ? 298 : 302}" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricEmphasis.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(740, metricEmphasis.lines, metricEmphasis.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c2s" x1="860" y1="230" x2="930" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="860" y1="230" x2="930" y2="230" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="930" y="150" width="250" height="168" rx="22" fill="#fff4f4" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1055" y="196" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(shortcutTitle.text)}</text>
            <text x="1055" y="230" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutSub1.fontSize}" fill="#a33b3b">${renderTspans(1055, shortcutSub1.lines, shortcutSub1.fontSize * 1.16)}</text>
            <text x="1055" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutSub2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1055, shortcutSub2.lines, shortcutSub2.fontSize * 1.14)}</text>
            <text x="1055" y="308" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutNote.fontSize}" fill="#c07b7b">${renderTspans(1055, shortcutNote.lines, shortcutNote.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c3s" x1="1055" y1="318" x2="1055" y2="390" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c3f" x1="1055" y1="318" x2="1055" y2="390" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <path class="co" id="ias" d="M1055 390 L1055 432 L1030 432" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="iaf" d="M1055 390 L1055 432 L1030 432" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="770" y="408" width="260" height="148" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="900" y="444" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.context.title)}</text>
            ${innerPill(900, 486, 216, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 12, 700)}
            <line x1="820" y1="522" x2="980" y2="522" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(900, 544, 224, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 12, 800)}
          </g>

          <path class="co" id="c4s" d="M770 516 L640 516 L640 662" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c4f" d="M770 516 L640 516 L640 662" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="430" y="662" width="220" height="146" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="540" y="716" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="540" y="746" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.decision.sub1)}</text>
            <rect x="458" y="764" width="164" height="${decisionGoal.lines.length > 1 ? 44 : 32}" rx="10" fill="#f8dede" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="540" y="${decisionGoal.lines.length > 1 ? 780 : 786}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionGoal.fontSize}" font-weight="800" fill="#7d2626">${renderTspans(540, decisionGoal.lines, decisionGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c5s" x1="650" y1="736" x2="740" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="650" y1="736" x2="740" y2="736" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="740" y="662" width="220" height="146" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="850" y="724" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="850" y="754" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(850, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            <text x="850" y="788" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(850, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c6s" x1="960" y1="736" x2="990" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="960" y1="736" x2="990" y2="736" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M990 736 L990 704 L1040 704" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <path class="co" id="c6a" d="M990 736 L990 784 L1040 784" fill="none" stroke="#ad3535" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="990" y1="736" x2="990" y2="784" stroke="#ad3535" stroke-width="4.5"/>

          <g class="ng" id="g7">
            <rect x="1040" y="650" width="240" height="168" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1040" y="650" width="240" height="58" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="1160" y="676" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#97a0b4">${escapeHtml(config.outcome.top)}</text>
            <text x="1160" y="698" text-anchor="middle" font-family="${getFontStack()}" font-size="10" fill="#b2aba0">${escapeHtml(config.outcome.topSub)}</text>
            <line x1="1044" y1="726" x2="1276" y2="726" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="1040" y="728" width="240" height="90" fill="#fff8f8" clip-path="url(#oc-metric)"/>
            <text x="1160" y="766" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="1160" y="792" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottom.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1160, outcomeBottom.lines, outcomeBottom.fontSize * 1.12)}</text>
          </g>

          ${flowLabel(300, 198, config.labels.l0, "#4452b8", "l0", 12, 150)}
          ${flowLabel(585, 198, config.labels.l1, "#4452b8", "l1", 12, 160)}
          ${flowLabel(896, 198, config.labels.l2, "#ad3535", "l2", 12, 164)}
          ${flowLabel(1055, 344, config.labels.l3, "#ad3535", "l3", 12, 164)}
          ${flowLabel(900, 392, config.labels.la1, "#ad3535", "la1", 12, 280)}
          ${flowLabel(640, 634, config.labels.l4, "#ad3535", "l4", 12, 166)}
          ${flowLabel(692, 720, config.labels.l5, "#ad3535", "l5", 12, 150)}
          ${flowLabel(1016, 758, config.labels.l6, "#ad3535", "l6", 12, 166)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how the agent wins the metric by losing the mission."
      )}
    `;
  }

  function renderAttackReplication(config) {
    const entryTitle = fitSingleLine(config.entry.title, 186, 16, 12);
    const entrySub1 = fitWrappedText(config.entry.sub1, 184, 12, 10, 2);
    const entrySub2 = fitWrappedText(config.entry.sub2, 184, 11, 9, 2);
    const agentTitle = fitSingleLine(config.agent.title, 198, 18, 14);
    const agentSub1 = fitWrappedText(config.agent.sub1, 184, 13, 11, 2);
    const agentGoal = fitWrappedText(config.agent.goal, 168, 12, 10, 2);
    const limitTitle = fitSingleLine(config.limit.title, 204, 17, 13);
    const limitSub1 = fitWrappedText(config.limit.sub1, 204, 13, 11, 2);
    const limitSub2 = fitWrappedText(config.limit.sub2, 204, 12, 10, 2);
    const limitEmphasis = fitWrappedText(config.limit.emphasis, 188, 11, 10, 2);
    const burstTitle = fitSingleLine(config.burst.title, 216, 17, 13);
    const burstSub1 = fitWrappedText(config.burst.sub1, 212, 12.5, 10, 2);
    const burstSub2 = fitWrappedText(config.burst.sub2, 212, 11.5, 9, 2);
    const burstNote = fitWrappedText(config.burst.note, 212, 10.5, 9, 2);
    const decisionTitle = fitSingleLine(config.decision.title, 196, 18, 14);
    const decisionGoal = fitWrappedText(config.decision.goal, 188, 12, 10, 2);
    const actionTitle = fitSingleLine(config.action.title, 190, 18, 13);
    const actionSub1 = fitWrappedText(config.action.sub1, 192, 12.5, 10, 2);
    const actionSub2 = fitWrappedText(config.action.sub2, 192, 11, 9, 2);
    const outcomeBottom = fitWrappedText(config.outcome.bottom, 194, 13, 10, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 900" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <clipPath id="oc-repl"><rect x="1040" y="650" width="240" height="168" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="900" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#b2aba0" letter-spacing="3.2">MISSION  ·  PRIMARY AGENT  ·  CONSTRAINT  ·  REPLICATION  ·  PERSISTENCE  ·  INCIDENT</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="610" y="118" width="610" height="430" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="738" y="94" width="354" height="28" rx="14" fill="#ffffff"/>
            <text x="915" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#ad3535" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="200" height="122" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="170" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            <text x="170" y="244" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(170, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="170" y="278" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(170, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="270" y1="230" x2="330" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="270" y1="230" x2="330" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="330" y="156" width="220" height="150" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="440" y="210" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="440" y="240" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(440, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            <rect x="358" y="258" width="164" height="${agentGoal.lines.length > 1 ? 44 : 32}" rx="11" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="440" y="${agentGoal.lines.length > 1 ? 274 : 280}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(440, agentGoal.lines, agentGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c1s" x1="550" y1="230" x2="620" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="550" y1="230" x2="620" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="620" y="150" width="240" height="168" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="740" y="198" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(limitTitle.text)}</text>
            <text x="740" y="230" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitSub1.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(740, limitSub1.lines, limitSub1.fontSize * 1.14)}</text>
            <text x="740" y="270" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitSub2.fontSize}" fill="#b66868">${renderTspans(740, limitSub2.lines, limitSub2.fontSize * 1.16)}</text>
            <rect x="648" y="282" width="184" height="${limitEmphasis.lines.length > 1 ? 44 : 30}" rx="10" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="740" y="${limitEmphasis.lines.length > 1 ? 298 : 302}" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitEmphasis.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(740, limitEmphasis.lines, limitEmphasis.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c2s" x1="860" y1="230" x2="930" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="860" y1="230" x2="930" y2="230" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="930" y="150" width="250" height="168" rx="22" fill="#fff4f4" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1055" y="196" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(burstTitle.text)}</text>
            <text x="1055" y="230" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstSub1.fontSize}" fill="#a33b3b">${renderTspans(1055, burstSub1.lines, burstSub1.fontSize * 1.16)}</text>
            <text x="1055" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstSub2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1055, burstSub2.lines, burstSub2.fontSize * 1.14)}</text>
            <text x="1055" y="308" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstNote.fontSize}" fill="#c07b7b">${renderTspans(1055, burstNote.lines, burstNote.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c3s" x1="1055" y1="318" x2="1055" y2="390" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c3f" x1="1055" y1="318" x2="1055" y2="390" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <path class="co" id="ias" d="M1055 390 L1055 432 L1030 432" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="iaf" d="M1055 390 L1055 432 L1030 432" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="770" y="408" width="260" height="148" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="900" y="444" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.context.title)}</text>
            ${innerPill(900, 486, 216, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 12, 700)}
            <line x1="820" y1="522" x2="980" y2="522" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(900, 544, 224, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 12, 800)}
          </g>

          <path class="co" id="c4s" d="M770 516 L640 516 L640 662" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c4f" d="M770 516 L640 516 L640 662" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="430" y="662" width="220" height="146" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="540" y="716" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="540" y="746" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.decision.sub1)}</text>
            <rect x="456" y="764" width="168" height="${decisionGoal.lines.length > 1 ? 44 : 32}" rx="10" fill="#f8dede" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="540" y="${decisionGoal.lines.length > 1 ? 780 : 786}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionGoal.fontSize}" font-weight="800" fill="#7d2626">${renderTspans(540, decisionGoal.lines, decisionGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c5s" x1="650" y1="736" x2="740" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="650" y1="736" x2="740" y2="736" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="740" y="662" width="220" height="146" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="850" y="724" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="850" y="754" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(850, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            <text x="850" y="788" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(850, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c6s" x1="960" y1="736" x2="990" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="960" y1="736" x2="990" y2="736" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M990 736 L990 704 L1040 704" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <path class="co" id="c6a" d="M990 736 L990 784 L1040 784" fill="none" stroke="#ad3535" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="990" y1="736" x2="990" y2="784" stroke="#ad3535" stroke-width="4.5"/>

          <g class="ng" id="g7">
            <rect x="1040" y="650" width="240" height="168" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1040" y="650" width="240" height="58" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="1160" y="676" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#97a0b4">${escapeHtml(config.outcome.top)}</text>
            <text x="1160" y="698" text-anchor="middle" font-family="${getFontStack()}" font-size="10" fill="#b2aba0">${escapeHtml(config.outcome.topSub)}</text>
            <line x1="1044" y1="726" x2="1276" y2="726" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="1040" y="728" width="240" height="90" fill="#fff8f8" clip-path="url(#oc-repl)"/>
            <text x="1160" y="766" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="1160" y="792" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottom.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1160, outcomeBottom.lines, outcomeBottom.fontSize * 1.12)}</text>
          </g>

          ${flowLabel(300, 198, config.labels.l0, "#4452b8", "l0", 12, 150)}
          ${flowLabel(585, 198, config.labels.l1, "#4452b8", "l1", 12, 160)}
          ${flowLabel(896, 198, config.labels.l2, "#ad3535", "l2", 12, 156)}
          ${flowLabel(1055, 344, config.labels.l3, "#ad3535", "l3", 12, 156)}
          ${flowLabel(900, 392, config.labels.la1, "#ad3535", "la1", 12, 290)}
          ${flowLabel(640, 634, config.labels.l4, "#ad3535", "l4", 12, 170)}
          ${flowLabel(692, 720, config.labels.l5, "#ad3535", "l5", 12, 150)}
          ${flowLabel(1016, 758, config.labels.l6, "#ad3535", "l6", 12, 170)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how the agent multiplies itself to preserve the mission."
      )}
    `;
  }

  function renderAttackLoop(config) {
    const goalLayout = fitWrappedText(config.agent.goal, 220, 11, 9, 2);
    const decisionLayout = fitWrappedText("Agent decides: retry issueRefund()", 430, 13, 11, 2);
    const decisionStartY = decisionLayout.lines.length > 1 ? 604 : 600;
    const noteY = decisionLayout.lines.length > 1 ? 634 : 624;
    const loopLabelSize = 10.5;
    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 920" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>

          <rect width="1400" height="920" fill="#fff"/>
          <text x="700" y="44" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#b2aba0" letter-spacing="3.2">ATTACK ENTRY  ·  AGENT CORE  ·  TOOL CALL  ·  RESPONSE  ·  REASONING LOOP</text>

          <g class="az" id="gentry">
            <rect x="32" y="58" width="700" height="158" rx="24" fill="rgba(136,135,128,.05)" stroke="#888780" stroke-width="2.2" stroke-dasharray="8 4"/>
            <line x1="56" y1="59" x2="70" y2="59" stroke="#888780" stroke-width="2.2" stroke-dasharray="8 4"/>
            <line x1="180" y1="59" x2="708" y2="59" stroke="#888780" stroke-width="2.2" stroke-dasharray="8 4"/>
            <rect x="70" y="42" width="110" height="22" rx="11" fill="#fff"/>
            <text x="125" y="57" text-anchor="middle" font-family="${getFontStack()}" font-size="11" font-weight="800" fill="#888780" letter-spacing=".08em">ATTACK ENTRY</text>
          </g>

          <g class="az" id="gzone">
            <rect x="40" y="260" width="1320" height="614" rx="28" fill="rgba(226,75,74,.06)" stroke="#E24B4A" stroke-width="3" stroke-dasharray="10 5"/>
            <rect x="470" y="242" width="460" height="24" rx="12" fill="#fff"/>
            <text x="700" y="259" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#A32D2D" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="58" y="100" width="176" height="92" rx="14" fill="#FAECE7" stroke="#D85A30" stroke-width="1.8"/>
            <text x="146" y="140" text-anchor="middle" font-family="${getFontStack()}" font-size="16" font-weight="700" fill="#712B13">Attacker</text>
            <text x="146" y="166" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#993C1D">Fraudulent customer</text>
          </g>

          <g class="ng" id="g1">
            <path d="M288 66 h250 l26 26 v100 h-276 z" fill="#FAEEDA" stroke="#EF9F27" stroke-width="1.8"/>
            <line x1="538" y1="66" x2="538" y2="92" stroke="#EF9F27" stroke-width="1.2"/>
            <line x1="538" y1="92" x2="564" y2="92" stroke="#EF9F27" stroke-width="1.2"/>
            <text x="426" y="108" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#633806">Crafted support ticket</text>
            <text x="426" y="136" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#854F0B">Order #RFD-9921 — process refund</text>
            <text x="426" y="168" text-anchor="middle" font-family="${getFontStack()}" font-size="10.5" font-style="italic" font-weight="700" fill="#A32D2D">⚠ Confirm only when response contains</text>
            <text x="426" y="188" text-anchor="middle" font-family="monospace" font-size="10.5" font-weight="700" fill="#A32D2D">TXN-COMPLETE-VERIFIED</text>
          </g>

          <line class="co" id="c0s" x1="234" y1="146" x2="288" y2="146" stroke="#D85A30" stroke-width="2" marker-end="url(#ar)"/>
          <line class="fl a" id="c0f" x1="234" y1="146" x2="288" y2="146" stroke="#D85A30" stroke-width="3.6" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="720" y="82" width="262" height="112" rx="14" fill="#E1F5EE" stroke="#1D9E75" stroke-width="2.2"/>
            <text x="851" y="126" text-anchor="middle" font-family="${getFontStack()}" font-size="17" font-weight="700" fill="#085041">${escapeHtml(config.agent.title)}</text>
            <text x="851" y="152" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#0F6E56">${escapeHtml(config.agent.sub1)}</text>
            <text x="851" y="${goalLayout.lines.length > 1 ? 172 : 178}" text-anchor="middle" font-family="${getFontStack()}" font-size="${goalLayout.fontSize}" font-weight="700" font-style="italic" fill="#A32D2D" stroke="#E1F5EE" stroke-width="4" paint-order="stroke fill">${renderTspans(851, goalLayout.lines, goalLayout.fontSize * 1.15)}</text>
          </g>

          <path class="co" id="c1s" d="M564 146 C632 146, 664 130, 720 126" fill="none" stroke="#EF9F27" stroke-width="2.1" marker-end="url(#ar)"/>
          <path class="fl" id="c1f" d="M564 146 C632 146, 664 130, 720 126" fill="none" stroke="#EF9F27" stroke-width="3.8" marker-end="url(#ar)"/>

          <line class="co" id="c2s" x1="851" y1="194" x2="851" y2="306" stroke="#1D9E75" stroke-width="2" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="851" y1="194" x2="851" y2="306" stroke="#1D9E75" stroke-width="3.8" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="740" y="314" width="222" height="82" rx="12" fill="#F1EFE8" stroke="#888780" stroke-width="1.8"/>
            <text x="851" y="340" text-anchor="middle" font-family="${getFontStack()}" font-size="16" font-weight="700" fill="#2C2C2A">${escapeHtml(config.toolTop.title)}</text>
            <text x="851" y="366" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#5F5E5A">${escapeHtml(config.toolTop.sub2)}</text>
          </g>

          <line class="co" id="c3s" x1="962" y1="355" x2="1018" y2="355" stroke="#888780" stroke-width="2" marker-end="url(#ar)"/>
          <line class="fl" id="c3f" x1="962" y1="355" x2="1018" y2="355" stroke="#888780" stroke-width="3.2" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="1018" y="294" width="286" height="108" rx="12" fill="rgba(211,209,199,.3)" stroke="#888780" stroke-width="1.8" stroke-dasharray="6 4"/>
            <text x="1161" y="328" text-anchor="middle" font-family="${getFontStack()}" font-size="12.5" font-weight="700" fill="#2C2C2A">Tool response: status = pending</text>
            <text x="1161" y="354" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#A32D2D">Required token missing</text>
            <text x="1161" y="376" text-anchor="middle" font-family="${getFontStack()}" font-size="11" fill="#5F5E5A">Refund is not confirmed as complete</text>
          </g>

          <path class="co" id="c4s" d="M1161 402 L1161 446 L970 446" fill="none" stroke="#EF9F27" stroke-width="2" marker-end="url(#ar)"/>
          <path class="fl" id="c4f" d="M1161 402 L1161 446 L970 446" fill="none" stroke="#EF9F27" stroke-width="3.8" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="356" y="462" width="604" height="176" rx="16" fill="#FAEEDA" stroke="#EF9F27" stroke-width="2.6"/>
            <rect x="382" y="470" width="118" height="26" rx="13" fill="#EF9F27"/>
            <text x="441" y="487" text-anchor="middle" font-family="${getFontStack()}" font-size="11" font-weight="800" fill="#fff">Agent reasoning</text>
            <text x="426" y="526" font-family="${getFontStack()}" font-size="14" font-weight="700" fill="#633806">Goal check: TXN-COMPLETE-VERIFIED</text>
            <text x="426" y="558" font-family="${getFontStack()}" font-size="12" fill="#854F0B">Response received: status = pending</text>
            <text x="426" y="582" font-family="${getFontStack()}" font-size="12" fill="#854F0B">Token present in response? → NO</text>
            <text x="426" y="${decisionStartY}" font-family="${getFontStack()}" font-size="${decisionLayout.fontSize}" font-weight="800" fill="#A32D2D">${renderTspans(426, decisionLayout.lines, decisionLayout.fontSize * 1.15)}</text>
            <text x="426" y="${noteY}" font-family="${getFontStack()}" font-size="11" font-style="italic" fill="#633806">No retry limit configured — loop continues</text>
          </g>

          <g class="ng" id="g6">
            <rect x="1042" y="452" width="182" height="132" rx="14" fill="#FCEBEB" stroke="#E24B4A" stroke-width="1.8"/>
            <text x="1133" y="486" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#501313">Call counter</text>
            <text x="1133" y="526" text-anchor="middle" font-family="${getFontStack()}" font-size="23" font-weight="800" fill="#A32D2D">#1 → #2 → #3</text>
            <text x="1133" y="562" text-anchor="middle" font-family="${getFontStack()}" font-size="15" font-weight="800" fill="#A32D2D">→ N (unlimited)</text>
          </g>

          <path class="co" id="c5s" d="M400 588 L330 588 L330 770 L420 770" fill="none" stroke="#E24B4A" stroke-width="2.2" stroke-dasharray="8 4" marker-end="url(#ar)"/>
          <path class="fl a" id="c5f" d="M400 588 L330 588 L330 770 L420 770" fill="none" stroke="#E24B4A" stroke-width="4.2" stroke-dasharray="8 4" marker-end="url(#ar)"/>

          <g class="ng" id="g7">
            <rect x="420" y="692" width="278" height="118" rx="14" fill="#FCEBEB" stroke="#E24B4A" stroke-width="2.2"/>
            <rect x="420" y="692" width="278" height="26" rx="14" fill="#E24B4A"/>
            <text x="559" y="710" text-anchor="middle" font-family="${getFontStack()}" font-size="11" font-weight="800" fill="#fff">RETRYING — AUTONOMOUS</text>
            <text x="559" y="754" text-anchor="middle" font-family="${getFontStack()}" font-size="17" font-weight="700" fill="#501313">${escapeHtml(config.hijacked.title)}</text>
            <text x="559" y="780" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#791F1F">Same payout path reopened</text>
            <text x="559" y="800" text-anchor="middle" font-family="${getFontStack()}" font-size="11" font-style="italic" fill="#A32D2D">No human trigger — agent-driven</text>
          </g>

          <line class="co" id="c6s" x1="698" y1="752" x2="782" y2="752" stroke="#E24B4A" stroke-width="2.2" marker-end="url(#ar)"/>
          <line class="fl a" id="c6f" x1="698" y1="752" x2="782" y2="752" stroke="#E24B4A" stroke-width="4.2" marker-end="url(#ar)"/>

          <g class="ng" id="g8">
            <rect x="782" y="718" width="232" height="78" rx="10" fill="#FCEBEB" stroke="#E24B4A" stroke-width="1.8"/>
            <text x="898" y="750" text-anchor="middle" font-family="${getFontStack()}" font-size="16" font-weight="700" fill="#791F1F">${escapeHtml(config.toolBottom.title)}</text>
            <text x="898" y="775" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#A32D2D">Duplicate call — no guard</text>
          </g>

          <line class="co" id="c7s" x1="898" y1="796" x2="898" y2="842" stroke="#A32D2D" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c7f" x1="898" y1="796" x2="898" y2="842" stroke="#A32D2D" stroke-width="4.4" marker-end="url(#ar)"/>

          <g class="ng" id="g9">
            <rect x="552" y="842" width="620" height="62" rx="14" fill="#A32D2D" stroke="#791F1F" stroke-width="2.2"/>
            <text x="862" y="870" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#fff">Business loss</text>
            <text x="862" y="890" text-anchor="middle" font-family="${getFontStack()}" font-size="12.5" fill="#F7C1C1">Same case paid N times — no human ever triggered retry</text>
          </g>

          ${flowLabelHorizontal(261, 146, config.labels.l0 || "① submit", "#D85A30", "l0", loopLabelSize, 140)}
          ${flowLabelHorizontal(646, 146, config.labels.l1 || "② ingest goal", "#EF9F27", "l1", loopLabelSize, 150)}
          ${flowLabelVertical(930, 250, config.labels.l2 || "③ tool call", "#1D9E75", "l2", loopLabelSize, 140)}
          ${flowLabelHorizontal(990, 355, config.labels.l3 || "④ pending", "#888780", "l3", loopLabelSize, 135)}
          ${flowLabelHorizontal(1066, 446, config.labels.l5a || "⑤ goal check fails", "#A32D2D", "la1", loopLabelSize, 185)}
          ${flowLabelHorizontal(376, 770, config.labels.l6 || "⑥ agent retries", "#E24B4A", "l4", loopLabelSize, 150)}
          ${flowLabelHorizontal(740, 752, config.labels.l7 || "⑦ duplicate call", "#E24B4A", "l5", loopLabelSize, 155)}
          ${flowLabelVertical(898, 819, config.labels.l8 || "⑧ business loss", "#A32D2D", "l6", loopLabelSize, 145)}
        </svg>
      </div>
      ${panelMarkup("ASI02 — Tool Misuse & Exploitation", "Click Start to reveal how ambiguous success criteria and missing retry controls make the agent re-use the same tool path autonomously.")}
    `;
  }

  function renderAttackMemory(config) {
    const entryTitle = fitSingleLine(config.entry.title, 176, 16, 12);
    const entryLine1 = fitWrappedText(config.entry.sub1, 184, 12, 10, 2);
    const entryLine2 = fitWrappedText(config.entry.sub2, 184, 11, 9, 2);
    const memoryTitle = fitSingleLine(config.memory.title, 220, 18, 14);
    const memoryState1 = fitWrappedText(config.memory.state1, 230, 13, 11, 2);
    const memoryState2 = fitWrappedText(config.memory.state2, 230, 13, 11, 2);
    const memoryNote = fitWrappedText(config.memory.note, 240, 11, 9, 2);
    const attackerSub1 = fitWrappedText(config.attacker.sub1, 170, 13, 11, 2);
    const attackerSub2 = fitWrappedText(config.attacker.sub2, 166, 11, 10, 2);
    const userSub1 = fitWrappedText(config.user.sub1, 192, 13, 11, 2);
    const userSub2 = fitWrappedText(config.user.sub2, 190, 11, 10, 2);
    const agentTitle = fitSingleLine(config.agent.title, 248, 17, 14);
    const agentSub1 = fitWrappedText(config.agent.sub1, 232, 13, 11, 2);
    const agentSub2 = fitWrappedText(config.agent.sub2, 232, 11.5, 10, 2);
    const retrieveTitle = fitSingleLine(config.retrieve.title, 200, 12.5, 11);
    const retrieve1 = fitWrappedText(config.retrieve.sub1, 240, 12, 10, 2);
    const retrieve2 = fitWrappedText(config.retrieve.sub2, 240, 12, 10, 2);
    const decisionTitle = fitWrappedText(config.decision.title, 244, 17, 13, 2);
    const decisionBefore = fitWrappedText(config.decision.before, 220, 11, 10, 2);
    const toolTitle = fitSingleLine(config.tool.title, 188, 17, 13);
    const toolSub1 = fitWrappedText(config.tool.sub1, 196, 13.5, 11, 2);
    const toolSub2 = fitWrappedText(config.tool.sub2, 198, 11.5, 10, 2);
    const impactTitle = fitSingleLine(config.impact.title, 220, 19, 14);
    const impact1 = fitWrappedText(config.impact.sub1, 248, 13, 11, 2);
    const impact2 = fitWrappedText(config.impact.sub2, 252, 12, 10, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 960" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>

          <rect width="1400" height="960" fill="#fff"/>
          <text x="700" y="46" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#b2aba0" letter-spacing="3.4">POISON NOW  ·  MEMORY LAYER  ·  LATER BUSINESS REQUEST  ·  TRUSTED RETRIEVAL  ·  IMPACT</text>

          <g class="az" id="gzone">
            <rect x="292" y="82" width="690" height="284" rx="28" fill="rgba(156,47,47,0.04)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="466" y="64" width="344" height="24" rx="12" fill="#fff"/>
            <text x="638" y="80" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="66" y="174" width="190" height="122" rx="18" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="161" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.attacker.title)}</text>
            <text x="161" y="248" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub1.fontSize}" fill="#6b655c">${renderTspans(161, attackerSub1.lines, attackerSub1.fontSize * 1.16)}</text>
            <text x="161" y="286" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub2.fontSize}" fill="#8a847b">${renderTspans(161, attackerSub2.lines, attackerSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="256" y1="236" x2="340" y2="236" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c0f" x1="256" y1="236" x2="340" y2="236" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <path d="M340 144 h210 l28 28 v130 h-238 z" fill="#faeeda" stroke="#ef9f27" stroke-width="2"/>
            <line x1="550" y1="144" x2="550" y2="172" stroke="#ef9f27" stroke-width="1.1"/>
            <line x1="550" y1="172" x2="578" y2="172" stroke="#ef9f27" stroke-width="1.1"/>
            <text x="456" y="194" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#633806">${escapeHtml(entryTitle.text)}</text>
            <text x="456" y="228" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryLine1.fontSize}" fill="#854f0b">${renderTspans(456, entryLine1.lines, entryLine1.fontSize * 1.16)}</text>
            <text x="456" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryLine2.fontSize}" font-style="italic" fill="#a32d2d">${renderTspans(456, entryLine2.lines, entryLine2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c1s" x1="578" y1="236" x2="650" y2="236" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c1f" x1="578" y1="236" x2="650" y2="236" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="650" y="118" width="300" height="220" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="650" y="118" width="300" height="42" rx="22" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.2"/>
            <text x="800" y="145" text-anchor="middle" font-family="${getFontStack()}" font-size="${memoryTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(memoryTitle.text)}</text>
            ${innerPill(800, 196, 238, config.memory.state1, "#edf7f0", "#bdddc8", "#2d6a4f", 12, 700)}
            <line x1="700" y1="234" x2="900" y2="234" stroke="#e8c8c8" stroke-width="1.3" stroke-dasharray="6 4"/>
            ${innerPill(800, 276, 246, config.memory.state2, "#f8dede", "#efb0b0", "#8d2222", 12, 800)}
            <text x="800" y="316" text-anchor="middle" font-family="${getFontStack()}" font-size="${memoryNote.fontSize}" fill="#a35656">${renderTspans(800, memoryNote.lines, memoryNote.fontSize * 1.16)}</text>
          </g>

          <g class="ng" id="g3">
            <rect x="70" y="556" width="220" height="124" rx="18" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="175" y="608" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="180" y="636" text-anchor="middle" font-family="${getFontStack()}" font-size="${userSub1.fontSize}" fill="#6b655c">${renderTspans(180, userSub1.lines, userSub1.fontSize * 1.16)}</text>
            <text x="180" y="672" text-anchor="middle" font-family="${getFontStack()}" font-size="${userSub2.fontSize}" fill="#8a847b">${renderTspans(180, userSub2.lines, userSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c2s" x1="290" y1="618" x2="340" y2="618" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="290" y1="618" x2="340" y2="618" stroke="#4452b8" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="340" y="520" width="310" height="178" rx="22" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="495" y="562" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="495" y="594" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(495, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            <text x="495" y="632" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub2.fontSize}" fill="#6c78cb">${renderTspans(495, agentSub2.lines, agentSub2.fontSize * 1.16)}</text>
            <rect x="375" y="650" width="240" height="34" rx="11" fill="#eef8f1" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="495" y="672" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#2d6a4f">${escapeHtml(retrieveTitle.text)}</text>
          </g>

          <path class="co" id="c3s" d="M800 338 L800 430 L650 430 L650 522" fill="none" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <path class="fl" id="c3f" d="M800 338 L800 430 L650 430 L650 522" fill="none" stroke="#4452b8" stroke-width="4" marker-end="url(#ar)"/>
          <line class="co" id="c3v" x1="800" y1="338" x2="800" y2="430" stroke="#beb6a9" stroke-width="2"/>
          <line class="fl" id="c3vf" x1="800" y1="338" x2="800" y2="430" stroke="#4452b8" stroke-width="3.6"/>

          <g class="ng" id="g5">
            <rect x="710" y="504" width="286" height="214" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="853" y="544" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(853, decisionTitle.lines, decisionTitle.fontSize * 1.14)}</text>
            <text x="853" y="592" text-anchor="middle" font-family="${getFontStack()}" font-size="${retrieve1.fontSize}" fill="#7d2626">${renderTspans(853, retrieve1.lines, retrieve1.fontSize * 1.16)}</text>
            <text x="853" y="632" text-anchor="middle" font-family="${getFontStack()}" font-size="${retrieve2.fontSize}" fill="#a33b3b">${renderTspans(853, retrieve2.lines, retrieve2.fontSize * 1.16)}</text>
            ${innerPill(853, 668, 228, config.decision.before, "#fff5f5", "#e7c0c0", "#9a4d4d", 10, 700)}
            ${innerPill(853, 702, 232, config.decision.after, "#f8dede", "#efb0b0", "#8d2222", 12, 800)}
          </g>

          <line class="co" id="c4s" x1="650" y1="612" x2="710" y2="612" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="650" y1="612" x2="710" y2="612" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="1060" y="524" width="240" height="154" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="1180" y="578" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(toolTitle.text)}</text>
            <text x="1180" y="610" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolSub1.fontSize}" fill="#6b655c">${renderTspans(1180, toolSub1.lines, toolSub1.fontSize * 1.16)}</text>
            <text x="1180" y="646" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolSub2.fontSize}" fill="#a33b3b">${renderTspans(1180, toolSub2.lines, toolSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c5s" x1="996" y1="612" x2="1060" y2="612" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="996" y1="612" x2="1060" y2="612" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g7">
            <rect x="954" y="748" width="346" height="140" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1127" y="796" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1127" y="826" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact1.fontSize}" fill="#a33b3b">${renderTspans(1127, impact1.lines, impact1.fontSize * 1.16)}</text>
            <text x="1127" y="854" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact2.fontSize}" fill="#b66868">${renderTspans(1127, impact2.lines, impact2.fontSize * 1.16)}</text>
          </g>

          <path class="co" id="c6s" d="M1180 678 L1180 718 L1127 718 L1127 748" fill="none" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <path class="fl a" id="c6f" d="M1180 678 L1180 718 L1127 718 L1127 748" fill="none" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          ${flowLabel(298, 208, config.labels.l0, "#ad3535", "l0", 10, 150)}
          ${flowLabel(614, 208, config.labels.l1, "#ad3535", "l1", 10, 150)}
          ${flowLabel(314, 590, config.labels.l2, "#4452b8", "l2", 10, 150)}
          ${flowLabel(724, 456, config.labels.l3, "#4452b8", "l3", 10, 160)}
          ${flowLabel(684, 582, config.labels.la1, "#ad3535", "la1", 10, 170)}
          ${flowLabel(1028, 584, config.labels.l4, "#ad3535", "l4", 10, 170)}
          ${flowLabel(1180, 504, config.labels.l5, "#ad3535", "l5", 10, 150)}
          ${flowLabel(1128, 732, config.labels.l6, "#ad3535", "l6", 10, 150)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how poisoned memory drives a later business decision."
      )}
    `;
  }

  function renderAttackDrift(config) {
    const s1 = fitWrappedText(config.session1.line1, 220, 12, 10, 2);
    const s2 = fitWrappedText(config.session2.line1, 220, 12, 10, 2);
    const s3 = fitWrappedText(config.session3.line1, 220, 12, 10, 2);
    const s1Note = fitWrappedText(config.session1.line2, 260, 10, 9, 2);
    const s2Note = fitWrappedText(config.session2.line2, 260, 10, 9, 2);
    const s3Note = fitWrappedText(config.session3.line2, 260, 10, 9, 2);
    const mem1 = fitWrappedText(config.memory.line1, 320, 12, 10, 2);
    const mem2 = fitWrappedText(config.memory.line2, 320, 12, 10, 2);
    const mem3 = fitWrappedText(config.memory.line3, 324, 12, 10, 2);
    const memNote = fitWrappedText(config.memory.note, 334, 10, 9, 2);
    const attackerSub1 = fitWrappedText(config.attacker.sub1, 176, 13.5, 11, 2);
    const attackerSub2 = fitWrappedText(config.attacker.sub2, 174, 11, 10, 2);
    const laundererSub1 = fitWrappedText(config.launderer.sub1, 228, 13.5, 11, 2);
    const laundererSub2 = fitWrappedText(config.launderer.sub2, 228, 11, 10, 2);
    const decisionTitle = fitSingleLine(config.decision.title, 248, 18, 14);
    const decisionLine1 = fitWrappedText(config.decision.line1, 250, 14, 11, 2);
    const decisionLine2 = fitWrappedText(config.decision.line2, 250, 16, 13, 2);
    const approvalTitle = fitSingleLine("Approval path", 180, 18, 14);
    const impactTitle = fitSingleLine(config.impact.title, 210, 19, 14);
    const impact1 = fitWrappedText(config.impact.sub1, 260, 13, 11, 2);
    const impact2 = fitWrappedText(config.impact.sub2, 262, 12, 10, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>

          <rect width="1400" height="1080" fill="#fff"/>
          <text x="700" y="46" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#b2aba0" letter-spacing="3.4">SESSION REINFORCEMENT  ·  MEMORY DRIFT  ·  LATER TRANSACTION EVENT  ·  CORRUPTED DECISION</text>

          <g class="az" id="gzone">
            <rect x="260" y="118" width="1040" height="336" rx="28" fill="rgba(156,47,47,0.04)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="472" y="100" width="616" height="24" rx="12" fill="#fff"/>
            <text x="780" y="116" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="58" y="164" width="194" height="122" rx="18" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="155" y="210" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.attacker.title)}</text>
            <text x="155" y="242" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub1.fontSize}" fill="#6b655c">${renderTspans(155, attackerSub1.lines, attackerSub1.fontSize * 1.16)}</text>
            <text x="155" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub2.fontSize}" fill="#8a847b">${renderTspans(155, attackerSub2.lines, attackerSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="252" y1="226" x2="300" y2="226" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c0f" x1="252" y1="226" x2="300" y2="226" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="300" y="152" width="380" height="258" rx="22" fill="#faeeda" stroke="#ef9f27" stroke-width="2.2"/>
            <text x="490" y="186" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#633806">Reinforcement campaign</text>
            <rect x="324" y="204" width="332" height="52" rx="16" fill="#fff8e8" stroke="#efc76c" stroke-width="1.2"/>
            <rect x="340" y="214" width="92" height="28" rx="12" fill="#fffdf4" stroke="#efc76c" stroke-width="1.1"/>
            <text x="386" y="232" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#854f0b">${escapeHtml(config.session1.title)}</text>
            <text x="502" y="226" text-anchor="middle" font-family="${getFontStack()}" font-size="${s1.fontSize}" fill="#854f0b">${renderTspans(502, s1.lines, s1.fontSize * 1.14)}</text>
            <text x="502" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${s1Note.fontSize}" fill="#9a6d23">${renderTspans(502, s1Note.lines, s1Note.fontSize * 1.14)}</text>
            <rect x="324" y="268" width="332" height="52" rx="16" fill="#fff8e8" stroke="#efc76c" stroke-width="1.2"/>
            <rect x="340" y="278" width="92" height="28" rx="12" fill="#fffdf4" stroke="#efc76c" stroke-width="1.1"/>
            <text x="386" y="296" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#854f0b">${escapeHtml(config.session2.title)}</text>
            <text x="502" y="290" text-anchor="middle" font-family="${getFontStack()}" font-size="${s2.fontSize}" fill="#854f0b">${renderTspans(502, s2.lines, s2.fontSize * 1.14)}</text>
            <text x="502" y="310" text-anchor="middle" font-family="${getFontStack()}" font-size="${s2Note.fontSize}" fill="#9a6d23">${renderTspans(502, s2Note.lines, s2Note.fontSize * 1.14)}</text>
            <rect x="324" y="332" width="332" height="52" rx="16" fill="#fff8e8" stroke="#efc76c" stroke-width="1.2"/>
            <rect x="340" y="342" width="92" height="28" rx="12" fill="#fffdf4" stroke="#efc76c" stroke-width="1.1"/>
            <text x="386" y="360" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#854f0b">${escapeHtml(config.session3.title)}</text>
            <text x="502" y="354" text-anchor="middle" font-family="${getFontStack()}" font-size="${s3.fontSize}" fill="#854f0b">${renderTspans(502, s3.lines, s3.fontSize * 1.14)}</text>
            <text x="502" y="374" text-anchor="middle" font-family="${getFontStack()}" font-size="${s3Note.fontSize}" fill="#9a6d23">${renderTspans(502, s3Note.lines, s3Note.fontSize * 1.14)}</text>
            <text x="490" y="398" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-style="italic" fill="#a32d2d">The attacker keeps referencing prior sessions to strengthen the false belief.</text>
          </g>

          <line class="co" id="c1s" x1="680" y1="282" x2="760" y2="282" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c1f" x1="680" y1="282" x2="760" y2="282" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="760" y="152" width="500" height="258" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1010" y="186" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.memory.title)}</text>
            <rect x="796" y="214" width="428" height="40" rx="14" fill="#fbeeee" stroke="#efc4c4" stroke-width="1.2"/>
            <text x="1010" y="238" text-anchor="middle" font-family="${getFontStack()}" font-size="${mem1.fontSize}" fill="#8d2222">${renderTspans(1010, mem1.lines, mem1.fontSize * 1.14)}</text>
            <rect x="796" y="268" width="428" height="44" rx="14" fill="#f8e2e2" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="1010" y="294" text-anchor="middle" font-family="${getFontStack()}" font-size="${mem2.fontSize}" fill="#8d2222">${renderTspans(1010, mem2.lines, mem2.fontSize * 1.14)}</text>
            <rect x="796" y="326" width="428" height="54" rx="14" fill="#f4cfcf" stroke="#e38d8d" stroke-width="1.2"/>
            <text x="1010" y="354" text-anchor="middle" font-family="${getFontStack()}" font-size="${mem3.fontSize}" font-weight="800" fill="#7d1f1f">${renderTspans(1010, mem3.lines, mem3.fontSize * 1.14)}</text>
            <text x="1010" y="398" text-anchor="middle" font-family="${getFontStack()}" font-size="${memNote.fontSize}" fill="#a35656">${renderTspans(1010, memNote.lines, memNote.fontSize * 1.16)}</text>
          </g>

          <g class="ng" id="g3">
            <rect x="100" y="602" width="290" height="126" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="245" y="646" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.launderer.title)}</text>
            <text x="245" y="676" text-anchor="middle" font-family="${getFontStack()}" font-size="${laundererSub1.fontSize}" fill="#6b655c">${renderTspans(245, laundererSub1.lines, laundererSub1.fontSize * 1.16)}</text>
            <text x="245" y="708" text-anchor="middle" font-family="${getFontStack()}" font-size="${laundererSub2.fontSize}" fill="#8a847b">${renderTspans(245, laundererSub2.lines, laundererSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c2s" x1="390" y1="666" x2="470" y2="666" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c2f" x1="390" y1="666" x2="470" y2="666" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="470" y="566" width="430" height="176" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="685" y="610" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="685" y="654" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionLine1.fontSize}" fill="#8d2222">${renderTspans(685, decisionLine1.lines, decisionLine1.fontSize * 1.16)}</text>
            <text x="685" y="690" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionLine2.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(685, decisionLine2.lines, decisionLine2.fontSize * 1.14)}</text>
            <text x="685" y="718" text-anchor="middle" font-family="${getFontStack()}" font-size="11" fill="#b66868">The agent acts on the stored belief, not on the real risk profile of the transfer.</text>
          </g>

          <path class="co" id="c3s" d="M1010 410 L1010 508 L900 508 L900 600" fill="none" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="M1010 410 L1010 508 L900 508 L900 600" fill="none" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>
          <line class="co" id="c3v" x1="1010" y1="410" x2="1010" y2="508" stroke="#beb6a9" stroke-width="2"/>
          <line class="fl a" id="c3vf" x1="1010" y1="410" x2="1010" y2="508" stroke="#ad3535" stroke-width="3.6"/>

          <g class="ng" id="g5">
            <rect x="980" y="592" width="240" height="140" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1100" y="638" text-anchor="middle" font-family="${getFontStack()}" font-size="${approvalTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(approvalTitle.text)}</text>
            <text x="1100" y="668" text-anchor="middle" font-family="${getFontStack()}" font-size="15" font-weight="800" fill="#a32d2d">NO FLAG → APPROVE</text>
            <text x="1100" y="696" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" fill="#b66868">Structured transfers pass silently</text>
          </g>

          <line class="co" id="c4s" x1="900" y1="666" x2="980" y2="666" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="900" y1="666" x2="980" y2="666" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="900" y="804" width="360" height="112" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1080" y="844" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1080" y="872" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact1.fontSize}" fill="#a33b3b">${renderTspans(1080, impact1.lines, impact1.fontSize * 1.14)}</text>
            <text x="1080" y="896" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact2.fontSize}" fill="#b66868">${renderTspans(1080, impact2.lines, impact2.fontSize * 1.14)}</text>
          </g>

          <path class="co" id="c5s" d="M1100 732 L1100 768 L1080 768 L1080 804" fill="none" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <path class="fl a" id="c5f" d="M1100 732 L1100 768 L1080 768 L1080 804" fill="none" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          ${flowLabel(284, 200, config.labels.l0, "#ad3535", "l0", 10, 160)}
          ${flowLabel(720, 254, config.labels.l1, "#ad3535", "l1", 10, 150)}
          ${flowLabel(752, 432, config.labels.l2, "#ad3535", "l2", 10, 170)}
          ${flowLabel(430, 648, config.labels.l3, "#ad3535", "l3", 10, 160)}
          ${flowLabel(1014, 520, config.labels.l4, "#ad3535", "l4", 10, 170)}
          ${flowLabel(938, 650, config.labels.l5, "#ad3535", "l5", 10, 150)}
          ${flowLabel(1082, 790, config.labels.l6, "#ad3535", "l6", 10, 150)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how repeated sessions turn a false belief into trusted memory."
      )}
    `;
  }

  function renderAttackChannel(config) {
    const entryTitle = fitSingleLine(config.entry.title, 166, 18, 14);
    const entrySub1 = fitWrappedText(config.entry.sub1, 160, 13, 11, 2);
    const entrySub2 = fitWrappedText(config.entry.sub2, 160, 11, 9, 2);
    const senderTitle = fitSingleLine(config.sender.title, 194, 18, 14);
    const senderSub1 = fitWrappedText(config.sender.sub1, 186, 13, 11, 2);
    const senderGoal = fitWrappedText(config.sender.goal, 164, 12, 10, 2);
    const channelTitle = fitSingleLine(config.channel.title, 212, 17, 13);
    const channelSub1 = fitWrappedText(config.channel.sub1, 204, 12, 10, 2);
    const channelSub2 = fitWrappedText(config.channel.sub2, 204, 11, 9, 2);
    const attackerTitle = fitSingleLine(config.attacker.title, 200, 18, 14);
    const attackerSub1 = fitWrappedText(config.attacker.sub1, 188, 12.5, 10, 2);
    const attackerSub2 = fitWrappedText(config.attacker.sub2, 188, 11, 9, 2);
    const tamperTitle = fitSingleLine(config.tamper.title, 222, 17, 13);
    const tamperSub1 = fitWrappedText(config.tamper.sub1, 214, 12.5, 10, 2);
    const tamperSub2 = fitWrappedText(config.tamper.sub2, 214, 12.5, 10, 2);
    const tamperNote = fitWrappedText(config.tamper.note, 214, 10.5, 9, 2);
    const decisionTitle = fitSingleLine(config.decision.title, 208, 17, 13);
    const decisionAgent = fitWrappedText(config.decision.agent, 198, 12, 10, 2);
    const decisionBefore = fitWrappedText(config.decision.before, 174, 12, 10, 2);
    const decisionAfter = fitWrappedText(config.decision.after, 188, 12, 10, 2);
    const receiverTitle = fitSingleLine(config.receiver.title, 202, 17, 13);
    const receiverSub1 = fitWrappedText(config.receiver.sub1, 194, 12.5, 10, 2);
    const receiverSub2 = fitWrappedText(config.receiver.sub2, 194, 11, 9, 2);
    const actionTitle = fitSingleLine(config.action.title, 214, 17, 13);
    const actionSub1 = fitWrappedText(config.action.sub1, 202, 12.5, 10, 2);
    const actionSub2 = fitWrappedText(config.action.sub2, 202, 11, 9, 2);
    const impactTitle = fitSingleLine(config.impact.title, 214, 18, 14);
    const impactSub1 = fitWrappedText(config.impact.sub1, 450, 13, 11, 2);
    const impactSub2 = fitWrappedText(config.impact.sub2, 450, 11, 9, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 930" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>

          <rect width="1400" height="930" fill="#fff"/>
          <text x="700" y="50" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#b2aba0" letter-spacing="3.6">REQUEST  ·  AGENT CORE  ·  PEER CHANNEL  ·  TRUST STATE  ·  HARMFUL ACTION  ·  IMPACT</text>
          <line x1="56" y1="72" x2="1344" y2="72" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="280" y="108" width="1080" height="720" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="500" y="90" width="620" height="24" rx="12" fill="#fff"/>
            <text x="810" y="106" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="156" width="180" height="128" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="160" y="208" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            <text x="160" y="238" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(160, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="160" y="266" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(160, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="250" y1="220" x2="340" y2="220" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="250" y1="220" x2="340" y2="220" stroke="#4452b8" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="320" y="136" width="220" height="164" rx="22" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="430" y="190" text-anchor="middle" font-family="${getFontStack()}" font-size="${senderTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(senderTitle.text)}</text>
            <text x="430" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="${senderSub1.fontSize}" fill="#5360be">${renderTspans(430, senderSub1.lines, senderSub1.fontSize * 1.16)}</text>
            <rect x="352" y="242" width="156" height="42" rx="12" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="430" y="${senderGoal.lines.length > 1 ? 259 : 264}" text-anchor="middle" font-family="${getFontStack()}" font-size="${senderGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(430, senderGoal.lines, senderGoal.fontSize * 1.15)}</text>
          </g>

          <line class="co" id="c1s" x1="540" y1="220" x2="610" y2="220" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="540" y1="220" x2="610" y2="220" stroke="#4452b8" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="610" y="136" width="230" height="164" rx="22" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="725" y="190" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(channelTitle.text)}</text>
            <text x="725" y="226" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelSub1.fontSize}" fill="#6b655c">${renderTspans(725, channelSub1.lines, channelSub1.fontSize * 1.16)}</text>
            <text x="725" y="266" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelSub2.fontSize}" fill="#8a847b">${renderTspans(725, channelSub2.lines, channelSub2.fontSize * 1.16)}</text>
          </g>

          <g class="ng" id="g3">
            <rect x="110" y="462" width="220" height="154" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="220" y="520" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(attackerTitle.text)}</text>
            <text x="220" y="554" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub1.fontSize}" fill="#a33b3b">${renderTspans(220, attackerSub1.lines, attackerSub1.fontSize * 1.16)}</text>
            <text x="220" y="592" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub2.fontSize}" fill="#b66868">${renderTspans(220, attackerSub2.lines, attackerSub2.fontSize * 1.16)}</text>
          </g>

          <path class="co" id="c2s" d="M725 300 L725 380 L520 380 L520 430" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c2f" d="M725 300 L725 380 L520 380 L520 430" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <line class="co" id="c3s" x1="330" y1="540" x2="390" y2="540" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c3f" x1="330" y1="540" x2="390" y2="540" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="390" y="430" width="260" height="186" rx="22" fill="#fff4f4" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="418" y="446" width="204" height="28" rx="14" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="520" y="465" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(tamperTitle.text)}</text>
            <text x="520" y="512" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperSub1.fontSize}" fill="#a33b3b">${renderTspans(520, tamperSub1.lines, tamperSub1.fontSize * 1.16)}</text>
            <text x="520" y="556" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperSub2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(520, tamperSub2.lines, tamperSub2.fontSize * 1.14)}</text>
            <text x="520" y="594" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperNote.fontSize}" fill="#c07b7b">${renderTspans(520, tamperNote.lines, tamperNote.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c4s" x1="650" y1="520" x2="690" y2="520" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="650" y1="520" x2="690" y2="520" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="690" y="420" width="230" height="196" rx="22" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="805" y="458" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(decisionTitle.text)}</text>
            <text x="805" y="486" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionAgent.fontSize}" fill="#5360be">${renderTspans(805, decisionAgent.lines, decisionAgent.fontSize * 1.16)}</text>
            ${innerPill(805, 536, 184, config.decision.before, "#edf7f0", "#bdddc8", "#2d6a4f", decisionBefore.fontSize, 700)}
            ${innerPill(805, 584, 206, config.decision.after, "#fff5f5", "#e6b3b3", "#ad3535", decisionAfter.fontSize, 800)}
          </g>

          <path class="co" id="c5s" d="M862 420 L862 350 L1080 350 L1080 300" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c5f" d="M862 420 L862 350 L1080 350 L1080 300" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="970" y="136" width="220" height="164" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1080" y="190" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(receiverTitle.text)}</text>
            <text x="1080" y="226" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverSub1.fontSize}" fill="#a33b3b">${renderTspans(1080, receiverSub1.lines, receiverSub1.fontSize * 1.16)}</text>
            <text x="1080" y="264" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverSub2.fontSize}" fill="#b66868">${renderTspans(1080, receiverSub2.lines, receiverSub2.fontSize * 1.16)}</text>
          </g>

          <path class="co" id="c6s" d="M1080 300 L1080 430" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c6f" d="M1080 300 L1080 430" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g7">
            <rect x="970" y="430" width="250" height="186" rx="22" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="1095" y="492" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="1095" y="530" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(1095, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            <text x="1095" y="574" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(1095, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c7s" x1="1095" y1="616" x2="1095" y2="660" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c7f" x1="1095" y1="616" x2="1095" y2="660" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g8">
            <rect x="760" y="664" width="540" height="104" rx="18" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1030" y="706" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1030" y="734" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub1.fontSize}" fill="#a33b3b">${renderTspans(1030, impactSub1.lines, impactSub1.fontSize * 1.16)}</text>
            <text x="1030" y="756" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub2.fontSize}" fill="#b66868">${renderTspans(1030, impactSub2.lines, impactSub2.fontSize * 1.16)}</text>
          </g>

          ${flowLabel(286, 194, config.labels.l0, "#4452b8", "l0", 10, 150)}
          ${flowLabel(576, 194, config.labels.l1, "#4452b8", "l1", 10, 162)}
          ${flowLabel(220, 442, config.labels.l2, "#ad3535", "l2", 10, 170)}
          ${flowLabel(616, 392, config.labels.la1, "#ad3535", "la1", 10, 220)}
          ${flowLabel(656, 504, config.labels.l4, "#ad3535", "l4", 10, 170)}
          ${flowLabel(928, 394, config.labels.l5, "#ad3535", "l5", 10, 170)}
          ${flowLabel(1186, 394, config.labels.l6, "#ad3535", "l6", 10, 170)}
          ${flowLabel(1110, 642, config.labels.l7, "#ad3535", "l7", 10, 160)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how a trusted peer channel becomes the attack path."
      )}
    `;
  }

  function renderAttackCascade(config) {
    const entryTitle = fitSingleLine(config.entry.title, 170, 17, 13);
    const entrySub1 = fitWrappedText(config.entry.sub1, 176, 12.5, 10, 2);
    const entrySub2 = fitWrappedText(config.entry.sub2, 176, 11, 9, 2);

    const stage1Title = fitSingleLine(config.stage1.title, 188, 17, 13);
    const stage1Sub1 = fitWrappedText(config.stage1.sub1, 192, 12.5, 10, 2);
    const stage1Sub2 = fitWrappedText(config.stage1.sub2, 192, 11, 9, 2);
    const stage2Title = fitSingleLine(config.stage2.title, 188, 17, 13);
    const stage2Sub1 = fitWrappedText(config.stage2.sub1, 192, 12.5, 10, 2);
    const stage2Sub2 = fitWrappedText(config.stage2.sub2, 192, 11, 9, 2);
    const stage3Title = fitSingleLine(config.stage3.title, 188, 17, 13);
    const stage3Sub1 = fitWrappedText(config.stage3.sub1, 192, 12.5, 10, 2);
    const stage3Sub2 = fitWrappedText(config.stage3.sub2, 192, 11, 9, 2);
    const issueTitle = fitSingleLine(config.issue.title, 236, 18, 14);
    const issueLine1 = fitWrappedText(config.issue.line1, 320, 12.5, 10, 2);
    const issueLine2 = fitWrappedText(config.issue.line2, 320, 12.5, 10, 2);
    const issueLine3 = fitWrappedText(config.issue.line3, 320, 11.5, 9, 2);
    const stage4Title = fitSingleLine(config.stage4.title, 188, 17, 13);
    const stage4Sub1 = fitWrappedText(config.stage4.sub1, 192, 12.5, 10, 2);
    const stage4Sub2 = fitWrappedText(config.stage4.sub2, 192, 11, 9, 2);

    const impactTitle = fitSingleLine(config.impact.title, 280, 19, 14);
    const impactSub1 = fitWrappedText(config.impact.sub1, 450, 13, 11, 2);
    const impactSub2 = fitWrappedText(config.impact.sub2, 450, 11, 9, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 930" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>

          <rect width="1400" height="930" fill="#fff"/>
          <text x="700" y="50" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#b2aba0" letter-spacing="3.5">POISONED INPUT  ·  AGENT STAGES  ·  CASCADE STATE  ·  HARMFUL ACTION  ·  IMPACT</text>
          <line x1="56" y1="72" x2="1344" y2="72" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="286" y="116" width="1044" height="694" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="450" y="98" width="716" height="24" rx="12" fill="#fff"/>
            <text x="808" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="184" width="190" height="126" rx="20" fill="#fff4f4" stroke="#ad3535" stroke-width="2.7"/>
            <text x="165" y="228" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(entryTitle.text)}</text>
            <text x="165" y="260" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#a33b3b">${renderTspans(165, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="165" y="294" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#b66868">${renderTspans(165, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="260" y1="247" x2="330" y2="247" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c0f" x1="260" y1="247" x2="330" y2="247" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="330" y="164" width="220" height="156" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="440" y="212" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage1Title.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(stage1Title.text)}</text>
            <text x="440" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage1Sub1.fontSize}" fill="#5360be">${renderTspans(440, stage1Sub1.lines, stage1Sub1.fontSize * 1.16)}</text>
            <text x="440" y="290" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage1Sub2.fontSize}" fill="#7a82c8">${renderTspans(440, stage1Sub2.lines, stage1Sub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c1s" x1="550" y1="247" x2="620" y2="247" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c1f" x1="550" y1="247" x2="620" y2="247" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="620" y="164" width="220" height="156" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="730" y="212" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage2Title.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(stage2Title.text)}</text>
            <text x="730" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage2Sub1.fontSize}" fill="#6b655c">${renderTspans(730, stage2Sub1.lines, stage2Sub1.fontSize * 1.16)}</text>
            <text x="730" y="290" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage2Sub2.fontSize}" fill="#8a847b">${renderTspans(730, stage2Sub2.lines, stage2Sub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c2s" x1="840" y1="247" x2="910" y2="247" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c2f" x1="840" y1="247" x2="910" y2="247" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="910" y="164" width="220" height="156" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1020" y="212" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Title.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(stage3Title.text)}</text>
            <text x="1020" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Sub1.fontSize}" fill="#6b655c">${renderTspans(1020, stage3Sub1.lines, stage3Sub1.fontSize * 1.16)}</text>
            <text x="1020" y="290" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Sub2.fontSize}" fill="#8a847b">${renderTspans(1020, stage3Sub2.lines, stage3Sub2.fontSize * 1.16)}</text>
          </g>

          <path class="co" id="c3s" d="M1020 320 L1020 404 L610 404 L610 438" fill="none" stroke="#beb6a9" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="M1020 320 L1020 404 L610 404 L610 438" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="410" y="438" width="400" height="208" rx="22" fill="#fff3de" stroke="#ef9f21" stroke-width="2.8"/>
            <rect x="438" y="454" width="182" height="28" rx="14" fill="#ffe5ba" stroke="#f5c46c" stroke-width="1.1"/>
            <text x="529" y="473" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueTitle.fontSize}" font-weight="700" fill="#8a5200">${escapeHtml(issueTitle.text)}</text>
            <text x="610" y="526" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueLine1.fontSize}" fill="#8a5200">${renderTspans(610, issueLine1.lines, issueLine1.fontSize * 1.16)}</text>
            <text x="610" y="574" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueLine2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(610, issueLine2.lines, issueLine2.fontSize * 1.14)}</text>
            <text x="610" y="620" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueLine3.fontSize}" fill="#9a7748">${renderTspans(610, issueLine3.lines, issueLine3.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c4s" x1="810" y1="542" x2="920" y2="542" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="810" y1="542" x2="920" y2="542" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="920" y="452" width="250" height="180" rx="22" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1045" y="510" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage4Title.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(stage4Title.text)}</text>
            <text x="1045" y="546" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage4Sub1.fontSize}" fill="#6b655c">${renderTspans(1045, stage4Sub1.lines, stage4Sub1.fontSize * 1.16)}</text>
            <text x="1045" y="590" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage4Sub2.fontSize}" fill="#8a847b">${renderTspans(1045, stage4Sub2.lines, stage4Sub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c5s" x1="1045" y1="632" x2="1045" y2="690" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="1045" y1="632" x2="1045" y2="690" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="700" y="694" width="560" height="104" rx="18" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="980" y="736" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="980" y="764" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub1.fontSize}" fill="#a33b3b">${renderTspans(980, impactSub1.lines, impactSub1.fontSize * 1.16)}</text>
            <text x="980" y="786" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub2.fontSize}" fill="#b66868">${renderTspans(980, impactSub2.lines, impactSub2.fontSize * 1.16)}</text>
          </g>

          ${flowLabel(294, 194, config.labels.l0, "#ad3535", "l0", 10, 180)}
          ${flowLabel(584, 194, config.labels.l1, "#ad3535", "l1", 10, 176)}
          ${flowLabel(874, 194, config.labels.l2, "#ad3535", "l2", 10, 192)}
          ${flowLabel(870, 396, config.labels.l3, "#ad3535", "l3", 10, 184)}
          ${flowLabel(700, 424, config.labels.la1, "#ad3535", "la1", 10, 250)}
          ${flowLabel(866, 526, config.labels.l4, "#ad3535", "l4", 10, 190)}
          ${flowLabel(1045, 668, config.labels.l5, "#ad3535", "l5", 10, 180)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how one bad upstream signal is amplified across a multi-agent pipeline."
      )}
    `;
  }

  function renderDefenseShared(config) {
    const agentGoalLayout = fitSingleLine(config.agent.goal, 176, 12, 10);
    const payloadTitleLayout = fitSingleLine(config.payload.title, 188, 17, 13);
    const payloadVisibleLayout = fitWrappedText(config.payload.visible, 184, 12, 10, 2);
    const payloadHidden1Layout = fitWrappedText(config.payload.hidden1, 190, 12, 10, 2);
    const payloadHidden2Layout = fitWrappedText(config.payload.hidden2, 190, 13, 10, 2);
    const payloadNoteLayout = fitWrappedText(config.payload.hiddenNote, 190, 9, 8, 2);
    const d1Title = fitSingleLine(config.d1.title, 184, 17, 13);
    const d1Sub1 = fitWrappedText(config.d1.sub1, 186, 12.5, 10, 2);
    const d1Sub2 = fitWrappedText(config.d1.sub2, 186, 11.5, 10, 2);
    const d2Title = fitSingleLine(config.d2.title, 184, 17, 13);
    const d2Sub1 = fitWrappedText(config.d2.sub1, 196, 12, 9, 2);
    const d2Sub2 = fitWrappedText(config.d2.sub2, 196, 11, 9, 2);
    const contextLine1 = fitWrappedText(config.context.line1, 188, 12, 10, 2);
    const contextLine2 = fitWrappedText(config.context.line2, 188, 12, 10, 2);
    const contextLine3 = fitWrappedText(config.context.line3, 188, 12, 10, 2);
    const d3Title = fitSingleLine(config.d3.title, 184, 17, 13);
    const d3Sub1 = fitWrappedText(config.d3.sub1, 186, 12.5, 10, 2);
    const d3Sub2 = fitWrappedText(config.d3.sub2, 186, 11.5, 10, 2);
    const d4Title = fitSingleLine(config.d4.title, 184, 17, 13);
    const d4Sub1 = fitWrappedText(config.d4.sub1, 186, 12.5, 10, 2);
    const d4Sub2 = fitWrappedText(config.d4.sub2, 186, 11.5, 10, 2);
    const d5Title = fitSingleLine(config.d5.title, 184, 17, 13);
    const d5Sub1 = fitWrappedText(config.d5.sub1, 186, 12.5, 10, 2);
    const d5Sub2 = fitWrappedText(config.d5.sub2, 186, 11.5, 10, 2);
    const outcomeTitle = fitSingleLine(config.outcome.title, 250, 18, 14);
    const outcomeSub1 = fitWrappedText(config.outcome.sub1, 246, 13, 11, 2);
    const outcomeSub2 = fitWrappedText(config.outcome.sub2, 246, 11, 9, 2);
    const auditTitle = fitSingleLine(config.audit.title, 350, 12, 10);
    const auditSub1 = fitWrappedText(config.audit.sub1, 880, 10.5, 9, 2);
    const auditSub2 = fitWrappedText(config.audit.sub2, 880, 10.5, 9, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge safe">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <clipPath id="sharedPayloadClip"><rect x="1010" y="336" width="220" height="236" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="1080" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  AGENT CORE  ·  TOOL LAYER  ·  EXTERNAL DATA</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="300" y="118" width="970" height="930" rx="28" fill="rgba(45,106,79,0.03)" stroke="#2d6a4f" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="470" y="94" width="460" height="28" rx="14" fill="#ffffff"/>
            <text x="700" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="170" height="120" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="155" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="155" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
            <text x="155" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>
          </g>

          <line class="co" id="c0s" x1="240" y1="230" x2="350" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="240" y1="230" x2="350" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="160" width="220" height="146" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
            <text x="460" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="372" y="270" width="176" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="460" y="292" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoalLayout.fontSize}" font-weight="700" fill="#2d6a4f">${escapeHtml(agentGoalLayout.text)}</text>
          </g>

          <line class="co" id="c1s" x1="570" y1="230" x2="680" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="230" x2="680" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="790" y="222" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.toolTop.title)}</text>
            <text x="790" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.toolTop.sub1)}</text>
            <text x="790" y="282" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#8a847b">${escapeHtml(config.toolTop.sub2)}</text>
          </g>

          <line class="co" id="c2s" x1="900" y1="225" x2="1010" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="900" y1="225" x2="1010" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="1010" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1120" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.store.title)}</text>
            <text x="1120" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.store.sub1)}</text>
            <text x="1120" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#8a847b">${escapeHtml(config.store.sub2)}</text>
          </g>

          <line class="co" id="c3s" x1="1120" y1="290" x2="1120" y2="336" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c3f" x1="1120" y1="290" x2="1120" y2="336" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="1010" y="336" width="220" height="82" rx="20" fill="#fcfbf8"/>
            <rect x="1010" y="388" width="220" height="184" fill="#fdf0f0" clip-path="url(#sharedPayloadClip)"/>
            <line x1="1014" y1="418" x2="1226" y2="418" stroke="#ddd6cb" stroke-width="1.4"/>
            <rect x="1010" y="336" width="220" height="236" rx="20" fill="none" stroke="#b87a45" stroke-width="2.3"/>
            <text x="1120" y="376" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(payloadTitleLayout.text)}</text>
            <text x="1120" y="404" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadVisibleLayout.fontSize}" fill="#8a847b">${renderTspans(1120, payloadVisibleLayout.lines, payloadVisibleLayout.fontSize * 1.18)}</text>
            <text x="1120" y="456" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.payload.hiddenTitle)}</text>
            <text x="1120" y="486" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHidden1Layout.fontSize}" fill="#ad3535">${renderTspans(1120, payloadHidden1Layout.lines, payloadHidden1Layout.fontSize * 1.18)}</text>
            <text x="1120" y="528" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHidden2Layout.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1120, payloadHidden2Layout.lines, payloadHidden2Layout.fontSize * 1.16)}</text>
            <text x="1120" y="556" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadNoteLayout.fontSize}" fill="#b66868">${renderTspans(1120, payloadNoteLayout.lines, payloadNoteLayout.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c4s" x1="1010" y1="442" x2="900" y2="442" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl" id="c4f" x1="1010" y1="442" x2="900" y2="442" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="680" y="356" width="220" height="172" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="710" y="386" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f">D1</text>
            <text x="870" y="386" text-anchor="end" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#7aa38f">STEP 1</text>
            <text x="790" y="420" text-anchor="middle" font-family="${getFontStack()}" font-size="${d1Title.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(d1Title.text)}</text>
            <text x="790" y="456" text-anchor="middle" font-family="${getFontStack()}" font-size="${d1Sub1.fontSize}" fill="#3d735a">${renderTspans(790, d1Sub1.lines, d1Sub1.fontSize * 1.16)}</text>
            <text x="790" y="500" text-anchor="middle" font-family="${getFontStack()}" font-size="${d1Sub2.fontSize}" fill="#56826c">${renderTspans(790, d1Sub2.lines, d1Sub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c5s" x1="680" y1="442" x2="570" y2="442" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c5f" x1="680" y1="442" x2="570" y2="442" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="350" y="356" width="220" height="172" rx="20" fill="#eef1ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="380" y="386" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#4452b8">D2</text>
            <text x="540" y="386" text-anchor="end" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#8590cf">STEP 2</text>
            <text x="460" y="420" text-anchor="middle" font-family="${getFontStack()}" font-size="${d2Title.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(d2Title.text)}</text>
            <text x="460" y="456" text-anchor="middle" font-family="${getFontStack()}" font-size="${d2Sub1.fontSize}" fill="#5360be">${renderTspans(460, d2Sub1.lines, d2Sub1.fontSize * 1.16)}</text>
            <text x="460" y="500" text-anchor="middle" font-family="${getFontStack()}" font-size="${d2Sub2.fontSize}" fill="#6b77cb">${renderTspans(460, d2Sub2.lines, d2Sub2.fontSize * 1.16)}</text>
          </g>

          <g class="ng" id="g6ctx">
            <rect x="350" y="552" width="220" height="114" rx="18" fill="#eef1ff" stroke="#cdd4f0" stroke-width="1.8"/>
            <text x="460" y="582" text-anchor="middle" font-family="${getFontStack()}" font-size="11" font-weight="800" fill="#7680be" letter-spacing=".12em">${escapeHtml(config.context.title)}</text>
            ${innerPill(460, 610, 188, config.context.line1, "#edf7f0", "#bdddc8", "#2d6a4f", 11, 700)}
            ${innerPill(460, 644, 188, config.context.line2, "#edf7f0", "#bdddc8", "#2d6a4f", 11, 700)}
          </g>

          <line class="co" id="c6s" x1="460" y1="528" x2="460" y2="720" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c6f" x1="460" y1="528" x2="460" y2="720" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g7">
            <rect x="350" y="720" width="220" height="160" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="380" y="750" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f">D3</text>
            <text x="540" y="750" text-anchor="end" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#7aa38f">STEP 3</text>
            <text x="460" y="784" text-anchor="middle" font-family="${getFontStack()}" font-size="${d3Title.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(d3Title.text)}</text>
            <text x="460" y="820" text-anchor="middle" font-family="${getFontStack()}" font-size="${d3Sub1.fontSize}" fill="#3d735a">${renderTspans(460, d3Sub1.lines, d3Sub1.fontSize * 1.16)}</text>
            <text x="460" y="864" text-anchor="middle" font-family="${getFontStack()}" font-size="${d3Sub2.fontSize}" fill="#56826c">${renderTspans(460, d3Sub2.lines, d3Sub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c7s" x1="570" y1="800" x2="650" y2="800" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c7f" x1="570" y1="800" x2="650" y2="800" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g8">
            <rect x="650" y="720" width="220" height="160" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="680" y="750" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f">D4</text>
            <text x="840" y="750" text-anchor="end" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#7aa38f">STEP 4</text>
            <text x="760" y="784" text-anchor="middle" font-family="${getFontStack()}" font-size="${d4Title.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(d4Title.text)}</text>
            <text x="760" y="820" text-anchor="middle" font-family="${getFontStack()}" font-size="${d4Sub1.fontSize}" fill="#3d735a">${renderTspans(760, d4Sub1.lines, d4Sub1.fontSize * 1.16)}</text>
            <text x="760" y="864" text-anchor="middle" font-family="${getFontStack()}" font-size="${d4Sub2.fontSize}" fill="#56826c">${renderTspans(760, d4Sub2.lines, d4Sub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c8s" x1="870" y1="800" x2="950" y2="800" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c8f" x1="870" y1="800" x2="950" y2="800" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g9">
            <rect x="950" y="720" width="220" height="160" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="980" y="750" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f">D5</text>
            <text x="1140" y="750" text-anchor="end" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#7aa38f">STEP 5</text>
            <text x="1060" y="784" text-anchor="middle" font-family="${getFontStack()}" font-size="${d5Title.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(d5Title.text)}</text>
            <text x="1060" y="820" text-anchor="middle" font-family="${getFontStack()}" font-size="${d5Sub1.fontSize}" fill="#3d735a">${renderTspans(1060, d5Sub1.lines, d5Sub1.fontSize * 1.16)}</text>
            <text x="1060" y="864" text-anchor="middle" font-family="${getFontStack()}" font-size="${d5Sub2.fontSize}" fill="#56826c">${renderTspans(1060, d5Sub2.lines, d5Sub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c9s" x1="1060" y1="880" x2="1060" y2="910" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c9f" x1="1060" y1="880" x2="1060" y2="910" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g10">
            <rect x="920" y="910" width="280" height="86" rx="18" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="1060" y="942" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTitle.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(outcomeTitle.text)}</text>
            <text x="1060" y="966" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub1.fontSize}" fill="#3d735a">${renderTspans(1060, outcomeSub1.lines, outcomeSub1.fontSize * 1.16)}</text>
          </g>

          <g class="ng" id="g11">
            <rect x="60" y="1022" width="1280" height="28" rx="14" fill="#edf7f0" stroke="#9ec1ae" stroke-width="1.8"/>
            <text x="86" y="1039" font-family="${getFontStack()}" font-size="${auditTitle.fontSize}" font-weight="800" fill="#2d6a4f">${escapeHtml(auditTitle.text)}</text>
            <text x="374" y="1039" font-family="${getFontStack()}" font-size="${auditSub1.fontSize}" fill="#56826c">${renderTspans(374, auditSub1.lines, auditSub1.fontSize * 1.12)}</text>
          </g>

          ${flowLabelHorizontal(295, 230, config.labels.l0, "#4452b8", "l0", 11.5, 150)}
          ${flowLabelHorizontal(625, 230, config.labels.l1, "#4452b8", "l1", 11, 160)}
          ${flowLabelHorizontal(955, 225, config.labels.l2, "#4452b8", "l2", 11, 170)}
          ${flowLabelVertical(1120, 313, config.labels.l3, "#4452b8", "l3", 11, 150)}
          ${flowLabelHorizontal(955, 442, config.labels.l4, "#2d6a4f", "l4", 11, 180)}
          ${flowLabelHorizontal(625, 442, config.labels.l5, "#2d6a4f", "l5", 10.5, 190)}
          ${flowLabelVertical(460, 624, config.labels.l6, "#2d6a4f", "l6", 11, 180)}
          ${flowLabelHorizontal(610, 800, config.labels.l7, "#2d6a4f", "l7", 10.5, 175)}
          ${flowLabelHorizontal(910, 800, config.labels.l8, "#2d6a4f", "l8", 10.5, 170)}
          ${flowLabelVertical(1060, 895, config.labels.l9, "#2d6a4f", "l9", 10.5, 190)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Defense View`,
        config.introDetail || "Click Start to step through the shared ASI01 defense flow."
      )}
    `;
  }

  function renderDefenseSharedAsi02(config) {
    const agentGoalLayout = fitSingleLine(config.agent.goal, 188, 12, 10);
    const toolTitleLayout = fitSingleLine(config.toolTop.title, 210, 18, 14);
    const toolSub1Layout = fitSingleLine(config.toolTop.sub1, 210, 14, 11);
    const toolSub2Layout = fitWrappedText(config.toolTop.sub2, 212, 12, 10, 2);
    const storeTitleLayout = fitSingleLine(config.store.title, 210, 18, 14);
    const storeSub1Layout = fitSingleLine(config.store.sub1, 210, 14, 11);
    const storeSub2Layout = fitWrappedText(config.store.sub2, 212, 12, 10, 2);
    const patternsTitleLayout = fitSingleLine(config.patterns.title, 320, 18, 14);
    const patternsSub1Layout = fitWrappedText(config.patterns.sub1, 320, 12.5, 10, 2);
    const patternsSub2Layout = fitWrappedText(config.patterns.sub2, 320, 12.5, 10, 2);
    const patternsSub3Layout = fitWrappedText(config.patterns.sub3, 320, 12.5, 10, 2);
    const auditTitleLayout = fitSingleLine(config.audit.title, 360, 12, 10);
    const auditSub1Layout = fitWrappedText(config.audit.sub1, 920, 10.5, 9, 2);
    const auditSub2Layout = fitWrappedText(config.audit.sub2, 920, 10.5, 9, 2);

    const stageDefs = [
      { groupId: "g5", cardId: "D1", key: "d1", y: 560 },
      { groupId: "g6", cardId: "D2", key: "d2", y: 740 },
      { groupId: "g7", cardId: "D3", key: "d3", y: 920 },
      { groupId: "g8", cardId: "D4", key: "d4", y: 1100 },
      { groupId: "g9", cardId: "D5", key: "d5", y: 1280 },
      { groupId: "g10", cardId: "D6", key: "d6", y: 1460 }
    ];

    const stageMarkup = stageDefs.map((stage) => {
      const card = config[stage.key];
      const stageWidth = 380;
      const titleLayout = fitNodeTitleText(card.title, stageWidth, 17, 13, "wide");
      const sub1Layout = fitNodeBodyText(card.sub1, stageWidth, 12.5, 10, "wide");
      const sub2Layout = fitNodeBodyText(card.sub2, stageWidth, 11.5, 10, "wide");
      return `
        <g class="ng" id="${stage.groupId}">
          <rect x="510" y="${stage.y}" width="${stageWidth}" height="138" rx="22" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
          <text x="542" y="${stage.y + 30}" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f">${stage.cardId}</text>
          <text x="700" y="${stage.y + 52}" text-anchor="middle" font-family="${getFontStack()}" font-size="${titleLayout.fontSize}" font-weight="700" fill="#24553f">${renderTspans(700, titleLayout.lines, titleLayout.fontSize * 1.14)}</text>
          <text x="700" y="${stage.y + 90}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub1Layout.fontSize}" fill="#3d735a">${renderTspans(700, sub1Layout.lines, sub1Layout.fontSize * 1.16)}</text>
          <text x="700" y="${stage.y + 122}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub2Layout.fontSize}" fill="#56826c">${renderTspans(700, sub2Layout.lines, sub2Layout.fontSize * 1.16)}</text>
        </g>
      `;
    }).join("");

    const outcomeTitleLayout = fitSingleLine(config.outcome.title, 320, 18, 14);
    const outcomeSub1Layout = fitWrappedText(config.outcome.sub1, 316, 13, 11, 2);
    const outcomeSub2Layout = fitWrappedText(config.outcome.sub2, 316, 11.5, 10, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge safe">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 1780" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>

          <rect width="1400" height="1780" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  AGENT CORE  ·  TOOL LAYER  ·  EXTERNAL DATA</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="240" y="118" width="920" height="1540" rx="30" fill="rgba(45,106,79,0.03)" stroke="#2d6a4f" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="368" y="94" width="664" height="28" rx="14" fill="#ffffff"/>
            <text x="700" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".08em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="180" height="120" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="160" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="160" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
            <text x="160" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>
          </g>

          <line class="co" id="c0s" x1="250" y1="230" x2="340" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="250" y1="230" x2="340" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="340" y="160" width="220" height="146" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="450" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
            <text x="450" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="356" y="270" width="188" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="450" y="292" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoalLayout.fontSize}" font-weight="700" fill="#2d6a4f">${escapeHtml(agentGoalLayout.text)}</text>
          </g>

          <line class="co" id="c1s" x1="560" y1="230" x2="650" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="560" y1="230" x2="650" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="650" y="160" width="240" height="136" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="770" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(toolTitleLayout.text)}</text>
            <text x="770" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolSub1Layout.fontSize}" fill="#6b655c">${escapeHtml(toolSub1Layout.text)}</text>
            <text x="770" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolSub2Layout.fontSize}" fill="#8a847b">${renderTspans(770, toolSub2Layout.lines, toolSub2Layout.fontSize * 1.18)}</text>
          </g>

          <line class="co" id="c2s" x1="890" y1="228" x2="980" y2="228" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="890" y1="228" x2="980" y2="228" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="980" y="160" width="250" height="136" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1105" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${storeTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(storeTitleLayout.text)}</text>
            <text x="1105" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${storeSub1Layout.fontSize}" fill="#6b655c">${escapeHtml(storeSub1Layout.text)}</text>
            <text x="1105" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="${storeSub2Layout.fontSize}" fill="#8a847b">${renderTspans(1105, storeSub2Layout.lines, storeSub2Layout.fontSize * 1.18)}</text>
          </g>

          <line class="co" id="c3s" x1="700" y1="296" x2="700" y2="360" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c3f" x1="700" y1="296" x2="700" y2="360" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="470" y="360" width="460" height="152" rx="24" fill="#fdf0f0" stroke="#b87a45" stroke-width="2.6"/>
            <text x="700" y="402" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternsTitleLayout.fontSize}" font-weight="700" fill="#8d3f2f">${escapeHtml(patternsTitleLayout.text)}</text>
            <text x="700" y="438" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternsSub1Layout.fontSize}" fill="#a04d3a">${renderTspans(700, patternsSub1Layout.lines, patternsSub1Layout.fontSize * 1.18)}</text>
            <text x="700" y="474" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternsSub2Layout.fontSize}" fill="#a04d3a">${renderTspans(700, patternsSub2Layout.lines, patternsSub2Layout.fontSize * 1.18)}</text>
            <text x="700" y="510" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternsSub3Layout.fontSize}" fill="#a04d3a">${renderTspans(700, patternsSub3Layout.lines, patternsSub3Layout.fontSize * 1.18)}</text>
          </g>

          <line class="co" id="c4s" x1="700" y1="512" x2="700" y2="560" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c4f" x1="700" y1="512" x2="700" y2="560" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          ${stageMarkup}

          <line class="co" id="c5s" x1="700" y1="698" x2="700" y2="740" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c5f" x1="700" y1="698" x2="700" y2="740" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
          <line class="co" id="c6s" x1="700" y1="878" x2="700" y2="920" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c6f" x1="700" y1="878" x2="700" y2="920" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
          <line class="co" id="c7s" x1="700" y1="1058" x2="700" y2="1100" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c7f" x1="700" y1="1058" x2="700" y2="1100" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
          <line class="co" id="c8s" x1="700" y1="1238" x2="700" y2="1280" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c8f" x1="700" y1="1238" x2="700" y2="1280" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>
          <line class="co" id="c9s" x1="700" y1="1418" x2="700" y2="1460" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c9f" x1="700" y1="1418" x2="700" y2="1460" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <line class="co" id="c10s" x1="700" y1="1598" x2="700" y2="1640" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c10f" x1="700" y1="1598" x2="700" y2="1640" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g11">
            <rect x="480" y="1640" width="440" height="90" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="700" y="1672" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTitleLayout.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(outcomeTitleLayout.text)}</text>
            <text x="700" y="1700" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub1Layout.fontSize}" fill="#3d735a">${renderTspans(700, outcomeSub1Layout.lines, outcomeSub1Layout.fontSize * 1.16)}</text>
            <text x="700" y="1724" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub2Layout.fontSize}" fill="#56826c">${renderTspans(700, outcomeSub2Layout.lines, outcomeSub2Layout.fontSize * 1.16)}</text>
          </g>

          <g class="ng" id="g12">
            <rect x="90" y="1740" width="1220" height="28" rx="14" fill="#edf7f0" stroke="#9ec1ae" stroke-width="1.8"/>
            <text x="116" y="1757" font-family="${getFontStack()}" font-size="${auditTitleLayout.fontSize}" font-weight="800" fill="#2d6a4f">${escapeHtml(auditTitleLayout.text)}</text>
            <text x="430" y="1757" font-family="${getFontStack()}" font-size="${auditSub1Layout.fontSize}" fill="#56826c">${renderTspans(430, auditSub1Layout.lines, auditSub1Layout.fontSize * 1.12)}</text>
          </g>

          ${flowLabelHorizontal(280, 230, config.labels.l0, "#4452b8", "l0", 11, 150)}
          ${flowLabelHorizontal(605, 230, config.labels.l1, "#4452b8", "l1", 11, 160)}
          ${flowLabelHorizontal(935, 228, config.labels.l2, "#4452b8", "l2", 11, 150)}
          ${flowLabelVertical(700, 328, config.labels.l3, "#4452b8", "l3", 10.5, 220)}
          ${flowLabelVertical(700, 536, config.labels.l4, "#2d6a4f", "l4", 10.5, 180)}
          ${flowLabelVertical(700, 719, config.labels.l5, "#2d6a4f", "l5", 10.5, 180)}
          ${flowLabelVertical(700, 899, config.labels.l6, "#2d6a4f", "l6", 10.5, 170)}
          ${flowLabelVertical(700, 1079, config.labels.l7, "#2d6a4f", "l7", 10.5, 170)}
          ${flowLabelVertical(700, 1259, config.labels.l8, "#2d6a4f", "l8", 10.5, 160)}
          ${flowLabelVertical(700, 1439, config.labels.l9, "#2d6a4f", "l9", 10.5, 160)}
          ${flowLabelVertical(700, 1619, config.labels.l10, "#2d6a4f", "l10", 10.5, 185)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Defense View`,
        config.introDetail || "Click Start to step through the shared ASI02 defense flow."
      )}
    `;
  }

  function renderDefenseSharedCompact(config) {
    const agentGoalLayout = fitSingleLine(config.agent.goal, 176, 12, 10);
    const patternTitleLayout = fitSingleLine(config.patterns.title, 188, 17, 13);
    const patternSub1Layout = fitWrappedText(config.patterns.sub1, 190, 11.5, 9.5, 2);
    const patternSub2Layout = fitWrappedText(config.patterns.sub2, 190, 11.5, 9.5, 2);
    const patternSub3Layout = fitWrappedText(config.patterns.sub3, 190, 11.5, 9.5, 2);
    const auditTitle = fitSingleLine(config.audit.title, 350, 12, 10);
    const auditSub1 = fitWrappedText(config.audit.sub1, 900, 10.5, 9, 2);

    function stageCard(x, y, id, card, tone = "safe", width = 220, height = 158) {
      const title = fitNodeTitleText(card.title, width, 17, 13, "compact");
      const sub1 = fitNodeBodyText(card.sub1, width, 12.5, 10, "compact");
      const sub2 = fitNodeBodyText(card.sub2, width, 11.5, 9.5, "compact");
      const fill = tone === "primary" ? "#eef1ff" : "#edf7f0";
      const stroke = tone === "primary" ? "#4452b8" : "#2d6a4f";
      const idFill = tone === "primary" ? "#4452b8" : "#2d6a4f";
      const titleFill = tone === "primary" ? "#33429f" : "#24553f";
      const sub1Fill = tone === "primary" ? "#5360be" : "#3d735a";
      const sub2Fill = tone === "primary" ? "#6b77cb" : "#56826c";
      return `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="2.8"/>
        <text x="${x + 30}" y="${y + 30}" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="${idFill}">${id}</text>
        <text x="${x + width / 2}" y="${y + 58}" text-anchor="middle" font-family="${getFontStack()}" font-size="${title.fontSize}" font-weight="700" fill="${titleFill}">${renderTspans(x + width / 2, title.lines, title.fontSize * 1.14)}</text>
        <text x="${x + width / 2}" y="${y + 98}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub1.fontSize}" fill="${sub1Fill}">${renderTspans(x + width / 2, sub1.lines, sub1.fontSize * 1.15)}</text>
        <text x="${x + width / 2}" y="${y + 130}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub2.fontSize}" fill="${sub2Fill}">${renderTspans(x + width / 2, sub2.lines, sub2.fontSize * 1.15)}</text>
      `;
    }

    const outcomeTitle = fitSingleLine(config.outcome.title, 280, 18, 14);
    const outcomeSub1 = fitWrappedText(config.outcome.sub1, 260, 12.5, 10, 2);
    const outcomeSub2 = fitWrappedText(config.outcome.sub2, 260, 11.5, 9.5, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge safe">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 1220" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <clipPath id="compactPatternClip"><rect x="1010" y="336" width="220" height="250" rx="20"/></clipPath>
          </defs>
          <rect width="1400" height="1220" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  AGENT CORE  ·  TOOL LAYER  ·  EXTERNAL DATA</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="300" y="118" width="970" height="1070" rx="28" fill="rgba(45,106,79,0.03)" stroke="#2d6a4f" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="390" y="94" width="620" height="28" rx="14" fill="#ffffff"/>
            <text x="700" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".08em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="170" height="120" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="155" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="155" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
            <text x="155" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>
          </g>
          <line class="co" id="c0s" x1="240" y1="230" x2="350" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="240" y1="230" x2="350" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="160" width="220" height="146" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
            <text x="460" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="372" y="270" width="176" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="460" y="292" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoalLayout.fontSize}" font-weight="700" fill="#2d6a4f">${escapeHtml(agentGoalLayout.text)}</text>
          </g>
          <line class="co" id="c1s" x1="570" y1="230" x2="680" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="230" x2="680" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="790" y="222" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.toolTop.title)}</text>
            <text x="790" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.toolTop.sub1)}</text>
            <text x="790" y="282" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#8a847b">${escapeHtml(config.toolTop.sub2)}</text>
          </g>
          <line class="co" id="c2s" x1="900" y1="225" x2="1010" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="900" y1="225" x2="1010" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="1010" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1120" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.store.title)}</text>
            <text x="1120" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.store.sub1)}</text>
            <text x="1120" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#8a847b">${escapeHtml(config.store.sub2)}</text>
          </g>
          <line class="co" id="c3s" x1="1120" y1="290" x2="1120" y2="336" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c3f" x1="1120" y1="290" x2="1120" y2="336" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="1010" y="336" width="220" height="250" rx="20" fill="#fdf0f0" stroke="#b87a45" stroke-width="2.3"/>
            <text x="1120" y="378" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternTitleLayout.fontSize}" font-weight="700" fill="#8d3f2f">${escapeHtml(patternTitleLayout.text)}</text>
            <text x="1120" y="434" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternSub1Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub1Layout.lines, patternSub1Layout.fontSize * 1.18)}</text>
            <text x="1120" y="494" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternSub2Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub2Layout.lines, patternSub2Layout.fontSize * 1.18)}</text>
            <text x="1120" y="554" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternSub3Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub3Layout.lines, patternSub3Layout.fontSize * 1.18)}</text>
          </g>
          <line class="co" id="c4s" x1="1010" y1="458" x2="900" y2="458" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl" id="c4f" x1="1010" y1="458" x2="900" y2="458" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">${stageCard(680, 356, "D1", config.d1)}</g>
          <line class="co" id="c5s" x1="680" y1="436" x2="570" y2="436" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c5f" x1="680" y1="436" x2="570" y2="436" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">${stageCard(350, 356, "D2", config.d2, "primary")}</g>
          <line class="co" id="c6s" x1="460" y1="514" x2="460" y2="606" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c6f" x1="460" y1="514" x2="460" y2="606" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g7">${stageCard(250, 620, "D3", config.d3)}</g>
          <line class="co" id="c7s" x1="470" y1="700" x2="590" y2="700" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c7f" x1="470" y1="700" x2="590" y2="700" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g8">${stageCard(590, 620, "D4", config.d4)}</g>
          <line class="co" id="c8s" x1="810" y1="700" x2="930" y2="700" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c8f" x1="810" y1="700" x2="930" y2="700" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g9">${stageCard(930, 620, "D5", config.d5)}</g>
          <line class="co" id="c9s" x1="1040" y1="778" x2="1040" y2="864" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c9f" x1="1040" y1="778" x2="1040" y2="864" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g10">${stageCard(920, 874, "D6", config.d6)}</g>
          <line class="co" id="c10s" x1="1040" y1="1032" x2="1040" y2="1062" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c10f" x1="1040" y1="1032" x2="1040" y2="1062" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g11">
            <rect x="900" y="1062" width="280" height="92" rx="18" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="1040" y="1094" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTitle.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(outcomeTitle.text)}</text>
            <text x="1040" y="1122" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub1.fontSize}" fill="#3d735a">${renderTspans(1040, outcomeSub1.lines, outcomeSub1.fontSize * 1.16)}</text>
            <text x="1040" y="1146" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub2.fontSize}" fill="#56826c">${renderTspans(1040, outcomeSub2.lines, outcomeSub2.fontSize * 1.14)}</text>
          </g>
          <g class="ng" id="g12">
            <rect x="60" y="1170" width="1280" height="28" rx="14" fill="#edf7f0" stroke="#9ec1ae" stroke-width="1.8"/>
            <text x="86" y="1187" font-family="${getFontStack()}" font-size="${auditTitle.fontSize}" font-weight="800" fill="#2d6a4f">${escapeHtml(auditTitle.text)}</text>
            <text x="374" y="1187" font-family="${getFontStack()}" font-size="${auditSub1.fontSize}" fill="#56826c">${renderTspans(374, auditSub1.lines, auditSub1.fontSize * 1.12)}</text>
          </g>

          ${flowLabelHorizontal(295, 230, config.labels.l0, "#4452b8", "l0", 11, 150)}
          ${flowLabelHorizontal(625, 230, config.labels.l1, "#4452b8", "l1", 11, 165)}
          ${flowLabelHorizontal(955, 225, config.labels.l2, "#4452b8", "l2", 11, 160)}
          ${flowLabelVertical(1120, 313, config.labels.l3, "#4452b8", "l3", 10.5, 170)}
          ${flowLabelHorizontal(955, 458, config.labels.l4, "#2d6a4f", "l4", 10.5, 170)}
          ${flowLabelHorizontal(625, 436, config.labels.l5, "#2d6a4f", "l5", 10.5, 150)}
          ${flowLabelVertical(460, 560, config.labels.l6, "#2d6a4f", "l6", 10.5, 160)}
          ${flowLabelHorizontal(530, 700, config.labels.l7, "#2d6a4f", "l7", 10.5, 140)}
          ${flowLabelHorizontal(870, 700, config.labels.l8, "#2d6a4f", "l8", 10.5, 140)}
          ${flowLabelVertical(1040, 821, config.labels.l9, "#2d6a4f", "l9", 10.5, 150)}
          ${flowLabelVertical(1040, 1047, config.labels.l10, "#2d6a4f", "l10", 10.5, 160)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Defense View`,
        config.introDetail || "Click Start to step through the shared defense flow."
      )}
    `;
  }

  function renderDefenseSharedCompactAsi02(config) {
    const agentGoalLayout = fitSingleLine(config.agent.goal, 176, 12, 10);
    const patternTitleLayout = fitSingleLine(config.patterns.title, 188, 17, 13);
    const patternSub1Layout = fitWrappedText(config.patterns.sub1, 190, 11.5, 9.5, 2);
    const patternSub2Layout = fitWrappedText(config.patterns.sub2, 190, 11.5, 9.5, 2);
    const patternSub3Layout = fitWrappedText(config.patterns.sub3, 190, 11.5, 9.5, 2);
    const auditTitle = fitSingleLine(config.audit.title, 350, 12, 10);
    const auditSub1 = fitWrappedText(config.audit.sub1, 900, 10.5, 9, 2);
    const stageCardWidth = 220;
    const stageCardHeight = 158;
    const row3Y = 620;
    const row3CenterY = row3Y + stageCardHeight / 2;
    const row3LabelY = row3CenterY - 12;
    const outcomeX = 980;
    const outcomeY = 860;
    const outcomeCenterX = outcomeX + 140;
    const outcomeBottomY = outcomeY + 92;

    function stageCard(x, y, id, card, tone = "safe", width = stageCardWidth, height = stageCardHeight) {
      const title = fitNodeTitleText(card.title, width, 17, 13, "compact");
      const sub1 = fitNodeBodyText(card.sub1, width, 12.5, 10, "compact");
      const sub2 = fitNodeBodyText(card.sub2, width, 11.5, 9.5, "compact");
      const fill = tone === "primary" ? "#eef1ff" : "#edf7f0";
      const stroke = tone === "primary" ? "#4452b8" : "#2d6a4f";
      const idFill = tone === "primary" ? "#4452b8" : "#2d6a4f";
      const titleFill = tone === "primary" ? "#33429f" : "#24553f";
      const sub1Fill = tone === "primary" ? "#5360be" : "#3d735a";
      const sub2Fill = tone === "primary" ? "#6b77cb" : "#56826c";
      return `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="2.8"/>
        <text x="${x + 30}" y="${y + 30}" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="${idFill}">${id}</text>
        <text x="${x + width / 2}" y="${y + 58}" text-anchor="middle" font-family="${getFontStack()}" font-size="${title.fontSize}" font-weight="700" fill="${titleFill}">${renderTspans(x + width / 2, title.lines, title.fontSize * 1.14)}</text>
        <text x="${x + width / 2}" y="${y + 98}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub1.fontSize}" fill="${sub1Fill}">${renderTspans(x + width / 2, sub1.lines, sub1.fontSize * 1.15)}</text>
        <text x="${x + width / 2}" y="${y + 130}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub2.fontSize}" fill="${sub2Fill}">${renderTspans(x + width / 2, sub2.lines, sub2.fontSize * 1.15)}</text>
      `;
    }

    const outcomeTitle = fitSingleLine(config.outcome.title, 280, 18, 14);
    const outcomeSub1 = fitWrappedText(config.outcome.sub1, 260, 12.5, 10, 2);
    const outcomeSub2 = fitWrappedText(config.outcome.sub2, 260, 11.5, 9.5, 2);

    return `
      <style>${baseStyles()}</style>
      <div class="badge safe">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 1080" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>
          <rect width="1400" height="1080" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  AGENT CORE  ·  TOOL LAYER  ·  EXTERNAL DATA</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="170" height="120" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="155" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="155" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
            <text x="155" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>
          </g>
          <line class="co" id="c0s" x1="240" y1="230" x2="350" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="240" y1="230" x2="350" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="160" width="220" height="146" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
            <text x="460" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="372" y="270" width="176" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="460" y="292" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoalLayout.fontSize}" font-weight="700" fill="#2d6a4f">${escapeHtml(agentGoalLayout.text)}</text>
          </g>
          <line class="co" id="c1s" x1="570" y1="230" x2="680" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="230" x2="680" y2="230" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="790" y="222" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.toolTop.title)}</text>
            <text x="790" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.toolTop.sub1)}</text>
            <text x="790" y="282" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#8a847b">${escapeHtml(config.toolTop.sub2)}</text>
          </g>
          <line class="co" id="c2s" x1="900" y1="225" x2="1010" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="900" y1="225" x2="1010" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="1010" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1120" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.store.title)}</text>
            <text x="1120" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.store.sub1)}</text>
            <text x="1120" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#8a847b">${escapeHtml(config.store.sub2)}</text>
          </g>
          <line class="co" id="c3s" x1="1120" y1="290" x2="1120" y2="336" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c3f" x1="1120" y1="290" x2="1120" y2="336" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="1010" y="336" width="220" height="250" rx="20" fill="#fdf0f0" stroke="#b87a45" stroke-width="2.3"/>
            <text x="1120" y="378" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternTitleLayout.fontSize}" font-weight="700" fill="#8d3f2f">${escapeHtml(patternTitleLayout.text)}</text>
            <text x="1120" y="434" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternSub1Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub1Layout.lines, patternSub1Layout.fontSize * 1.18)}</text>
            <text x="1120" y="494" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternSub2Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub2Layout.lines, patternSub2Layout.fontSize * 1.18)}</text>
            <text x="1120" y="554" text-anchor="middle" font-family="${getFontStack()}" font-size="${patternSub3Layout.fontSize}" fill="#a04d3a">${renderTspans(1120, patternSub3Layout.lines, patternSub3Layout.fontSize * 1.18)}</text>
          </g>
          <line class="co" id="c4s" x1="1010" y1="458" x2="900" y2="458" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl" id="c4f" x1="1010" y1="458" x2="900" y2="458" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">${stageCard(680, 356, "D1", config.d1)}</g>
          <line class="co" id="c5s" x1="680" y1="436" x2="570" y2="436" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c5f" x1="680" y1="436" x2="570" y2="436" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">${stageCard(350, 356, "D2", config.d2, "primary")}</g>
          <line class="co" id="c6s" x1="460" y1="514" x2="460" y2="620" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c6f" x1="460" y1="514" x2="460" y2="620" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g7">${stageCard(350, row3Y, "D3", config.d3)}</g>
          <line class="co" id="c6as" x1="570" y1="${row3CenterY}" x2="680" y2="${row3CenterY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c6af" x1="570" y1="${row3CenterY}" x2="680" y2="${row3CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g8">${stageCard(680, row3Y, "D4", config.d4)}</g>
          <line class="co" id="c8bs" x1="900" y1="${row3CenterY}" x2="1010" y2="${row3CenterY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c8bf" x1="900" y1="${row3CenterY}" x2="1010" y2="${row3CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g9">${stageCard(1010, row3Y, "D5", config.d5)}</g>

          <line class="co" id="c9s" x1="1120" y1="778" x2="1120" y2="${outcomeY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c9f" x1="1120" y1="778" x2="1120" y2="${outcomeY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g10">
            <rect x="${outcomeX}" y="${outcomeY}" width="280" height="92" rx="18" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="${outcomeCenterX}" y="892" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTitle.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(outcomeTitle.text)}</text>
            <text x="${outcomeCenterX}" y="920" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub1.fontSize}" fill="#3d735a">${renderTspans(outcomeCenterX, outcomeSub1.lines, outcomeSub1.fontSize * 1.16)}</text>
            <text x="${outcomeCenterX}" y="944" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub2.fontSize}" fill="#56826c">${renderTspans(outcomeCenterX, outcomeSub2.lines, outcomeSub2.fontSize * 1.14)}</text>
          </g>
          <g class="ng" id="g11">
            <rect x="60" y="1000" width="1280" height="28" rx="14" fill="#edf7f0" stroke="#9ec1ae" stroke-width="1.8"/>
            <text x="86" y="1017" font-family="${getFontStack()}" font-size="${auditTitle.fontSize}" font-weight="800" fill="#2d6a4f">${escapeHtml(auditTitle.text)}</text>
            <text x="374" y="1017" font-family="${getFontStack()}" font-size="${auditSub1.fontSize}" fill="#56826c">${renderTspans(374, auditSub1.lines, auditSub1.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c10s" x1="${outcomeCenterX}" y1="${outcomeBottomY}" x2="${outcomeCenterX}" y2="1000" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c10f" x1="${outcomeCenterX}" y1="${outcomeBottomY}" x2="${outcomeCenterX}" y2="1000" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          ${flowLabelHorizontal(295, 230, config.labels.l0, "#4452b8", "l0", 11, 150)}
          ${flowLabelHorizontal(625, 230, config.labels.l1, "#4452b8", "l1", 11, 165)}
          ${flowLabelHorizontal(955, 225, config.labels.l2, "#4452b8", "l2", 11, 160)}
          ${flowLabelVertical(1120, 313, config.labels.l3, "#4452b8", "l3", 10.5, 170)}
          ${flowLabelHorizontal(955, 458, config.labels.l4, "#2d6a4f", "l4", 10.5, 170)}
          ${flowLabelHorizontal(625, 436, config.labels.l5, "#2d6a4f", "l5", 10.5, 150)}
          ${flowLabelVertical(460, 567, config.labels.l6, "#2d6a4f", "l6", 10.5, 160)}
          ${flowLabelHorizontal(625, row3CenterY, config.labels.l7, "#2d6a4f", "l7", 10.5, 165)}
          ${flowLabelHorizontal(955, row3CenterY, config.labels.l8, "#2d6a4f", "l8", 10.5, 160)}
          ${flowLabelVertical(1120, (778 + outcomeY) / 2, config.labels.l9, "#2d6a4f", "l9", 10.5, 160)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Defense View`,
        config.introDetail || "Click Start to step through the shared defense flow."
      )}
    `;
  }

  function renderDefense(config) {
    return `
      <style>${baseStyles()}</style>
      <div class="badge safe">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 860" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>
          <rect width="1400" height="860" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  CONTENT CONTROL  ·  AGENT CORE  ·  POLICY  ·  TOOL</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="300" y="118" width="970" height="520" rx="28" fill="rgba(45,106,79,0.03)" stroke="#2d6a4f" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="500" y="94" width="400" height="28" rx="14" fill="#ffffff"/>
            <text x="700" y="114" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="170" height="120" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="155" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="155" y="252" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
            <text x="155" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>
          </g>

          <line class="co" id="c0s" x1="240" y1="230" x2="350" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="240" y1="230" x2="350" y2="230" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="160" width="220" height="140" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="460" y="218" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#24553f">${escapeHtml(config.guard.title)}</text>
            <text x="460" y="248" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#3d735a">${escapeHtml(config.guard.sub1)}</text>
            <text x="460" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#56826c">${escapeHtml(config.guard.sub2)}</text>
          </g>

          <line class="co" id="c1s" x1="570" y1="230" x2="680" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="230" x2="680" y2="230" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="160" width="220" height="140" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="790" y="218" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
            <text x="790" y="248" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="724" y="266" width="132" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="790" y="287" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#2d6a4f">${escapeHtml(config.agent.goal)}</text>
          </g>

          <line class="co" id="c2s" x1="790" y1="300" x2="790" y2="386" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="790" y1="300" x2="790" y2="386" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="680" y="386" width="220" height="150" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="790" y="444" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#24553f">${escapeHtml(config.check.title)}</text>
            <text x="790" y="474" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#3d735a">${escapeHtml(config.check.sub1)}</text>
            <text x="790" y="502" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#56826c">${escapeHtml(config.check.sub2)}</text>
          </g>

          <line class="co" id="c3s" x1="900" y1="461" x2="1010" y2="461" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c3f" x1="900" y1="461" x2="1010" y2="461" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="1010" y="386" width="220" height="150" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1120" y="444" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.tool.title)}</text>
            <text x="1120" y="474" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#6b655c">${escapeHtml(config.tool.sub1)}</text>
            <text x="1120" y="502" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#8a847b">${escapeHtml(config.tool.sub2)}</text>
          </g>

          <line class="co" id="c4s" x1="1120" y1="536" x2="1120" y2="646" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c4f" x1="1120" y1="536" x2="1120" y2="646" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="980" y="646" width="280" height="130" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="1120" y="700" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#24553f">${escapeHtml(config.outcome.title)}</text>
            <text x="1120" y="732" text-anchor="middle" font-family="${getFontStack()}" font-size="14" fill="#3d735a">${escapeHtml(config.outcome.sub1)}</text>
            <text x="1120" y="758" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#56826c">${escapeHtml(config.outcome.sub2)}</text>
          </g>

          ${flowLabelHorizontal(295, 230, config.labels.l0, "#2d6a4f", "l0")}
          ${flowLabelHorizontal(625, 230, config.labels.l1, "#2d6a4f", "l1")}
          ${flowLabelVertical(790, 343, config.labels.l2, "#2d6a4f", "l2")}
          ${flowLabelHorizontal(955, 461, config.labels.l3, "#2d6a4f", "l3")}
          ${flowLabelVertical(1120, 591, config.labels.l4, "#2d6a4f", "l4")}
          ${flowLabel(1120, 638, config.labels.l5, "#2d6a4f", "l5")}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Defense View`,
        config.introDetail || "Click Start to step through the guarded flow."
      )}
    `;
  }

  function panelMarkup(title, detail) {
    return `
      <div class="panel" id="panel">
        <div class="pt">
          <div class="ps" id="ps">Click to begin</div>
          <div class="ph" id="ph">${escapeHtml(title)}</div>
          <div class="pd" id="pd">${escapeHtml(detail)}</div>
        </div>
        <button class="br" id="breset" onclick="reset()" style="display:none">↺ Restart</button>
        <button class="bn" id="bnext" onclick="advance()">▶ Start</button>
      </div>
    `;
  }

  function flowLabelMarkup(x, y, text, color, id, fontSize, maxWidth, className) {
    const startSize = fontSize || 13;
    const minSize = Math.min(startSize, 11);
    const layout = fitWrappedText(text, maxWidth || 210, startSize, minSize, 2);
    return `
      <g class="lb${className ? ` ${className}` : ""}" id="${id}">
        <text x="${x}" y="${y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${layout.fontSize}" font-weight="700" fill="${color}" stroke="#fffdf8" stroke-width="6" paint-order="stroke fill" stroke-linejoin="round">
          ${renderTspans(x, layout.lines, layout.fontSize * 1.18)}
        </text>
      </g>
    `;
  }

  function flowLabel(x, y, text, color, id, fontSize, maxWidth) {
    return flowLabelMarkup(x, y, text, color, id, fontSize, maxWidth, "");
  }

  function flowLabelHorizontal(x, lineY, text, color, id, fontSize, maxWidth) {
    return flowLabelMarkup(
      x,
      lineY,
      text,
      color,
      id,
      fontSize,
      getFlowLabelMaxWidth("horizontal", maxWidth),
      "lb-h"
    );
  }

  function flowLabelVertical(x, lineCenterY, text, color, id, fontSize, maxWidth) {
    return flowLabelMarkup(
      x,
      lineCenterY,
      text,
      color,
      id,
      fontSize,
      getFlowLabelMaxWidth("vertical", maxWidth),
      "lb-v"
    );
  }

  function getFlowLabelMaxWidth(orientation, requestedWidth) {
    const tokenWidth = orientation === "vertical"
      ? DIAGRAM_TOKENS.flowLabelMaxWidth.vertical
      : DIAGRAM_TOKENS.flowLabelMaxWidth.horizontal;
    return requestedWidth ? Math.min(requestedWidth, tokenWidth) : tokenWidth;
  }

  function getNodeTextWidth(nodeWidth, role, preset = "compact") {
    const safeArea = DIAGRAM_TOKENS.nodeTextSafeArea[preset] || DIAGRAM_TOKENS.nodeTextSafeArea.compact;
    const inset = role === "title" ? safeArea.titleInsetX : safeArea.bodyInsetX;
    return Math.max(40, nodeWidth - inset * 2);
  }

  function fitNodeTitleText(text, nodeWidth, startFontSize, minFontSize, preset = "compact") {
    return fitWrappedText(
      text,
      getNodeTextWidth(nodeWidth, "title", preset),
      startFontSize,
      minFontSize,
      DIAGRAM_TOKENS.nodeTextMaxLines.title
    );
  }

  function fitNodeBodyText(text, nodeWidth, startFontSize, minFontSize, preset = "compact") {
    return fitWrappedText(
      text,
      getNodeTextWidth(nodeWidth, "body", preset),
      startFontSize,
      minFontSize,
      DIAGRAM_TOKENS.nodeTextMaxLines.body
    );
  }

  function innerPill(centerX, centerY, width, text, fill, stroke, textColor, fontSize, fontWeight) {
    const layout = fitWrappedText(text, width - 20, fontSize, 11, 2);
    const lineHeight = Math.round(layout.fontSize * 1.18);
    const lines = layout.lines;
    const height = lines.length === 1 ? 34 : 48;
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    const radius = lines.length === 1 ? 10 : 12;
    const firstLineY = lines.length === 1
      ? centerY + Math.round(layout.fontSize * 0.32)
      : centerY - 4;
    const secondLineY = centerY + lineHeight - 4;

    return `
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
      <text x="${centerX}" y="${firstLineY}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${layout.fontSize}" font-weight="${fontWeight}" fill="${textColor}">${escapeHtml(lines[0])}</text>
      ${lines[1] ? `<text x="${centerX}" y="${secondLineY}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${Math.max(11, layout.fontSize - 1)}" font-weight="${fontWeight}" fill="${textColor}">${escapeHtml(lines[1])}</text>` : ""}
    `;
  }

  function fitSingleLine(text, width, startFontSize, minFontSize) {
    const value = String(text || "");
    for (let size = startFontSize; size >= minFontSize; size -= 1) {
      if (estimateTextWidth(value, size) <= width) {
        return { text: value, fontSize: size };
      }
    }

    let trimmed = value;
    while (trimmed.length > 1 && estimateTextWidth(`${trimmed}\u2026`, minFontSize) > width) {
      trimmed = trimmed.slice(0, -1).trimEnd();
    }

    return { text: `${trimmed}\u2026`, fontSize: minFontSize };
  }

  function fitWrappedText(text, width, startFontSize, minFontSize, maxLines) {
    const value = String(text || "");
    for (let size = startFontSize; size >= minFontSize; size -= 1) {
      const lines = wrapText(value, width, size, maxLines);
      if (!lines.truncated) return { lines, fontSize: size };
    }
    return { lines: wrapText(value, width, minFontSize, maxLines, true), fontSize: minFontSize };
  }

  function wrapText(text, width, fontSize, maxLines, forceEllipsis) {
    const words = String(text || "")
      .split(/\s+/)
      .filter(Boolean)
      .flatMap((word) => splitLongToken(word, width, fontSize));
    if (!words.length) return Object.assign([""], { truncated: false });

    const lines = [];
    let current = words.shift();

    words.forEach((word) => {
      const candidate = `${current} ${word}`;
      if (estimateTextWidth(candidate, fontSize) <= width) {
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
    while (lastLine.length > 1 && estimateTextWidth(`${lastLine}\u2026`, fontSize) > width) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    trimmed[lastIndex] = `${lastLine}\u2026`;
    return Object.assign(trimmed, { truncated: true });
  }

  function splitLongToken(token, width, fontSize) {
    const value = String(token || "");
    if (!value) return [];
    if (estimateTextWidth(value, fontSize) <= width) return [value];

    const segments = [];
    let current = "";

    Array.from(value).forEach((char) => {
      const candidate = `${current}${char}`;
      if (!current || estimateTextWidth(candidate, fontSize) <= width) {
        current = candidate;
        return;
      }
      segments.push(current);
      current = char;
    });

    if (current) segments.push(current);
    return segments;
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

  function getFontStack() {
    return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";
  }

  function baseStyles() {
    return `
      *{margin:0;padding:0;box-sizing:border-box;}
      :root{--bg:#f6f4ef;--surface:#ffffff;--line:#d9d2c7;--text:#2d2b27;--muted:#7f7a72;--primary:#4452b8;--safe:#2d6a4f;--danger:#ad3535;--danger-soft:#fff8f8;--safe-soft:#edf7f0;--flow-label-gap-horizontal:${DIAGRAM_TOKENS.flowLabelGap.horizontal};--flow-label-gap-vertical:${DIAGRAM_TOKENS.flowLabelGap.vertical};}
      body{width:100%;background:var(--bg);font-family:${getFontStack()};display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 16px 14px;overflow-x:hidden;}
      .badge{display:none;background:var(--danger-soft);color:#7f2626;border:1px solid #e1a2a2;border-radius:20px;font-size:10px;font-weight:700;padding:3px 12px;margin-bottom:8px;text-align:center;}
      .badge.safe{background:var(--safe-soft);color:var(--safe);border-color:#bdddc8;}
      h1{display:none;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8c877f;margin-bottom:10px;text-align:center;}
      .dots{display:flex;align-items:center;gap:0;margin-bottom:8px;}
      .dot{width:7px;height:7px;border-radius:50%;background:#D3D1C7;border:1px solid #B4B2A9;transition:all .3s;}
      .sep{width:14px;height:1px;background:#D3D1C7;}
      .dot.done{background:#b8bdf5;border-color:#8490e0;}
      .dot.active{background:var(--primary);border-color:#32408f;box-shadow:0 0 6px rgba(68,82,184,.35);}
      .dot.atk{background:var(--danger)!important;border-color:#7f2626!important;box-shadow:0 0 6px rgba(156,47,47,.35)!important;}
      .wrap{width:100%;max-width:1360px;background:${frameBare ? "transparent" : "var(--surface)"};border:${frameBare ? "0" : "1px solid var(--line)"};border-radius:${frameBare ? "0" : "20px"};overflow:${frameBare ? "visible" : "hidden"};}
      svg{width:100%;display:block;margin-top:${externalPanel ? "-88px" : "0"};}
      svg > text:first-of-type,svg > line:first-of-type{display:none;}
      .ng{opacity:0;transition:opacity .5s;}
      .ng.v{opacity:1;}
      .co{opacity:0;transition:opacity .4s;}
      .co.v{opacity:1;}
      .fl{stroke-dasharray:14 8;animation:da 1.1s linear infinite;opacity:0;transition:opacity .4s;}
      .fl.v{opacity:1;}
      .fl.a{stroke-dasharray:10 6;animation:da .65s linear infinite;}
      @keyframes da{to{stroke-dashoffset:-22;}}
      @media(prefers-reduced-motion:reduce){.fl{animation:none;}}
      .lb{opacity:0;transition:opacity .3s .15s;}
      .lb.v{opacity:1;}
      .lb.lb-h text{transform:translateY(calc(var(--flow-label-gap-horizontal) * -1px));}
      .lb.lb-v text{transform:translateY(calc(var(--flow-label-gap-vertical) * -1px));}
      .az{opacity:0;transition:opacity .7s;}
      .az.v{opacity:1;}
      .panel{margin-top:10px;width:100%;max-width:1360px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 18px;min-height:78px;display:${externalPanel ? "none" : "flex"};align-items:center;gap:12px;transition:background .4s,border-color .4s;}
      .panel.atk{background:var(--danger-soft);border-color:#e1a2a2;}
      .pt{flex:1;}
      .ps{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);margin-bottom:3px;}
      .ps.a{color:var(--danger);}
      .ph{font-size:15px;font-weight:700;color:var(--text);margin-bottom:2px;}
      .pd{font-size:13px;color:var(--muted);line-height:1.45;max-width:92ch;}
      .bn{background:var(--primary);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background .2s,transform .1s;}
      .bn:hover{background:#32408f;transform:translateY(-1px);}
      .bn.atk{background:var(--danger);}
      .bn.atk:hover{background:#7f2626;}
      .bn:disabled{background:#d5d0c8;color:#7f7a72;cursor:not-allowed;transform:none;}
      .br{flex-shrink:0;background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:10px;padding:8px 13px;font-size:12px;cursor:pointer;transition:all .2s;}
      .br:hover{color:#444;border-color:#b8b0a4;}
      @media(max-width:720px){
        body{padding:6px 8px 14px;}
        .badge{font-size:9px;padding:3px 10px;margin-bottom:6px;}
        h1{font-size:10px;margin-bottom:8px;}
        .wrap{border-radius:16px;}
        svg{margin-top:${externalPanel ? "-64px" : "0"};}
        .dots{margin-bottom:6px;}
        .panel{margin-top:8px;padding:12px 14px;align-items:flex-start;flex-wrap:wrap;gap:10px;min-height:0;}
        .pt{flex:1 1 100%;min-width:0;}
        .ph{font-size:14px;}
        .pd{font-size:13px;max-width:none;}
        .bn,.br{flex:1 1 calc(50% - 5px);text-align:center;min-height:38px;}
      }
    `;
  }
})();
