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
              href: "./interactive.html?scenario=asi01-doc-rag&view=attack",
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
              href: "./interactive.html?scenario=asi01-doc-rag&view=defense",
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
          id: "asi01-support-refund",
          title: "Customer service refund workflow hijack",
          type: "Scenario 1B",
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
                "A hidden instruction inside customer-service content changes the refund objective and redirects money to the attacker.",
              href: "./interactive.html?scenario=asi01-support-refund&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Support lead", subtitle: "Process refund case" },
                  { id: "agent", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Support assistant", subtitle: "Goal: refund customer" },
                  { id: "payload", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "Refund email", subtitle: "Hidden payout instruction" },
                  { id: "context", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Goal becomes attacker-directed" },
                  { id: "tool", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "issueRefund()", subtitle: "Legitimate tool" },
                  { id: "outcome", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker payout", subtitle: "Refund sent to wrong account" }
                ],
                edges: [
                  { from: "user", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. refund task", labelX: 255, labelY: 126 },
                  { from: "agent", to: "payload", fromSide: "right", toSide: "left", tone: "primary", label: "2. read case content", labelX: 660, labelY: 118 },
                  { from: "payload", to: "context", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. hidden instruction rewrites refund goal", labelX: 730, labelY: 278 },
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
                "A hidden instruction inside a supplier invoice PDF silently redirects a legitimate payment to the attacker.",
              href: "./interactive.html?scenario=asi01-email&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Finance lead", subtitle: "Approve supplier payment" },
                  { id: "agent", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Procurement assistant", subtitle: "Goal: pay supplier" },
                  { id: "payload", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "invoice.pdf", subtitle: "Hidden payment instruction" },
                  { id: "context", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Payment destination changed" },
                  { id: "tool", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "issuePayment()", subtitle: "Legitimate payment tool" },
                  { id: "outcome", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker account", subtitle: "Approved payment sent wrong" }
                ],
                edges: [
                  { from: "user", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. payment task", labelX: 255, labelY: 126 },
                  { from: "agent", to: "payload", fromSide: "right", toSide: "left", tone: "primary", label: "2. read invoice PDF", labelX: 660, labelY: 118 },
                  { from: "payload", to: "context", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. hidden instruction rewrites payee goal", labelX: 720, labelY: 278 },
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
                "A public competitor page quietly turns a research task into an exfiltration workflow while still producing a normal summary.",
              href: "./interactive.html?scenario=asi01-web-operator&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "Financial analyst", subtitle: "Research competitor pricing" },
                  { id: "operator", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Research assistant", subtitle: "Goal: summarize market data" },
                  { id: "page", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "competitor-page.html", subtitle: "Hidden exfiltration instruction" },
                  { id: "goal", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Research becomes exfiltration" },
                  { id: "portal", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "postResearch()", subtitle: "Legitimate outbound connector" },
                  { id: "leak", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker endpoint", subtitle: "Internal queries leave scope" }
                ],
                edges: [
                  { from: "user", to: "operator", fromSide: "right", toSide: "left", tone: "primary", label: "1. research task", labelX: 255, labelY: 126 },
                  { from: "operator", to: "page", fromSide: "right", toSide: "left", tone: "primary", label: "2. retrieve competitor page", labelX: 650, labelY: 118 },
                  { from: "page", to: "goal", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. hidden instruction rewrites research goal", labelX: 718, labelY: 278 },
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
        {
          id: "asi01-calendar-drift",
          title: "Customer profile poisons CRM outreach workflow",
          type: "Scenario 4",
          status: "built",
          description:
            "A customer-edited CRM profile contains hidden instructions that cause a customer success assistant to export internal customer data.",
          href: "./scenario.html?asi=ASI01&scenario=asi01-calendar-drift",
          businessContext:
            "A customer success assistant reads CRM profiles and drafts personalized outreach based on account data.",
          whyItRelates:
            "This is one of the most realistic enterprise cases because the poisoned content lives inside a trusted internal system.",
          attackSummary:
            "The agent reads a malicious customer profile from the CRM, absorbs attacker instructions from a notes field, and uses legitimate data tools to export the full customer list.",
          defenseSummary:
            "Treat all user-supplied CRM fields as untrusted, sanitize records before reasoning, and block external sends or broad exports without approval.",
          lessons: [
            "Trusted systems can still deliver untrusted content.",
            "User-editable fields inside internal apps are prime injection points.",
            "The riskiest move is when a narrow outreach task turns into broad data extraction."
          ],
          controls: [
            {
              name: "Validate intent",
              detail: "Before any export or external send, compare the planned action against the original outreach task and allowed customer scope."
            },
            {
              name: "Least privilege",
              detail: "Limit customer success agents so they can access only the current account context and cannot export broad customer datasets."
            },
            {
              name: "Observe drift",
              detail: "Alert when outreach workflows trigger database-wide reads, external sends, or record access patterns that do not match the normal task."
            }
          ],
          views: {
            attack: {
              title: "Attack View",
              caption:
                "A poisoned CRM profile quietly turns personalized outreach into a broad customer-list exfiltration workflow.",
              href: "./interactive.html?scenario=asi01-calendar-drift&view=attack",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "user", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "CS manager", subtitle: "Draft outreach email" },
                  { id: "agent", x: 300, y: 92, w: 220, h: 112, tone: "primary", title: "Customer success assistant", subtitle: "Goal: email one customer" },
                  { id: "payload", x: 860, y: 88, w: 220, h: 150, tone: "danger", title: "crm-profile.notes", subtitle: "Hidden data-theft instruction" },
                  { id: "context", x: 300, y: 320, w: 220, h: 116, tone: "danger", title: "Context window", subtitle: "Outreach becomes data export" },
                  { id: "tool", x: 600, y: 320, w: 210, h: 116, tone: "neutral", title: "exportCustomers()", subtitle: "Legitimate CRM data tool" },
                  { id: "outcome", x: 900, y: 320, w: 220, h: 116, tone: "danger", title: "Attacker inbox", subtitle: "Customer list is exfiltrated" }
                ],
                edges: [
                  { from: "user", to: "agent", fromSide: "right", toSide: "left", tone: "primary", label: "1. outreach task", labelX: 255, labelY: 126 },
                  { from: "agent", to: "payload", fromSide: "right", toSide: "left", tone: "primary", label: "2. read CRM profile", labelX: 665, labelY: 118 },
                  { from: "payload", to: "context", fromSide: "left", toSide: "right", tone: "danger", mode: "elbow", label: "3. hidden instruction rewrites outreach goal", labelX: 718, labelY: 278 },
                  { from: "context", to: "tool", fromSide: "right", toSide: "left", tone: "danger", label: "4. corrupted data request reaches tool", labelX: 550, labelY: 354 },
                  { from: "tool", to: "outcome", fromSide: "right", toSide: "left", tone: "danger", label: "5. full customer list exposed", labelX: 860, labelY: 354 }
                ]
              }
            },
            defense: {
              title: "Defense View",
              caption:
                "CRM fields stay untrusted, exports stay blocked, and the assistant remains focused on a single-account outreach task.",
              href: "./interactive.html?scenario=asi01-calendar-drift&view=defense",
              diagram: {
                width: 1200,
                height: 620,
                nodes: [
                  { id: "record", x: 40, y: 100, w: 180, h: 96, tone: "neutral", title: "CRM profile", subtitle: "User-editable record fields" },
                  { id: "guard", x: 290, y: 92, w: 220, h: 120, tone: "safe", title: "Record guardrail", subtitle: "Sanitize notes + classify user text" },
                  { id: "agent", x: 590, y: 92, w: 220, h: 112, tone: "primary", title: "Customer success assistant", subtitle: "Original outreach goal preserved" },
                  { id: "policy", x: 290, y: 330, w: 220, h: 120, tone: "safe", title: "Scope check", subtitle: "One-account outreach only" },
                  { id: "tool", x: 590, y: 330, w: 220, h: 120, tone: "neutral", title: "Scoped CRM tools", subtitle: "No broad export or external send" },
                  { id: "ops", x: 890, y: 210, w: 220, h: 120, tone: "safe", title: "Observability", subtitle: "Detect unusual dataset access" }
                ],
                edges: [
                  { from: "record", to: "guard", fromSide: "right", toSide: "left", tone: "safe", label: "1. sanitize CRM record before reasoning", labelX: 242, labelY: 126 },
                  { from: "guard", to: "agent", fromSide: "right", toSide: "left", tone: "safe", label: "2. only safe account data reaches planning", labelX: 548, labelY: 126 },
                  { from: "agent", to: "policy", fromSide: "bottom", toSide: "top", tone: "primary", mode: "elbow", label: "3. outreach action checked against account scope", labelX: 544, labelY: 260 },
                  { from: "policy", to: "tool", fromSide: "right", toSide: "left", tone: "safe", label: "4. block export and unapproved external sends", labelX: 550, labelY: 364 },
                  { from: "policy", to: "ops", fromSide: "right", toSide: "left", tone: "safe", mode: "elbow", label: "5. unusual record-access patterns are logged", labelX: 845, labelY: 188 }
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
      href: "#",
      summary:
        "Legitimate tools are invoked in unsafe ways because of prompt injection, misalignment, unsafe delegation, or ambiguous instructions."
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
