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
      horizontal: 12,
      vertical: 12
    },
    flowConnectorEndInset: {
      horizontal: 16,
      vertical: 12
    },
    flowLabelFontSize: {
      horizontal: 11.5,
      vertical: 11.5
    },
    flowLabelMinFontSize: {
      horizontal: 10.5,
      vertical: 10.5
    },
    flowLabelMaxWidth: {
      horizontal: 160,
      vertical: 176
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
  const REVIEW_ATTACK_LAYOUT = {
    entry: { x: 20, y: 170, width: 230, height: 122 },
    agent: { x: 340, y: 156, width: 220, height: 150 },
    middle: { x: 700, y: 150, width: 250, height: 168 },
    reviewer: { x: 1050, y: 156, width: 240, height: 150 },
    reviewerTall: { x: 1050, y: 150, width: 240, height: 168 },
    context: { x: 790, y: 410, width: 310, height: 164 },
    decision: { x: 350, y: 668, width: 240, height: 146 },
    action: { x: 700, y: 668, width: 220, height: 146 },
    outcome: { x: 1060, y: 656, width: 250, height: 168 },
    zone: { x: 690, y: 118, width: 620, height: 456, labelRectX: 720, labelRectY: 86, labelRectWidth: 560, labelX: 1000, labelY: 98 },
    lines: {
      topY: 230,
      reviewerBridgeY: 382,
      reviewerContextY: 410,
      contextDecisionY: 492,
      decisionActionY: 742,
      actionOutcomeY: 742,
      outcomeEvidenceY: 710
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
      { show: ["g3", "g4az"], co: ["c2s"], fl: ["c2f", "c3f"], lb: ["l2", "l3"], atk: false },
      { show: ["g4ctx"], co: ["ias"], fl: ["iaf"], lb: ["la1", "la2"], atk: true },
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
      { show: ["g3cue"], co: ["c3s", "c3v"], fl: ["c3f", "c3vf"], lb: ["l3"], atk: false },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["la1"], atk: true },
      { show: ["g6"], co: ["c5s"], fl: ["c5f"], lb: ["l4"], atk: true },
      { show: ["g7"], co: ["c6s"], fl: ["c6f"], lb: ["l5", "l6"], atk: true }
    ];
  }

  function buildAttackDriftSteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: true },
      { show: ["g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: true },
      { show: ["g2", "gzone"], co: ["c1s", "c1bs"], fl: ["c1f", "c1bf"], lb: ["l1", "l2"], atk: true },
      { show: ["g3", "g3cue"], co: ["c2s"], fl: ["c2f"], lb: ["l3"], atk: true },
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
      { show: ["g3"], co: ["c2s"], fl: ["c2f"], lb: ["l2"], atk: true },
      { show: ["gzone", "g4"], co: ["c3s"], fl: ["c3f"], lb: ["la1"], atk: true },
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
    const payloadVisible2Layout = config.payload.visible2
      ? fitWrappedText(config.payload.visible2, 188, 8.4, 7.4, 3)
      : null;
    const payloadHidden1Layout = fitWrappedText(config.payload.hidden1, 190, 12, 10, 2);
    const payloadHidden2Layout = fitWrappedText(config.payload.hidden2, 190, 14, 11, 2);
    const payloadHidden3Layout = config.payload.hidden3
      ? fitWrappedText(config.payload.hidden3, 190, 12, 10, 2)
      : null;
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
    const toolBottomNoteLayout = config.toolBottom.note
      ? fitSingleLine(config.toolBottom.note, 190, 10, 8.2)
      : null;
    const toolBottomSub2Y = toolBottomNoteLayout
      ? (toolBottomSub2Layout.lines.length > 1 ? 768 : 776)
      : (toolBottomSub2Layout.lines.length > 1 ? 772 : 782);
    const toolBottomNoteY = toolBottomNoteLayout ? 796 : null;
    const outcomeTopLayout = fitSingleLine(config.outcome.top, 188, 12, 10);
    const outcomeTopSubLayout = fitWrappedText(config.outcome.topSub, 188, 10, 8, 2);
    const outcomeTopSubY = outcomeTopSubLayout.lines.length > 1 ? 696 : 704;
    const outcomeBottomTitleLayout = fitWrappedText(config.outcome.bottomTitle, 196, 18, 13, 2);
    const outcomeBottomLayout = fitWrappedText(config.outcome.bottom, 184, 13, 10, 2);
    const outcomeBottomTitleY = outcomeBottomTitleLayout.lines.length > 1 ? 756 : 768;
    const outcomeBottomY = outcomeBottomLayout.lines.length > 1 ? 792 : 798;
    const payloadDividerY = payloadVisible2Layout ? 426 : 408;
    const payloadVisibleY = payloadVisible2Layout
      ? (payloadVisibleLayout.lines.length > 1 ? 382 : 388)
      : (payloadVisibleLayout.lines.length > 1 ? 384 : 391);
    const payloadVisible2Y = payloadVisible2Layout
      ? payloadVisibleY + ((payloadVisibleLayout.lines.length - 1) * 14) + 18
      : null;
    const payloadHiddenTitleY = payloadVisible2Layout ? 448 : 454;
    const payloadHidden1Y = payloadVisible2Layout ? 474 : 480;
    const payloadHidden2Y = payloadHidden1Y + (payloadHidden1Layout.lines.length - 1) * 14 + 26;
    const payloadHidden3Y = payloadHidden3Layout
      ? payloadHidden2Y + (payloadHidden2Layout.lines.length - 1) * 14 + 24
      : null;
    const payloadNoteY = payloadHidden3Y
      ? payloadHidden3Y + ((payloadHidden3Layout.lines.length - 1) * 13) + 24
      : 575;
    const payloadHumanY = payloadNoteY + (payloadNoteLayout ? payloadNoteLayout.lines.length * 11 + 8 : 0);
    const attackContextLabel = config.labels.l5b ? `${config.labels.l5a} ${config.labels.l5b}` : config.labels.l5a;
    const l3LabelY = config.labelPositions?.l3Y || 308;
    const l8LabelX = config.labelPositions?.l8X || 955;
    const l8LabelY = config.labelPositions?.l8Y || 736;
    const outcomeConnectorEndX = config.connectorPositions?.outcomeEndX || 1010;

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
            <rect x="500" y="86" width="400" height="20" rx="10" fill="#ffffff"/>
            <text x="700" y="98" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#ad3535" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
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

            <rect x="1010" y="326" width="220" height="${payloadDividerY - 326}" rx="20" fill="#fcfbf8"/>
            <rect x="1010" y="${payloadDividerY - 32}" width="220" height="32" fill="#fcfbf8"/>
            <rect x="1010" y="${payloadDividerY}" width="220" height="${556 - payloadDividerY}" fill="#fdf0f0" clip-path="url(#dc)"/>
            <line x1="1014" y1="${payloadDividerY}" x2="1226" y2="${payloadDividerY}" stroke="#ddd6cb" stroke-width="1.4"/>
            <rect x="1010" y="326" width="220" height="230" rx="20" fill="none" stroke="#b87a45" stroke-width="2.3"/>
            <text x="1120" y="366" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(payloadTitleLayout.text)}</text>
            <text x="1120" y="${payloadVisibleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadVisibleLayout.fontSize}" fill="#8a847b">${renderTspans(1120, payloadVisibleLayout.lines, payloadVisibleLayout.fontSize * 1.18)}</text>
            ${payloadVisible2Layout ? `<text x="1120" y="${payloadVisible2Y}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="${payloadVisible2Layout.fontSize}" fill="#9a5a5a">${renderTspans(1120, payloadVisible2Layout.lines, payloadVisible2Layout.fontSize * 1.2)}</text>` : ""}
            <text x="1120" y="${payloadHiddenTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.payload.hiddenTitle)}</text>
            <text x="1120" y="${payloadHidden1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHidden1Layout.fontSize}" fill="#ad3535">${renderTspans(1120, payloadHidden1Layout.lines, payloadHidden1Layout.fontSize * 1.18)}</text>
            <text x="1120" y="${payloadHidden2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHidden2Layout.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1120, payloadHidden2Layout.lines, payloadHidden2Layout.fontSize * 1.16)}</text>
            ${payloadHidden3Layout ? `<text x="1120" y="${payloadHidden3Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${payloadHidden3Layout.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1120, payloadHidden3Layout.lines, payloadHidden3Layout.fontSize * 1.16)}</text>` : ""}
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
            ${toolBottomNoteLayout ? `<text x="790" y="${toolBottomNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolBottomNoteLayout.fontSize}" fill="#b66868">${escapeHtml(toolBottomNoteLayout.text)}</text>` : ""}
          </g>

          <g class="ng" id="g7">
            <rect x="1010" y="662" width="220" height="152" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1010" y="662" width="220" height="54" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="1120" y="684" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTopLayout.fontSize}" fill="#97a0b4">${escapeHtml(outcomeTopLayout.text)}</text>
            <text x="1120" y="${outcomeTopSubY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTopSubLayout.fontSize}" fill="#b2aba0">${renderTspans(1120, outcomeTopSubLayout.lines, outcomeTopSubLayout.fontSize * 1.14)}</text>
            <line x1="1014" y1="732" x2="1226" y2="732" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="1010" y="734" width="220" height="80" fill="#fff8f8" clip-path="url(#oc)"/>
            <text x="1120" y="${outcomeBottomTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottomTitleLayout.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(1120, outcomeBottomTitleLayout.lines, outcomeBottomTitleLayout.fontSize * 1.1)}</text>
            <text x="1120" y="${outcomeBottomY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottomLayout.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(1120, outcomeBottomLayout.lines, outcomeBottomLayout.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c6s" x1="900" y1="736" x2="940" y2="736" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="900" y1="736" x2="940" y2="736" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M940 736 L940 704 L1010 704" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="co" id="c6a" x1="940" y1="736" x2="${outcomeConnectorEndX}" y2="736" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="940" y1="736" x2="${outcomeConnectorEndX}" y2="736" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          ${flowLabelHorizontal((entry.x + entry.width + agent.x) / 2, topY, config.labels.l0, "#4452b8", "l0", 12, 150)}
          ${flowLabelHorizontal((agent.x + agent.width + middle.x) / 2, topY, config.labels.l1, "#4452b8", "l1", 12, 160)}
          ${flowLabelHorizontal((middle.x + middle.width + reviewer.x) / 2, topY, config.labels.l2, "#ad3535", "l2", 12, 176)}
          ${config.labels.l3b
            ? flowLabelVerticalWithNote(reviewerCenterX, l3LabelY, config.labels.l3, config.labels.l3b, "#ad3535", "l3", 10.5, 170)
            : flowLabelVertical(reviewerCenterX, l3LabelY, config.labels.l3, "#ad3535", "l3")}
          ${flowLabelHorizontal(790, 468, attackContextLabel, "#ad3535", "la1", 12, 340)}
          ${flowLabelVertical(decisionCenterX, 612, config.labels.l4, "#ad3535", "l4", 12, 170)}
          ${flowLabelHorizontal((decision.x + decision.width + action.x) / 2, decisionActionY, config.labels.l5, "#ad3535", "l5", 12, 155)}
          ${flowLabelHorizontal((outcomeConnectorPivotX + getFlowConnectorEndX(outcome.x)) / 2, actionOutcomeY, config.labels.l6, "#ad3535", "l6", 12, 156)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal the flow one step at a time."
      )}
    `;
  }

  function renderAttackTrust(config) {
    const layout = REVIEW_ATTACK_LAYOUT;
    const entry = { ...layout.entry, ...(config.entry.box || {}) };
    const agent = { ...layout.agent, ...(config.agent.box || {}) };
    const middle = { ...layout.middle, ...(config.recommendation.box || {}) };
    const reviewer = { ...layout.reviewer, ...(config.reviewer.box || {}) };
    const context = { ...layout.context, ...(config.context.box || {}) };
    const decision = { ...layout.decision, ...(config.decision.box || {}) };
    const action = { ...layout.action, ...(config.action.box || {}) };
    const outcome = { ...layout.outcome, ...(config.outcome.box || {}) };
    const zone = { ...layout.zone, ...(config.zoneBox || {}) };
    const topY = layout.lines.topY;
    const reviewerBridgeY = layout.lines.reviewerBridgeY;
    const reviewerToContextY = layout.lines.reviewerContextY;
    const contextToDecisionY = layout.lines.contextDecisionY;
    const decisionActionY = layout.lines.decisionActionY;
    const actionOutcomeY = layout.lines.actionOutcomeY;
    const outcomeEvidenceY = layout.lines.outcomeEvidenceY;
    const outcomeConnectorPivotX = 960;
    const entryCenterX = entry.x + entry.width / 2;
    const agentCenterX = agent.x + agent.width / 2;
    const middleCenterX = middle.x + middle.width / 2;
    const reviewerCenterX = reviewer.x + reviewer.width / 2;
    const contextCenterX = context.x + context.width / 2;
    const contextMiddleY = context.y + context.height / 2;
    const decisionCenterX = decision.x + decision.width / 2;
    const actionCenterX = action.x + action.width / 2;
    const outcomeCenterX = outcome.x + outcome.width / 2;
    const l2X = config.labels.l2X || ((middle.x + middle.width + reviewer.x) / 2);
    const l2Y = config.labels.l2Y || topY;
    const l4Y = config.labels.l4Y || ((contextMiddleY + decision.y) / 2);
    const outcomeConnectorEndX = config.connectorPositions?.outcomeEndX || outcome.x;
    const contextTitleY = context.y + 40;
    const contextBeforeY = context.y + 82;
    const contextDividerY = context.y + 114;
    const contextAfterY = context.y + 142;
    const contextNoteY = context.y + 178;
    const recommendationSub2Y = middle.y + 104;
    const recommendationPillCenterY = middle.y + 136;
    const recommendationNoteY = middle.y + 170;
    const zoneFontSize = config.zoneBox?.fontSize || 12;
    const zoneLetterSpacing = config.zoneBox?.letterSpacing || ".11em";

    const entryTitle = fitSingleLine(config.entry.title, entry.width - 18, 16, 10);
    const entrySub1 = fitWrappedText(config.entry.sub1, entry.width - 40, 12, 10, 2);
    const entrySourceLabel = config.entry.sourceLabel
      ? fitWrappedText(config.entry.sourceLabel, entry.width - 34, 10.6, 8.8, 2)
      : null;
    const entryVisibleLabel = config.entry.visibleLabel
      ? fitSingleLine(config.entry.visibleLabel, entry.width - 34, 10.4, 8.8)
      : null;
    const entrySub2 = fitWrappedText(config.entry.sub2, entry.width - 40, 11, 9, 2);
    const entryPayloadTitle = config.entry.payloadTitle
      ? fitSingleLine(config.entry.payloadTitle, entry.width - 34, 11.5, 9.5)
      : null;
    const entryPayload1 = config.entry.payload1
      ? fitWrappedText(config.entry.payload1, entry.width - 36, 10.8, 9, 2)
      : null;
    const entryPayload2 = config.entry.payload2
      ? fitWrappedText(config.entry.payload2, entry.width - 36, 10.8, 9, 2)
      : null;
    const entryPayload3 = config.entry.payload3
      ? fitWrappedText(config.entry.payload3, entry.width - 36, 9.8, 8.4, 2)
      : null;
    const entrySourceLabelY = entry.y + 40;
    const entryVisibleLabelY = entry.y + (entrySourceLabel ? 56 : 48);
    const entrySub1Y = entry.y + (entryVisibleLabel ? 68 : (entrySourceLabel ? 62 : 58));
    const entrySub2Y = entry.y + (entryVisibleLabel ? 82 : 80);

    const agentTitle = fitSingleLine(config.agent.title, agent.width - 22, 18, 14);
    const agentSub1 = fitWrappedText(config.agent.sub1, agent.width - 36, 13, 11, 2);
    const agentSub2 = config.agent.sub2
      ? fitWrappedText(config.agent.sub2, agent.width - 36, 10.8, 9.2, 2)
      : null;
    const agentGoal = fitWrappedText(config.agent.goal, agent.width - 56, 12, 10, 2);

    const recommendationTitle = fitSingleLine(config.recommendation.title, middle.width - 26, 17, 13);
    const recommendationSub1 = fitWrappedText(config.recommendation.sub1, middle.width - 28, 13, 11, 2);
    const recommendationSub2 = fitWrappedText(config.recommendation.sub2, middle.width - 30, 12, 10, 2);
    const recommendationEmphasis = fitWrappedText(config.recommendation.emphasis, middle.width - 42, 11, 10, 2);
    const recommendationNote = config.recommendation.note
      ? fitWrappedText(config.recommendation.note, middle.width - 32, 10.6, 9, 2)
      : null;
    const recommendationDesignTitle = config.recommendation.designTitle
      ? fitSingleLine(config.recommendation.designTitle, middle.width - 30, 10.8, 9)
      : null;
    const recommendationDesign1 = config.recommendation.design1
      ? fitWrappedText(config.recommendation.design1, middle.width - 34, 10.2, 8.8, 2)
      : null;
    const recommendationDesign2 = config.recommendation.design2
      ? fitWrappedText(config.recommendation.design2, middle.width - 34, 10.2, 8.8, 2)
      : null;
    const recommendationDesign3 = config.recommendation.design3
      ? fitWrappedText(config.recommendation.design3, middle.width - 34, 10.2, 8.8, 2)
      : null;

    const reviewerTitle = fitSingleLine(config.reviewer.title, reviewer.width - 32, 17, 13);
    const reviewerSub1 = fitWrappedText(config.reviewer.sub1, reviewer.width - 36, 12.5, 10, 2);
    const reviewerSub2 = fitWrappedText(config.reviewer.sub2, reviewer.width - 36, 11, 9, 2);

    const contextNote = config.context.note
      ? fitWrappedText(config.context.note, context.width - 34, 10.2, 8.8, 3)
      : null;

    const decisionTitle = fitSingleLine(config.decision.title, 190, 18, 14);
    const decisionGoal = fitWrappedText(config.decision.goal, 160, 12, 10, 2);
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
            <clipPath id="oc-trust"><rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="${outcome.height}" rx="20"/></clipPath>
            <clipPath id="entry-payload-clip"><rect x="${entry.x}" y="${entry.y}" width="${entry.width}" height="${entry.height}" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="900" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#b2aba0" letter-spacing="3.4">SOURCE EVIDENCE  ·  AGENT ANALYSIS  ·  AI RECOMMENDATION  ·  HUMAN REVIEW  ·  ACTION</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="${zone.labelRectX}" y="${zone.labelRectY}" width="${zone.labelRectWidth}" height="20" rx="10" fill="#ffffff"/>
            <text x="${zone.labelX}" y="${zone.labelY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${zoneFontSize}" font-weight="800" fill="#ad3535" letter-spacing="${zoneLetterSpacing}">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="${entry.x}" y="${entry.y}" width="${entry.width}" height="${entry.height}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            ${entryPayloadTitle ? `
            <rect x="${entry.x}" y="${entry.y + 92}" width="${entry.width}" height="${entry.height - 92}" fill="#fff3de" clip-path="url(#entry-payload-clip)"/>
            <line x1="${entry.x + 6}" y1="${entry.y + 92}" x2="${entry.x + entry.width - 6}" y2="${entry.y + 92}" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="${entryCenterX - 74}" y="${entry.y + 100}" width="148" height="22" rx="11" fill="#ffe5ba" stroke="#f5c46c" stroke-width="1.1"/>
            ` : ""}
            <text x="${entryCenterX}" y="${entry.y + 30}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            ${entrySourceLabel ? `<text x="${entryCenterX}" y="${entrySourceLabelY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySourceLabel.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entrySourceLabel.lines, entrySourceLabel.fontSize * 1.14)}</text>` : ""}
            ${entryVisibleLabel ? `<text x="${entryCenterX}" y="${entryVisibleLabelY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryVisibleLabel.fontSize}" fill="#9b968d">${escapeHtml(entryVisibleLabel.text)}</text>` : ""}
            <text x="${entryCenterX}" y="${entrySub1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(entryCenterX, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="${entryCenterX}" y="${entrySub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(entryCenterX, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
            ${entryPayloadTitle ? `<text x="${entryCenterX}" y="${entry.y + 115}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryPayloadTitle.fontSize}" font-weight="800" fill="#8a5200" letter-spacing=".08em">${escapeHtml(entryPayloadTitle.text)}</text>` : ""}
            ${entryPayload1 ? `<text x="${entryCenterX}" y="${entry.y + 142}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryPayload1.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entryPayload1.lines, entryPayload1.fontSize * 1.16)}</text>` : ""}
            ${entryPayload2 ? `<text x="${entryCenterX}" y="${entry.y + 164}" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" font-size="${entryPayload2.fontSize}" font-weight="700" fill="#8a5200">${renderTspans(entryCenterX, entryPayload2.lines, entryPayload2.fontSize * 1.16)}</text>` : ""}
            ${entryPayload3 ? `<text x="${entryCenterX}" y="${entry.y + 188}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryPayload3.fontSize}" fill="#b36a6a">${renderTspans(entryCenterX, entryPayload3.lines, entryPayload3.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c0s" x1="${entry.x + entry.width}" y1="${topY}" x2="${agent.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="${entry.x + entry.width}" y1="${topY}" x2="${agent.x}" y2="${topY}" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="${agent.x}" y="${agent.y}" width="${agent.width}" height="${agent.height}" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="${agentCenterX}" y="${agent.y + 42}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="${agentCenterX}" y="${agent.y + 72}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(agentCenterX, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            ${agentSub2 ? `<text x="${agentCenterX}" y="${agent.y + 100}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub2.fontSize}" fill="#7a82c8">${renderTspans(agentCenterX, agentSub2.lines, agentSub2.fontSize * 1.16)}</text>` : ""}
            <rect x="${agentCenterX - 92}" y="${agent.y + (agentSub2 ? 116 : 102)}" width="184" height="${agentGoal.lines.length > 1 ? 44 : 32}" rx="11" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="${agentCenterX}" y="${agent.y + (agentSub2 ? (agentGoal.lines.length > 1 ? 132 : 138) : (agentGoal.lines.length > 1 ? 118 : 124))}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(agentCenterX, agentGoal.lines, agentGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c1s" x1="${agent.x + agent.width}" y1="${topY}" x2="${middle.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="${agent.x + agent.width}" y1="${topY}" x2="${middle.x}" y2="${topY}" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="${middle.x}" y="${middle.y}" width="${middle.width}" height="${middle.height}" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${middleCenterX}" y="${middle.y + 48}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(recommendationTitle.text)}</text>
            <text x="${middleCenterX}" y="${middle.y + 80}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationSub1.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(middleCenterX, recommendationSub1.lines, recommendationSub1.fontSize * 1.14)}</text>
            <text x="${middleCenterX}" y="${recommendationSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationSub2.fontSize}" fill="#b66868">${renderTspans(middleCenterX, recommendationSub2.lines, recommendationSub2.fontSize * 1.16)}</text>
            <rect x="${middleCenterX - 108}" y="${recommendationPillCenterY - (recommendationEmphasis.lines.length > 1 ? 22 : 15)}" width="216" height="${recommendationEmphasis.lines.length > 1 ? 44 : 30}" rx="10" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="${middleCenterX}" y="${recommendationEmphasis.lines.length > 1 ? recommendationPillCenterY - 6 : recommendationPillCenterY + 4}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationEmphasis.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(middleCenterX, recommendationEmphasis.lines, recommendationEmphasis.fontSize * 1.12)}</text>
            ${recommendationNote ? `<text x="${middleCenterX}" y="${recommendationNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationNote.fontSize}" fill="#9a7748">${renderTspans(middleCenterX, recommendationNote.lines, recommendationNote.fontSize * 1.16)}</text>` : ""}
            ${recommendationDesignTitle ? `<text x="${middleCenterX}" y="${middle.y + 196}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationDesignTitle.fontSize}" font-weight="800" fill="#8a5200" letter-spacing=".08em">${escapeHtml(recommendationDesignTitle.text)}</text>` : ""}
            ${recommendationDesign1 ? `<text x="${middleCenterX}" y="${middle.y + 214}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationDesign1.fontSize}" fill="#9a7748">${renderTspans(middleCenterX, recommendationDesign1.lines, recommendationDesign1.fontSize * 1.14)}</text>` : ""}
            ${recommendationDesign2 ? `<text x="${middleCenterX}" y="${middle.y + 232}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationDesign2.fontSize}" fill="#9a7748">${renderTspans(middleCenterX, recommendationDesign2.lines, recommendationDesign2.fontSize * 1.14)}</text>` : ""}
            ${recommendationDesign3 ? `<text x="${middleCenterX}" y="${middle.y + 250}" text-anchor="middle" font-family="${getFontStack()}" font-size="${recommendationDesign3.fontSize}" font-weight="700" fill="#8a5200">${renderTspans(middleCenterX, recommendationDesign3.lines, recommendationDesign3.fontSize * 1.14)}</text>` : ""}
          </g>

          <line class="co" id="c2s" x1="${middle.x + middle.width}" y1="${topY}" x2="${reviewer.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="${middle.x + middle.width}" y1="${topY}" x2="${reviewer.x}" y2="${topY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="${reviewer.x}" y="${reviewer.y}" width="${reviewer.width}" height="${reviewer.height}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="${reviewerCenterX}" y="${reviewer.y + 54}" text-anchor="middle" font-family="${getFontStack()}" font-size="${reviewerTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(reviewerTitle.text)}</text>
            <text x="${reviewerCenterX}" y="${reviewer.y + 88}" text-anchor="middle" font-family="${getFontStack()}" font-size="${reviewerSub1.fontSize}" fill="#6b655c">${renderTspans(reviewerCenterX, reviewerSub1.lines, reviewerSub1.fontSize * 1.16)}</text>
            <text x="${reviewerCenterX}" y="${reviewer.y + 124}" text-anchor="middle" font-family="${getFontStack()}" font-size="${reviewerSub2.fontSize}" fill="#8a847b">${renderTspans(reviewerCenterX, reviewerSub2.lines, reviewerSub2.fontSize * 1.16)}</text>
          </g>

          <path class="co" id="c3s" d="M${reviewerCenterX} ${reviewer.y + reviewer.height} L${reviewerCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerToContextY}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="M${reviewerCenterX} ${reviewer.y + reviewer.height} L${reviewerCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerToContextY}" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="${context.x}" y="${context.y}" width="${context.width}" height="${context.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${contextCenterX}" y="${contextTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.context.title)}</text>
            ${innerPill(contextCenterX, contextBeforeY, 252, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 12, 700)}
            <line x1="${contextCenterX - 98}" y1="${contextDividerY}" x2="${contextCenterX + 98}" y2="${contextDividerY}" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(contextCenterX, contextAfterY, 260, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 12, 800)}
            ${contextNote ? `<text x="${contextCenterX}" y="${contextNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${contextNote.fontSize}" fill="#9a7748">${renderTspans(contextCenterX, contextNote.lines, contextNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <path class="co" id="c4s" d="M${context.x} ${contextMiddleY} L${decisionCenterX} ${contextMiddleY} L${decisionCenterX} ${decision.y}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c4f" d="M${context.x} ${contextMiddleY} L${decisionCenterX} ${contextMiddleY} L${decisionCenterX} ${decision.y}" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="${decision.x}" y="${decision.y}" width="${decision.width}" height="${decision.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${decisionCenterX}" y="722" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="${decisionCenterX}" y="752" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.decision.sub1)}</text>
            <rect x="358" y="770" width="164" height="${decisionGoal.lines.length > 1 ? 44 : 32}" rx="10" fill="#f8dede" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="${decisionCenterX}" y="${decisionGoal.lines.length > 1 ? 786 : 792}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionGoal.fontSize}" font-weight="800" fill="#7d2626">${renderTspans(decisionCenterX, decisionGoal.lines, decisionGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c5s" x1="${decision.x + decision.width}" y1="${decisionActionY}" x2="${action.x}" y2="${decisionActionY}" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="${decision.x + decision.width}" y1="${decisionActionY}" x2="${action.x}" y2="${decisionActionY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="${action.x}" y="${action.y}" width="${action.width}" height="${action.height}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="${actionCenterX}" y="730" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="${actionCenterX}" y="760" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(actionCenterX, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            <text x="${actionCenterX}" y="794" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(actionCenterX, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>
          </g>

          <g class="ng" id="g7">
            <rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="${outcome.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="58" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="${outcomeCenterX}" y="682" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#97a0b4">${escapeHtml(config.outcome.top)}</text>
            <text x="${outcomeCenterX}" y="704" text-anchor="middle" font-family="${getFontStack()}" font-size="10" fill="#b2aba0">${escapeHtml(config.outcome.topSub)}</text>
            <line x1="${outcome.x + 4}" y1="732" x2="${outcome.x + outcome.width - 4}" y2="732" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="${outcome.x}" y="734" width="${outcome.width}" height="90" fill="#fff8f8" clip-path="url(#oc-trust)"/>
            <text x="${outcomeCenterX}" y="772" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="${outcomeCenterX}" y="798" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottom.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(outcomeCenterX, outcomeBottom.lines, outcomeBottom.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c6s" x1="${action.x + action.width}" y1="${actionOutcomeY}" x2="${outcomeConnectorPivotX}" y2="${actionOutcomeY}" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="${action.x + action.width}" y1="${actionOutcomeY}" x2="${outcomeConnectorPivotX}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M${outcomeConnectorPivotX} ${actionOutcomeY} L${outcomeConnectorPivotX} ${outcomeEvidenceY} L${outcome.x} ${outcomeEvidenceY}" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="co" id="c6a" x1="${outcomeConnectorPivotX}" y1="${actionOutcomeY}" x2="${outcomeConnectorEndX}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="${outcomeConnectorPivotX}" y1="${actionOutcomeY}" x2="${outcomeConnectorEndX}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          ${flowLabelHorizontal((entry.x + entry.width + agent.x) / 2, topY, config.labels.l0, "#4452b8", "l0", 12, 170)}
          ${flowLabelHorizontal((agent.x + agent.width + middle.x) / 2, topY, config.labels.l1, "#4452b8", "l1", 12, 184)}
          ${flowLabelHorizontal(l2X, l2Y, config.labels.l2, "#ad3535", "l2", 12, config.labels.l2Width || 188, { maxLines: config.labels.l2Lines || 3 })}
          ${flowLabelVertical(reviewerCenterX, ((reviewer.y + reviewer.height + reviewerBridgeY) / 2) + 8, config.labels.l3, "#ad3535", "l3", 12, config.labels.l3Width || 188, { maxLines: config.labels.l3Lines || 3 })}
          ${flowLabelHorizontal((reviewerCenterX + contextCenterX) / 2, reviewerBridgeY, config.labels.la1, "#ad3535", "la1", 12, 190)}
          ${flowLabelVertical(decisionCenterX, l4Y, config.labels.l4, "#ad3535", "l4", 12, 160)}
          ${flowLabelHorizontal((decision.x + decision.width + action.x) / 2, decisionActionY, config.labels.l5, "#ad3535", "l5", 12, 150)}
          ${flowLabelHorizontal((outcomeConnectorPivotX + outcomeConnectorEndX) / 2, actionOutcomeY, config.labels.l6, "#ad3535", "l6", 12, 156)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how the AI's confidence and tone displace independent human review."
      )}
    `;
  }

  function renderAttackMetricGaming(config) {
    const layout = REVIEW_ATTACK_LAYOUT;
    const entry = { ...layout.entry, ...(config.entry.box || {}) };
    const agent = { ...layout.agent, ...(config.agent.box || {}) };
    const middle = { ...layout.middle, ...(config.metric.box || {}) };
    const reviewer = { ...layout.reviewerTall, ...(config.shortcut.box || {}) };
    const context = { ...layout.context, ...(config.context.box || {}) };
    const decision = { ...layout.decision, ...(config.decision.box || {}) };
    const action = { ...layout.action, ...(config.action.box || {}) };
    const outcome = { ...layout.outcome, ...(config.outcome.box || {}) };
    const zone = { ...layout.zone, ...(config.zoneBox || {}) };
    const topY = layout.lines.topY;
    const reviewerBridgeY = layout.lines.reviewerBridgeY;
    const reviewerToContextY = layout.lines.reviewerContextY;
    const contextToDecisionY = layout.lines.contextDecisionY;
    const decisionActionY = layout.lines.decisionActionY;
    const actionOutcomeY = layout.lines.actionOutcomeY;
    const outcomeEvidenceY = layout.lines.outcomeEvidenceY;
    const outcomeConnectorPivotX = 960;
    const entryCenterX = entry.x + entry.width / 2;
    const agentCenterX = agent.x + agent.width / 2;
    const middleCenterX = middle.x + middle.width / 2;
    const reviewerCenterX = reviewer.x + reviewer.width / 2;
    const contextCenterX = context.x + context.width / 2;
    const contextMiddleY = context.y + context.height / 2;
    const decisionCenterX = decision.x + decision.width / 2;
    const actionCenterX = action.x + action.width / 2;
    const outcomeCenterX = outcome.x + outcome.width / 2;
    const contextTitleY = context.y + 40;
    const contextBeforeY = context.y + 84;
    const contextDividerY = context.y + 120;
    const contextAfterY = config.context.afterY || (context.y + 146);
    const contextNoteY = context.y + 178;
    const shortcutToContextBridgeY = config.shortcut.bridgeY || reviewerBridgeY;
    const contextDecisionBridgeY = config.context.connectorY || contextMiddleY;
    const middleSub2Y = config.metric.sub2Y || (middle.y + 106);
    const middlePillCenterY = config.metric.pillY || (middle.y + 148);
    const zoneNoteX = zone.x + zone.width - 28;
    const zoneNoteY = zone.y + zone.height - 28;

    const entryTitle = fitSingleLine(config.entry.title, entry.width - 18, 16, 10);
    const entrySub1 = fitWrappedText(config.entry.sub1, entry.width - 40, 12, 10, 2);
    const entrySub2 = config.entry.sub2
      ? fitWrappedText(config.entry.sub2, entry.width - 40, 11, 9, 2)
      : null;
    const entryNote = config.entry.note
      ? fitWrappedText(config.entry.note, entry.width - 34, 10.2, 8.8, 2)
      : null;
    const entryDesignTitle = config.entry.designTitle
      ? fitSingleLine(config.entry.designTitle, entry.width - 32, 11.5, 9.5)
      : null;
    const entryDesign1 = config.entry.design1
      ? fitWrappedText(config.entry.design1, entry.width - 36, 10.5, 8.8, 2)
      : null;
    const entryDesign2 = config.entry.design2
      ? fitWrappedText(config.entry.design2, entry.width - 36, 10.5, 8.8, 2)
      : null;
    const entryDesign3 = config.entry.design3
      ? fitWrappedText(config.entry.design3, entry.width - 36, 10.5, 8.8, 2)
      : null;
    const entryNoteY = entry.y + 100;

    const agentTitle = fitSingleLine(config.agent.title, agent.width - 22, 18, 14);
    const agentSub1 = fitWrappedText(config.agent.sub1, agent.width - 36, 13, 11, 2);
    const agentGoal = fitWrappedText(config.agent.goal, agent.width - 56, 12, 10, 2);

    const metricTitle = fitSingleLine(config.metric.title, middle.width - 26, 17, 13);
    const metricSub1 = fitWrappedText(config.metric.sub1, middle.width - 28, 13, 11, 2);
    const metricSub2 = fitWrappedText(config.metric.sub2, middle.width - 30, 12, 10, 2);
    const metricEmphasis = fitWrappedText(config.metric.emphasis, middle.width - 42, 11, 10, 2);

    const shortcutTitle = fitSingleLine(config.shortcut.title, reviewer.width - 24, 17, 13);
    const shortcutSub1 = fitWrappedText(config.shortcut.sub1, reviewer.width - 30, 12.5, 10, 2);
    const shortcutSub2 = fitWrappedText(config.shortcut.sub2, reviewer.width - 30, 11.5, 9, 2);
    const shortcutNote = fitWrappedText(config.shortcut.note, reviewer.width - 28, 10.5, 9, 3);

    const contextNote = config.context.note
      ? fitWrappedText(config.context.note, context.width - 34, 10.2, 8.8, 2)
      : null;

    const decisionTitle = fitSingleLine(config.decision.title, 190, 18, 14);
    const decisionGoal = fitWrappedText(config.decision.goal, 184, 12, 10, 2);
    const decisionNote = !config.decision.noteOutside && config.decision.note
      ? fitWrappedText(config.decision.note, 196, 10.4, 8.8, 2)
      : null;
    const decisionNoteOutside = config.decision.noteOutside
      ? fitWrappedText(config.decision.noteOutside, 210, 10.2, 8.6, 2)
      : null;
    const actionTitle = fitSingleLine(config.action.title, action.width - 30, 18, 13);
    const actionSub1 = fitWrappedText(config.action.sub1, action.width - 28, 12.5, 10, 2);
    const actionSub2 = config.action.sub2
      ? fitWrappedText(config.action.sub2, action.width - 28, 11, 9, 2)
      : null;
    const actionNote1 = config.action.note1
      ? fitWrappedText(config.action.note1, action.width - 30, 10.4, 8.8, 2)
      : null;
    const actionNote2 = config.action.note2
      ? fitWrappedText(config.action.note2, action.width - 30, 10.4, 8.8, 2)
      : null;
    const outcomeBottom = fitWrappedText(config.outcome.bottom, outcome.width - 44, 13, 10, 2);
    const outcomeNote = config.outcome.note
      ? fitWrappedText(config.outcome.note, outcome.width - 42, 10.2, 8.8, 2)
      : null;
    const zoneNote = config.zoneNote
      ? fitWrappedText(config.zoneNote, 260, 10.3, 8.8, 2)
      : null;

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
            <clipPath id="oc-metric"><rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="${outcome.height}" rx="20"/></clipPath>
            <clipPath id="oc-metric-entry"><rect x="${entry.x}" y="${entry.y}" width="${entry.width}" height="${entry.height}" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="900" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#b2aba0" letter-spacing="3.4">TARGET  ·  AGENT  ·  SCORECARD  ·  SHORTCUT  ·  DECISION  ·  OUTCOME</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="${zone.labelRectX}" y="${zone.labelRectY}" width="${zone.labelRectWidth}" height="20" rx="10" fill="#ffffff"/>
            <text x="${zone.labelX}" y="${zone.labelY}" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#ad3535" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
            ${zoneNote ? `<text x="${zoneNoteX}" y="${zoneNoteY}" text-anchor="end" font-family="${getFontStack()}" font-size="${zoneNote.fontSize}" fill="#9a7748">${renderTspans(zoneNoteX, zoneNote.lines, zoneNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <g class="ng" id="g0">
            <rect x="${entry.x}" y="${entry.y}" width="${entry.width}" height="${entry.height}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            ${entryDesignTitle ? `
            <rect x="${entry.x}" y="${entry.y + 88}" width="${entry.width}" height="${entry.height - 88}" fill="#fff3de" clip-path="url(#oc-metric-entry)"/>
            <line x1="${entry.x + 6}" y1="${entry.y + 88}" x2="${entry.x + entry.width - 6}" y2="${entry.y + 88}" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="${entryCenterX - 72}" y="${entry.y + 96}" width="144" height="22" rx="11" fill="#ffe5ba" stroke="#f5c46c" stroke-width="1.1"/>
            ` : ""}
            <text x="${entryCenterX}" y="${entry.y + 30}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            <text x="${entryCenterX}" y="${entry.y + 56}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(entryCenterX, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            ${entrySub2 ? `<text x="${entryCenterX}" y="${entry.y + 80}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(entryCenterX, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>` : ""}
            ${entryNote ? `<text x="${entryCenterX}" y="${entryNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryNote.fontSize}" fill="#8a5200">${renderTspans(entryCenterX, entryNote.lines, entryNote.fontSize * 1.14)}</text>` : ""}
            ${entryDesignTitle ? `<text x="${entryCenterX}" y="${entry.y + 111}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesignTitle.fontSize}" font-weight="800" fill="#8a5200" letter-spacing=".08em">${escapeHtml(entryDesignTitle.text)}</text>` : ""}
            ${entryDesign1 ? `<text x="${entryCenterX}" y="${entry.y + 136}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesign1.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entryDesign1.lines, entryDesign1.fontSize * 1.16)}</text>` : ""}
            ${entryDesign2 ? `<text x="${entryCenterX}" y="${entry.y + 160}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesign2.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entryDesign2.lines, entryDesign2.fontSize * 1.16)}</text>` : ""}
            ${entryDesign3 ? `<text x="${entryCenterX}" y="${entry.y + 184}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesign3.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entryDesign3.lines, entryDesign3.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c0s" x1="${entry.x + entry.width}" y1="${topY}" x2="${agent.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="${entry.x + entry.width}" y1="${topY}" x2="${agent.x}" y2="${topY}" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="${agent.x}" y="${agent.y}" width="${agent.width}" height="${agent.height}" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="${agentCenterX}" y="${agent.y + 42}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="${agentCenterX}" y="${agent.y + 72}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(agentCenterX, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            <rect x="${agentCenterX - 92}" y="${agent.y + 102}" width="184" height="${agentGoal.lines.length > 1 ? 44 : 32}" rx="11" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="${agentCenterX}" y="${agent.y + (agentGoal.lines.length > 1 ? 118 : 124)}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(agentCenterX, agentGoal.lines, agentGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c1s" x1="${agent.x + agent.width}" y1="${topY}" x2="${middle.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="${agent.x + agent.width}" y1="${topY}" x2="${middle.x}" y2="${topY}" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="${middle.x}" y="${middle.y}" width="${middle.width}" height="${middle.height}" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${middleCenterX}" y="${middle.y + 48}" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(metricTitle.text)}</text>
            <text x="${middleCenterX}" y="${middle.y + 80}" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricSub1.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(middleCenterX, metricSub1.lines, metricSub1.fontSize * 1.14)}</text>
            <text x="${middleCenterX}" y="${middleSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricSub2.fontSize}" fill="#b66868">${renderTspans(middleCenterX, metricSub2.lines, metricSub2.fontSize * 1.16)}</text>
            <rect x="${middleCenterX - 104}" y="${middlePillCenterY - (metricEmphasis.lines.length > 1 ? 22 : 15)}" width="208" height="${metricEmphasis.lines.length > 1 ? 44 : 30}" rx="10" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="${middleCenterX}" y="${metricEmphasis.lines.length > 1 ? middlePillCenterY - 6 : middlePillCenterY + 4}" text-anchor="middle" font-family="${getFontStack()}" font-size="${metricEmphasis.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(middleCenterX, metricEmphasis.lines, metricEmphasis.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c2s" x1="${middle.x + middle.width}" y1="${topY}" x2="${reviewer.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="${middle.x + middle.width}" y1="${topY}" x2="${reviewer.x}" y2="${topY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="${reviewer.x}" y="${reviewer.y}" width="${reviewer.width}" height="${reviewer.height}" rx="22" fill="#fff4f4" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${reviewerCenterX}" y="${reviewer.y + 46}" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(shortcutTitle.text)}</text>
            <text x="${reviewerCenterX}" y="${reviewer.y + 80}" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutSub1.fontSize}" fill="#a33b3b">${renderTspans(reviewerCenterX, shortcutSub1.lines, shortcutSub1.fontSize * 1.16)}</text>
            <text x="${reviewerCenterX}" y="${reviewer.y + 124}" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutSub2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(reviewerCenterX, shortcutSub2.lines, shortcutSub2.fontSize * 1.14)}</text>
            <text x="${reviewerCenterX}" y="${reviewer.y + 164}" text-anchor="middle" font-family="${getFontStack()}" font-size="${shortcutNote.fontSize}" font-weight="700" fill="#ad3535">${renderTspans(reviewerCenterX, shortcutNote.lines, shortcutNote.fontSize * 1.14)}</text>
          </g>

          <path class="co" id="c3s" d="M${reviewer.x + reviewer.width - 18} ${reviewer.y + reviewer.height} L${reviewer.x + reviewer.width - 18} ${shortcutToContextBridgeY} L${contextCenterX} ${shortcutToContextBridgeY} L${contextCenterX} ${reviewerToContextY}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="M${reviewer.x + reviewer.width - 18} ${reviewer.y + reviewer.height} L${reviewer.x + reviewer.width - 18} ${shortcutToContextBridgeY} L${contextCenterX} ${shortcutToContextBridgeY} L${contextCenterX} ${reviewerToContextY}" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="${context.x}" y="${context.y}" width="${context.width}" height="${context.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${contextCenterX}" y="${contextTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.context.title)}</text>
            ${innerPill(contextCenterX, contextBeforeY, 236, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 12, 700)}
            <line x1="${contextCenterX - 86}" y1="${contextDividerY}" x2="${contextCenterX + 86}" y2="${contextDividerY}" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(contextCenterX, contextAfterY, 244, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 12, 800)}
            ${contextNote ? `<text x="${contextCenterX}" y="${contextNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${contextNote.fontSize}" fill="#9a7748">${renderTspans(contextCenterX, contextNote.lines, contextNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <path class="co" id="c4s" d="M${context.x} ${contextMiddleY} L${decisionCenterX} ${contextDecisionBridgeY} L${decisionCenterX} ${decision.y}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c4f" d="M${context.x} ${contextMiddleY} L${decisionCenterX} ${contextDecisionBridgeY} L${decisionCenterX} ${decision.y}" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="${decision.x}" y="${decision.y}" width="${decision.width}" height="${decision.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${decisionCenterX}" y="722" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="${decisionCenterX}" y="752" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.decision.sub1)}</text>
            <rect x="358" y="770" width="164" height="${decisionGoal.lines.length > 1 ? 44 : 32}" rx="10" fill="#f8dede" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="${decisionCenterX}" y="${decisionGoal.lines.length > 1 ? 786 : 792}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionGoal.fontSize}" font-weight="800" fill="#7d2626">${renderTspans(decisionCenterX, decisionGoal.lines, decisionGoal.fontSize * 1.14)}</text>
            ${decisionNote ? `<text x="${decisionCenterX}" y="820" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionNote.fontSize}" fill="#9a7748">${renderTspans(decisionCenterX, decisionNote.lines, decisionNote.fontSize * 1.16)}</text>` : ""}
          </g>
          ${decisionNoteOutside ? `
          <path d="M${decisionCenterX} ${decision.y + decision.height + 4} L${decisionCenterX} ${decision.y + decision.height + 14}" fill="none" stroke="#ad3535" stroke-width="2.2" stroke-dasharray="4 4" marker-end="url(#ar)"/>
          <text x="${decisionCenterX}" y="${decision.y + decision.height + 22}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionNoteOutside.fontSize}" fill="#9a7748">${renderTspans(decisionCenterX, decisionNoteOutside.lines, decisionNoteOutside.fontSize * 1.14)}</text>
          ` : ""}

          <line class="co" id="c5s" x1="${decision.x + decision.width}" y1="${decisionActionY}" x2="${action.x}" y2="${decisionActionY}" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="${decision.x + decision.width}" y1="${decisionActionY}" x2="${action.x}" y2="${decisionActionY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="${action.x}" y="${action.y}" width="${action.width}" height="${action.height}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="${actionCenterX}" y="730" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="${actionCenterX}" y="760" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(actionCenterX, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            ${actionSub2 ? `<text x="${actionCenterX}" y="794" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(actionCenterX, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>` : ""}
            ${actionNote1 ? `<text x="${actionCenterX}" y="820" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionNote1.fontSize}" fill="#9a7748">${renderTspans(actionCenterX, actionNote1.lines, actionNote1.fontSize * 1.16)}</text>` : ""}
            ${actionNote2 ? `<text x="${actionCenterX}" y="844" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionNote2.fontSize}" fill="#9a7748">${renderTspans(actionCenterX, actionNote2.lines, actionNote2.fontSize * 1.16)}</text>` : ""}
          </g>

          <g class="ng" id="g7">
            <rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="${outcomeNote ? outcome.height + 26 : outcome.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="58" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="${outcomeCenterX}" y="682" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#97a0b4">${escapeHtml(config.outcome.top)}</text>
            <text x="${outcomeCenterX}" y="704" text-anchor="middle" font-family="${getFontStack()}" font-size="10" fill="#b2aba0">${escapeHtml(config.outcome.topSub)}</text>
            <line x1="${outcome.x + 4}" y1="732" x2="${outcome.x + outcome.width - 4}" y2="732" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="${outcome.x}" y="734" width="${outcome.width}" height="${outcomeNote ? 116 : 90}" fill="#fff8f8" clip-path="url(#oc-metric)"/>
            <text x="${outcomeCenterX}" y="772" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="${outcomeCenterX}" y="798" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottom.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(outcomeCenterX, outcomeBottom.lines, outcomeBottom.fontSize * 1.12)}</text>
            ${outcomeNote ? `<text x="${outcomeCenterX}" y="830" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeNote.fontSize}" fill="#9a7748">${renderTspans(outcomeCenterX, outcomeNote.lines, outcomeNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c6s" x1="${action.x + action.width}" y1="${actionOutcomeY}" x2="${outcomeConnectorPivotX}" y2="${actionOutcomeY}" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="${action.x + action.width}" y1="${actionOutcomeY}" x2="${outcomeConnectorPivotX}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M${outcomeConnectorPivotX} ${actionOutcomeY} L${outcomeConnectorPivotX} ${outcomeEvidenceY} L${outcome.x} ${outcomeEvidenceY}" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="co" id="c6a" x1="${outcomeConnectorPivotX}" y1="${actionOutcomeY}" x2="${getFlowConnectorEndX(outcome.x)}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="${outcomeConnectorPivotX}" y1="${actionOutcomeY}" x2="${getFlowConnectorEndX(outcome.x)}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          ${flowLabelHorizontal((entry.x + entry.width + agent.x) / 2, topY, config.labels.l0, "#4452b8", "l0", 12, 150)}
          ${flowLabelHorizontal((agent.x + agent.width + middle.x) / 2, topY, config.labels.l1, "#4452b8", "l1", 12, 170)}
          ${flowLabelHorizontal((middle.x + middle.width + reviewer.x) / 2, topY, config.labels.l2, "#ad3535", "l2", 12, 176)}
          ${flowLabelVertical(config.labels.l3X || reviewerCenterX, config.labels.l3Y || (((reviewer.y + reviewer.height + shortcutToContextBridgeY) / 2) + 8), config.labels.l3, "#ad3535", "l3", 12, config.labels.l3Width || 170)}
          ${flowLabelHorizontal(config.labels.la1X || ((reviewerCenterX + contextCenterX) / 2), config.labels.la1Y || shortcutToContextBridgeY, config.labels.la1, "#ad3535", "la1", 12, config.labels.la1Width || 210)}
          ${flowLabelVertical(config.labels.l4X || decisionCenterX, config.labels.l4Y || ((contextDecisionBridgeY + decision.y) / 2), config.labels.l4, "#ad3535", "l4", 12, config.labels.l4Width || 166)}
          ${flowLabelHorizontal(config.labels.l5X || ((decision.x + decision.width + action.x) / 2), config.labels.l5Y || (decisionActionY - 12), config.labels.l5, "#ad3535", "l5", 12, config.labels.l5Width || 150)}
          ${flowLabelHorizontal(config.labels.l6X || ((outcomeConnectorPivotX + getFlowConnectorEndX(outcome.x)) / 2), config.labels.l6Y || (actionOutcomeY - 12), config.labels.l6, "#ad3535", "l6", 12, config.labels.l6Width || 156)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how the agent wins the metric by losing the mission."
      )}
    `;
  }

  function renderAttackReplication(config) {
    const layout = REVIEW_ATTACK_LAYOUT;
    const entry = { ...layout.entry, ...(config.entry.box || {}) };
    const agent = { ...layout.agent, ...(config.agent.box || {}) };
    const middle = { ...layout.middle, ...(config.limit.box || {}) };
    const reviewer = { ...layout.reviewerTall, ...(config.burst.box || {}) };
    const context = { ...layout.context, ...(config.context.box || {}) };
    const decision = { ...layout.decision, ...(config.decision.box || {}) };
    const action = { ...layout.action, ...(config.action.box || {}) };
    const outcome = { ...layout.outcome, ...(config.outcome.box || {}) };
    const zone = { ...layout.zone, ...(config.zoneBox || {}) };
    const topY = layout.lines.topY;
    const reviewerBridgeY = layout.lines.reviewerBridgeY;
    const reviewerToContextY = layout.lines.reviewerContextY;
    const contextToDecisionY = layout.lines.contextDecisionY;
    const decisionActionY = layout.lines.decisionActionY;
    const actionOutcomeY = layout.lines.actionOutcomeY;
    const outcomeEvidenceY = layout.lines.outcomeEvidenceY;
    const outcomeConnectorPivotX = 960;
    const contextTitleY = context.y + 40;
    const contextBeforeY = context.y + 86;
    const contextDividerY = context.y + 122;
    const contextAfterY = context.y + 138;
    const middleSub2Y = middle.y + 106;
    const middlePillCenterY = middle.y + 148;
    const decisionCenterX = decision.x + decision.width / 2;
    const actionCenterX = action.x + action.width / 2;
    const outcomeCenterX = outcome.x + outcome.width / 2;
    const reviewerCenterX = reviewer.x + reviewer.width / 2;
    const contextCenterX = context.x + context.width / 2;
    const contextMiddleY = context.y + context.height / 2;
    const middleCenterX = middle.x + middle.width / 2;
    const agentCenterX = agent.x + agent.width / 2;
    const entryCenterX = entry.x + entry.width / 2;
    const entryTitle = fitSingleLine(config.entry.title, entry.width - 18, 16, 10);
    const entrySub1 = fitWrappedText(config.entry.sub1, 184, 12, 10, 2);
    const entrySub2 = config.entry.sub2
      ? fitWrappedText(config.entry.sub2, 184, 11, 9, 2)
      : null;
    const entryDesignTitle = config.entry.designTitle
      ? fitSingleLine(config.entry.designTitle, entry.width - 30, 11.5, 9.5)
      : null;
    const entryDesign1 = config.entry.design1
      ? fitWrappedText(config.entry.design1, entry.width - 34, 10.5, 8.8, 2)
      : null;
    const entryDesign2 = config.entry.design2
      ? fitWrappedText(config.entry.design2, entry.width - 34, 10.5, 8.8, 2)
      : null;
    const entryDesign3 = config.entry.design3
      ? fitWrappedText(config.entry.design3, entry.width - 34, 10.5, 8.8, 2)
      : null;
    const agentTitle = fitSingleLine(config.agent.title, agent.width - 22, 18, 14);
    const agentSub1 = fitWrappedText(config.agent.sub1, agent.width - 36, 13, 11, 2);
    const agentGoal = fitWrappedText(config.agent.goal, 168, 12, 10, 2);
    const limitTitle = fitSingleLine(config.limit.title, middle.width - 26, 17, 13);
    const limitSub1 = fitWrappedText(config.limit.sub1, middle.width - 28, 13, 11, 2);
    const limitSub2 = fitWrappedText(config.limit.sub2, middle.width - 30, 12, 10, 2);
    const limitEmphasis = fitWrappedText(config.limit.emphasis, 196, 11, 10, 2);
    const limitNote = config.limit.note
      ? fitWrappedText(config.limit.note, middle.width - 28, 10.2, 8.8, 2)
      : null;
    const burstTitle = fitSingleLine(config.burst.title, reviewer.width - 28, 17, 13);
    const burstSub1 = fitWrappedText(config.burst.sub1, reviewer.width - 32, 12.5, 10, 2);
    const burstSub2 = fitWrappedText(config.burst.sub2, reviewer.width - 32, 11.5, 9, 2);
    const burstNote = fitWrappedText(config.burst.note, reviewer.width - 32, 10.5, 9, 2);
    const burstNote2 = config.burst.note2
      ? fitWrappedText(config.burst.note2, reviewer.width - 32, 10.2, 8.8, 2)
      : null;
    const decisionTitle = fitSingleLine(config.decision.title, 196, 18, 14);
    const decisionGoal = fitWrappedText(config.decision.goal, 160, 12, 10, 2);
    const decisionNote = config.decision.note
      ? fitWrappedText(config.decision.note, 196, 10.2, 8.8, 2)
      : null;
    const actionTitle = fitSingleLine(config.action.title, action.width - 30, 18, 13);
    const actionSub1 = fitWrappedText(config.action.sub1, action.width - 28, 12.5, 10, 2);
    const actionSub2 = config.action.sub2
      ? fitWrappedText(config.action.sub2, action.width - 28, 11, 9, 2)
      : null;
    const actionNote1 = config.action.note1
      ? fitWrappedText(config.action.note1, action.width - 30, 10.2, 8.8, 2)
      : null;
    const actionNote2 = config.action.note2
      ? fitWrappedText(config.action.note2, action.width - 30, 10.2, 8.8, 2)
      : null;
    const outcomeBottom = fitWrappedText(config.outcome.bottom, 194, 13, 10, 2);
    const outcomeNote = config.outcome.note
      ? fitWrappedText(config.outcome.note, 194, 10.2, 8.8, 2)
      : null;
    const zoneNote = config.zoneNote
      ? fitWrappedText(config.zoneNote, 260, 10.3, 8.8, 2)
      : null;
    const zoneFontSize = config.zoneBox?.fontSize || 12;
    const zoneLetterSpacing = config.zoneBox?.letterSpacing || ".11em";
    const zoneNoteX = zone.x + zone.width - 28;
    const zoneNoteY = zone.y + zone.height - 28;
    const entryDesignAreaY = entry.y + 98;
    const entryDesignTitleY = entry.y + 114;
    const entryDesign1Y = entry.y + 138;
    const entryDesign2Y = entry.y + 160;
    const entryDesign3Y = entry.y + 184;
    const limitNoteY = middle.y + 184;
    const burstNote2Y = reviewer.y + 182;
    const decisionNoteY = decision.y + 166;
    const actionNote1Y = action.y + 158;
    const actionNote2Y = action.y + 182;
    const outcomeNoteY = outcome.y + 158;
    const l3LabelY = config.labelPositions?.l3Y || (((reviewer.y + reviewer.height + reviewerBridgeY) / 2) + 8);

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
            <clipPath id="oc-repl"><rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="${outcome.height}" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="900" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="700" fill="#b2aba0" letter-spacing="3.2">MISSION  ·  PRIMARY AGENT  ·  CONSTRAINT  ·  REPLICATION  ·  PERSISTENCE  ·  INCIDENT</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="${zone.labelRectX}" y="${zone.labelRectY}" width="${zone.labelRectWidth}" height="20" rx="10" fill="#ffffff"/>
            <text x="${zone.labelX}" y="${zone.labelY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${zoneFontSize}" font-weight="800" fill="#ad3535" letter-spacing="${zoneLetterSpacing}">${escapeHtml(config.zone)}</text>
            ${zoneNote ? `<text x="${zoneNoteX}" y="${zoneNoteY}" text-anchor="end" font-family="${getFontStack()}" font-size="${zoneNote.fontSize}" fill="#9a7748">${renderTspans(zoneNoteX, zoneNote.lines, zoneNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <g class="ng" id="g0">
            <rect x="${entry.x}" y="${entry.y}" width="${entry.width}" height="${entry.height}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            ${entryDesignTitle ? `
            <rect x="${entry.x}" y="${entryDesignAreaY}" width="${entry.width}" height="${entry.height - 94}" fill="#fff3de"/>
            <line x1="${entry.x + 6}" y1="${entryDesignAreaY}" x2="${entry.x + entry.width - 6}" y2="${entryDesignAreaY}" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="${entryCenterX - 72}" y="${entry.y + 102}" width="144" height="22" rx="11" fill="#ffe5ba" stroke="#f5c46c" stroke-width="1.1"/>
            ` : ""}
            <text x="${entryCenterX}" y="214" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            <text x="${entryCenterX}" y="244" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(entryCenterX, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            ${entrySub2 ? `<text x="${entryCenterX}" y="278" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(entryCenterX, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>` : ""}
            ${entryDesignTitle ? `<text x="${entryCenterX}" y="${entryDesignTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesignTitle.fontSize}" font-weight="800" fill="#8a5200" letter-spacing=".08em">${escapeHtml(entryDesignTitle.text)}</text>` : ""}
            ${entryDesign1 ? `<text x="${entryCenterX}" y="${entryDesign1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesign1.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entryDesign1.lines, entryDesign1.fontSize * 1.16)}</text>` : ""}
            ${entryDesign2 ? `<text x="${entryCenterX}" y="${entryDesign2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesign2.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entryDesign2.lines, entryDesign2.fontSize * 1.16)}</text>` : ""}
            ${entryDesign3 ? `<text x="${entryCenterX}" y="${entryDesign3Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryDesign3.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entryDesign3.lines, entryDesign3.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c0s" x1="${entry.x + entry.width}" y1="${topY}" x2="${agent.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="${entry.x + entry.width}" y1="${topY}" x2="${agent.x}" y2="${topY}" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="${agent.x}" y="${agent.y}" width="${agent.width}" height="${agent.height}" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="${agentCenterX}" y="210" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="${agentCenterX}" y="240" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(agentCenterX, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            <rect x="${agentCenterX - 92}" y="258" width="184" height="${agentGoal.lines.length > 1 ? 44 : 32}" rx="11" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="${agentCenterX}" y="${agentGoal.lines.length > 1 ? 274 : 280}" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(agentCenterX, agentGoal.lines, agentGoal.fontSize * 1.14)}</text>
          </g>

          <line class="co" id="c1s" x1="${agent.x + agent.width}" y1="${topY}" x2="${middle.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="${agent.x + agent.width}" y1="${topY}" x2="${middle.x}" y2="${topY}" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="${middle.x}" y="${middle.y}" width="${middle.width}" height="${middle.height}" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${middleCenterX}" y="198" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(limitTitle.text)}</text>
            <text x="${middleCenterX}" y="230" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitSub1.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(middleCenterX, limitSub1.lines, limitSub1.fontSize * 1.14)}</text>
            <text x="${middleCenterX}" y="${middleSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitSub2.fontSize}" fill="#b66868">${renderTspans(middleCenterX, limitSub2.lines, limitSub2.fontSize * 1.16)}</text>
            <rect x="${middleCenterX - 104}" y="${middlePillCenterY - (limitEmphasis.lines.length > 1 ? 22 : 15)}" width="208" height="${limitEmphasis.lines.length > 1 ? 44 : 30}" rx="10" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="${middleCenterX}" y="${limitEmphasis.lines.length > 1 ? middlePillCenterY - 6 : middlePillCenterY + 4}" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitEmphasis.fontSize}" font-weight="700" fill="#7d2626">${renderTspans(middleCenterX, limitEmphasis.lines, limitEmphasis.fontSize * 1.12)}</text>
            ${limitNote ? `<text x="${middleCenterX}" y="${limitNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${limitNote.fontSize}" fill="#9a7748">${renderTspans(middleCenterX, limitNote.lines, limitNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c2s" x1="${middle.x + middle.width}" y1="${topY}" x2="${reviewer.x}" y2="${topY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="${middle.x + middle.width}" y1="${topY}" x2="${reviewer.x}" y2="${topY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="${reviewer.x}" y="${reviewer.y}" width="${reviewer.width}" height="${reviewer.height}" rx="22" fill="#fff4f4" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${reviewerCenterX}" y="196" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(burstTitle.text)}</text>
            <text x="${reviewerCenterX}" y="230" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstSub1.fontSize}" fill="#a33b3b">${renderTspans(reviewerCenterX, burstSub1.lines, burstSub1.fontSize * 1.16)}</text>
            <text x="${reviewerCenterX}" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstSub2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(reviewerCenterX, burstSub2.lines, burstSub2.fontSize * 1.14)}</text>
            <text x="${reviewerCenterX}" y="308" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstNote.fontSize}" fill="#c07b7b">${renderTspans(reviewerCenterX, burstNote.lines, burstNote.fontSize * 1.14)}</text>
            ${burstNote2 ? `<text x="${reviewerCenterX}" y="${burstNote2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${burstNote2.fontSize}" fill="#c07b7b">${renderTspans(reviewerCenterX, burstNote2.lines, burstNote2.fontSize * 1.14)}</text>` : ""}
          </g>

          <path class="co" id="c3s" d="M${reviewerCenterX} ${reviewer.y + reviewer.height} L${reviewerCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerToContextY}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="M${reviewerCenterX} ${reviewer.y + reviewer.height} L${reviewerCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerBridgeY} L${contextCenterX} ${reviewerToContextY}" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="${context.x}" y="${context.y}" width="${context.width}" height="${context.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${contextCenterX}" y="${contextTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.context.title)}</text>
            ${innerPill(contextCenterX, contextBeforeY, 236, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 12, 700)}
            <line x1="${contextCenterX - 86}" y1="${contextDividerY}" x2="${contextCenterX + 86}" y2="${contextDividerY}" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(contextCenterX, contextAfterY, 244, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 12, 800)}
          </g>

          <path class="co" id="c4s" d="M${context.x} ${contextMiddleY} L${decisionCenterX} ${contextToDecisionY} L${decisionCenterX} ${decision.y}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <path class="fl a" id="c4f" d="M${context.x} ${contextMiddleY} L${decisionCenterX} ${contextToDecisionY} L${decisionCenterX} ${decision.y}" fill="none" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="${decision.x}" y="${decision.y}" width="${decision.width}" height="${decision.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${decisionCenterX}" y="722" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="${decisionCenterX}" y="752" text-anchor="middle" font-family="${getFontStack()}" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.decision.sub1)}</text>
            <rect x="356" y="770" width="168" height="${decisionGoal.lines.length > 1 ? 44 : 32}" rx="10" fill="#f8dede" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="${decisionCenterX}" y="${decisionGoal.lines.length > 1 ? 786 : 792}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionGoal.fontSize}" font-weight="800" fill="#7d2626">${renderTspans(decisionCenterX, decisionGoal.lines, decisionGoal.fontSize * 1.14)}</text>
            ${decisionNote ? `<text x="${decisionCenterX}" y="${decisionNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionNote.fontSize}" fill="#9a7748">${renderTspans(decisionCenterX, decisionNote.lines, decisionNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c5s" x1="${decision.x + decision.width}" y1="${decisionActionY}" x2="${action.x}" y2="${decisionActionY}" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="${decision.x + decision.width}" y1="${decisionActionY}" x2="${action.x}" y2="${decisionActionY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="${action.x}" y="${action.y}" width="${action.width}" height="${action.height}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="${actionCenterX}" y="730" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="${actionCenterX}" y="760" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(actionCenterX, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            ${actionSub2 ? `<text x="${actionCenterX}" y="794" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(actionCenterX, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>` : ""}
            ${actionNote1 ? `<text x="${actionCenterX}" y="${actionNote1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionNote1.fontSize}" fill="#9a7748">${renderTspans(actionCenterX, actionNote1.lines, actionNote1.fontSize * 1.16)}</text>` : ""}
            ${actionNote2 ? `<text x="${actionCenterX}" y="${actionNote2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionNote2.fontSize}" fill="#9a7748">${renderTspans(actionCenterX, actionNote2.lines, actionNote2.fontSize * 1.16)}</text>` : ""}
          </g>

          <g class="ng" id="g7">
            <rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="${outcome.height}" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="${outcome.x}" y="${outcome.y}" width="${outcome.width}" height="58" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="${outcomeCenterX}" y="682" text-anchor="middle" font-family="${getFontStack()}" font-size="12" fill="#97a0b4">${escapeHtml(config.outcome.top)}</text>
            <text x="${outcomeCenterX}" y="704" text-anchor="middle" font-family="${getFontStack()}" font-size="10" fill="#b2aba0">${escapeHtml(config.outcome.topSub)}</text>
            <line x1="${outcome.x + 4}" y1="732" x2="${outcome.x + outcome.width - 4}" y2="732" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="${outcome.x}" y="734" width="${outcome.width}" height="90" fill="#fff8f8" clip-path="url(#oc-repl)"/>
            <text x="${outcomeCenterX}" y="772" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="${outcomeCenterX}" y="798" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeBottom.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(outcomeCenterX, outcomeBottom.lines, outcomeBottom.fontSize * 1.12)}</text>
            ${outcomeNote ? `<text x="${outcomeCenterX}" y="${outcomeNoteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeNote.fontSize}" fill="#9a7748">${renderTspans(outcomeCenterX, outcomeNote.lines, outcomeNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c6s" x1="${action.x + action.width}" y1="${actionOutcomeY}" x2="${outcomeConnectorPivotX}" y2="${actionOutcomeY}" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="${action.x + action.width}" y1="${actionOutcomeY}" x2="${outcomeConnectorPivotX}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M${outcomeConnectorPivotX} ${actionOutcomeY} L${outcomeConnectorPivotX} ${outcomeEvidenceY} L${outcome.x} ${outcomeEvidenceY}" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="co" id="c6a" x1="${outcomeConnectorPivotX}" y1="${actionOutcomeY}" x2="${getFlowConnectorEndX(outcome.x)}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="${outcomeConnectorPivotX}" y1="${actionOutcomeY}" x2="${getFlowConnectorEndX(outcome.x)}" y2="${actionOutcomeY}" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          ${flowLabelHorizontal((entry.x + entry.width + agent.x) / 2, topY, config.labels.l0, "#4452b8", "l0", 12, 150)}
          ${flowLabelHorizontal((agent.x + agent.width + middle.x) / 2, topY, config.labels.l1, "#4452b8", "l1", 12, 160)}
          ${flowLabelHorizontal((middle.x + middle.width + reviewer.x) / 2, topY, config.labels.l2, "#ad3535", "l2", 12, 156)}
          ${flowLabelHorizontal(reviewer.x + reviewer.width - 80, reviewer.y + reviewer.height + 28, config.labels.l3, "#ad3535", "l3", 12, 160)}
          ${flowLabelHorizontal((reviewerCenterX + contextCenterX) / 2, reviewerBridgeY, config.labels.la1, "#ad3535", "la1", 12, 190)}
          ${flowLabelVertical(decisionCenterX, (contextToDecisionY + decision.y) / 2, config.labels.l4, "#ad3535", "l4", 12, 170)}
          ${flowLabelHorizontal((decision.x + decision.width + action.x) / 2, decisionActionY + 10, config.labels.l5, "#ad3535", "l5", 12, 120)}
          ${flowLabelHorizontalSegment(outcomeConnectorPivotX, getFlowConnectorEndX(outcome.x), actionOutcomeY + 10, config.labels.l6, "#ad3535", "l6", 12, 132)}
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
    const loopLabelSize = 11.5;
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
            <rect x="32" y="58" width="986" height="158" rx="24" fill="rgba(136,135,128,.05)"/>
            <path d="M180 58 H994 A24 24 0 0 1 1018 82 V192 A24 24 0 0 1 994 216 H56 A24 24 0 0 1 32 192 V82 A24 24 0 0 1 56 58" fill="none" stroke="#888780" stroke-width="2.4" stroke-dasharray="8 4" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="70" y="28" width="110" height="22" rx="11" fill="#fff"/>
            <text x="125" y="43" text-anchor="middle" font-family="${getFontStack()}" font-size="11" font-weight="800" fill="#888780" letter-spacing=".08em">ATTACK ENTRY</text>
            <path d="M56 58 H70" fill="none" stroke="#888780" stroke-width="2.4" stroke-dasharray="8 4" stroke-linecap="round"/>
          </g>

          <g class="az" id="gzone">
            <rect x="40" y="260" width="1320" height="614" rx="28" fill="rgba(226,75,74,.06)" stroke="#E24B4A" stroke-width="3" stroke-dasharray="10 5"/>
            <rect x="470" y="242" width="460" height="24" rx="12" fill="#fff"/>
            <text x="700" y="243" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#A32D2D" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
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

          <path class="co" id="c4s" d="M1161 402 L1161 446 L970 462" fill="none" stroke="#EF9F27" stroke-width="2" marker-end="url(#ar)"/>
          <path class="fl" id="c4f" d="M1161 402 L1161 446 L970 462" fill="none" stroke="#EF9F27" stroke-width="3.8" marker-end="url(#ar)"/>

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

          <path class="co" id="c5s" d="M350 588 L330 588 L330 770 L420 770" fill="none" stroke="#E24B4A" stroke-width="2.2" stroke-dasharray="8 4" marker-end="url(#ar)"/>
          <path class="fl a" id="c5f" d="M350 588 L330 588 L330 770 L420 770" fill="none" stroke="#E24B4A" stroke-width="4.2" stroke-dasharray="8 4" marker-end="url(#ar)"/>

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
          ${flowLabelVertical(900, 250, config.labels.l2 || "③ tool call", "#1D9E75", "l2", loopLabelSize, 140)}
          ${flowLabelHorizontal(990, 355, config.labels.l3 || "④ pending", "#888780", "l3", loopLabelSize, 135)}
          ${flowLabelHorizontal(1066, 446, config.labels.l5a || "⑤ goal check fails", "#A32D2D", "la1", loopLabelSize, 185)}
          ${flowLabelHorizontal(376, 770, config.labels.l6 || "⑥ agent retries", "#E24B4A", "l4", loopLabelSize, 150)}
          ${flowLabelHorizontal(740, 752, config.labels.l7 || "⑦ duplicate call", "#E24B4A", "l5", loopLabelSize, 155)}
          ${flowLabelVertical(898, 836, config.labels.l8 || "⑧ business loss", "#A32D2D", "l6", loopLabelSize, 145)}
        </svg>
      </div>
      ${panelMarkup("ASI02 — Tool Misuse & Exploitation", "Click Start to reveal how ambiguous success criteria and missing retry controls make the agent re-use the same tool path autonomously.")}
    `;
  }

  function renderAttackMemory(config) {
    const useCombinedPayoutLabel = config.tool.title === "approveInvoice()";
    const payoutConnectorLabel = useCombinedPayoutLabel
      ? "⑦-⑧ auto-pay executes → fraud cashes out"
      : config.labels.l5;
    const entryTitle = fitSingleLine(config.entry.title, 176, 16, 12);
    const entryLine1 = fitWrappedText(config.entry.sub1, 184, 12, 10, 2);
    const entryLine2 = fitWrappedText(config.entry.sub2, 184, 11, 9, 2);
    const memoryTitle = fitSingleLine(config.memory.title, 220, 18, 14);
    const memoryState1 = fitWrappedText(config.memory.state1, 230, 13, 11, 2);
    const memoryState2 = fitWrappedText(config.memory.state2, 230, 13, 11, 2);
    const memoryNote = fitWrappedText(config.memory.note, 240, 11, 9, 2);
    const attackerSub1 = fitWrappedText(config.attacker.sub1, 170, 13, 11, 2);
    const attackerSub2 = fitWrappedText(config.attacker.sub2, 166, 11, 10, 2);
    const attackerBoxHeight = attackerSub2.lines.length > 1 ? 134 : 122;
    const attackerTitleY = attackerSub2.lines.length > 1 ? 214 : 220;
    const attackerSub1Y = attackerSub2.lines.length > 1 ? 242 : 248;
    const attackerSub2Y = attackerSub2.lines.length > 1 ? 274 : 286;
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
    const toolNote = config.tool.note
      ? fitWrappedText(config.tool.note, 196, 10, 8.6, 2)
      : null;
    const impactVisibleTitle = config.impact.visibleTitle
      ? fitSingleLine(config.impact.visibleTitle, 236, 12.5, 10)
      : null;
    const impactVisibleSub1 = config.impact.visibleSub1
      ? fitWrappedText(config.impact.visibleSub1, 246, 10.5, 9, 2)
      : null;
    const impactHasVisible = Boolean(impactVisibleTitle && impactVisibleSub1);
    const impactTitle = fitSingleLine(config.impact.title, 220, 18, 13);
    const impact1 = fitWrappedText(config.impact.sub1, 248, 13, 11, 2);
    const impact2 = fitWrappedText(config.impact.sub2, 252, 12, 10, 2);
    const timelineCue = config.timelineCue
      ? fitSingleLine(config.timelineCue, 120, 11, 9)
      : null;
    const toolBoxHeight = toolNote ? 170 : 154;
    const toolConnectorStartY = toolNote ? 694 : 678;

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
            <rect x="276" y="92" width="726" height="284" rx="28" fill="rgba(156,47,47,0.04)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="504" y="74" width="268" height="20" rx="10" fill="#fff"/>
            <text x="638" y="88" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="34" y="174" width="190" height="${attackerBoxHeight}" rx="18" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="129" y="${attackerTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.attacker.title)}</text>
            <text x="129" y="${attackerSub1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub1.fontSize}" fill="#6b655c">${renderTspans(129, attackerSub1.lines, attackerSub1.fontSize * 1.16)}</text>
            <text x="129" y="${attackerSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub2.fontSize}" fill="#8a847b">${renderTspans(129, attackerSub2.lines, attackerSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="224" y1="236" x2="308" y2="236" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c0f" x1="224" y1="236" x2="308" y2="236" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <path d="M308 144 h228 l28 28 v130 h-256 z" fill="#faeeda" stroke="#ef9f27" stroke-width="2"/>
            <line x1="536" y1="144" x2="536" y2="172" stroke="#ef9f27" stroke-width="1.1"/>
            <line x1="536" y1="172" x2="564" y2="172" stroke="#ef9f27" stroke-width="1.1"/>
            <text x="436" y="194" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#633806">${escapeHtml(entryTitle.text)}</text>
            <text x="436" y="228" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryLine1.fontSize}" fill="#854f0b">${renderTspans(436, entryLine1.lines, entryLine1.fontSize * 1.16)}</text>
            <text x="436" y="274" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryLine2.fontSize}" font-style="italic" fill="#a32d2d">${renderTspans(436, entryLine2.lines, entryLine2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c1s" x1="564" y1="236" x2="650" y2="236" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c1f" x1="564" y1="236" x2="650" y2="236" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

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
            <rect x="34" y="556" width="220" height="124" rx="18" fill="#fbfcfe" stroke="#d8dfe9" stroke-width="2.1"/>
            <text x="144" y="608" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#586578">${escapeHtml(config.user.title)}</text>
            <text x="144" y="636" text-anchor="middle" font-family="${getFontStack()}" font-size="${userSub1.fontSize}" fill="#6f7d91">${renderTspans(144, userSub1.lines, userSub1.fontSize * 1.16)}</text>
            <text x="144" y="672" text-anchor="middle" font-family="${getFontStack()}" font-size="${userSub2.fontSize}" fill="#93a0b2">${renderTspans(144, userSub2.lines, userSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c2s" x1="254" y1="618" x2="340" y2="618" stroke="#d7dde7" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="254" y1="618" x2="340" y2="618" stroke="#8ea0d8" stroke-width="3.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="340" y="520" width="310" height="178" rx="22" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="495" y="562" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(agentTitle.text)}</text>
            <text x="495" y="594" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub1.fontSize}" fill="#5360be">${renderTspans(495, agentSub1.lines, agentSub1.fontSize * 1.16)}</text>
            <text x="495" y="632" text-anchor="middle" font-family="${getFontStack()}" font-size="${agentSub2.fontSize}" fill="#6c78cb">${renderTspans(495, agentSub2.lines, agentSub2.fontSize * 1.16)}</text>
            <rect x="375" y="650" width="240" height="34" rx="11" fill="#eef8f1" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="495" y="672" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#2d6a4f">${escapeHtml(retrieveTitle.text)}</text>
          </g>

          <path class="co" id="c3s" d="M800 338 L800 430 L495 430 L495 520" fill="none" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <path class="fl" id="c3f" d="M800 338 L800 430 L495 430 L495 520" fill="none" stroke="#4452b8" stroke-width="4" marker-end="url(#ar)"/>
          <line class="co" id="c3v" x1="800" y1="338" x2="800" y2="430" stroke="#beb6a9" stroke-width="2"/>
          <line class="fl" id="c3vf" x1="800" y1="338" x2="800" y2="430" stroke="#4452b8" stroke-width="3.6"/>
          ${timelineCue ? `<text class="ng" id="g3cue" x="646" y="418" text-anchor="middle" font-family="${getFontStack()}" font-size="${timelineCue.fontSize}" font-style="italic" fill="#8a847b">${escapeHtml(timelineCue.text)}</text>` : ""}

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
            <rect x="1060" y="524" width="240" height="${toolBoxHeight}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="1180" y="578" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(toolTitle.text)}</text>
            <text x="1180" y="610" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolSub1.fontSize}" fill="#6b655c">${renderTspans(1180, toolSub1.lines, toolSub1.fontSize * 1.16)}</text>
            <text x="1180" y="646" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolSub2.fontSize}" fill="#a33b3b">${renderTspans(1180, toolSub2.lines, toolSub2.fontSize * 1.16)}</text>
            ${toolNote ? `<text x="1180" y="676" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolNote.fontSize}" fill="#b66868">${renderTspans(1180, toolNote.lines, toolNote.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c5s" x1="996" y1="612" x2="1060" y2="612" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="996" y1="612" x2="1060" y2="612" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g7">
            ${impactHasVisible
              ? `
            <rect x="1007" y="732" width="346" height="172" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1022" y="748" width="316" height="54" rx="14" fill="#f8f7f4" stroke="#ddd6cb" stroke-width="1.2"/>
            <text x="1180" y="772" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactVisibleTitle.fontSize}" font-weight="700" fill="#97a0b4">${escapeHtml(impactVisibleTitle.text)}</text>
            <text x="1180" y="792" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactVisibleSub1.fontSize}" fill="#b2aba0">${renderTspans(1180, impactVisibleSub1.lines, impactVisibleSub1.fontSize * 1.14)}</text>
            <line x1="1030" y1="816" x2="1330" y2="816" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <text x="1180" y="848" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1180" y="874" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact1.fontSize}" fill="#a33b3b">${renderTspans(1180, impact1.lines, impact1.fontSize * 1.16)}</text>
            <text x="1180" y="898" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact2.fontSize}" fill="#b66868">${renderTspans(1180, impact2.lines, impact2.fontSize * 1.16)}</text>
              `
              : `
            <rect x="1007" y="748" width="346" height="140" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1180" y="796" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1180" y="826" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact1.fontSize}" fill="#a33b3b">${renderTspans(1180, impact1.lines, impact1.fontSize * 1.16)}</text>
            <text x="1180" y="854" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact2.fontSize}" fill="#b66868">${renderTspans(1180, impact2.lines, impact2.fontSize * 1.16)}</text>
              `}
          </g>

          <line class="co" id="c6s" x1="1180" y1="${toolConnectorStartY}" x2="1180" y2="${impactHasVisible ? 732 : 748}" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c6f" x1="1180" y1="${toolConnectorStartY}" x2="1180" y2="${impactHasVisible ? 732 : 748}" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          ${flowLabel(266, 208, config.labels.l0, "#ad3535", "l0", 10, 112)}
          ${flowLabel(614, 208, config.labels.l1, "#ad3535", "l1", 10, 150)}
          ${flowLabel(296, 590, config.labels.l2, "#4452b8", "l2", 10, 118)}
          ${flowLabelHorizontalSegment(495, 800, 430, config.labels.l3, "#4452b8", "l3", 10, 190)}
          ${flowLabel(676, 584, config.labels.la1, "#ad3535", "la1", 10, 156)}
          ${flowLabel(1028, 584, config.labels.l4, "#ad3535", "l4", 10, 122)}
          ${flowLabelVertical(1180, 712, payoutConnectorLabel, "#ad3535", "l5", 10, 190)}
          ${useCombinedPayoutLabel ? "" : flowLabelVertical(1180, 734, config.labels.l6, "#ad3535", "l6", 10, 112)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how poisoned memory drives a later business decision."
      )}
    `;
  }

  function renderAttackDrift(config) {
    const s1 = fitWrappedText(config.session1.line1, 224, 12, 10, 2);
    const s2 = fitWrappedText(config.session2.line1, 224, 12, 10, 2);
    const s3 = fitWrappedText(config.session3.line1, 224, 12, 10, 2);
    const s1Note = fitWrappedText(config.session1.line2, 240, 10, 9, 2);
    const s2Note = fitWrappedText(config.session2.line2, 240, 10, 9, 2);
    const s3Note = fitWrappedText(config.session3.line2, 240, 10, 9, 2);
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
    const decisionLine2 = fitWrappedText(config.decision.line2, 250, 14, 11, 2);
    const decisionLine3 = config.decision.line3
      ? fitWrappedText(config.decision.line3, 250, 16, 13, 2)
      : null;
    const decisionNote = config.decision.note
      ? fitWrappedText(config.decision.note, 280, 11, 9, 2)
      : null;
    const approvalTitle = fitSingleLine("Approval path", 180, 18, 14);
    const impactVisibleTitle = config.impact.visibleTitle
      ? fitSingleLine(config.impact.visibleTitle, 236, 12.5, 10)
      : null;
    const impactVisibleSub1 = config.impact.visibleSub1
      ? fitWrappedText(config.impact.visibleSub1, 246, 10.5, 9, 2)
      : null;
    const impactHasVisible = Boolean(impactVisibleTitle && impactVisibleSub1);
    const impactTitle = fitSingleLine(config.impact.title, 210, 18, 13);
    const impact1 = fitWrappedText(config.impact.sub1, 260, 13, 11, 2);
    const impact2 = fitWrappedText(config.impact.sub2, 262, 12, 10, 2);
    const timelineCue = config.timelineCue
      ? fitSingleLine(config.timelineCue, 140, 11, 9)
      : null;

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
            <rect x="248" y="126" width="1052" height="336" rx="28" fill="rgba(156,47,47,0.04)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="528" y="108" width="492" height="20" rx="10" fill="#fff"/>
            <text x="774" y="122" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="30" y="164" width="194" height="122" rx="18" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="127" y="210" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.attacker.title)}</text>
            <text x="127" y="242" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub1.fontSize}" fill="#6b655c">${renderTspans(127, attackerSub1.lines, attackerSub1.fontSize * 1.16)}</text>
            <text x="127" y="276" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub2.fontSize}" fill="#8a847b">${renderTspans(127, attackerSub2.lines, attackerSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="224" y1="226" x2="280" y2="226" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c0f" x1="224" y1="226" x2="280" y2="226" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="280" y="152" width="430" height="276" rx="22" fill="#faeeda" stroke="#ef9f27" stroke-width="2.2"/>
            <text x="495" y="186" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#633806">Reinforcement campaign</text>
            <rect x="306" y="204" width="378" height="58" rx="16" fill="#fff8e8" stroke="#efc76c" stroke-width="1.2"/>
            <rect x="324" y="214" width="94" height="28" rx="12" fill="#fffdf4" stroke="#efc76c" stroke-width="1.1"/>
            <text x="371" y="232" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#854f0b">${escapeHtml(config.session1.title)}</text>
            <text x="540" y="222" text-anchor="middle" font-family="${getFontStack()}" font-size="${s1.fontSize}" fill="#854f0b">${renderTspans(540, s1.lines, s1.fontSize * 1.14)}</text>
            <text x="540" y="248" text-anchor="middle" font-family="${getFontStack()}" font-size="${s1Note.fontSize}" fill="#9a6d23">${renderTspans(540, s1Note.lines, s1Note.fontSize * 1.14)}</text>
            <rect x="306" y="272" width="378" height="58" rx="16" fill="#fff8e8" stroke="#efc76c" stroke-width="1.2"/>
            <rect x="324" y="282" width="94" height="28" rx="12" fill="#fffdf4" stroke="#efc76c" stroke-width="1.1"/>
            <text x="371" y="300" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#854f0b">${escapeHtml(config.session2.title)}</text>
            <text x="540" y="290" text-anchor="middle" font-family="${getFontStack()}" font-size="${s2.fontSize}" fill="#854f0b">${renderTspans(540, s2.lines, s2.fontSize * 1.14)}</text>
            <text x="540" y="316" text-anchor="middle" font-family="${getFontStack()}" font-size="${s2Note.fontSize}" fill="#9a6d23">${renderTspans(540, s2Note.lines, s2Note.fontSize * 1.14)}</text>
            <rect x="306" y="340" width="378" height="58" rx="16" fill="#fff8e8" stroke="#efc76c" stroke-width="1.2"/>
            <rect x="324" y="350" width="94" height="28" rx="12" fill="#fffdf4" stroke="#efc76c" stroke-width="1.1"/>
            <text x="371" y="368" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#854f0b">${escapeHtml(config.session3.title)}</text>
            <text x="540" y="358" text-anchor="middle" font-family="${getFontStack()}" font-size="${s3.fontSize}" fill="#854f0b">${renderTspans(540, s3.lines, s3.fontSize * 1.14)}</text>
            <text x="540" y="384" text-anchor="middle" font-family="${getFontStack()}" font-size="${s3Note.fontSize}" fill="#9a6d23">${renderTspans(540, s3Note.lines, s3Note.fontSize * 1.14)}</text>
            <text x="495" y="412" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-style="italic" fill="#a32d2d">The attacker keeps referencing prior sessions to strengthen the false belief.</text>
          </g>

          <line class="co" id="c1s" x1="710" y1="292" x2="840" y2="292" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c1f" x1="710" y1="292" x2="840" y2="292" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="840" y="152" width="430" height="258" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1055" y="186" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.memory.title)}</text>
            <rect x="882" y="214" width="346" height="40" rx="14" fill="#fbeeee" stroke="#efc4c4" stroke-width="1.2"/>
            <text x="1055" y="238" text-anchor="middle" font-family="${getFontStack()}" font-size="${mem1.fontSize}" fill="#8d2222">${renderTspans(1055, mem1.lines, mem1.fontSize * 1.14)}</text>
            <rect x="882" y="268" width="346" height="44" rx="14" fill="#f8e2e2" stroke="#efb0b0" stroke-width="1.2"/>
            <text x="1055" y="294" text-anchor="middle" font-family="${getFontStack()}" font-size="${mem2.fontSize}" fill="#8d2222">${renderTspans(1055, mem2.lines, mem2.fontSize * 1.14)}</text>
            <rect x="882" y="326" width="346" height="54" rx="14" fill="#f4cfcf" stroke="#e38d8d" stroke-width="1.2"/>
            <text x="1055" y="354" text-anchor="middle" font-family="${getFontStack()}" font-size="${mem3.fontSize}" font-weight="800" fill="#7d1f1f">${renderTspans(1055, mem3.lines, mem3.fontSize * 1.14)}</text>
            <text x="1055" y="398" text-anchor="middle" font-family="${getFontStack()}" font-size="${memNote.fontSize}" fill="#a35656">${renderTspans(1055, memNote.lines, memNote.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c1bs" x1="1055" y1="410" x2="1055" y2="454" stroke="#beb6a9" stroke-width="2.4"/>
          <line class="fl a" id="c1bf" x1="1055" y1="410" x2="1055" y2="454" stroke="#ad3535" stroke-width="4"/>
          ${timelineCue ? `<text class="ng" id="g3cue" x="1055" y="484" text-anchor="middle" font-family="${getFontStack()}" font-size="${timelineCue.fontSize}" font-style="italic" fill="#8a847b">${escapeHtml(timelineCue.text)}</text>` : ""}

          <g class="ng" id="g3">
            <rect x="30" y="602" width="300" height="126" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="180" y="646" text-anchor="middle" font-family="${getFontStack()}" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.launderer.title)}</text>
            <text x="180" y="676" text-anchor="middle" font-family="${getFontStack()}" font-size="${laundererSub1.fontSize}" fill="#6b655c">${renderTspans(180, laundererSub1.lines, laundererSub1.fontSize * 1.16)}</text>
            <text x="180" y="708" text-anchor="middle" font-family="${getFontStack()}" font-size="${laundererSub2.fontSize}" fill="#8a847b">${renderTspans(180, laundererSub2.lines, laundererSub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c2s" x1="330" y1="666" x2="500" y2="666" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c2f" x1="330" y1="666" x2="500" y2="666" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="500" y="552" width="420" height="204" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="710" y="610" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(decisionTitle.text)}</text>
            <text x="710" y="642" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionLine1.fontSize}" fill="#8d2222">${renderTspans(710, decisionLine1.lines, decisionLine1.fontSize * 1.16)}</text>
            <text x="710" y="674" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionLine2.fontSize}" fill="#8d2222">${renderTspans(710, decisionLine2.lines, decisionLine2.fontSize * 1.16)}</text>
            ${decisionLine3 ? `<text x="710" y="708" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionLine3.fontSize}" font-weight="800" fill="#a32d2d">${renderTspans(710, decisionLine3.lines, decisionLine3.fontSize * 1.14)}</text>` : ""}
            <text x="710" y="736" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionNote ? decisionNote.fontSize : 11}" fill="#b66868">${decisionNote ? renderTspans(710, decisionNote.lines, decisionNote.fontSize * 1.16) : "The agent acts on the stored belief, not on the real risk profile of the transfer."}</text>
          </g>

          <path class="co" id="c3s" d="M1055 500 L1055 514 L710 514 L710 566" fill="none" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="M1055 500 L1055 514 L710 514 L710 566" fill="none" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>
          <line class="co" id="c3v" x1="1055" y1="454" x2="1055" y2="500" stroke="#beb6a9" stroke-width="2"/>
          <line class="fl a" id="c3vf" x1="1055" y1="454" x2="1055" y2="500" stroke="#ad3535" stroke-width="3.6"/>

          <g class="ng" id="g5">
            <rect x="1045" y="592" width="230" height="140" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1160" y="638" text-anchor="middle" font-family="${getFontStack()}" font-size="${approvalTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(approvalTitle.text)}</text>
            <text x="1160" y="668" text-anchor="middle" font-family="${getFontStack()}" font-size="15" font-weight="800" fill="#a32d2d">NO FLAG → APPROVE</text>
            <text x="1160" y="696" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" fill="#b66868">Structured transfers pass silently</text>
          </g>

          <line class="co" id="c4s" x1="920" y1="666" x2="1045" y2="666" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="920" y1="666" x2="1045" y2="666" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            ${impactHasVisible
              ? `
            <rect x="980" y="772" width="360" height="168" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1000" y="788" width="320" height="54" rx="14" fill="#f8f7f4" stroke="#ddd6cb" stroke-width="1.2"/>
            <text x="1160" y="812" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactVisibleTitle.fontSize}" font-weight="700" fill="#97a0b4">${escapeHtml(impactVisibleTitle.text)}</text>
            <text x="1160" y="832" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactVisibleSub1.fontSize}" fill="#b2aba0">${renderTspans(1160, impactVisibleSub1.lines, impactVisibleSub1.fontSize * 1.14)}</text>
            <line x1="1010" y1="856" x2="1310" y2="856" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <text x="1160" y="888" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1160" y="912" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact1.fontSize}" fill="#a33b3b">${renderTspans(1160, impact1.lines, impact1.fontSize * 1.14)}</text>
            <text x="1160" y="932" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact2.fontSize}" fill="#b66868">${renderTspans(1160, impact2.lines, impact2.fontSize * 1.14)}</text>
              `
              : `
            <rect x="980" y="804" width="360" height="112" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1160" y="844" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1160" y="872" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact1.fontSize}" fill="#a33b3b">${renderTspans(1160, impact1.lines, impact1.fontSize * 1.14)}</text>
            <text x="1160" y="896" text-anchor="middle" font-family="${getFontStack()}" font-size="${impact2.fontSize}" fill="#b66868">${renderTspans(1160, impact2.lines, impact2.fontSize * 1.14)}</text>
              `}
          </g>

          <line class="co" id="c5s" x1="1160" y1="732" x2="1160" y2="${impactHasVisible ? 772 : 804}" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="1160" y1="732" x2="1160" y2="${impactHasVisible ? 772 : 804}" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          ${flowLabel(246, 192, config.labels.l0, "#ad3535", "l0", 10, 120)}
          ${flowLabel(776, 246, config.labels.l1, "#ad3535", "l1", 10, 118)}
          ${flowLabel(1088, 482, config.labels.l2, "#ad3535", "l2", 10, 110)}
          ${flowLabel(420, 642, config.labels.l3, "#ad3535", "l3", 10, 128)}
          ${flowLabel(900, 506, config.labels.l4, "#ad3535", "l4", 10, 124)}
          ${flowLabel(982, 650, config.labels.l5, "#ad3535", "l5", 10, 118)}
          ${flowLabelVertical(1160, 782, config.labels.l6, "#ad3535", "l6", 10, 120)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how repeated sessions turn a false belief into trusted memory."
      )}
    `;
  }

  function renderAttackChannel(config) {
    const viewBoxWidth = config.action.calloutTitle ? 1520 : 1400;
    const frameWidth = viewBoxWidth;
    const frameRight = viewBoxWidth - 56;
    const zoneWidth = config.action.calloutTitle ? 1180 : 1060;
    const frameCenterX = viewBoxWidth / 2;
    const zoneCenterX = 300 + zoneWidth / 2;
    const entryTitle = fitSingleLine(config.entry.title, 166, 18, 14);
    const entrySub1 = fitWrappedText(config.entry.sub1, 160, 13, 11, 2);
    const entrySub2 = fitWrappedText(config.entry.sub2, 160, 11, 9, 2);
    const senderTitle = fitSingleLine(config.sender.title, 194, 18, 14);
    const senderSub1 = fitWrappedText(config.sender.sub1, 186, 13, 11, 2);
    const senderGoal = fitWrappedText(config.sender.goal, 164, 12, 10, 2);
    const channelTitle = fitSingleLine(config.channel.title, 212, 17, 13);
    const channelSub1 = fitWrappedText(config.channel.sub1, 204, 12, 10, 2);
    const channelSub2 = fitWrappedText(config.channel.sub2, 204, 11, 9, 2);
    const channelSub3 = config.channel.sub3
      ? fitWrappedText(config.channel.sub3, 204, 11, 9, 2)
      : null;
    const channelSub4 = config.channel.sub4
      ? fitWrappedText(config.channel.sub4, 204, 10.5, 8.8, 2)
      : null;
    const channelBoxHeight = channelSub4 ? 196 : (channelSub3 ? 176 : 164);
    const attackerTitle = fitSingleLine(config.attacker.title, 200, 18, 14);
    const attackerSub1 = fitWrappedText(config.attacker.sub1, 188, 12.5, 10, 2);
    const attackerSub2 = fitWrappedText(config.attacker.sub2, 188, 11, 9, 2);
    const attackerTone = config.attacker.tone || "danger";
    const attackerPalette = attackerTone === "neutral"
      ? { fill: "#fcfbf8", stroke: "#aba294", title: "#38342f", sub1: "#6b655c", sub2: "#8a847b" }
      : (attackerTone === "threat"
        ? { fill: "#fff6f6", stroke: "#cf8f8f", title: "#6f3a3a", sub1: "#8b5a5a", sub2: "#9b6d6d" }
        : { fill: "#f7f5f1", stroke: "#989082", title: "#48423b", sub1: "#6b655c", sub2: "#8a847b" });
    const tamperTitle = fitSingleLine(config.tamper.title, 222, 17, 13);
    const tamperSub1 = fitWrappedText(config.tamper.sub1, 214, 12.5, 10, 2);
    const tamperSub2 = fitWrappedText(config.tamper.sub2, 214, 12.5, 10, 2);
    const tamperNote = fitWrappedText(config.tamper.note, 214, 10.5, 9, 2);
    const decisionTitle = fitSingleLine(config.decision.title, 208, 17, 13);
    const decisionAgent = fitWrappedText(config.decision.agent, 198, 12, 10, 2);
    const decisionBefore = fitWrappedText(config.decision.before, 174, 12, 10, 2);
    const decisionAfter = fitWrappedText(config.decision.after, 188, 12, 10, 2);
    const receiverWidth = config.receiver.width || 220;
    const receiverX = 1020;
    const receiverCenterX = receiverX + receiverWidth / 2;
    const receiverTitle = fitSingleLine(config.receiver.title, receiverWidth - 18, 17, 13);
    const receiverSub1 = fitWrappedText(config.receiver.sub1, receiverWidth - 26, 12.5, 10, 2);
    const receiverSub2 = fitWrappedText(config.receiver.sub2, receiverWidth - 36, 11, 9, 2);
    const receiverSub3 = config.receiver.sub3
      ? fitWrappedText(config.receiver.sub3, receiverWidth - 44, 10.5, 8.8, 2)
      : null;
    const receiverBadgeTitle = config.receiver.badgeTitle
      ? fitSingleLine(config.receiver.badgeTitle, receiverWidth - 70, 10.5, 8.6)
      : null;
    const receiverBadgeSub1 = config.receiver.badgeSub1
      ? fitSingleLine(config.receiver.badgeSub1, receiverWidth - 58, 9.5, 8)
      : null;
    const receiverHasBadge = Boolean(receiverBadgeTitle && receiverBadgeSub1);
    const receiverBoxHeight = receiverHasBadge
      ? (receiverSub3 ? 206 : 188)
      : (receiverSub3 ? 182 : 164);
    const receiverBoxBottomY = 136 + receiverBoxHeight;
    const actionTitle = fitSingleLine(config.action.title, 214, 17, 13);
    const actionSub1 = fitWrappedText(config.action.sub1, 202, 12.5, 10, 2);
    const actionSub2 = fitWrappedText(config.action.sub2, 202, 11, 9, 2);
    const actionBadgeTitle = config.action.badgeTitle
      ? fitSingleLine(config.action.badgeTitle, 166, 10.5, 8.6)
      : null;
    const actionBadgeSub1 = config.action.badgeSub1
      ? fitSingleLine(config.action.badgeSub1, 138, 9.5, 8)
      : null;
    const actionHasBadge = Boolean(actionBadgeTitle && actionBadgeSub1);
    const actionBoxHeight = actionHasBadge ? 202 : 186;
    const actionBoxBottomY = 430 + actionBoxHeight;
    const actionCalloutTitle = config.action.calloutTitle
      ? fitWrappedText(config.action.calloutTitle, 180, 11, 9.5, 2)
      : null;
    const actionCalloutSub1 = config.action.calloutSub1
      ? fitWrappedText(config.action.calloutSub1, 180, 10.5, 9, 2)
      : null;
    const impactY = config.impact.y || 664;
    const impactTitle = fitSingleLine(config.impact.title, 214, 18, 14);
    const impactSub1 = fitWrappedText(config.impact.sub1, 360, 13, 11, 2);
    const impactSub2 = fitWrappedText(config.impact.sub2, 360, 11, 9, 2);
    const attackerConnectorPath = config.attackerToChannelPath
      ? config.attackerToChannelPath
      : (config.channelToAttacker
      ? "M795 300 L795 372 L160 372 L160 430"
      : "M160 430 L160 372 L795 372 L795 300");
    const tamperConnectorPath = config.tamperConnectorPath || null;
    const receiverConnectorPath = `M865 420 L930 420 Q950 420 950 400 L950 244 Q950 220 974 220 L${receiverX} 220`;
    const receiverLabelX = 942;
    const receiverLabelY = 350;

    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 ${viewBoxWidth} 930" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>

          <rect width="${frameWidth}" height="930" fill="#fff"/>
          <text x="${frameCenterX}" y="50" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="700" fill="#b2aba0" letter-spacing="3.6">REQUEST  ·  AGENT CORE  ·  PEER CHANNEL  ·  TRUST STATE  ·  HARMFUL ACTION  ·  IMPACT</text>
          <line x1="56" y1="72" x2="${frameRight}" y2="72" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="300" y="118" width="${zoneWidth}" height="710" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="516" y="86" width="628" height="24" rx="12" fill="#fff"/>
            <text x="${zoneCenterX}" y="102" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="50" y="156" width="180" height="128" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="140" y="208" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(entryTitle.text)}</text>
            <text x="140" y="238" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#6b655c">${renderTspans(140, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="140" y="266" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#8a847b">${renderTspans(140, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c0s" x1="230" y1="220" x2="350" y2="220" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="230" y1="220" x2="350" y2="220" stroke="#4452b8" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="136" width="220" height="164" rx="22" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="190" text-anchor="middle" font-family="${getFontStack()}" font-size="${senderTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(senderTitle.text)}</text>
            <text x="460" y="220" text-anchor="middle" font-family="${getFontStack()}" font-size="${senderSub1.fontSize}" fill="#5360be">${renderTspans(460, senderSub1.lines, senderSub1.fontSize * 1.16)}</text>
            <rect x="382" y="242" width="156" height="42" rx="12" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="460" y="${senderGoal.lines.length > 1 ? 259 : 264}" text-anchor="middle" font-family="${getFontStack()}" font-size="${senderGoal.fontSize}" font-weight="700" fill="#2d6a4f">${renderTspans(460, senderGoal.lines, senderGoal.fontSize * 1.15)}</text>
          </g>

          <line class="co" id="c1s" x1="570" y1="220" x2="680" y2="220" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="220" x2="680" y2="220" stroke="#4452b8" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="136" width="230" height="${channelBoxHeight}" rx="22" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="795" y="190" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(channelTitle.text)}</text>
            <text x="795" y="226" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelSub1.fontSize}" fill="#6b655c">${renderTspans(795, channelSub1.lines, channelSub1.fontSize * 1.16)}</text>
            <text x="795" y="266" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelSub2.fontSize}" fill="#8a847b">${renderTspans(795, channelSub2.lines, channelSub2.fontSize * 1.16)}</text>
            ${channelSub3 ? `<text x="795" y="292" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelSub3.fontSize}" fill="#8a847b">${renderTspans(795, channelSub3.lines, channelSub3.fontSize * 1.16)}</text>` : ""}
            ${channelSub4 ? `<text x="795" y="318" text-anchor="middle" font-family="${getFontStack()}" font-size="${channelSub4.fontSize}" fill="#9b6d6d">${renderTspans(795, channelSub4.lines, channelSub4.fontSize * 1.16)}</text>` : ""}
          </g>

          <g class="ng" id="g3">
            <rect x="50" y="430" width="220" height="154" rx="22" fill="${attackerPalette.fill}" stroke="${attackerPalette.stroke}" stroke-width="2.4"/>
            <text x="160" y="488" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerTitle.fontSize}" font-weight="700" fill="${attackerPalette.title}">${escapeHtml(attackerTitle.text)}</text>
            <text x="160" y="522" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub1.fontSize}" fill="${attackerPalette.sub1}">${renderTspans(160, attackerSub1.lines, attackerSub1.fontSize * 1.16)}</text>
            <text x="160" y="560" text-anchor="middle" font-family="${getFontStack()}" font-size="${attackerSub2.fontSize}" fill="${attackerPalette.sub2}">${renderTspans(160, attackerSub2.lines, attackerSub2.fontSize * 1.16)}</text>
          </g>

          <path class="co" id="c2s" d="${attackerConnectorPath}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c2f" d="${attackerConnectorPath}" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          ${tamperConnectorPath
            ? `<path class="co" id="c3s" d="${tamperConnectorPath}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="${tamperConnectorPath}" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>`
            : `<line class="co" id="c3s" x1="270" y1="520" x2="390" y2="520" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c3f" x1="270" y1="520" x2="390" y2="520" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>`}

          <g class="ng" id="g4">
            <rect x="390" y="430" width="260" height="186" rx="22" fill="#fff4f4" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="418" y="446" width="204" height="28" rx="14" fill="#f7dfdf" stroke="#e7b1b1" stroke-width="1.1"/>
            <text x="520" y="465" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(tamperTitle.text)}</text>
            <text x="520" y="512" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperSub1.fontSize}" fill="#a33b3b">${renderTspans(520, tamperSub1.lines, tamperSub1.fontSize * 1.16)}</text>
            <text x="520" y="556" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperSub2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(520, tamperSub2.lines, tamperSub2.fontSize * 1.14)}</text>
            <text x="520" y="594" text-anchor="middle" font-family="${getFontStack()}" font-size="${tamperNote.fontSize}" fill="#c07b7b">${renderTspans(520, tamperNote.lines, tamperNote.fontSize * 1.16)}</text>
          </g>

          <line class="co" id="c4s" x1="650" y1="520" x2="750" y2="520" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="650" y1="520" x2="750" y2="520" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="750" y="420" width="230" height="196" rx="22" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="865" y="458" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionTitle.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(decisionTitle.text)}</text>
            <text x="865" y="486" text-anchor="middle" font-family="${getFontStack()}" font-size="${decisionAgent.fontSize}" fill="#5360be">${renderTspans(865, decisionAgent.lines, decisionAgent.fontSize * 1.16)}</text>
            ${innerPill(865, 536, 184, config.decision.before, "#edf7f0", "#bdddc8", "#2d6a4f", decisionBefore.fontSize, 700)}
            ${innerPill(865, 584, 206, config.decision.after, "#fff5f5", "#e6b3b3", "#ad3535", decisionAfter.fontSize, 800)}
          </g>

          <path class="co" id="c5s" d="${receiverConnectorPath}" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c5f" d="${receiverConnectorPath}" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="${receiverX}" y="136" width="${receiverWidth}" height="${receiverBoxHeight}" rx="22" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${receiverCenterX}" y="190" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(receiverTitle.text)}</text>
            <text x="${receiverCenterX}" y="226" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverSub1.fontSize}" fill="#a33b3b">${renderTspans(receiverCenterX, receiverSub1.lines, receiverSub1.fontSize * 1.16)}</text>
            <text x="${receiverCenterX}" y="264" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverSub2.fontSize}" fill="#b66868">${renderTspans(receiverCenterX, receiverSub2.lines, receiverSub2.fontSize * 1.16)}</text>
            ${receiverSub3
              ? `<text x="${receiverCenterX}" y="292" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverSub3.fontSize}" fill="#c07b7b">${renderTspans(receiverCenterX, receiverSub3.lines, receiverSub3.fontSize * 1.16)}</text>`
              : ""}
            ${receiverHasBadge
              ? `
            <rect x="${receiverX + 24}" y="${receiverSub3 ? 310 : 282}" width="${receiverWidth - 48}" height="24" rx="12" fill="#f5f4f1" stroke="#d8d0c4" stroke-width="1"/>
            <text x="${receiverCenterX}" y="${receiverSub3 ? 326 : 298}" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverBadgeTitle.fontSize}" font-weight="700" fill="#7a746a">${escapeHtml(receiverBadgeTitle.text)}</text>
            <text x="${receiverCenterX}" y="${receiverSub3 ? 346 : 318}" text-anchor="middle" font-family="${getFontStack()}" font-size="${receiverBadgeSub1.fontSize}" fill="#9a9387">${escapeHtml(receiverBadgeSub1.text)}</text>
              `
              : ""}
          </g>

          <path class="co" id="c6s" d="M${receiverCenterX} ${receiverBoxBottomY} L${receiverCenterX} 430" fill="none" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c6f" d="M${receiverCenterX} ${receiverBoxBottomY} L${receiverCenterX} 430" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g7">
            <rect x="1020" y="430" width="250" height="${actionBoxHeight}" rx="22" fill="#fcfbf8" stroke="#aba294" stroke-width="2.4"/>
            <text x="1145" y="492" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionTitle.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(actionTitle.text)}</text>
            <text x="1145" y="530" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub1.fontSize}" fill="#6b655c">${renderTspans(1145, actionSub1.lines, actionSub1.fontSize * 1.16)}</text>
            <text x="1145" y="574" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionSub2.fontSize}" fill="#8a847b">${renderTspans(1145, actionSub2.lines, actionSub2.fontSize * 1.16)}</text>
            ${actionHasBadge
              ? `
            <rect x="1052" y="590" width="186" height="24" rx="12" fill="#f5f4f1" stroke="#d8d0c4" stroke-width="1"/>
            <text x="1145" y="606" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionBadgeTitle.fontSize}" font-weight="700" fill="#7a746a">${escapeHtml(actionBadgeTitle.text)}</text>
            <text x="1145" y="626" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionBadgeSub1.fontSize}" fill="#9a9387">${escapeHtml(actionBadgeSub1.text)}</text>
              `
              : ""}
          </g>
          ${actionCalloutTitle && actionCalloutSub1
            ? `
          <g class="ng" id="g7b">
            <rect x="1296" y="454" width="180" height="118" rx="18" fill="#fcfbf8" stroke="#aba294" stroke-width="2" stroke-dasharray="8 6"/>
            <text x="1386" y="494" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionCalloutTitle.fontSize}" font-weight="700" fill="#38342f">${renderTspans(1386, actionCalloutTitle.lines, actionCalloutTitle.fontSize * 1.16)}</text>
            <text x="1386" y="542" text-anchor="middle" font-family="${getFontStack()}" font-size="${actionCalloutSub1.fontSize}" fill="#8a847b">${renderTspans(1386, actionCalloutSub1.lines, actionCalloutSub1.fontSize * 1.16)}</text>
          </g>
            `
            : ""}

          <line class="co" id="c7s" x1="1145" y1="${actionBoxBottomY}" x2="1145" y2="${impactY}" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c7f" x1="1145" y1="${actionBoxBottomY}" x2="1145" y2="${impactY}" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g8">
            <rect x="940" y="${impactY}" width="410" height="96" rx="18" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="1145" y="${impactY + 40}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="1145" y="${impactY + 66}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub1.fontSize}" fill="#a33b3b">${renderTspans(1145, impactSub1.lines, impactSub1.fontSize * 1.16)}</text>
            <text x="1145" y="${impactY + 88}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub2.fontSize}" fill="#b66868">${renderTspans(1145, impactSub2.lines, impactSub2.fontSize * 1.16)}</text>
          </g>

          ${flowLabelHorizontalSegment(230, 350, 220, config.labels.l0, "#4452b8", "l0", 10.5, 118)}
          ${flowLabelHorizontalSegment(570, 680, 220, config.labels.l1, "#4452b8", "l1", 10.5, 118)}
          ${config.labels.l2X
            ? flowLabel(config.labels.l2X, config.labels.l2Y || 372, config.labels.l2, "#ad3535", "l2", 10, config.labels.l2Width || 190)
            : flowLabelHorizontal(478, 372, config.labels.l2, "#ad3535", "l2", 10, 236)}
          ${config.labels.la1X
            ? flowLabel(config.labels.la1X, config.labels.la1Y || 520, config.labels.la1, "#ad3535", "la1", 10, config.labels.la1Width || 120)
            : config.labels.la1b
            ? flowLabelHorizontalWithNote(330, 520, config.labels.la1, config.labels.la1b, "#ad3535", "la1", 10, 146, 112)
            : flowLabelHorizontalSegment(270, 390, 520, config.labels.la1, "#ad3535", "la1", 10, 120)}
          ${config.labels.l4X
            ? flowLabelMarkup(config.labels.l4X, config.labels.l4Y || 520, config.labels.l4, "#ad3535", "l4", {
                fontSize: 10,
                maxWidth: config.labels.l4Width || 188,
                maxLines: config.labels.l4Lines || 2,
                orientation: "horizontal",
                className: "lb-h"
              })
            : config.labels.l4b
            ? flowLabelHorizontalWithNote(700, 520, config.labels.l4, config.labels.l4b, "#ad3535", "l4", 10, 120, 150, 22)
            : flowLabelHorizontal(700, 520, config.labels.l4, "#ad3535", "l4", 10, 188)}
          ${config.labels.l5X
            ? flowLabel(config.labels.l5X, config.labels.l5Y || receiverLabelY, config.labels.l5, "#ad3535", "l5", 10, config.labels.l5Width || 146)
            : flowLabel(receiverLabelX, receiverLabelY, config.labels.l5, "#ad3535", "l5", 10, 146)}
          ${flowLabelVertical(receiverCenterX, (receiverBoxBottomY + 430) / 2, config.labels.l6, "#ad3535", "l6", 10, config.labels.l6Width || 146)}
          ${flowLabelVertical(1145, (actionBoxBottomY + impactY) / 2, config.labels.l7, "#ad3535", "l7", 10, 146)}
        </svg>
      </div>
      ${panelMarkup(
        config.introTitle || `${scenario.label} — Attack View`,
        config.introDetail || "Click Start to reveal how a trusted peer channel becomes the attack path."
      )}
    `;
  }

  function renderAttackCascade(config) {
    const zoneX = 286;
    const zoneY = 116;
    const zoneWidth = 1044;
    const zoneHeight = config.zoneHeight || 694;
    const entryX = 24;
    const entryY = 184;
    const entryWidth = 190;
    const entryHeight = 154;
    const stageY = 164;
    const stageWidth = 210;
    const stageHeight = 186;
    const stage1X = 360;
    const stage2X = 710;
    const stage3X = 1060;
    const issueX = config.issue.box?.x || 430;
    const issueY = config.issue.box?.y || 438;
    const issueWidth = config.issue.box?.width || 400;
    const issueHeight = config.issue.box?.height || 248;
    const stage4X = 980;
    const stage4Y = 452;
    const stage4Width = 250;
    const stage4Height = 206;
    const impactX = config.impactSecondary ? 1000 : 780;
    const impactY = config.impact.y || 694;
    const impactWidth = config.impactSecondary ? 300 : 500;
    const impactHeight = 104;
    const impactSecondaryX = 640;
    const impactSecondaryWidth = 300;

    const entryRightX = entryX + entryWidth;
    const entryCenterX = entryX + (entryWidth / 2);
    const entryCenterY = entryY + (entryHeight / 2);
    const stageCenterY = stageY + (stageHeight / 2);
    const stage1CenterX = stage1X + (stageWidth / 2);
    const stage1RightX = stage1X + stageWidth;
    const stage2CenterX = stage2X + (stageWidth / 2);
    const stage2RightX = stage2X + stageWidth;
    const stage3CenterX = stage3X + (stageWidth / 2);
    const stageBottomY = stageY + stageHeight;
    const cascadeTurnY = 400;
    const issueCenterX = issueX + (issueWidth / 2);
    const issueRightX = issueX + issueWidth;
    const issueCenterY = issueY + (issueHeight / 2);
    const stage4CenterX = stage4X + (stage4Width / 2);
    const stage4BottomY = stage4Y + stage4Height;
    const impactCenterX = impactX + (impactWidth / 2);
    const impactBoxHeight = config.impact.height || (config.impact.sub3 ? 134 : impactHeight);
    const impactTitleY = impactY + 42;
    const impactSub1Y = impactY + 70;
    const impactSub2Y = impactY + 92;
    const impactSub3Y = impactY + 114;

    const entryTitle = fitSingleLine(config.entry.title, 170, 17, 13);
    const entrySub0 = config.entry.sub0
      ? fitWrappedText(config.entry.sub0, 176, 10.5, 9, 2)
      : null;
    const entrySub1 = fitWrappedText(config.entry.sub1, 176, 12.5, 10, 2);
    const entrySub2 = fitWrappedText(config.entry.sub2, 176, 11, 9, 2);
    const entrySub3 = config.entry.sub3
      ? fitWrappedText(config.entry.sub3, 176, 10.5, 8.8, 2)
      : null;

    const stage1Title = fitSingleLine(config.stage1.title, 188, 17, 13);
    const stage1Sub1 = fitWrappedText(config.stage1.sub1, 192, 12.5, 10, 2);
    const stage1Sub2 = fitWrappedText(config.stage1.sub2, 192, 11, 9, 2);
    const stage1Sub3 = config.stage1.sub3
      ? fitWrappedText(config.stage1.sub3, 192, 10.5, 8.8, 2)
      : null;
    const stage2Title = fitSingleLine(config.stage2.title, 188, 17, 13);
    const stage2Sub1 = fitWrappedText(config.stage2.sub1, 192, 12.5, 10, 2);
    const stage2Sub2 = fitWrappedText(config.stage2.sub2, 192, 11, 9, 2);
    const stage2Sub3 = config.stage2.sub3
      ? fitWrappedText(config.stage2.sub3, 192, 10.5, 8.8, 2)
      : null;
    const stage3Title = fitSingleLine(config.stage3.title, 188, 17, 13);
    const stage3Sub1 = fitWrappedText(config.stage3.sub1, 192, 12.5, 10, 2);
    const stage3Sub2 = fitWrappedText(config.stage3.sub2, 192, 11, 9, 2);
    const stage3Callout = config.stage3.callout
      ? fitWrappedText(config.stage3.callout, 194, 13.5, 11.5, 2)
      : null;
    const stage3Sub3 = config.stage3.sub3
      ? fitWrappedText(config.stage3.sub3, 192, 10.5, 8.8, 2)
      : null;
    const issueTitle = fitSingleLine(config.issue.title, 236, 18, 14);
    const issueLine1 = fitWrappedText(config.issue.line1, 320, 12.5, 10, 2);
    const issueLine2 = fitWrappedText(config.issue.line2, 320, 12.5, 10, 2);
    const issueLine3 = fitWrappedText(config.issue.line3, 320, 11.5, 9, 2);
    const issueLine4 = config.issue.line4
      ? fitWrappedText(config.issue.line4, 320, 10.8, 9, 2)
      : null;
    const issueNote = config.issue.note
      ? fitWrappedText(config.issue.note, 320, 10.5, 8.8, 2)
      : null;
    const issueNoteBoxY = config.issue.noteBoxY || 670;
    const issueNoteTextY = config.issue.noteTextY || (issueNoteBoxY + 22);
    const stage4Title = fitSingleLine(config.stage4.title, 188, 17, 13);
    const stage4Sub1 = fitWrappedText(config.stage4.sub1, 192, 12.5, 10, 2);
    const stage4Sub2 = fitWrappedText(config.stage4.sub2, 192, 11, 9, 2);
    const stage4Sub3 = config.stage4.sub3
      ? fitWrappedText(config.stage4.sub3, 192, 10.5, 8.8, 2)
      : null;
    const stage4Callout = config.stage4.callout
      ? fitWrappedText(config.stage4.callout, 194, 10.8, 9.2, 2)
      : null;

    const impactTitle = fitSingleLine(config.impact.title, impactWidth - 40, 19, 14);
    const impactSub1 = fitWrappedText(config.impact.sub1, impactWidth - 40, 13, 11, 2);
    const impactSub2 = fitWrappedText(config.impact.sub2, impactWidth - 40, 11, 9, 2);
    const impactSub3 = config.impact.sub3
      ? fitWrappedText(config.impact.sub3, impactWidth - 40, 10.8, 9, 2)
      : null;
    const impactSecondaryTitle = config.impactSecondary
      ? fitSingleLine(config.impactSecondary.title, 240, 18, 14)
      : null;
    const impactSecondarySub1 = config.impactSecondary
      ? fitWrappedText(config.impactSecondary.sub1, 260, 12.5, 10.5, 2)
      : null;
    const impactSecondarySub2 = config.impactSecondary && config.impactSecondary.sub2
      ? fitWrappedText(config.impactSecondary.sub2, 260, 10.8, 9, 2)
      : null;
    const impactSecondaryHeight = config.impactSecondary?.height || (config.impactSecondary?.sub2 ? 116 : 104);
    const impactSecondaryTitleY = impactY + 42;
    const impactSecondarySub1Y = impactY + 70;
    const impactSecondarySub2Y = impactY + 92;

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
            <rect x="${zoneX}" y="${zoneY}" width="${zoneWidth}" height="${zoneHeight}" rx="28" fill="rgba(156,47,47,0.03)" stroke="#ad3535" stroke-width="3" stroke-dasharray="12 8"/>
            <rect x="450" y="86" width="716" height="24" rx="12" fill="#fff"/>
            <text x="808" y="102" text-anchor="middle" font-family="${getFontStack()}" font-size="11.5" font-weight="800" fill="#ad3535" letter-spacing=".1em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="${entryX}" y="${entryY}" width="${entryWidth}" height="${entryHeight}" rx="20" fill="${config.entry.tone === "payload" ? "#fff3de" : "#fff4f4"}" stroke="${config.entry.tone === "payload" ? "#ef9f21" : "#ad3535"}" stroke-width="2.7"/>
            <text x="${entryCenterX}" y="228" text-anchor="middle" font-family="${getFontStack()}" font-size="${entryTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(entryTitle.text)}</text>
            ${entrySub0 ? `<text x="${entryCenterX}" y="248" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub0.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entrySub0.lines, entrySub0.fontSize * 1.16)}</text>` : ""}
            <text x="${entryCenterX}" y="${entrySub0 ? 278 : 260}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub1.fontSize}" fill="#a33b3b">${renderTspans(entryCenterX, entrySub1.lines, entrySub1.fontSize * 1.16)}</text>
            <text x="${entryCenterX}" y="${entrySub0 ? 312 : 294}" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub2.fontSize}" fill="#b66868">${renderTspans(entryCenterX, entrySub2.lines, entrySub2.fontSize * 1.16)}</text>
            ${entrySub3 ? `<text x="${entryCenterX}" y="330" text-anchor="middle" font-family="${getFontStack()}" font-size="${entrySub3.fontSize}" fill="#9a7748">${renderTspans(entryCenterX, entrySub3.lines, entrySub3.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c0s" x1="${entryRightX}" y1="${entryCenterY}" x2="${stage1X}" y2="${stageCenterY}" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c0f" x1="${entryRightX}" y1="${entryCenterY}" x2="${stage1X}" y2="${stageCenterY}" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="${stage1X}" y="${stageY}" width="${stageWidth}" height="${stageHeight}" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="${stage1CenterX}" y="212" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage1Title.fontSize}" font-weight="700" fill="#33429f">${escapeHtml(stage1Title.text)}</text>
            <text x="${stage1CenterX}" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage1Sub1.fontSize}" fill="#5360be">${renderTspans(stage1CenterX, stage1Sub1.lines, stage1Sub1.fontSize * 1.16)}</text>
            <text x="${stage1CenterX}" y="290" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage1Sub2.fontSize}" fill="#7a82c8">${renderTspans(stage1CenterX, stage1Sub2.lines, stage1Sub2.fontSize * 1.16)}</text>
            ${stage1Sub3 ? `<text x="${stage1CenterX}" y="322" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage1Sub3.fontSize}" fill="#9a7748">${renderTspans(stage1CenterX, stage1Sub3.lines, stage1Sub3.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c1s" x1="${stage1RightX}" y1="${stageCenterY}" x2="${stage2X}" y2="${stageCenterY}" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c1f" x1="${stage1RightX}" y1="${stageCenterY}" x2="${stage2X}" y2="${stageCenterY}" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="${stage2X}" y="${stageY}" width="${stageWidth}" height="${stageHeight}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="${stage2CenterX}" y="212" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage2Title.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(stage2Title.text)}</text>
            <text x="${stage2CenterX}" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage2Sub1.fontSize}" fill="#6b655c">${renderTspans(stage2CenterX, stage2Sub1.lines, stage2Sub1.fontSize * 1.16)}</text>
            <text x="${stage2CenterX}" y="290" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage2Sub2.fontSize}" fill="#8a847b">${renderTspans(stage2CenterX, stage2Sub2.lines, stage2Sub2.fontSize * 1.16)}</text>
            ${stage2Sub3 ? `<text x="${stage2CenterX}" y="322" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage2Sub3.fontSize}" fill="#9a7748">${renderTspans(stage2CenterX, stage2Sub3.lines, stage2Sub3.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c2s" x1="${stage2RightX}" y1="${stageCenterY}" x2="${stage3X}" y2="${stageCenterY}" stroke="#beb6a9" stroke-width="2.4" marker-end="url(#ar)"/>
          <line class="fl a" id="c2f" x1="${stage2RightX}" y1="${stageCenterY}" x2="${stage3X}" y2="${stageCenterY}" stroke="#ad3535" stroke-width="4" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="${stage3X}" y="${stageY}" width="${stageWidth}" height="${stageHeight}" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="${stage3CenterX}" y="212" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Title.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(stage3Title.text)}</text>
            <text x="${stage3CenterX}" y="246" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Sub1.fontSize}" fill="#6b655c">${renderTspans(stage3CenterX, stage3Sub1.lines, stage3Sub1.fontSize * 1.16)}</text>
            ${stage3Callout ? `<text x="${stage3CenterX}" y="278" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Callout.fontSize}" font-weight="800" fill="#8a5200">${renderTspans(stage3CenterX, stage3Callout.lines, stage3Callout.fontSize * 1.16)}</text>` : ""}
            <text x="${stage3CenterX}" y="${stage3Callout ? 304 : 290}" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Sub2.fontSize}" fill="#8a847b">${renderTspans(stage3CenterX, stage3Sub2.lines, stage3Sub2.fontSize * 1.16)}</text>
            ${stage3Sub3 ? `<text x="${stage3CenterX}" y="${stage3Callout ? 330 : 322}" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage3Sub3.fontSize}" fill="#9a7748">${renderTspans(stage3CenterX, stage3Sub3.lines, stage3Sub3.fontSize * 1.16)}</text>` : ""}
          </g>

          <path class="co" id="c3s" d="M${stage3CenterX} ${stageBottomY} L${stage3CenterX} ${cascadeTurnY} L${issueCenterX} ${cascadeTurnY} L${issueCenterX} ${issueY}" fill="none" stroke="#beb6a9" stroke-width="2.8" marker-end="url(#ar)"/>
          <path class="fl a" id="c3f" d="M${stage3CenterX} ${stageBottomY} L${stage3CenterX} ${cascadeTurnY} L${issueCenterX} ${cascadeTurnY} L${issueCenterX} ${issueY}" fill="none" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="${issueX}" y="${issueY}" width="${issueWidth}" height="${issueHeight}" rx="22" fill="#fff3de" stroke="#ef9f21" stroke-width="2.8"/>
            <rect x="${issueX + 28}" y="454" width="182" height="28" rx="14" fill="#ffe5ba" stroke="#f5c46c" stroke-width="1.1"/>
            <text x="${issueX + 119}" y="473" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueTitle.fontSize}" font-weight="700" fill="#8a5200">${escapeHtml(issueTitle.text)}</text>
            <text x="${issueCenterX}" y="526" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueLine1.fontSize}" fill="#8a5200">${renderTspans(issueCenterX, issueLine1.lines, issueLine1.fontSize * 1.16)}</text>
            <text x="${issueCenterX}" y="574" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueLine2.fontSize}" font-weight="800" fill="#ad3535">${renderTspans(issueCenterX, issueLine2.lines, issueLine2.fontSize * 1.14)}</text>
            <text x="${issueCenterX}" y="620" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueLine3.fontSize}" fill="#9a7748">${renderTspans(issueCenterX, issueLine3.lines, issueLine3.fontSize * 1.16)}</text>
            ${issueLine4 ? `<text x="${issueCenterX}" y="654" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueLine4.fontSize}" font-weight="700" fill="#8a5200">${renderTspans(issueCenterX, issueLine4.lines, issueLine4.fontSize * 1.16)}</text>` : ""}
            ${issueNote ? `
            <rect x="${issueX + 36}" y="${issueNoteBoxY}" width="${issueWidth - 72}" height="36" rx="14" fill="#fcfbf8" stroke="#aba294" stroke-width="1.4" stroke-dasharray="8 6"/>
            <text x="${issueCenterX}" y="${issueNoteTextY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${issueNote.fontSize}" fill="#6b655c">${renderTspans(issueCenterX, issueNote.lines, issueNote.fontSize * 1.16)}</text>
            ` : ""}
          </g>

          <line class="co" id="c4s" x1="${issueRightX}" y1="${issueCenterY}" x2="${stage4X}" y2="${issueCenterY}" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="${issueRightX}" y1="${issueCenterY}" x2="${stage4X}" y2="${issueCenterY}" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="${stage4X}" y="${stage4Y}" width="${stage4Width}" height="${stage4Height}" rx="22" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="${stage4CenterX}" y="510" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage4Title.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(stage4Title.text)}</text>
            <text x="${stage4CenterX}" y="546" text-anchor="middle" font-family="${getFontStack()}" font-size="${Math.max(stage4Sub1.fontSize, 11.4)}" font-weight="800" fill="#6b655c">${renderTspans(stage4CenterX, stage4Sub1.lines, Math.max(stage4Sub1.fontSize, 11.4) * 1.16)}</text>
            ${stage4Callout ? `<text x="${stage4CenterX}" y="574" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage4Callout.fontSize}" font-weight="700" fill="#9a7748">${renderTspans(stage4CenterX, stage4Callout.lines, stage4Callout.fontSize * 1.16)}</text>` : ""}
            <text x="${stage4CenterX}" y="${stage4Callout ? 602 : 590}" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage4Sub2.fontSize}" fill="#8a847b">${renderTspans(stage4CenterX, stage4Sub2.lines, stage4Sub2.fontSize * 1.16)}</text>
            ${stage4Sub3 ? `<text x="${stage4CenterX}" y="${stage4Callout ? 630 : 618}" text-anchor="middle" font-family="${getFontStack()}" font-size="${stage4Sub3.fontSize}" fill="#9a7748">${renderTspans(stage4CenterX, stage4Sub3.lines, stage4Sub3.fontSize * 1.16)}</text>` : ""}
          </g>

          <line class="co" id="c5s" x1="${stage4CenterX}" y1="${stage4BottomY}" x2="${stage4CenterX}" y2="${impactY}" stroke="rgba(173,53,53,.35)" stroke-width="2.8" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="${stage4CenterX}" y1="${stage4BottomY}" x2="${stage4CenterX}" y2="${impactY}" stroke="#ad3535" stroke-width="4.3" marker-end="url(#ar)"/>

          ${config.impactSecondary ? `
          <line class="co" id="c5b" x1="${impactSecondaryX + impactSecondaryWidth}" y1="${impactY + 52}" x2="${impactX}" y2="${impactY + 52}" stroke="#beb6a9" stroke-width="2.2" stroke-dasharray="7 5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5bf" x1="${impactSecondaryX + impactSecondaryWidth}" y1="${impactY + 52}" x2="${impactX}" y2="${impactY + 52}" stroke="#ad3535" stroke-width="3.4" stroke-dasharray="7 5" marker-end="url(#ar)"/>

          <g class="ng" id="g6b">
            <rect x="${impactSecondaryX}" y="${impactY}" width="${impactSecondaryWidth}" height="${impactSecondaryHeight}" rx="18" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${impactSecondaryX + (impactSecondaryWidth / 2)}" y="${impactSecondaryTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSecondaryTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactSecondaryTitle.text)}</text>
            <text x="${impactSecondaryX + (impactSecondaryWidth / 2)}" y="${impactSecondarySub1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSecondarySub1.fontSize}" fill="#a33b3b">${renderTspans(impactSecondaryX + (impactSecondaryWidth / 2), impactSecondarySub1.lines, impactSecondarySub1.fontSize * 1.16)}</text>
            ${impactSecondarySub2 ? `<text x="${impactSecondaryX + (impactSecondaryWidth / 2)}" y="${impactSecondarySub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSecondarySub2.fontSize}" fill="#b66868">${renderTspans(impactSecondaryX + (impactSecondaryWidth / 2), impactSecondarySub2.lines, impactSecondarySub2.fontSize * 1.16)}</text>` : ""}
          </g>
          ` : ""}

          <g class="ng" id="g6">
            <rect x="${impactX}" y="${impactY}" width="${impactWidth}" height="${impactBoxHeight}" rx="18" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="${impactCenterX}" y="${impactTitleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactTitle.fontSize}" font-weight="700" fill="#7d2626">${escapeHtml(impactTitle.text)}</text>
            <text x="${impactCenterX}" y="${impactSub1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub1.fontSize}" fill="#a33b3b">${renderTspans(impactCenterX, impactSub1.lines, impactSub1.fontSize * 1.16)}</text>
            <text x="${impactCenterX}" y="${impactSub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub2.fontSize}" fill="#b66868">${renderTspans(impactCenterX, impactSub2.lines, impactSub2.fontSize * 1.16)}</text>
            ${impactSub3 ? `<text x="${impactCenterX}" y="${impactSub3Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${impactSub3.fontSize}" fill="#9f6a6a">${renderTspans(impactCenterX, impactSub3.lines, impactSub3.fontSize * 1.16)}</text>` : ""}
          </g>

          ${flowLabelHorizontalSegment(entryRightX, stage1X, entryCenterY, config.labels.l0, "#ad3535", "l0", 10, 168)}
          ${flowLabelHorizontalSegment(stage1RightX, stage2X, stageCenterY, config.labels.l1, "#ad3535", "l1", 10, 164)}
          ${flowLabelHorizontalSegment(stage2RightX, stage3X, stageCenterY, config.labels.l2, "#ad3535", "l2", 10, 176)}
          ${flowLabelVertical(stage3CenterX, (stageBottomY + cascadeTurnY) / 2, config.labels.l3, "#ad3535", "l3", 10, 158)}
          ${flowLabelHorizontalSegment(issueCenterX, stage3CenterX, cascadeTurnY, config.labels.la1, "#ad3535", "la1", 10, 220)}
          ${flowLabelHorizontalSegment(issueRightX, stage4X, issueCenterY, config.labels.l4, "#ad3535", "l4", 10, 196)}
          ${flowLabelVertical(stage4CenterX, config.labels.l5Y || ((stage4BottomY + impactY) / 2), config.labels.l5, "#ad3535", "l5", 10, 170)}
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
    const d5Sub2 = fitWrappedText(config.d5.sub2, 186, 10.5, 9, 2);
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
            <text x="700" y="98" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
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
          ${flowLabelHorizontalSegment(570, 680, 230, config.labels.l1, "#4452b8", "l1", 10.5, 96)}
          ${flowLabelHorizontalSegment(900, 1010, 225, config.labels.l2, "#4452b8", "l2", 10.5, 96)}
          ${flowLabelVertical(1120, 334, config.labels.l3, "#4452b8", "l3", 10.5, 150)}
          ${flowLabelHorizontal(955, 442, config.labels.l4, "#2d6a4f", "l4", 11, 180)}
          ${flowLabelHorizontal(625, 442, config.labels.l5, "#2d6a4f", "l5", 10.5, 190)}
          ${flowLabelVertical(460, 700, config.labels.l6, "#2d6a4f", "l6", 10.5, 150)}
          ${flowLabelHorizontal(610, 800, config.labels.l7, "#2d6a4f", "l7", 10.5, 175)}
          ${flowLabelHorizontal(910, 800, config.labels.l8, "#2d6a4f", "l8", 10.5, 170)}
          ${flowLabelVertical(1060, 918, config.labels.l9, "#2d6a4f", "l9", 10.5, 170)}
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
            <text x="700" y="98" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".08em">${escapeHtml(config.zone)}</text>
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
            <text x="700" y="98" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".08em">${escapeHtml(config.zone)}</text>
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
          ${flowLabelHorizontal(625, 230, config.labels.l1, "#4452b8", "l1", 11, 128)}
          ${flowLabelHorizontal(955, 225, config.labels.l2, "#4452b8", "l2", 11, 124)}
          ${flowLabelVertical(1120, 340, config.labels.l3, "#4452b8", "l3", 10.5, 170)}
          ${flowLabelHorizontal(955, 458, config.labels.l4, "#2d6a4f", "l4", 10.5, 170)}
          ${flowLabelHorizontal(625, 436, config.labels.l5, "#2d6a4f", "l5", 10.5, 150)}
          ${flowLabelVertical(460, 560, config.labels.l6, "#2d6a4f", "l6", 10.5, 160)}
          ${flowLabelHorizontal(530, 700, config.labels.l7, "#2d6a4f", "l7", 10.5, 140)}
          ${flowLabelHorizontalSegment(810, 930, 700, config.labels.l8, "#2d6a4f", "l8", 10.5, 140)}
          ${flowLabelVertical(1040, 821, config.labels.l9, "#2d6a4f", "l9", 10.5, 150)}
          ${flowLabelVertical(1040, 1076, config.labels.l10, "#2d6a4f", "l10", 10.5, 160)}
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
    const toolTopTitleLayout = fitSingleLine(config.toolTop.title, 188, 18, 14);
    const patternTitleLayout = fitSingleLine(config.patterns.title, 188, 17, 13);
    const patternSub1Layout = fitWrappedText(config.patterns.sub1, 190, 11.5, 9.5, 2);
    const patternSub2Layout = fitWrappedText(config.patterns.sub2, 190, 11.5, 9.5, 2);
    const patternSub3Layout = fitWrappedText(config.patterns.sub3, 190, 11.5, 9.5, 2);
    const auditTitle = fitSingleLine(config.audit.title, 350, 12, 10);
    const auditSub1 = fitWrappedText(config.audit.sub1, 900, 10.5, 9, 2);
    const stageCardWidth = 250;
    const stageCardHeight = 186;
    const row2Y = 356;
    const row2CenterY = row2Y + stageCardHeight / 2;
    const row2BottomY = row2Y + stageCardHeight;
    const row3Y = 662;
    const row3CenterY = row3Y + stageCardHeight / 2;
    const row3BottomY = row3Y + stageCardHeight;
    const outcomeX = 980;
    const outcomeY = 960;
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
      const titleLineHeight = title.fontSize * 1.14;
      const sub1LineHeight = sub1.fontSize * 1.15;
      const sub2LineHeight = sub2.fontSize * 1.15;
      const titleBlockHeight = Math.max(titleLineHeight, title.lines.length * titleLineHeight);
      const sub1BlockHeight = Math.max(sub1LineHeight, sub1.lines.length * sub1LineHeight);
      const contentTopY = y + 56;
      const titleY = contentTopY;
      const sub1Y = titleY + titleBlockHeight + 24;
      const sub2Y = sub1Y + sub1BlockHeight + 20;
      return `
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="2.8"/>
        <text x="${x + 24}" y="${y + 24}" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="${idFill}">${id}</text>
        <text x="${x + width / 2}" y="${titleY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${title.fontSize}" font-weight="700" fill="${titleFill}">${renderTspans(x + width / 2, title.lines, titleLineHeight)}</text>
        <text x="${x + width / 2}" y="${sub1Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub1.fontSize}" fill="${sub1Fill}">${renderTspans(x + width / 2, sub1.lines, sub1LineHeight)}</text>
        <text x="${x + width / 2}" y="${sub2Y}" text-anchor="middle" font-family="${getFontStack()}" font-size="${sub2.fontSize}" fill="${sub2Fill}">${renderTspans(x + width / 2, sub2.lines, sub2LineHeight)}</text>
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
        <svg viewBox="0 0 1400 1180" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
          </defs>
          <rect width="1400" height="1180" fill="#fff"/>
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
            <text x="790" y="222" text-anchor="middle" font-family="${getFontStack()}" font-size="${toolTopTitleLayout.fontSize}" font-weight="700" fill="#38342f">${escapeHtml(toolTopTitleLayout.text)}</text>
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
          <line class="co" id="c4s" x1="1010" y1="${row2CenterY}" x2="${680 + stageCardWidth}" y2="${row2CenterY}" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl" id="c4f" x1="1010" y1="${row2CenterY}" x2="${680 + stageCardWidth}" y2="${row2CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">${stageCard(680, row2Y, "D1", config.d1)}</g>
          <line class="co" id="c5s" x1="680" y1="${row2CenterY}" x2="${350 + stageCardWidth}" y2="${row2CenterY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c5f" x1="680" y1="${row2CenterY}" x2="${350 + stageCardWidth}" y2="${row2CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">${stageCard(350, row2Y, "D2", config.d2, "primary")}</g>
          <line class="co" id="c6s" x1="${350 + stageCardWidth / 2}" y1="${row2BottomY}" x2="${350 + stageCardWidth / 2}" y2="${row3Y}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c6f" x1="${350 + stageCardWidth / 2}" y1="${row2BottomY}" x2="${350 + stageCardWidth / 2}" y2="${row3Y}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g7">${stageCard(350, row3Y, "D3", config.d3)}</g>
          <line class="co" id="c6as" x1="${350 + stageCardWidth}" y1="${row3CenterY}" x2="680" y2="${row3CenterY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c6af" x1="${350 + stageCardWidth}" y1="${row3CenterY}" x2="680" y2="${row3CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g8">${stageCard(680, row3Y, "D4", config.d4)}</g>
          <line class="co" id="c8bs" x1="${680 + stageCardWidth}" y1="${row3CenterY}" x2="1010" y2="${row3CenterY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c8bf" x1="${680 + stageCardWidth}" y1="${row3CenterY}" x2="1010" y2="${row3CenterY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g9">${stageCard(1010, row3Y, "D5", config.d5)}</g>

          <line class="co" id="c9s" x1="${1010 + stageCardWidth / 2}" y1="${row3BottomY}" x2="${1010 + stageCardWidth / 2}" y2="${outcomeY}" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c9f" x1="${1010 + stageCardWidth / 2}" y1="${row3BottomY}" x2="${1010 + stageCardWidth / 2}" y2="${outcomeY}" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g10">
            <rect x="${outcomeX}" y="${outcomeY}" width="280" height="92" rx="18" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="${outcomeCenterX}" y="${outcomeY + 32}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeTitle.fontSize}" font-weight="700" fill="#24553f">${escapeHtml(outcomeTitle.text)}</text>
            <text x="${outcomeCenterX}" y="${outcomeY + 60}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub1.fontSize}" fill="#3d735a">${renderTspans(outcomeCenterX, outcomeSub1.lines, outcomeSub1.fontSize * 1.16)}</text>
            <text x="${outcomeCenterX}" y="${outcomeY + 84}" text-anchor="middle" font-family="${getFontStack()}" font-size="${outcomeSub2.fontSize}" fill="#56826c">${renderTspans(outcomeCenterX, outcomeSub2.lines, outcomeSub2.fontSize * 1.14)}</text>
          </g>
          <g class="ng" id="g11">
            <rect x="60" y="1100" width="1280" height="28" rx="14" fill="#edf7f0" stroke="#9ec1ae" stroke-width="1.8"/>
            <text x="86" y="1117" font-family="${getFontStack()}" font-size="${auditTitle.fontSize}" font-weight="800" fill="#2d6a4f">${escapeHtml(auditTitle.text)}</text>
            <text x="374" y="1117" font-family="${getFontStack()}" font-size="${auditSub1.fontSize}" fill="#56826c">${renderTspans(374, auditSub1.lines, auditSub1.fontSize * 1.12)}</text>
          </g>

          <line class="co" id="c10s" x1="${outcomeCenterX}" y1="${outcomeBottomY}" x2="${outcomeCenterX}" y2="1100" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c10f" x1="${outcomeCenterX}" y1="${outcomeBottomY}" x2="${outcomeCenterX}" y2="1100" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          ${flowLabelHorizontal(295, 230, config.labels.l0, "#4452b8", "l0", 11, 148)}
          ${flowLabelHorizontalSegment(570, 680, 230, config.labels.l1, "#4452b8", "l1", 10.5, 92)}
          ${flowLabelHorizontalSegment(900, 1010, 225, config.labels.l2, "#4452b8", "l2", 10.5, 92)}
          ${flowLabelVertical(1120, 337, config.labels.l3, "#4452b8", "l3", 10.5, 154)}
          ${flowLabelHorizontalSegment(930, 1010, row2CenterY, config.labels.l4, "#2d6a4f", "l4", 10, 128)}
          ${flowLabelHorizontalSegment(600, 680, row2CenterY, config.labels.l5, "#2d6a4f", "l5", 10, 126)}
          ${flowLabelVertical(475, row3Y + 42, config.labels.l6, "#2d6a4f", "l6", 10, 140)}
          ${flowLabelHorizontalSegment(600, 680, row3CenterY, config.labels.l7, "#2d6a4f", "l7", 10, 126)}
          ${flowLabelHorizontalSegment(930, 1010, row3CenterY, config.labels.l8, "#2d6a4f", "l8", 10, 126)}
          ${flowLabelVertical(1135, ((row3BottomY + outcomeY) / 2) + 64, config.labels.l9, "#2d6a4f", "l9", 10, 144)}
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
            <text x="700" y="98" text-anchor="middle" font-family="${getFontStack()}" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
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

  function flowLabelMarkup(x, y, text, color, id, options = {}) {
    const orientation = options.orientation || "horizontal";
    const className = options.className || (orientation === "vertical" ? "lb-v" : "lb-h");
    const defaultFontSize = DIAGRAM_TOKENS.flowLabelFontSize[orientation] || 11.5;
    const startSize = Math.max(options.fontSize || defaultFontSize, defaultFontSize);
    const minSize = DIAGRAM_TOKENS.flowLabelMinFontSize[orientation] || Math.min(startSize, 10.5);
    const maxWidth = options.maxWidth || getFlowLabelMaxWidth(orientation);
    const maxLines = options.maxLines || 2;
    const layout = fitWrappedText(text, maxWidth, startSize, minSize, maxLines);
    const lineHeight = layout.fontSize * 1.18;
    const multiLineLift = layout.lines.length > 1 ? ((layout.lines.length - 1) * lineHeight) / 2 : 0;
    const textY = y - multiLineLift;
    return `
      <g class="lb ${className}" id="${id}">
        <text x="${x}" y="${textY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${layout.fontSize}" font-weight="700" fill="${color}" stroke="#fffdf8" stroke-width="6" paint-order="stroke fill" stroke-linejoin="round">
          ${renderTspans(x, layout.lines, lineHeight)}
        </text>
      </g>
    `;
  }

  function flowLabel(x, y, text, color, id, fontSize, maxWidth) {
    return flowLabelMarkup(x, y, text, color, id, {
      fontSize,
      maxWidth,
      orientation: "horizontal",
      className: "lb-h"
    });
  }

  function flowLabelHorizontal(x, lineY, text, color, id, fontSize, maxWidth, options = {}) {
    return flowLabelMarkup(x, lineY, text, color, id, {
      ...options,
      fontSize,
      maxWidth: getFlowLabelMaxWidth("horizontal", maxWidth),
      orientation: "horizontal",
      className: "lb-h"
    });
  }

  function flowLabelHorizontalSegment(x1, x2, lineY, text, color, id, fontSize, maxWidth) {
    const segmentWidth = Math.abs(x2 - x1);
    const usableWidth = Math.max(72, segmentWidth - 20);
    const wrappedWidth = maxWidth ? Math.min(maxWidth, usableWidth) : usableWidth;
    return flowLabelHorizontal((x1 + x2) / 2, lineY, text, color, id, fontSize, wrappedWidth);
  }

  function flowLabelHorizontalWithNote(x, lineY, text, note, color, id, fontSize, maxWidth, noteMaxWidth, noteOffsetY = 14) {
    const mainStartSize = Math.max(fontSize || (DIAGRAM_TOKENS.flowLabelFontSize.horizontal || 11.5), DIAGRAM_TOKENS.flowLabelFontSize.horizontal || 11.5);
    const mainMinSize = DIAGRAM_TOKENS.flowLabelMinFontSize.horizontal || Math.min(mainStartSize, 10.5);
    const mainMaxWidth = getFlowLabelMaxWidth("horizontal", maxWidth);
    const mainLayout = fitWrappedText(text, mainMaxWidth, mainStartSize, mainMinSize, 2);
    const mainLineHeight = mainLayout.fontSize * 1.18;
    const mainTextY = lineY - 10 - (mainLayout.lines.length > 1 ? ((mainLayout.lines.length - 1) * mainLineHeight) / 2 : 0);

    const noteLayout = fitWrappedText(note, noteMaxWidth || 140, 8.8, 7.4, 2);
    const noteLineHeight = noteLayout.fontSize * 1.18;
    const noteY = lineY + noteOffsetY;

    return `
      <g class="lb lb-h" id="${id}">
        <text x="${x}" y="${mainTextY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${mainLayout.fontSize}" font-weight="700" fill="${color}" stroke="#fffdf8" stroke-width="6" paint-order="stroke fill" stroke-linejoin="round">
          ${renderTspans(x, mainLayout.lines, mainLineHeight)}
        </text>
        <text x="${x}" y="${noteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${noteLayout.fontSize}" font-weight="600" fill="#8a847b" stroke="#fffdf8" stroke-width="5" paint-order="stroke fill" stroke-linejoin="round">
          ${renderTspans(x, noteLayout.lines, noteLineHeight)}
        </text>
      </g>
    `;
  }

  function flowLabelVertical(x, lineCenterY, text, color, id, fontSize, maxWidth, options = {}) {
    return flowLabelMarkup(x, lineCenterY, text, color, id, {
      ...options,
      fontSize,
      maxWidth: getFlowLabelMaxWidth("vertical", maxWidth),
      orientation: "vertical",
      className: "lb-v"
    });
  }

  function flowLabelVerticalWithNote(x, lineCenterY, text, note, color, id, fontSize, maxWidth) {
    const mainStartSize = Math.max(fontSize || (DIAGRAM_TOKENS.flowLabelFontSize.vertical || 11.5), DIAGRAM_TOKENS.flowLabelFontSize.vertical || 11.5);
    const mainMinSize = DIAGRAM_TOKENS.flowLabelMinFontSize.vertical || Math.min(mainStartSize, 10.5);
    const mainMaxWidth = getFlowLabelMaxWidth("vertical", maxWidth);
    const mainLayout = fitWrappedText(text, mainMaxWidth, mainStartSize, mainMinSize, 2);
    const mainLineHeight = mainLayout.fontSize * 1.18;
    const mainMultiLineLift = mainLayout.lines.length > 1 ? ((mainLayout.lines.length - 1) * mainLineHeight) / 2 : 0;
    const mainTextY = lineCenterY - mainMultiLineLift;

    const noteLayout = fitWrappedText(note, 150, 8.8, 7.4, 2);
    const noteLineHeight = noteLayout.fontSize * 1.18;
    const noteY = lineCenterY + 28;

    return `
      <g class="lb lb-v" id="${id}">
        <text x="${x}" y="${mainTextY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${mainLayout.fontSize}" font-weight="700" fill="${color}" stroke="#fffdf8" stroke-width="6" paint-order="stroke fill" stroke-linejoin="round">
          ${renderTspans(x, mainLayout.lines, mainLineHeight)}
        </text>
        <text x="${x}" y="${noteY}" text-anchor="middle" font-family="${getFontStack()}" font-size="${noteLayout.fontSize}" font-weight="600" fill="#8a847b" stroke="#fffdf8" stroke-width="5" paint-order="stroke fill" stroke-linejoin="round">
          ${renderTspans(x, noteLayout.lines, noteLineHeight)}
        </text>
      </g>
    `;
  }

  function getFlowLabelMaxWidth(orientation, requestedWidth) {
    const tokenWidth = orientation === "vertical"
      ? DIAGRAM_TOKENS.flowLabelMaxWidth.vertical
      : DIAGRAM_TOKENS.flowLabelMaxWidth.horizontal;
    return requestedWidth || tokenWidth;
  }

  function getFlowConnectorEndX(endX, orientation = "horizontal") {
    const inset = DIAGRAM_TOKENS.flowConnectorEndInset[orientation] || 0;
    return endX - inset;
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
      svg{width:100%;display:block;margin-top:${externalPanel ? "-56px" : "0"};}
      svg > text:first-of-type,svg > line:first-of-type{display:none;}
      .ng{opacity:0;transition:opacity .5s;}
      .ng.v{opacity:1;}
      .co{opacity:0;transition:opacity .4s;}
      .co.v{opacity:0;}
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
        svg{margin-top:${externalPanel ? "-40px" : "0"};}
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
