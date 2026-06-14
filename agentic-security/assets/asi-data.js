window.OWASP_ASI_DATA = {
  categories: [
    {
      id: "ASI01",
      title: "Agent Goal Hijack",
      status: "in-progress",
      href: "./asi01.html",
      summary:
        "Attackers manipulate the agent's objective, task selection, or decision pathway through untrusted language inputs and loosely governed orchestration.",
      trainerAngle:
        "Teach ASI01 as goal drift across different input channels, not as a single prompt-injection trick.",
      scenarios: [
        {
          id: "asi01-doc-rag",
          title: "Malicious document in retrieval flow",
          type: "Scenario 1",
          status: "built",
          description:
            "A hidden instruction inside a retrieved document changes the agent's goal and redirects a legitimate tool action.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-doc-rag",
          detailedHref: "./ASI01_interactive_light_extracted.html",
          businessContext:
            "A finance or operations assistant reads a retrieved report and emails a summary to the team.",
          whyItRelates:
            "This is the cleanest way to explain that data-like content can act like instructions inside an agent workflow.",
          attackSummary:
            "The agent treats the document payload as trusted context, rewrites its goal, and uses a normal communication tool for the wrong recipient.",
          defenseSummary:
            "Validate intent before action, isolate untrusted content before it reaches planning, and require approval or policy checks for outbound high-impact actions.",
          lessons: [
            "The tool is not compromised. The goal changed upstream.",
            "Documents and retrieval results are untrusted language inputs.",
            "Goal drift must be visible before the external action happens."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Compare current agent intent to the original task before any external send or high-impact tool action."
            },
            {
              name: "Least privilege",
              detail: "Limit document-reading agents to scoped outbound channels and approved recipients wherever possible."
            },
            {
              name: "Observe drift",
              detail: "Log goal changes, recipient changes, and abnormal tool sequences so operators can detect hijack attempts quickly."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "Untrusted document content silently changes the goal and causes a legitimate tool to act on the wrong objective.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "User", subtitle: "Ask for a summary" },
                  { id: "agent", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Planner / agent", subtitle: "Goal: email team" },
                  { id: "doc", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "Retrieved doc.pdf", subtitle: "Hidden instruction inside" },
                  { id: "context", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Goal becomes attacker-directed" },
                  { id: "tool", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "sendEmail()", subtitle: "Legitimate tool" },
                  { id: "outcome", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker mailbox", subtitle: "Team never receives output" }
                ],
                edges: [
                  { from: "user", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. task request", labelX: 255, labelY: 126 },
                  { from: "agent", to: "doc", fromSide: "right", toSide: "left", tone: "primary", label: "2. retrieve content", labelX: 660, labelY: 118 },
                  { from: "doc", to: "context", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. injected instruction rewrites goal", labelX: 730, labelY: 278 },
                  { from: "context", to: "tool", fromSide: "right", toSide: "left", tone: "danger", label: "4. corrupted intent reaches tool", labelX: 560, labelY: 354 },
                  { from: "tool", to: "outcome", fromSide: "right", toSide: "left", tone: "danger", label: "5. valid send, wrong target", labelX: 860, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "The architecture stops the hijack by isolating untrusted content, validating intent, and gating high-impact actions.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "User", subtitle: "Ask for a summary" },
                  { id: "ingest", x: 290, y: 90, w: 220, h: 120, tone: "safe", title: "Content guardrail", subtitle: "Sanitize + classify document" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Planner / agent", subtitle: "Original goal preserved" },
                  { id: "policy", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Intent / policy check", subtitle: "Compare current intent to task" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped email tool", subtitle: "Least privilege + approvals" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Audit / alerting", subtitle: "Detect goal drift and recipient changes" }
                ],
                edges: [
                  { from: "user", to: "ingest", fromSide: "right", toSide: "left", tone: "primary", label: "1. retrieve content through guardrail", labelX: 250, labelY: 124 },
                  { from: "ingest", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. only sanitized content enters planning", labelX: 550, labelY: 124 },
                  { from: "agent", to: "policy", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. proposed action checked against original intent", labelX: 550, labelY: 260 },
                  { from: "policy", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. allow only if recipient and scope are valid", labelX: 555, labelY: 364 },
                  { from: "policy", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. drift, recipient change, and overrides are logged", labelX: 845, labelY: 186 }
                ]
              }
            }
          }
        },
        {
          id: "asi01-email",
          title: "Malicious email hijacks internal communications",
          type: "Scenario 2",
          status: "built",
          description:
            "An external email contains attacker-crafted language that changes how an internal communications assistant interprets its task.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-email",
          businessContext:
            "An executive assistant agent triages email and drafts internal updates for staff or leadership.",
          whyItRelates:
            "Teams immediately understand the risk of an email assistant speaking under a trusted company voice.",
          attackSummary:
            "The agent processes an untrusted inbound email, treats the message as instruction-bearing context, and sends unauthorized internal communication.",
          defenseSummary:
            "Separate external content from agent goals, classify sender trust, validate outbound intent, and require approval for broad or sensitive sends.",
          lessons: [
            "Trusted output identity makes the attack more convincing.",
            "Inbound email must never directly redefine the task.",
            "Human approval matters most when the audience is broad or high-trust."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Before sending organization-wide or sensitive communications, confirm the message still matches the original user objective."
            },
            {
              name: "Least privilege",
              detail: "Limit internal comms agents from broadcasting broadly unless they pass stronger policy checks or approval."
            },
            {
              name: "Observe drift",
              detail: "Alert when an outbound message’s audience, purpose, or tone changes materially from the original workflow."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "An external email becomes a hidden instruction carrier and the agent abuses its trusted internal voice.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "attacker", x: 40, y: 100, w: 180, h: 96, tone: "danger", title: "External sender", subtitle: "Crafted email" },
                  { id: "mailbox", x: 300, y: 92, w: 220, h: 112, tone: "neutral", title: "Shared inbox", subtitle: "Inbound message enters workflow" },
                  { id: "agent", x: 600, y: 92, w: 220, h: 112, tone: "primary", title: "Comms assistant", subtitle: "Draft internal update" },
                  { id: "context", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Goal state", subtitle: "Recipient / purpose changed" },
                  { id: "tool", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "Internal send tool", subtitle: "Uses trusted identity" },
                  { id: "staff", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Employees / leadership", subtitle: "Receive unauthorized message" }
                ],
                edges: [
                  { from: "attacker", to: "mailbox", fromSide: "right", toSide: "left", tone: "danger", label: "1. crafted inbound email", labelX: 255, labelY: 126 },
                  { from: "mailbox", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "2. email becomes planning context", labelX: 550, labelY: 126 },
                  { from: "agent", to: "context", fromSide: "bottom", toSide: "top", tone: "danger", mode: "elbow", label: "3. hidden instruction shifts communication goal", labelX: 555, labelY: 270 },
                  { from: "context", to: "tool", fromSide: "right", toSide: "left", tone: "danger", label: "4. trusted send action uses wrong intent", labelX: 560, labelY: 354 },
                  { from: "tool", to: "staff", fromSide: "right", toSide: "left", tone: "danger", label: "5. unauthorized internal message lands", labelX: 860, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Sender trust, intent validation, and approval for sensitive broadcasts stop the assistant from becoming a social engineering amplifier.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "mail", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Inbound email", subtitle: "External content" },
                  { id: "classify", x: 290, y: 92, w: 220, h: 120, tone: "safe", title: "Trust classifier", subtitle: "External vs internal + content risk" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Comms assistant", subtitle: "Original task preserved" },
                  { id: "approval", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Approval / policy gate", subtitle: "Broadcasts and sensitive sends reviewed" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped send tool", subtitle: "Audience limits enforced" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Monitoring", subtitle: "Track audience, tone, and recipient drift" }
                ],
                edges: [
                  { from: "mail", to: "classify", fromSide: "right", toSide: "left", tone: "safe", label: "1. treat inbound email as untrusted", labelX: 240, labelY: 126 },
                  { from: "classify", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. separate content from task intent", labelX: 545, labelY: 126 },
                  { from: "agent", to: "approval", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. high-impact send requests are checked", labelX: 545, labelY: 260 },
                  { from: "approval", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. only approved audience and purpose can pass", labelX: 555, labelY: 364 },
                  { from: "tool", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. suspicious comms patterns are observable", labelX: 850, labelY: 188 }
                ]
              }
            }
          }
        },
        {
          id: "asi01-web-operator",
          title: "Browser / operator follows attacker web content",
          type: "Scenario 3",
          status: "built",
          description:
            "A browsing or search agent opens attacker-controlled content, absorbs hidden instructions, and then acts within an authenticated session.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-web-operator",
          businessContext:
            "A browser operator agent researches vendors or account issues while logged into internal or enterprise applications.",
          whyItRelates:
            "This is a strong scenario for teams using browsing assistants, search copilots, or operator-style agents with authenticated access.",
          attackSummary:
            "A malicious page changes the operator agent’s task, which then pivots into authenticated internal resources and exposes sensitive information.",
          defenseSummary:
            "Treat browsing zones as untrusted, restrict authenticated pivots, force confirmation before exports, and watch for action drift after page reads.",
          lessons: [
            "Reading a web page is not harmless when the model treats text as instruction-bearing.",
            "Authenticated pivots are the highest-risk moment in operator-style workflows.",
            "Browsing agents should default to read-only exploration."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Re-assert the user’s original goal before navigating from public web content into internal authenticated surfaces."
            },
            {
              name: "Least privilege",
              detail: "Keep browsing agents read-only by default and narrow what authenticated pages or exports they can access."
            },
            {
              name: "Observe drift",
              detail: "Alert when a browsing task suddenly expands into login, export, admin, or sensitive retrieval behaviors."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "A malicious public page becomes the bridge between harmless research and harmful authenticated actions.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "User", subtitle: "Research a vendor issue" },
                  { id: "operator", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Browser operator", subtitle: "Search and browse" },
                  { id: "page", x: 600, y: 92, w: 220, h: 112, tone: "danger", title: "Malicious web page", subtitle: "Hidden instructions in content" },
                  { id: "goal", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Goal state", subtitle: "Research becomes data grab" },
                  { id: "portal", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "Authenticated portal", subtitle: "Internal account / knowledge app" },
                  { id: "leak", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Sensitive exposure", subtitle: "Internal data leaves intended scope" }
                ],
                edges: [
                  { from: "user", to: "operator", fromSide: "right", toSide: "left", tone: "primary", label: "1. harmless browsing task", labelX: 245, labelY: 126 },
                  { from: "operator", to: "page", fromSide: "right", toSide: "left", tone: "primary", label: "2. operator reads attacker page", labelX: 548, labelY: 126 },
                  { from: "page", to: "goal", fromSide: "bottom", toSide: "right", tone: "danger", mode: "elbow", label: "3. hidden instructions reframe objective", labelX: 575, labelY: 262 },
                  { from: "goal", to: "portal", fromSide: "right", toSide: "left", tone: "danger", label: "4. agent pivots into trusted session", labelX: 560, labelY: 354 },
                  { from: "portal", to: "leak", fromSide: "right", toSide: "left", tone: "danger", label: "5. internal data exposed", labelX: 850, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Browsing stays isolated, risky pivots require re-validation, and exports from authenticated tools are explicitly controlled.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "task", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Research task", subtitle: "User request" },
                  { id: "zone", x: 290, y: 92, w: 220, h: 120, tone: "safe", title: "Untrusted browsing zone", subtitle: "Public web content isolated" },
                  { id: "operator", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Operator", subtitle: "Task scope preserved" },
                  { id: "check", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Authenticated pivot check", subtitle: "Confirm intent before internal access" },
                  { id: "portal", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Internal portal", subtitle: "Read-only + export controls" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Telemetry", subtitle: "Track pivots, exports, and data movement" }
                ],
                edges: [
                  { from: "task", to: "zone", fromSide: "right", toSide: "left", tone: "primary", label: "1. browse public content in isolation", labelX: 245, labelY: 126 },
                  { from: "zone", to: "operator", fromSide: "right", toSide: "left", tone: "safe", label: "2. page content cannot redefine the goal", labelX: 550, labelY: 126 },
                  { from: "operator", to: "check", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. internal pivots require intent confirmation", labelX: 555, labelY: 260 },
                  { from: "check", to: "portal", fromSide: "right", toSide: "left", tone: "safe", label: "4. only scoped, read-only actions are allowed", labelX: 555, labelY: 364 },
                  { from: "portal", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. sensitive exports and pivots are logged", labelX: 850, labelY: 188 }
                ]
              }
            }
          }
        },
        {
          id: "asi01-calendar-drift",
          title: "Calendar invite causes silent goal drift",
          type: "Scenario 4",
          status: "built",
          description:
            "A crafted calendar invite or recurring instruction quietly influences the planner over time, leading to low-friction but unsafe approvals.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-calendar-drift",
          businessContext:
            "A scheduling or executive operations agent processes meetings, daily planning prompts, and recurring approval workflows.",
          whyItRelates:
            "This makes ASI01 feel more enterprise-realistic because the drift is subtle, recurring, and not obviously malicious to a human observer.",
          attackSummary:
            "An invite or recurring prompt injects a hidden objective that gradually changes decision weighting and approval behavior.",
          defenseSummary:
            "Treat calendar and schedule inputs as untrusted, bind each run to an immutable task scope, and alert when daily behavior drifts from baseline.",
          lessons: [
            "Not all goal hijack is loud. Some of it is slow and policy-shaped.",
            "Recurring workflows need stronger integrity around goal persistence.",
            "Goal drift detection is just as important as one-time blocking."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Bind each execution cycle to the original objective instead of letting recurring content redefine priorities silently."
            },
            {
              name: "Least privilege",
              detail: "Limit planning agents from approving, routing, or escalating outside clearly scoped authority."
            },
            {
              name: "Observe drift",
              detail: "Baseline normal planner behavior and alert on recurring shifts in approvals, recipients, or action patterns."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "A recurring or scheduled prompt quietly changes how the planner weights decisions, causing unsafe approvals without obvious breakage.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "invite", x: 40, y: 100, w: 180, h: 96, tone: "danger", title: "Calendar invite", subtitle: "Recurring hidden instruction" },
                  { id: "planner", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Planning agent", subtitle: "Daily prioritization" },
                  { id: "memory", x: 600, y: 92, w: 220, h: 112, tone: "danger", title: "Execution context", subtitle: "Objective weighting shifts" },
                  { id: "goal", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Decision policy", subtitle: "Low-friction approval bias" },
                  { id: "workflow", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "Approval workflow", subtitle: "Legitimate action path" },
                  { id: "impact", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Business impact", subtitle: "Unsafe approvals / silent drift" }
                ],
                edges: [
                  { from: "invite", to: "planner", fromSide: "right", toSide: "left", tone: "danger", label: "1. recurring content enters planner", labelX: 245, labelY: 126 },
                  { from: "planner", to: "memory", fromSide: "right", toSide: "left", tone: "primary", label: "2. quiet goal weighting shift", labelX: 550, labelY: 126 },
                  { from: "memory", to: "goal", fromSide: "bottom", toSide: "right", tone: "danger", mode: "elbow", label: "3. decisions drift over repeated cycles", labelX: 560, labelY: 262 },
                  { from: "goal", to: "workflow", fromSide: "right", toSide: "left", tone: "danger", label: "4. legitimate workflow acts on skewed priorities", labelX: 545, labelY: 354 },
                  { from: "workflow", to: "impact", fromSide: "right", toSide: "left", tone: "danger", label: "5. unsafe approvals accumulate", labelX: 850, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Recurring workflows stay safe when each run is bound to an approved intent, and drift across repeated cycles is visible to operators.",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "schedule", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Calendar / schedule input", subtitle: "Untrusted by default" },
                  { id: "bind", x: 290, y: 92, w: 220, h: 120, tone: "safe", title: "Intent binding", subtitle: "Original task + constraints fixed per run" },
                  { id: "planner", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Planning agent", subtitle: "Execution stays in scope" },
                  { id: "gate", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Approval policy", subtitle: "Goal-changing actions blocked or reviewed" },
                  { id: "workflow", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Workflow engine", subtitle: "Scoped approvals only" },
                  { id: "monitor", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Drift monitor", subtitle: "Detect repeated shifts over time" }
                ],
                edges: [
                  { from: "schedule", to: "bind", fromSide: "right", toSide: "left", tone: "safe", label: "1. recurring inputs cannot redefine objectives", labelX: 240, labelY: 126 },
                  { from: "bind", to: "planner", fromSide: "right", toSide: "left", tone: "safe", label: "2. each cycle starts from a fixed intent capsule", labelX: 545, labelY: 126 },
                  { from: "planner", to: "gate", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. deviations trigger policy review", labelX: 555, labelY: 260 },
                  { from: "gate", to: "workflow", fromSide: "right", toSide: "left", tone: "safe", label: "4. only in-scope approvals can continue", labelX: 550, labelY: 364 },
                  { from: "workflow", to: "monitor", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. recurring drift patterns become observable", labelX: 845, labelY: 188 }
                ]
              }
            }
          }
        }
      ]
    },
    {
      id: "ASI02",
      title: "Tool Misuse & Exploitation",
      status: "planned",
      href: "./blueprint.html#asi02",
      summary:
        "Legitimate tools are invoked in unsafe ways because of prompt injection, misalignment, unsafe delegation, or ambiguous instructions."
    },
    {
      id: "ASI03",
      title: "Identity & Privilege Abuse",
      status: "planned",
      href: "./blueprint.html#asi03",
      summary:
        "The agent misuses or inherits identity and access in ways that break intended authorization boundaries."
    },
    {
      id: "ASI04",
      title: "Agentic Supply Chain Vulnerabilities",
      status: "planned",
      href: "./blueprint.html#asi04",
      summary:
        "The tool, framework, package, or dependency ecosystem becomes the source of compromise for agentic systems."
    },
    {
      id: "ASI05",
      title: "Unexpected Code Execution (RCE)",
      status: "planned",
      href: "./blueprint.html#asi05",
      summary:
        "Agentic workflows trigger unsafe command execution, code paths, or system-level actions that result in compromise."
    },
    {
      id: "ASI06",
      title: "Memory & Context Poisoning",
      status: "planned",
      href: "./blueprint.html#asi06",
      summary:
        "Persistent or shared memory is corrupted so future agent reasoning and decisions are manipulated over time."
    },
    {
      id: "ASI07",
      title: "Insecure Inter-Agent Communication",
      status: "planned",
      href: "./blueprint.html#asi07",
      summary:
        "Messages, protocols, or directories between agents can be spoofed, poisoned, or abused to influence behavior."
    },
    {
      id: "ASI08",
      title: "Cascading Failures",
      status: "planned",
      href: "./blueprint.html#asi08",
      summary:
        "One agentic error or manipulation propagates across tools, agents, or workflows and expands the blast radius."
    },
    {
      id: "ASI09",
      title: "Human-Agent Trust Exploitation",
      status: "planned",
      href: "./blueprint.html#asi09",
      summary:
        "Humans are manipulated into over-trusting, approving, or acting on deceptive agent behavior or outputs."
    },
    {
      id: "ASI10",
      title: "Rogue Agents",
      status: "planned",
      href: "./blueprint.html#asi10",
      summary:
        "Autonomous misalignment emerges or persists, causing agents to act outside intended objectives even without direct attacker control."
    }
  ]
};
