
# ASI Attack Scenario — Storytelling Template (Enterprise Grade)

---

## (0) Incident Outcome — Hook (START HERE)

“Let me start with what happened in production.”

[Describe final impact in 1–2 lines]
- Wrong action executed (refund, email, deletion, etc.)
- No system error
- No alerts triggered

“This is the kind of failure that looks normal in logs, but is wrong in business outcome.”

---

## (1) System Context — What This Agent Does

“Now let’s reconstruct the system.”

“This is an enterprise AI agent used for [business function: refund processing / support / coding / etc.].”

“It is responsible for:
- understanding user requests
- retrieving relevant data
- calling enterprise tools
- executing business actions”

---

## (2) Normal Flow — What Should Have Happened

“In a normal scenario, the workflow is simple.”

“The agent receives a request, understands intent, retrieves correct data, and executes the correct action.”

“The goal of the system is well defined and aligned with business rules.”

---

## (3) Data Entry Point — Where External Content Enters

“Now the agent begins execution.”

“It retrieves data from external sources such as:
- emails
- tickets
- documents
- CRM notes
- system logs”

“This is where external content enters the agent system.”

---

## (4) Attack Payload — Malicious Input (MOST IMPORTANT)

“Inside this external content, there is a hidden malicious instruction.”

[READ ACTUAL PAYLOAD SLOWLY]

“This content is not part of the real business request — it is injected by an attacker.”

👉 PAUSE HERE:
“Read that again. This is all it takes to influence the system.”

---

## (5) Core Failure — Trust Boundary Break

“This is where the system fails.”

“The agent does not properly separate:
trusted system instructions vs untrusted external content.”

“So it treats attacker content as valid reasoning input.”

“This is a trust boundary failure.”

---

## (6) OWASP Event — Attack Type

“This maps to OWASP ASI-[XX].”

“It represents a case where external content manipulates agent behavior or goal.”

---

## (7) Execution — Tool Call Happens

“The agent continues execution normally.”

“It calls a legitimate enterprise tool:
- refund API
- email system
- database update
- workflow engine”

“But the parameters are now influenced by the injected instruction.”

---

## (8) Business Impact — What Actually Happens

“From the system perspective, everything looks valid.”

“No errors. No crashes. No alerts.”

“But the business outcome is incorrect:
- wrong recipient
- wrong action
- wrong decision”

---

## (9) Root Cause — Final Explanation

“This is not a system breach.”

“The system was not hacked.”

“The failure happened because external untrusted content influenced internal decision-making.”

“This is the core security problem in agentic systems.”

---

## (10) Final Summary — One-line Learning

“To summarize:

A normal workflow was running.
An attacker injected hidden instructions.
The agent trusted them.
The goal changed.
And the wrong action was executed without any system failure.”

---

## (END) Key Lesson

“The real risk in AI agents is not incorrect responses — it is incorrect actions caused by untrusted context influencing execution.”