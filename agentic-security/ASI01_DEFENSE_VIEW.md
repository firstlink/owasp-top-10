# ASI01 Defense View

## Agent Goal Hijack
### OWASP Top 10 for Agentic Applications 2026

---

> All three ASI01 attack vectors introduced in this site, via **email**, **PDF**, or **web page**, should be explained to learners through one shared defense architecture.
> The core lesson is not "three different fixes for three different payloads."
> The core lesson is that **untrusted content must never be allowed to redefine protected agent intent**.

## Security Architect Verdict

This is the version I would want students, architects, and engineering leaders to learn from.
It teaches layered defense without overstating any single control, and it keeps the trust boundaries clear:

- External content is untrusted even when it looks routine or business-relevant.
- Goal protection is stronger than prompt wording; it is a state and policy problem.
- The agent should not be trusted to self-certify safety on its own.
- High-impact execution must be gated outside the model's own reasoning loop.
- Monitoring is a spanning control, not a footer afterthought.

---

## How the Defended System Works

> The diagram reads top to bottom.
> Each layer is a checkpoint.
> D1 reduces risk at ingestion.
> D2 preserves protected task state.
> D3 independently verifies that the proposed action still matches the original goal.
> D4 and D5 gate execution.
> D6 monitors the full chain.

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│               DEFENSE ZONE: ASI01 AGENT GOAL HIJACK                                │
│               Shared architecture for email, PDF, and web injection                │
└─────────────────────────────────────────────────────────────────────────────────────┘

REQUEST / CONTENT FLOW
─────────────────────────────────────────────────────────────────────────────────────

  User / system        ──①──►   Agent task request     ──②──►   readContent()
  "Process this case"           Original business goal           Email / PDF / web fetch
                                                                  │
                                                                  │ ③ Retrieve untrusted content
                                                                  ▼
                                                        ┌─────────────────────────────┐
                                                        │ External content source     │
                                                        │ May contain hidden or       │
                                                        │ deceptive instructions      │
                                                        └──────────────┬──────────────┘
                                                                       │
                                                                       ▼
                                            ╔═════════════════════════════════════════╗
                                            ║ [D1] INPUT SCREENING & NORMALIZATION    ║
                                            ║                                         ║
                                            ║ Purpose: reduce ingestion risk, not     ║
                                            ║ "guarantee clean content."              ║
                                            ║                                         ║
                                            ║ - Normalize markup, encoding, metadata  ║
                                            ║ - Strip obvious hidden content          ║
                                            ║ - Classify suspicious instruction-like  ║
                                            ║   text inside untrusted data            ║
                                            ║ - Quarantine or downgrade risky input   ║
                                            ╚═══════════════════╤═════════════════════╝
                                                                │
                                                    ④ Safe-to-process content only
                                                                │
                                                                ▼
                                            ╔═════════════════════════════════════════╗
                                            ║ [D2] PROTECTED TASK STATE               ║
                                            ║    + INSTRUCTION / DATA SEPARATION      ║
                                            ║                                         ║
                                            ║ Original objective is bound outside     ║
                                            ║ untrusted content.                      ║
                                            ║                                         ║
                                            ║ External content is treated as DATA,    ║
                                            ║ never as authority to redefine intent.  ║
                                            ║                                         ║
                                            ║ If D1 misses something, task state      ║
                                            ║ still resists goal overwrite.           ║
                                            ╚═══════════════════╤═════════════════════╝
                                                                │
                                                                ▼
                                                      ┌──────────────────────┐
                                                      │ Protected context     │
                                                      │ Goal remains bound    │
                                                      │ to original request   │
                                                      └──────────┬───────────┘
                                                                 │
                                                                 │ ⑤ Propose next action
                                                                 ▼
                                            ╔═════════════════════════════════════════╗
                                            ║ [D3] INDEPENDENT GOAL / POLICY CHECK    ║
                                            ║                                         ║
                                            ║ A verifier outside the model's own      ║
                                            ║ reasoning loop checks:                  ║
                                            ║                                         ║
                                            ║ - Does this action still match the      ║
                                            ║   original business objective?          ║
                                            ║ - Did destination, payee, recipient,    ║
                                            ║   or workflow scope drift?              ║
                                            ║                                         ║
                                            ║ Drift detected -> halt and escalate     ║
                                            ╚═══════════════════╤═════════════════════╝
                                                                │
                                                                │ ⑥ Candidate action passes
                                                                ▼
                                            ╔═════════════════════════════════════════╗
                                            ║ [D4] OUTPUT POLICY & EGRESS GUARD       ║
                                            ║                                         ║
                                            ║ Validate the proposed action against    ║
                                            ║ tool scope, recipient scope, data       ║
                                            ║ handling rules, and outbound policy.    ║
                                            ║                                         ║
                                            ║ Blocks:                                 ║
                                            ║ - Unauthorized transfer                 ║
                                            ║ - Unexpected external post              ║
                                            ║ - Out-of-role tool use                  ║
                                            ║ - Scope expansion beyond task boundary  ║
                                            ╚═══════════════════╤═════════════════════╝
                                                                │
                                                                │ ⑦ High-impact action?
                                                                ▼
                                            ╔═════════════════════════════════════════╗
                                            ║ [D5] HUMAN AUTHORIZATION GATE           ║
                                            ║                                         ║
                                            ║ Sensitive actions require explicit      ║
                                            ║ human approval before execution.        ║
                                            ║                                         ║
                                            ║ Examples:                               ║
                                            ║ - Refund or payment destination change  ║
                                            ║ - External data transmission            ║
                                            ║ - New recipient, payee, or endpoint     ║
                                            ╚═══════════════════╤═════════════════════╝
                                                                │
                                                                │ ⑧ Execute approved action
                                                                ▼

  Approved business outcome  ◄──────────  issueAction() through scoped tool path
  ✓ Refund to verified customer
  ✓ Payment to approved supplier
  ✓ Summary delivered only to authorized analyst

─────────────────────────────────────────────────────────────────────────────────────
║ [D6] AUDIT TRAIL, TELEMETRY, AND ANOMALY DETECTION                                ║
║ Spans the entire flow, not a final-stage add-on.                                  ║
║ Log ingestion events, task-state changes, proposed actions, policy decisions,     ║
║ human approvals, tool calls, and unusual drift patterns in real time.             ║
─────────────────────────────────────────────────────────────────────────────────────
```

---

## Defense Checkpoints

| # | Defense | Where It Applies | What It Really Does |
|---|---|---|---|
| **D1** | Input Screening & Normalization | Before content enters reasoning | Reduces risk by normalizing, classifying, stripping obvious hidden content, and quarantining suspicious input. It does not guarantee perfect cleansing. |
| **D2** | Protected Task State + Instruction/Data Separation | Between ingestion and reasoning | Preserves the original goal outside untrusted content and prevents retrieved text from becoming authority. |
| **D3** | Independent Goal / Policy Check | Between planning and execution | Verifies that the proposed action still matches the original objective, recipient, and scope. |
| **D4** | Output Policy & Egress Guard | Immediately before tool execution | Enforces destination, scope, and data-transfer policy before any external action occurs. |
| **D5** | Human Authorization Gate | High-risk paths only | Requires explicit approval for sensitive or materially irreversible actions. |
| **D6** | Audit Trail, Telemetry, and Monitoring | Across the whole lifecycle | Makes drift, repeated anomalies, policy failures, and suspicious tool usage visible. |

---

## Why This One Defense View Covers All Three ASI01 Attacks

| Scenario | Untrusted input channel | What changes in the attack | Why the same defense architecture still works |
|---|---|---|---|
| **Scenario 1** - Email injection | Crafted inbox message | Hidden text tries to redirect a refund or payout destination | D1 screens the message, D2 keeps the original case goal protected, and D3/D4 prevent payout drift from becoming execution. |
| **Scenario 2** - PDF invoice injection | Supplier-facing document | Hidden document content tries to alter payee details or workflow intent | D1 treats the PDF as untrusted content, D2 keeps the business objective bound, and D3 verifies the proposed payee against approved intent. |
| **Scenario 3** - Web page injection | Retrieved public page | Hidden page content tries to turn research into exfiltration or unauthorized outbound action | D1 sanitizes fetched content, D2 stops the page from rewriting the mission, and D4 blocks unapproved egress even if upstream controls degrade. |

---

## Strategic Teaching Guidance

If this is presented in a course or on the site, the strategic message should be:

1. ASI01 is not "just prompt injection."
It is goal hijack through any untrusted language-bearing channel.

2. The critical security failure is architectural.
The system lets untrusted content compete with protected intent.

3. No single model-layer control is enough.
You need ingestion controls, protected state, independent verification, execution policy, human gating, and observability.

4. The strongest control is not "better prompting."
It is preserving trust boundaries between content, intent, policy, and action.

---

## Example Implementation Options

These are examples, not mandatory product endorsements.

| Defense | Example implementation options |
|---|---|
| D1 | Prompt injection classifiers, document sanitizers, HTML/DOM reduction, metadata stripping, allowlist-based parsers |
| D2 | Orchestrator-held task state, structured intent binding, instruction/data separation, policy-tagged context assembly |
| D3 | Independent policy engine, workflow verifier, goal-state comparator, destination or recipient validation layer |
| D4 | Output validators, egress controls, tool-scoping middleware, recipient and endpoint allowlists |
| D5 | Human-in-the-loop approval step, dual control for funds movement, step-up authorization for scope changes |
| D6 | Langfuse, Arize Phoenix, SIEM integration, audit logging, anomaly detection on action drift |

---

## Final Architect Notes

- Do not teach D1 as magical payload removal.
- Do not teach D2 as "the system prompt solves it."
- Do not teach D3 as mere self-reflection by the same model.
- Do not place D6 outside the flow conceptually.
- Do teach that the trust boundary is the real lesson of ASI01.

---

*OWASP Top 10 for Agentic Applications - ASI01:2026*  
*Training focus: defend protected agent intent against untrusted content*
