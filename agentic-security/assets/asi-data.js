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
          id: "asi01-support-refund",
          title: "Customer service refund workflow hijack",
          type: "Scenario 1",
          status: "built",
          description:
            "A support agent reads a customer refund email and hidden instructions redirect the refund payout to an attacker destination.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-support-refund",
          businessContext:
            "A customer support assistant reviews refund requests, checks order details, and triggers a refund through a payment tool.",
          whyItRelates:
            "This feels more real to service and operations teams because the business action is familiar, high-impact, and easy to visualize.",
          attackSummary:
            "The support agent reads an inbound refund request, absorbs attacker instructions in the message content, and uses a legitimate refund tool to send money to the wrong destination.",
          defenseSummary:
            "Treat inbound case content as untrusted, preserve the original refund intent, and require policy checks on payout destination and refund scope before execution.",
          lessons: [
            "Customer-service workflows are high-risk because the tool action looks normal.",
            "The dangerous shift happens in agent intent, not in the refund API itself.",
            "Destination validation is as important as refund approval."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Compare the intended refund destination and amount against the original customer case before issuing payment."
            },
            {
              name: "Least privilege",
              detail: "Limit support agents so they can refund only verified orders to verified customer payment destinations."
            },
            {
              name: "Observe drift",
              detail: "Log payout destination changes, unusual refund patterns, and mismatches between customer identity and payment target."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "An attacker-crafted refund email changes the refund objective and redirects money to the attacker.",
              href: "./interactive.html?scenario=asi01-support-refund&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Support lead", subtitle: "Process refund case" },
                  { id: "agent", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Support assistant", subtitle: "Goal: refund customer" },
                  { id: "payload", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "Attacker email", subtitle: "Hidden payout instruction" },
                  { id: "context", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Goal becomes attacker-directed" },
                  { id: "tool", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "issueRefund()", subtitle: "Legitimate tool" },
                  { id: "outcome", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker payout", subtitle: "Refund sent to wrong account" }
                ],
                edges: [
                  { from: "user", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. refund task", labelX: 255, labelY: 126 },
                  { from: "agent", to: "payload", fromSide: "right", toSide: "left", tone: "primary", label: "2. read attacker email", labelX: 660, labelY: 118 },
                  { from: "payload", to: "context", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. attacker payload rewrites refund goal", labelX: 714, labelY: 278 },
                  { from: "context", to: "tool", fromSide: "right", toSide: "left", tone: "danger", label: "4. corrupted payout intent reaches tool", labelX: 560, labelY: 354 },
                  { from: "tool", to: "outcome", fromSide: "right", toSide: "left", tone: "danger", label: "5. valid refund, wrong destination", labelX: 860, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "The service architecture keeps refund intent intact by isolating customer content and validating payout destination before issuing money.",
              href: "./interactive.html?scenario=asi01-support-refund&view=defense",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Support lead", subtitle: "Process refund case" },
                  { id: "guard", x: 290, y: 90, w: 220, h: 120, tone: "safe", title: "Case-content guardrail", subtitle: "Sanitize + classify inbound request" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Support assistant", subtitle: "Original refund goal preserved" },
                  { id: "policy", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Refund validation", subtitle: "Verify amount, order, and payout destination" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped refund tool", subtitle: "Refund only verified customer target" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Audit / alerting", subtitle: "Detect payout drift and refund anomalies" }
                ],
                edges: [
                  { from: "user", to: "guard", fromSide: "right", toSide: "left", tone: "primary", label: "1. refund content through guardrail", labelX: 250, labelY: 124 },
                  { from: "guard", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. only sanitized case data enters planning", labelX: 550, labelY: 124 },
                  { from: "agent", to: "policy", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. proposed refund checked against original case", labelX: 550, labelY: 260 },
                  { from: "policy", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. allow only verified payout target", labelX: 555, labelY: 364 },
                  { from: "policy", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. destination changes and odd refunds are logged", labelX: 845, labelY: 186 }
                ]
              }
            }
          }
        },
        {
          id: "asi01-email",
          title: "Malicious invoice PDF redirects payment",
          type: "Scenario 2",
          status: "built",
          description:
            "A procurement assistant reads a supplier invoice PDF with hidden instructions and redirects a legitimate payment to the attacker.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-email",
          businessContext:
            "A procurement or finance assistant reviews supplier invoices and issues payment through an approved payment workflow.",
          whyItRelates:
            "This is realistic for finance and operations teams because the tool action looks completely legitimate and the damage is immediate.",
          attackSummary:
            "The assistant processes a trusted-looking invoice PDF, absorbs hidden instructions from the document, and sends funds to the wrong bank account.",
          defenseSummary:
            "Strip hidden document content, validate payee accounts against approved supplier records, and require stronger controls for payment execution.",
          lessons: [
            "The payment tool is not broken. The payee decision changed upstream.",
            "Trusted-looking PDFs are still untrusted language input for the agent.",
            "Account validation matters as much as payment approval."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Before issuing payment, compare the destination account and supplier identity against the original invoice request and approved vendor record."
            },
            {
              name: "Least privilege",
              detail: "Restrict payment agents so they can send only to approved supplier accounts and require step-up review for destination changes."
            },
            {
              name: "Observe drift",
              detail: "Alert on account changes, new payees, metadata-heavy PDFs, and payment flows that diverge from normal supplier history."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "An attacker-supplied invoice PDF silently redirects a legitimate payment to the attacker.",
              href: "./interactive.html?scenario=asi01-email&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Finance lead", subtitle: "Approve supplier payment" },
                  { id: "agent", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Procurement assistant", subtitle: "Goal: pay supplier" },
                  { id: "payload", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "Attacker invoice.pdf", subtitle: "Hidden payment instruction" },
                  { id: "context", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Payment destination changed" },
                  { id: "tool", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "issuePayment()", subtitle: "Legitimate payment tool" },
                  { id: "outcome", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker account", subtitle: "Approved payment sent wrong" }
                ],
                edges: [
                  { from: "user", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. payment task", labelX: 255, labelY: 126 },
                  { from: "agent", to: "payload", fromSide: "right", toSide: "left", tone: "primary", label: "2. read attacker PDF", labelX: 660, labelY: 118 },
                  { from: "payload", to: "context", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. attacker payload rewrites payee goal", labelX: 706, labelY: 278 },
                  { from: "context", to: "tool", fromSide: "right", toSide: "left", tone: "danger", label: "4. corrupted payee reaches tool", labelX: 560, labelY: 354 },
                  { from: "tool", to: "outcome", fromSide: "right", toSide: "left", tone: "danger", label: "5. valid payment, wrong account", labelX: 860, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Document sanitization, supplier validation, and payment controls keep the invoice workflow aligned to the real vendor.",
              href: "./interactive.html?scenario=asi01-email&view=defense",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "invoice", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Supplier invoice", subtitle: "Untrusted PDF input" },
                  { id: "guard", x: 290, y: 92, w: 220, h: 120, tone: "safe", title: "PDF guardrail", subtitle: "Strip hidden text + metadata" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Procurement assistant", subtitle: "Original payment goal preserved" },
                  { id: "check", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Supplier validation", subtitle: "Match invoice to approved payee record" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped payment tool", subtitle: "Approved accounts only" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Audit / alerting", subtitle: "Detect payee drift and anomalies" }
                ],
                edges: [
                  { from: "invoice", to: "guard", fromSide: "right", toSide: "left", tone: "safe", label: "1. sanitize invoice before parsing", labelX: 245, labelY: 126 },
                  { from: "guard", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. only cleaned invoice data enters planning", labelX: 545, labelY: 126 },
                  { from: "agent", to: "check", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. proposed payment checked against supplier record", labelX: 540, labelY: 260 },
                  { from: "check", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. allow only approved supplier account", labelX: 555, labelY: 364 },
                  { from: "check", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. account changes and high-risk invoices are logged", labelX: 840, labelY: 188 }
                ]
              }
            }
          }
        },
        {
          id: "asi01-web-operator",
          title: "Malicious web page hijacks market research",
          type: "Scenario 3",
          status: "built",
          description:
            "A research agent opens attacker-controlled competitor content, absorbs hidden instructions, and starts exfiltrating internal research context.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-web-operator",
          businessContext:
            "A market intelligence assistant searches the web for competitor pricing and summarizes findings for an analyst.",
          whyItRelates:
            "This feels real for teams using search copilots or browser agents because public web content looks harmless until it changes the goal.",
          attackSummary:
            "A malicious web page changes the research objective so the assistant forwards internal queries and collected intelligence to an attacker endpoint.",
          defenseSummary:
            "Sanitize retrieved pages, block unapproved outbound calls, and require the assistant to keep the original research-only scope.",
          lessons: [
            "Search and browsing are input channels, not trusted instruction channels.",
            "Research agents should never turn a summary task into an outbound data transfer.",
            "Public content must stay isolated from high-impact actions."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Re-assert the original research objective before allowing any action beyond summarization, especially any external send or API call."
            },
            {
              name: "Least privilege",
              detail: "Keep research agents read-only and block arbitrary outbound endpoints or connectors not explicitly approved for the workflow."
            },
            {
              name: "Observe drift",
              detail: "Alert when a research session starts calling external endpoints, copying internal prompts, or expanding beyond expected browsing and summary actions."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "An attacker-controlled competitor page quietly turns a research task into an exfiltration workflow while still producing a normal summary.",
              href: "./interactive.html?scenario=asi01-web-operator&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Financial analyst", subtitle: "Research competitor pricing" },
                  { id: "operator", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Research assistant", subtitle: "Goal: summarize market data" },
                  { id: "page", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "Attacker page.html", subtitle: "Hidden exfiltration instruction" },
                  { id: "goal", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Research becomes exfiltration" },
                  { id: "portal", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "postResearch()", subtitle: "Legitimate outbound connector" },
                  { id: "leak", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker endpoint", subtitle: "Internal queries leave scope" }
                ],
                edges: [
                  { from: "user", to: "operator", fromSide: "right", toSide: "left", tone: "primary", label: "1. research task", labelX: 255, labelY: 126 },
                  { from: "operator", to: "page", fromSide: "right", toSide: "left", tone: "primary", label: "2. retrieve attacker page", labelX: 650, labelY: 118 },
                  { from: "page", to: "goal", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. attacker payload rewrites research goal", labelX: 704, labelY: 278 },
                  { from: "goal", to: "portal", fromSide: "right", toSide: "left", tone: "danger", label: "4. corrupted summary sent outward", labelX: 560, labelY: 354 },
                  { from: "portal", to: "leak", fromSide: "right", toSide: "left", tone: "danger", label: "5. internal intelligence exposed", labelX: 855, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Web content stays isolated, outbound calls stay constrained, and the assistant remains a research summarizer instead of a data sender.",
              href: "./interactive.html?scenario=asi01-web-operator&view=defense",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "web", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Retrieved web page", subtitle: "Untrusted public content" },
                  { id: "isolate", x: 290, y: 92, w: 220, h: 120, tone: "safe", title: "Web guardrail", subtitle: "Strip hidden DOM + trust score page" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Research assistant", subtitle: "Original summary goal preserved" },
                  { id: "confirm", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Outbound action check", subtitle: "No unapproved endpoint or send" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped research tools", subtitle: "Summary only, no arbitrary exfiltration" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Observability", subtitle: "Detect unusual network or action drift" }
                ],
                edges: [
                  { from: "web", to: "isolate", fromSide: "right", toSide: "left", tone: "safe", label: "1. sanitize retrieved page", labelX: 250, labelY: 126 },
                  { from: "isolate", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. only safe page content reaches reasoning", labelX: 545, labelY: 126 },
                  { from: "agent", to: "confirm", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. any action beyond summary is revalidated", labelX: 548, labelY: 260 },
                  { from: "confirm", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. allow only approved research outputs", labelX: 560, labelY: 364 },
                  { from: "confirm", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. unusual outbound activity is logged", labelX: 850, labelY: 188 }
                ]
              }
            }
          }
        },
        
      ]
    },
    {
      id: "ASI02",
      title: "Tool Misuse & Exploitation",
      status: "in-progress",
      href: "./asi02.html",
      summary:
        "Legitimate tools are invoked in unsafe ways because of prompt injection, misalignment, unsafe delegation, or ambiguous instructions.",
      trainerAngle:
        "Teach ASI02 as dangerous tool behavior after the agent has already decided to act, not just as bad prompt handling.",
      scenarios: [
        {
          id: "asi02-refund-loop",
          title: "Refund machine loops payouts",
          type: "Scenario 1",
          status: "built",
          description:
            "A support agent autonomously retries a refund tool when workflow state remains ambiguous, causing the same case to be paid repeatedly.",
          href: "./scenario.html?asi=ASI02&scenario=asi02-refund-loop",
          businessContext:
            "A customer-service refund assistant can check eligibility and issue refunds without a human in the loop for low-value cases.",
          whyItRelates:
            "It is easy for every audience to understand because the loss is immediate and the tools look normal.",
          attackSummary:
            "Ambiguous refund state causes the agent to autonomously retry the same legitimate payout path, and weak execution controls allow duplicate refunds.",
          defenseSummary:
            "Use idempotency, per-case execution limits, and state-aware checks so ambiguous status cannot reopen the same refund path automatically.",
          lessons: [
            "Tool misuse can happen even when the agent never leaves its allowed toolset.",
            "A loop is often an execution-control failure, not a model-quality problem.",
            "Financial actions need idempotency and state memory, not just intent checks."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Verify that the case has not already been refunded before any new refund tool call is allowed."
            },
            {
              name: "Least privilege",
              detail: "Limit the agent to one refund action per case and require escalation for retries or repeated tool use."
            },
            {
              name: "Observe drift",
              detail: "Alert on repeated tool invocation, abnormal refund counts, and refund bursts tied to one workflow."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "Ambiguous refund state causes the assistant to retry on its own, and weak execution controls allow the legitimate payout path to run again.",
              href: "./interactive.html?scenario=asi02-refund-loop&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 190, h: 96, tone: "neutral", title: "Support lead", subtitle: "Process one refund case" },
                  { id: "agent", x: 300, y: 92, w: 230, h: 112, tone: "primary", title: "Refund assistant", subtitle: "Low-value auto refund flow" },
                  { id: "check", x: 600, y: 92, w: 220, h: 112, tone: "neutral", title: "issueRefund()", subtitle: "First payout attempt starts" },
                  { id: "loop", x: 300, y: 320, w: 230, h: 116, tone: "danger", title: "Ambiguous state", subtitle: "Pending status reopens path" },
                  { id: "pay", x: 600, y: 320, w: 220, h: 116, tone: "danger", title: "issueRefund()", subtitle: "Same payout path re-used" },
                  { id: "impact", x: 900, y: 320, w: 230, h: 116, tone: "danger", title: "Business loss", subtitle: "Same case paid many times" }
                ],
                edges: [
                  { from: "user", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. refund request", labelX: 265, labelY: 126 },
                  { from: "agent", to: "check", fromSide: "right", toSide: "left", tone: "primary", label: "2. first payout call", labelX: 555, labelY: 126 },
                  { from: "check", to: "loop", fromSide: "bottom", toSide: "right", tone: "danger", mode: "elbow", label: "3. pending state makes refund look unfinished", labelX: 505, labelY: 266 },
                  { from: "loop", to: "pay", fromSide: "right", toSide: "left", tone: "danger", label: "4. agent retries payout on its own", labelX: 535, labelY: 354 },
                  { from: "pay", to: "impact", fromSide: "right", toSide: "left", tone: "danger", label: "5. repeated payouts accumulate", labelX: 860, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Idempotency, case state, and execution limits stop the assistant from turning one refund into a payout loop.",
              href: "./interactive.html?scenario=asi02-refund-loop&view=defense",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "case", x: 40, y: 100, w: 190, h: 96, tone: "neutral", title: "Refund case", subtitle: "Single business action" },
                  { id: "guard", x: 290, y: 92, w: 230, h: 120, tone: "safe", title: "Execution guardrail", subtitle: "Idempotency + per-case lock" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Refund assistant", subtitle: "One action only" },
                  { id: "check", x: 290, y: 330, w: 230, h: 120, tone: "safe", title: "State check", subtitle: "Already refunded? block retry" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped refund tool", subtitle: "One payout token per case" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Monitoring", subtitle: "Detect bursts and loops" }
                ],
                edges: [
                  { from: "case", to: "guard", fromSide: "right", toSide: "left", tone: "primary", label: "1. case enters guarded workflow", labelX: 250, labelY: 126 },
                  { from: "guard", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. assistant gets one executable refund path", labelX: 550, labelY: 126 },
                  { from: "agent", to: "check", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. retry request checked against case state", labelX: 548, labelY: 260 },
                  { from: "check", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. only unused payout can proceed", labelX: 555, labelY: 364 },
                  { from: "tool", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. abnormal repetition becomes visible", labelX: 845, labelY: 188 }
                ]
              }
            }
          }
        },
        {
          id: "asi02-devops-chain",
          title: "DevOps agent disables production auth",
          type: "Scenario 2",
          status: "built",
          description:
            "A DevOps agent chains together log reading, config writing, and service restarts in a way that breaks production security.",
          href: "./scenario.html?asi=ASI02&scenario=asi02-devops-chain",
          businessContext:
            "An operations agent helps on-call teams diagnose incidents and apply low-risk production changes automatically.",
          whyItRelates:
            "Engineers and architects immediately understand the blast radius because the same tools are common in modern automation.",
          attackSummary:
            "A lookalike recovery tool is selected during incident response, and the assistant invokes it in production because the tool appears legitimate.",
          defenseSummary:
            "Use a trusted tool catalog, gate high-impact execution, and never let a discovered helper mutate production unless it is verified and approved.",
          lessons: [
            "The danger is the chain, not any one tool in isolation.",
            "Write access plus restart access is high-risk when the same agent holds both.",
            "Operational urgency is often what hides misuse until after impact."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Require the proposed production change to match a known safe remediation plan before allowing config mutation."
            },
            {
              name: "Least privilege",
              detail: "Split read, write, and restart capabilities so one agent cannot complete the whole destructive chain alone."
            },
            {
              name: "Observe drift",
              detail: "Alert when incident triage expands into auth changes, config rewrites, or broad service restarts."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "A lookalike recovery tool is discovered during incident response and then invoked in production because the assistant trusts its description.",
              href: "./interactive.html?scenario=asi02-devops-chain&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "oncall", x: 40, y: 100, w: 190, h: 96, tone: "neutral", title: "On-call engineer", subtitle: "Check production incident" },
                  { id: "agent", x: 300, y: 92, w: 230, h: 112, tone: "primary", title: "DevOps agent", subtitle: "Incident remediation assistant" },
                  { id: "logs", x: 600, y: 92, w: 220, h: 112, tone: "neutral", title: "discoverTools()", subtitle: "Recovery helper is discovered" },
                  { id: "config", x: 300, y: 320, w: 230, h: 116, tone: "danger", title: "Lookalike tool", subtitle: "Claims safe auth recovery" },
                  { id: "restart", x: 600, y: 320, w: 220, h: 116, tone: "danger", title: "auth-recovery-pro", subtitle: "Unsafe prod fix goes live" },
                  { id: "impact", x: 900, y: 320, w: 230, h: 116, tone: "danger", title: "Production impact", subtitle: "12 services restart insecure" }
                ],
                edges: [
                  { from: "oncall", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. investigate incident", labelX: 265, labelY: 126 },
                  { from: "agent", to: "logs", fromSide: "right", toSide: "left", tone: "primary", label: "2. search recovery helpers", labelX: 548, labelY: 126 },
                  { from: "logs", to: "config", fromSide: "bottom", toSide: "right", tone: "danger", mode: "elbow", label: "3. deceptive tool looks legitimate", labelX: 535, labelY: 266 },
                  { from: "config", to: "restart", fromSide: "right", toSide: "left", tone: "danger", label: "4. agent executes spoofed helper", labelX: 550, labelY: 354 },
                  { from: "restart", to: "impact", fromSide: "right", toSide: "left", tone: "danger", label: "5. authentication breaks in prod", labelX: 865, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Production safety improves when recovery helpers come from a trusted catalog and high-impact execution is separately approved.",
              href: "./interactive.html?scenario=asi02-devops-chain&view=defense",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "incident", x: 40, y: 100, w: 190, h: 96, tone: "neutral", title: "Incident signal", subtitle: "Logs and alerts only" },
                  { id: "triage", x: 290, y: 92, w: 230, h: 120, tone: "safe", title: "Trusted tool catalog", subtitle: "Signed and allowlisted helpers only" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "DevOps agent", subtitle: "Proposes, does not enforce" },
                  { id: "policy", x: 290, y: 330, w: 230, h: 120, tone: "safe", title: "Execution gate", subtitle: "Auth and restart policies checked" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped recovery tools", subtitle: "Verified helpers and gated restart" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Audit trail", subtitle: "Track risky service mutations" }
                ],
                edges: [
                  { from: "incident", to: "triage", fromSide: "right", toSide: "left", tone: "primary", label: "1. select only trusted helpers", labelX: 248, labelY: 126 },
                  { from: "triage", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. assistant receives verified tool choices", labelX: 540, labelY: 126 },
                  { from: "agent", to: "policy", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. high-impact changes require policy gate", labelX: 548, labelY: 260 },
                  { from: "policy", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. only approved safe change can execute", labelX: 555, labelY: 364 },
                  { from: "tool", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. risky restarts remain observable", labelX: 845, labelY: 188 }
                ]
              }
            }
          }
        },
        {
          id: "asi02-trading-output",
          title: "Trading agent acts on poisoned tool output",
          type: "Scenario 3",
          status: "built",
          description:
            "A financial research agent treats upstream analysis output as if it were already approved for execution and places a trade that was never authorized.",
          href: "./scenario.html?asi=ASI02&scenario=asi02-trading-output",
          businessContext:
            "A trading or treasury assistant gathers market data, analyzes signals, and can place bounded trades for approved strategies.",
          whyItRelates:
            "It feels sophisticated and high-stakes, which makes it memorable for technical leaders and enterprise audiences.",
          attackSummary:
            "A compromised market-data result is treated as if it already has trade authority, so research output crosses directly into execution.",
          defenseSummary:
            "Treat tool output as untrusted until validated, require explicit trade intent binding, and keep analysis separate from execution authority.",
          lessons: [
            "Trusted tool output can still be an attack surface.",
            "Analysis and execution should not share a blind trust boundary.",
            "High-stakes tools need explicit action authorization, not implied context."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Require a trade plan to match an approved strategy, instrument, and size before any execution call is permitted."
            },
            {
              name: "Least privilege",
              detail: "Keep market-analysis tools separate from execution authority so one compromised output cannot directly place a trade."
            },
            {
              name: "Observe drift",
              detail: "Alert when market-research workflows suddenly initiate orders, unusual sizes, or assets outside the declared strategy."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "A compromised signal crosses the trust boundary into execution because the workflow treats analysis results as if they were already approved trades.",
              href: "./interactive.html?scenario=asi02-trading-output&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "analyst", x: 40, y: 100, w: 190, h: 96, tone: "neutral", title: "Portfolio lead", subtitle: "Review market opportunity" },
                  { id: "agent", x: 300, y: 92, w: 230, h: 112, tone: "primary", title: "Trading assistant", subtitle: "Analyze and prepare action" },
                  { id: "feed", x: 600, y: 92, w: 220, h: 112, tone: "neutral", title: "fetchMarketData()", subtitle: "Compromised signal package returned" },
                  { id: "analysis", x: 300, y: 320, w: 230, h: 116, tone: "danger", title: "Compromised signal", subtitle: "Accepted as order-ready" },
                  { id: "trade", x: 600, y: 320, w: 220, h: 116, tone: "danger", title: "placeTrade()", subtitle: "Unauthorized order executes" },
                  { id: "impact", x: 900, y: 320, w: 230, h: 116, tone: "danger", title: "Financial impact", subtitle: "Large position opened" }
                ],
                edges: [
                  { from: "analyst", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. research request", labelX: 265, labelY: 126 },
                  { from: "agent", to: "feed", fromSide: "right", toSide: "left", tone: "primary", label: "2. fetch analysis", labelX: 565, labelY: 126 },
                  { from: "feed", to: "analysis", fromSide: "bottom", toSide: "right", tone: "danger", mode: "elbow", label: "3. compromised signal is treated as trade authority", labelX: 468, labelY: 266 },
                  { from: "analysis", to: "trade", fromSide: "right", toSide: "left", tone: "danger", label: "4. order routed without second approval", labelX: 520, labelY: 354 },
                  { from: "trade", to: "impact", fromSide: "right", toSide: "left", tone: "danger", label: "5. capital moves before review", labelX: 860, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "Analysis stays separate from execution when tool output is validated and trade authority is explicitly approved.",
              href: "./interactive.html?scenario=asi02-trading-output&view=defense",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "request", x: 40, y: 100, w: 190, h: 96, tone: "neutral", title: "Research request", subtitle: "No implied trade authority" },
                  { id: "guard", x: 290, y: 92, w: 230, h: 120, tone: "safe", title: "Tool-output validation", subtitle: "Schema and policy checks" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Trading assistant", subtitle: "Analysis only by default" },
                  { id: "approval", x: 290, y: 330, w: 230, h: 120, tone: "safe", title: "Trade authorization gate", subtitle: "Approved strategy and size required" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped execution tool", subtitle: "Executes only bound orders" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Surveillance", subtitle: "Detect unusual order paths" }
                ],
                edges: [
                  { from: "request", to: "guard", fromSide: "right", toSide: "left", tone: "primary", label: "1. validate incoming tool output", labelX: 250, labelY: 126 },
                  { from: "guard", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. assistant receives analysis-safe data", labelX: 548, labelY: 126 },
                  { from: "agent", to: "approval", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. any trade move requires explicit approval", labelX: 548, labelY: 260 },
                  { from: "approval", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. execute only approved bound order", labelX: 555, labelY: 364 },
                  { from: "tool", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. suspicious execution remains visible", labelX: 845, labelY: 188 }
                ]
              }
            }
          }
        }
      ]
    },
    {
      id: "ASI03",
      title: "Identity & Privilege Abuse",
      status: "planned",
      href: "#",
      summary:
        "The agent misuses or inherits identity and access in ways that break intended authorization boundaries."
    },
    {
      id: "ASI04",
      title: "Agentic Supply Chain Vulnerabilities",
      status: "planned",
      href: "#",
      summary:
        "The tool, framework, package, or dependency ecosystem becomes the source of compromise for agentic systems."
    },
    {
      id: "ASI05",
      title: "Unexpected Code Execution (RCE)",
      status: "planned",
      href: "#",
      summary:
        "Agentic workflows trigger unsafe command execution, code paths, or system-level actions that result in compromise."
    },
    {
      id: "ASI06",
      title: "Memory & Context Poisoning",
      status: "planned",
      href: "#",
      summary:
        "Persistent or shared memory is corrupted so future agent reasoning and decisions are manipulated over time."
    },
    {
      id: "ASI07",
      title: "Insecure Inter-Agent Communication",
      status: "planned",
      href: "#",
      summary:
        "Messages, protocols, or directories between agents can be spoofed, poisoned, or abused to influence behavior."
    },
    {
      id: "ASI08",
      title: "Cascading Failures",
      status: "planned",
      href: "#",
      summary:
        "One agentic error or manipulation propagates across tools, agents, or workflows and expands the blast radius."
    },
    {
      id: "ASI09",
      title: "Human-Agent Trust Exploitation",
      status: "planned",
      href: "#",
      summary:
        "Humans are manipulated into over-trusting, approving, or acting on deceptive agent behavior or outputs."
    },
    {
      id: "ASI10",
      title: "Rogue Agents",
      status: "planned",
      href: "#",
      summary:
        "Autonomous misalignment emerges or persists, causing agents to act outside intended objectives even without direct attacker control."
    }
  ]
};
