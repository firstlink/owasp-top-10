(function () {
  const walkthroughs = window.ASI_WALKTHROUGHS || {};
  const params = new URLSearchParams(window.location.search);
  const scenarioId = params.get("scenario");
  const view = params.get("view") === "defense" ? "defense" : "attack";
  const scenario = walkthroughs[scenarioId];

  if (!scenario || !scenario[view]) {
    document.body.innerHTML = "<p style='font-family: sans-serif; padding: 24px;'>Walkthrough not found.</p>";
    return;
  }

  const data = scenario[view];
  document.title = `${scenario.label} · ${view === "attack" ? "Attack View" : "Defense View"}`;
  document.body.innerHTML = view === "attack" ? renderAttack(data) : renderDefense(data);

  const steps = view === "attack" ? buildAttackSteps() : buildDefenseSteps();
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
  };

  window.reset = function reset() {
    current = -1;
    document.querySelectorAll(".ng,.co,.fl,.lb,.az").forEach((element) => element.classList.remove("v"));
    document.querySelectorAll(".dot").forEach((dot) => dot.classList.remove("active", "done", "atk"));
    const panel = document.getElementById("panel");
    const stepLabel = document.getElementById("ps");
    const nextButton = document.getElementById("bnext");
    panel.classList.remove("atk");
    stepLabel.classList.remove("a");
    stepLabel.textContent = "Click to begin";
    document.getElementById("ph").textContent = view === "attack"
      ? "ASI01 — Agent Goal Hijack"
      : "ASI01 — Defense Walkthrough";
    document.getElementById("pd").textContent = view === "attack"
      ? "Click Start to reveal the flow one step at a time. Use each step to explain how untrusted content changes the agent's goal and leads to the harmful outcome."
      : "Click Start to step through the guarded flow. This version shows how the system keeps the original intent intact before any external action happens.";
    nextButton.textContent = "▶ Start";
    nextButton.disabled = false;
    nextButton.classList.remove("atk");
    document.getElementById("breset").style.display = "none";
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

  function buildAttackSteps() {
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

  function buildDefenseSteps() {
    return [
      { show: ["g0"], co: [], fl: [], lb: [], atk: false },
      { show: ["gzone", "g1"], co: ["c0s"], fl: ["c0f"], lb: ["l0"], atk: false },
      { show: ["g2"], co: ["c1s"], fl: ["c1f"], lb: ["l1"], atk: false },
      { show: ["g3"], co: ["c2s"], fl: ["c2f"], lb: ["l2"], atk: false },
      { show: ["g4"], co: ["c3s"], fl: ["c3f"], lb: ["l3"], atk: false },
      { show: ["g5"], co: ["c4s"], fl: ["c4f"], lb: ["l4", "l5"], atk: false }
    ];
  }

  function renderAttack(config) {
    return `
      <style>${baseStyles()}</style>
      <div class="badge">${escapeHtml(config.badge)}</div>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="dots" id="dots"></div>
      <div class="wrap">
        <svg viewBox="0 0 1400 860" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </marker>
            <clipPath id="dc"><rect x="1010" y="326" width="220" height="190" rx="20"/></clipPath>
            <clipPath id="oc"><rect x="1010" y="660" width="220" height="140" rx="20"/></clipPath>
          </defs>

          <rect width="1400" height="860" fill="#fff"/>
          <text x="700" y="54" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  AGENT CORE  ·  TOOL LAYER  ·  EXTERNAL DATA</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="g4az">
            <rect x="315" y="118" width="945" height="500" rx="28" fill="rgba(156,47,47,0.02)" stroke="#ad3535" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="500" y="94" width="400" height="28" rx="14" fill="#ffffff"/>
            <text x="700" y="114" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="800" fill="#ad3535" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="160" width="170" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="155" y="214" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="155" y="246" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
            <text x="155" y="274" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>
          </g>

          <line class="co" id="c0s" x1="240" y1="225" x2="350" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="240" y1="225" x2="350" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="160" width="220" height="130" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="220" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
            <text x="460" y="252" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="378" y="276" width="164" height="34" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="460" y="299" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#2d6a4f">${escapeHtml(config.agent.goal)}</text>
          </g>

          <line class="co" id="c1s" x1="570" y1="225" x2="680" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="225" x2="680" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="790" y="222" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.toolTop.title)}</text>
            <text x="790" y="252" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#6b655c">${escapeHtml(config.toolTop.sub1)}</text>
            <text x="790" y="282" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#8a847b">${escapeHtml(config.toolTop.sub2)}</text>
          </g>

          <line class="co" id="c2s" x1="900" y1="225" x2="1010" y2="225" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="900" y1="225" x2="1010" y2="225" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="1010" y="160" width="220" height="130" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1120" y="214" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.store.title)}</text>
            <text x="1120" y="246" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#6b655c">${escapeHtml(config.store.sub1)}</text>
            <text x="1120" y="274" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#8a847b">${escapeHtml(config.store.sub2)}</text>

            <line x1="1120" y1="290" x2="1120" y2="326" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
            <line class="fl" id="c3f" x1="1120" y1="290" x2="1120" y2="326" stroke="#4452b8" stroke-width="4.5" marker-end="url(#ar)"/>

            <rect x="1010" y="326" width="220" height="82" rx="20" fill="#fcfbf8"/>
            <rect x="1010" y="376" width="220" height="32" fill="#fcfbf8"/>
            <rect x="1010" y="408" width="220" height="108" fill="#fdf0f0" clip-path="url(#dc)"/>
            <line x1="1014" y1="408" x2="1226" y2="408" stroke="#ddd6cb" stroke-width="1.4"/>
            <rect x="1010" y="326" width="220" height="190" rx="20" fill="none" stroke="#b87a45" stroke-width="2.3"/>
            <text x="1120" y="366" text-anchor="middle" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="#38342f">${escapeHtml(config.payload.title)}</text>
            <text x="1120" y="391" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#8a847b">${escapeHtml(config.payload.visible)}</text>
            <text x="1120" y="454" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="800" fill="#ad3535">${escapeHtml(config.payload.hiddenTitle)}</text>
            <text x="1120" y="482" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#ad3535">${escapeHtml(config.payload.hidden1)}</text>
            <text x="1120" y="510" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="#ad3535">${escapeHtml(config.payload.hidden2)}</text>
          </g>

          <line class="co" id="ias" x1="1010" y1="468" x2="570" y2="468" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="iaf" x1="1010" y1="468" x2="570" y2="468" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4ctx">
            <rect x="350" y="390" width="220" height="180" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="460" y="426" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.context.title)}</text>
            ${innerPill(460, 479, 180, config.context.before, "#edf7f0", "#bdddc8", "#2d6a4f", 13, 700)}
            <line x1="390" y1="520" x2="530" y2="520" stroke="#e4d5d5" stroke-width="1.4" stroke-dasharray="5 4"/>
            ${innerPill(460, 546, 204, config.context.after, "#fff5f5", "#e6b3b3", "#ad3535", 13, 800)}
          </g>

          <line class="co" id="c4s" x1="460" y1="570" x2="460" y2="670" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c4f" x1="460" y1="570" x2="460" y2="670" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="350" y="674" width="220" height="140" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <text x="460" y="732" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.hijacked.title)}</text>
            <text x="460" y="764" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="#ad3535">${escapeHtml(config.hijacked.sub1)}</text>
            ${innerPill(460, 792, 208, config.hijacked.goal, "#efb0b0", "#efb0b0", "#7d2626", 13, 800)}
          </g>

          <line class="co" id="c5s" x1="570" y1="744" x2="680" y2="744" stroke="rgba(173,53,53,.35)" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c5f" x1="570" y1="744" x2="680" y2="744" stroke="#ad3535" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g6">
            <rect x="680" y="674" width="220" height="140" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="790" y="736" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.toolBottom.title)}</text>
            <text x="790" y="768" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#6b655c">${escapeHtml(config.toolBottom.sub1)}</text>
            <text x="790" y="796" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#ad3535">${escapeHtml(config.toolBottom.sub2)}</text>
          </g>

          <line class="co" id="c6s" x1="900" y1="744" x2="940" y2="744" stroke="rgba(173,53,53,.35)" stroke-width="3.5"/>
          <line class="fl a" id="c6f" x1="900" y1="744" x2="940" y2="744" stroke="#ad3535" stroke-width="4.5"/>
          <path class="co" id="c6t" d="M940 744 L940 710 L1010 710" fill="none" stroke="#beb6a9" stroke-width="2.5" stroke-dasharray="6 5" marker-end="url(#ar)"/>
          <path class="co" id="c6a" d="M940 744 L940 782 L1010 782" fill="none" stroke="#ad3535" stroke-width="3.5" marker-end="url(#ar)"/>
          <line class="fl a" id="c6af" x1="940" y1="744" x2="940" y2="782" stroke="#ad3535" stroke-width="4.5"/>

          <g class="ng" id="g7">
            <rect x="1010" y="674" width="220" height="140" rx="20" fill="#fff8f8" stroke="#ad3535" stroke-width="2.8"/>
            <rect x="1010" y="674" width="220" height="54" rx="20" fill="#f8f7f4" stroke="#dcd5ca" stroke-width="1.4"/>
            <text x="1120" y="696" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#97a0b4">${escapeHtml(config.outcome.top)}</text>
            <text x="1120" y="716" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" fill="#b2aba0">${escapeHtml(config.outcome.topSub)}</text>
            <line x1="1014" y1="744" x2="1226" y2="744" stroke="#ddd6cb" stroke-width="1.2" stroke-dasharray="5 4"/>
            <rect x="1010" y="746" width="220" height="68" fill="#fff8f8" clip-path="url(#oc)"/>
            <text x="1120" y="780" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#7d2626">${escapeHtml(config.outcome.bottomTitle)}</text>
            <text x="1120" y="804" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="800" fill="#ad3535">${escapeHtml(config.outcome.bottom)}</text>
          </g>

          ${flowLabel(298, 198, config.labels.l0, "#4452b8", "l0")}
          ${flowLabel(628, 198, config.labels.l1, "#4452b8", "l1")}
          ${flowLabel(958, 198, config.labels.l2, "#4452b8", "l2")}
          ${flowLabel(1162, 312, config.labels.l3, "#4452b8", "l3")}
          ${flowLabel(790, 450, `${config.labels.l5a} ${config.labels.l5b}`, "#ad3535", "la1", 13)}
          ${flowLabel(460, 620, config.labels.l6, "#ad3535", "l4")}
          ${flowLabel(606, 748, config.labels.l7, "#ad3535", "l5")}
          ${flowLabel(1006, 748, config.labels.l8, "#ad3535", "l6")}
        </svg>
      </div>
      ${panelMarkup("ASI01 — Agent Goal Hijack", "Click Start to reveal the flow one step at a time. Use each step to explain how untrusted content changes the agent's goal and leads to the harmful outcome.")}
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
          <text x="700" y="54" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="#b2aba0" letter-spacing="4">INPUT  ·  CONTENT CONTROL  ·  AGENT CORE  ·  POLICY  ·  TOOL</text>
          <line x1="56" y1="76" x2="1344" y2="76" stroke="#ece6dc" stroke-width="1"/>

          <g class="az" id="gzone">
            <rect x="300" y="118" width="970" height="520" rx="28" fill="rgba(45,106,79,0.03)" stroke="#2d6a4f" stroke-width="3.5" stroke-dasharray="12 10"/>
            <rect x="500" y="94" width="400" height="28" rx="14" fill="#ffffff"/>
            <text x="700" y="114" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="800" fill="#2d6a4f" letter-spacing=".11em">${escapeHtml(config.zone)}</text>
          </g>

          <g class="ng" id="g0">
            <rect x="70" y="170" width="170" height="120" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="155" y="220" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.user.title)}</text>
            <text x="155" y="252" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#6b655c">${escapeHtml(config.user.sub1)}</text>
            <text x="155" y="276" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#8a847b">${escapeHtml(config.user.sub2)}</text>
          </g>

          <line class="co" id="c0s" x1="240" y1="230" x2="350" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c0f" x1="240" y1="230" x2="350" y2="230" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g1">
            <rect x="350" y="160" width="220" height="140" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="460" y="218" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#24553f">${escapeHtml(config.guard.title)}</text>
            <text x="460" y="248" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#3d735a">${escapeHtml(config.guard.sub1)}</text>
            <text x="460" y="276" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#56826c">${escapeHtml(config.guard.sub2)}</text>
          </g>

          <line class="co" id="c1s" x1="570" y1="230" x2="680" y2="230" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c1f" x1="570" y1="230" x2="680" y2="230" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g2">
            <rect x="680" y="160" width="220" height="140" rx="20" fill="#f7f8ff" stroke="#4452b8" stroke-width="2.8"/>
            <text x="790" y="218" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#33429f">${escapeHtml(config.agent.title)}</text>
            <text x="790" y="248" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#5360be">${escapeHtml(config.agent.sub1)}</text>
            <rect x="724" y="266" width="132" height="32" rx="10" fill="#edf7f0" stroke="#bdddc8" stroke-width="1.2"/>
            <text x="790" y="287" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#2d6a4f">${escapeHtml(config.agent.goal)}</text>
          </g>

          <line class="co" id="c2s" x1="790" y1="300" x2="790" y2="386" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c2f" x1="790" y1="300" x2="790" y2="386" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g3">
            <rect x="680" y="386" width="220" height="150" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="790" y="444" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#24553f">${escapeHtml(config.check.title)}</text>
            <text x="790" y="474" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#3d735a">${escapeHtml(config.check.sub1)}</text>
            <text x="790" y="502" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#56826c">${escapeHtml(config.check.sub2)}</text>
          </g>

          <line class="co" id="c3s" x1="900" y1="461" x2="1010" y2="461" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c3f" x1="900" y1="461" x2="1010" y2="461" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g4">
            <rect x="1010" y="386" width="220" height="150" rx="20" fill="#fcfbf8" stroke="#aba294" stroke-width="2.5"/>
            <text x="1120" y="444" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#38342f">${escapeHtml(config.tool.title)}</text>
            <text x="1120" y="474" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#6b655c">${escapeHtml(config.tool.sub1)}</text>
            <text x="1120" y="502" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#8a847b">${escapeHtml(config.tool.sub2)}</text>
          </g>

          <line class="co" id="c4s" x1="1120" y1="536" x2="1120" y2="646" stroke="#beb6a9" stroke-width="2.5" marker-end="url(#ar)"/>
          <line class="fl" id="c4f" x1="1120" y1="536" x2="1120" y2="646" stroke="#2d6a4f" stroke-width="4.5" marker-end="url(#ar)"/>

          <g class="ng" id="g5">
            <rect x="980" y="646" width="280" height="130" rx="20" fill="#edf7f0" stroke="#2d6a4f" stroke-width="2.8"/>
            <text x="1120" y="700" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#24553f">${escapeHtml(config.outcome.title)}</text>
            <text x="1120" y="732" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#3d735a">${escapeHtml(config.outcome.sub1)}</text>
            <text x="1120" y="758" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#56826c">${escapeHtml(config.outcome.sub2)}</text>
          </g>

          ${flowLabel(295, 194, config.labels.l0, "#2d6a4f", "l0")}
          ${flowLabel(625, 194, config.labels.l1, "#2d6a4f", "l1")}
          ${flowLabel(790, 350, config.labels.l2, "#2d6a4f", "l2")}
          ${flowLabel(956, 446, config.labels.l3, "#2d6a4f", "l3")}
          ${flowLabel(1120, 590, config.labels.l4, "#2d6a4f", "l4")}
          ${flowLabel(1120, 638, config.labels.l5, "#2d6a4f", "l5")}
        </svg>
      </div>
      ${panelMarkup("ASI01 — Defense Walkthrough", "Click Start to step through the guarded flow. This version shows how the system keeps the original intent intact before any external action happens.")}
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

  function flowLabel(x, y, text, color, id, fontSize) {
    const layout = fitWrappedText(text, 210, fontSize || 13, 11, 2);
    return `
      <g class="lb" id="${id}">
        <text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${layout.fontSize}" font-weight="700" fill="${color}" stroke="#fffdf8" stroke-width="6" paint-order="stroke fill" stroke-linejoin="round">
          ${renderTspans(x, layout.lines, layout.fontSize * 1.18)}
        </text>
      </g>
    `;
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

  function fitWrappedText(text, width, startFontSize, minFontSize, maxLines) {
    const value = String(text || "");
    for (let size = startFontSize; size >= minFontSize; size -= 1) {
      const lines = wrapText(value, width, size, maxLines);
      if (!lines.truncated) return { lines, fontSize: size };
    }
    return { lines: wrapText(value, width, minFontSize, maxLines, true), fontSize: minFontSize };
  }

  function wrapText(text, width, fontSize, maxLines, forceEllipsis) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
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

  function baseStyles() {
    return `
      *{margin:0;padding:0;box-sizing:border-box;}
      :root{--bg:#f6f4ef;--surface:#ffffff;--line:#d9d2c7;--text:#2d2b27;--muted:#7f7a72;--primary:#4452b8;--safe:#2d6a4f;--danger:#9c2f2f;--danger-soft:#fdf0f0;--safe-soft:#edf7f0;}
      body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:16px 18px 24px;}
      .badge{display:inline-block;background:var(--danger-soft);color:#7f2626;border:1px solid #e1a2a2;border-radius:20px;font-size:11px;font-weight:700;padding:4px 14px;margin-bottom:12px;text-align:center;}
      .badge.safe{background:var(--safe-soft);color:var(--safe);border-color:#bdddc8;}
      h1{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8c877f;margin-bottom:18px;text-align:center;}
      .dots{display:flex;align-items:center;gap:0;margin-bottom:14px;}
      .dot{width:8px;height:8px;border-radius:50%;background:#D3D1C7;border:1px solid #B4B2A9;transition:all .3s;}
      .sep{width:14px;height:1px;background:#D3D1C7;}
      .dot.done{background:#b8bdf5;border-color:#8490e0;}
      .dot.active{background:var(--primary);border-color:#32408f;box-shadow:0 0 6px rgba(68,82,184,.35);}
      .dot.atk{background:var(--danger)!important;border-color:#7f2626!important;box-shadow:0 0 6px rgba(156,47,47,.35)!important;}
      .wrap{width:100%;max-width:1360px;background:var(--surface);border:1px solid var(--line);border-radius:20px;overflow:hidden;}
      svg{width:100%;display:block;}
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
      .az{opacity:0;transition:opacity .7s;}
      .az.v{opacity:1;}
      .panel{margin-top:14px;width:100%;max-width:1360px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px 22px;min-height:92px;display:flex;align-items:center;gap:16px;transition:background .4s,border-color .4s;}
      .panel.atk{background:var(--danger-soft);border-color:#e1a2a2;}
      .pt{flex:1;}
      .ps{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);margin-bottom:4px;}
      .ps.a{color:var(--danger);}
      .ph{font-size:17px;font-weight:700;color:var(--text);margin-bottom:3px;}
      .pd{font-size:14px;color:var(--muted);line-height:1.55;max-width:92ch;}
      .bn{background:var(--primary);color:#fff;border:none;border-radius:10px;padding:11px 22px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background .2s,transform .1s;}
      .bn:hover{background:#32408f;transform:translateY(-1px);}
      .bn.atk{background:var(--danger);}
      .bn.atk:hover{background:#7f2626;}
      .bn:disabled{background:#d5d0c8;color:#7f7a72;cursor:not-allowed;transform:none;}
      .br{flex-shrink:0;background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:10px;padding:10px 15px;font-size:13px;cursor:pointer;transition:all .2s;}
      .br:hover{color:#444;border-color:#b8b0a4;}
    `;
  }
})();
