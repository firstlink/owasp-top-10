# ASI03 Shared Defense Scenario — Task-Scoped Identity Architecture

## PREVIEW

ASI03 becomes dangerous the moment we stop asking who is really acting.

The business request may be legitimate.
The drift happens in identity, delegation, and inherited authority.

We'll use the poisoned delegation chain as the main frame.

Three ideas matter here:

task-scoped identity,
trust boundary,
and privilege drift.

The defense question is:

how does the system prove that the right identity is acting, with only the access this task should have?

---

## STEP 1

SHOW: User + Agent planner

The workflow begins with a normal enterprise request.

Review this deployment.

The request itself is not the danger.

The danger comes later.

It appears when authority starts traveling through agents, sessions, and downstream systems.

---

## STEP 2

SHOW: issueTaskIdentity()

Here we meet the most important control concept in ASI03:
task-scoped identity.

Task-scoped identity means the system creates a short-lived credential for this workflow only.

It does not simply borrow a broad user token.
It does not let a parent agent's standing privilege flow by default.

That is the first difference between fragile delegation and governed delegation.

---

## STEP 3

SHOW: Trust boundary

This trust boundary is where ASI03 becomes real.

Delegation.
Session reuse.
Peer-agent approval.
Cross-service trust.

This is where identity claims can drift away from the original request.

That happens when each hop is not made explicit.

---

## STEP 4

SHOW: Threat variants covered

The failure usually appears in three forms:

- impersonated higher-trust authority
- cross-user or cross-session bleed
- downstream privilege drift

That is the right frame.

ASI03 is not only about one stolen token.
It is about authority traveling farther than the task should allow.

---

## STEP 5

SHOW: Cryptographic identity verification

D1, Cryptographic identity verification, asks for proof at every trust hop.

Not just a familiar display name.
Not just an internal-looking role.
Not just a message that appears to come from the right place.

Signed identity proof is what tells the system who actually issued the action or approval.

In plain terms, signatures and verified identity claims let the receiver check both origin and integrity:
who issued this, and has it been altered on the way?

That matters in ASI03, because the attack tries to borrow higher-trust authority without truly possessing it.

If that proof is missing, an approval-shaped message can be mistaken for real authority.

An inherited token can be mistaken for real authority too.

---

## STEP 6

SHOW: Minimum privilege enforcement

D2, Minimum privilege enforcement, answers the next question:

even if the identity is real, how much power should it carry?

Least privilege means each task gets only the access it truly needs.

The same rule applies to sub-agents.
And it applies to peer interactions.

Research does not silently become inbox access.
Shared help does not quietly remain consultant-admin by default.

That is what stops a valid identity from becoming an overpowered identity.

If this control is weak, the actor may be genuine, but the blast radius is still far too large for the task.

---

## STEP 7

SHOW: Privilege escalation detection & hold

D3 watches for the moment authority tries to grow.

New scope requests.
Unexpected token persistence.
Cross-user session reuse.
Mid-task authority expansion.

Those are treated as threat signals, and the workflow pauses before escalation becomes action.

This is where the system starts treating privilege growth itself as a security event.

Otherwise, scope expansion can look like normal workflow progress.

By the time it is obvious, the agent may already be acting far beyond the original request.

---

## STEP 8

SHOW: Cross-agent trust validation

D4, Cross-agent trust validation, stops the receiver from trusting something just because it looks approved.

Downstream agents check three things.

Who really issued the instruction.
Who signed it.
And whether that provenance still matches policy.

Pipeline position is not proof.
Message format is not proof.
The whole chain must stay verifiable from end to end.

That blocks a classic ASI03 pattern.

One compromised, or over-trusted, hop tries to speak with someone else's authority.

If that check is missing, downstream agents can become amplifiers for a forged delegation chain.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

If the workflow truly needs more authority than it started with, the D5 Human-in-the-Loop Gate makes that change explicit.

A human reviews the escalation.

That matters here, because the approval is protecting privilege, not just money movement or outbound actions.

The agent does not get to self-authorize its own scope growth.

Take away that governance moment, and the whole system is relying on the agent to police itself.

That is not a safe design.

---

## STEP 10

SHOW: Approved identity outcome + D6 - Strong Observability

The Approved identity outcome shows the success condition:

the verified actor,
with the verified scope,
along the verified trust chain.

And D6, Strong Observability, records the full lifecycle:

- identity issuance
- token checks
- delegation hops
- session reuse
- escalation attempts
- approvals

That gives the enterprise an authority path that stays explainable from start to finish.

---

## FINAL TAKEAWAY

The strongest defense against ASI03 is not simply, "authenticate harder."

It is:

issue task-scoped identity,
prove provenance at every hop,
minimize privilege by default,
pause on escalation,
and never let downstream trust rest on assumption alone.
