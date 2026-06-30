# ASI03 Shared Defense Scenario — Task-Scoped Identity Architecture

## PREVIEW

ASI03 looks routine until you ask a harder question:

who is really acting right now?

The business request may be legitimate.
The dangerous drift happens in identity, delegation, and inherited authority.

We'll use the poisoned delegation chain as the main frame.

This walkthrough teaches three core ideas:

task-scoped identity,
trust boundary,
and privilege drift.

Then it shows how the architecture proves that the acting identity is the right identity, with the right scope, for this task only.

---

## STEP 1

SHOW: User + Agent planner

At the User and Agent planner stage, the workflow begins with a normal enterprise request.

Review this deployment.

The request itself is not the risk.

The risk is how far authority is allowed to travel once that request moves through agents, sessions, and downstream systems.

---

## STEP 2

SHOW: issueTaskIdentity()

The `issueTaskIdentity()` stage introduces the most important control concept in ASI03: task-scoped identity.

Task-scoped identity means the system creates a short-lived credential for this workflow only.

It does not simply borrow a broad user token.
It does not let a parent agent's standing privilege flow by default.

That is the first difference between fragile delegation and governed delegation.

---

## STEP 3

SHOW: Trust boundary

The Trust boundary is where ASI03 becomes real.

Delegation.
Session reuse.
Peer-agent approval.
Cross-service trust.

This is the part of the architecture where identity claims can stretch away from the original request unless every hop is made explicit.

---

## STEP 4

SHOW: Threat variants covered

The Threat variants step frames the recurring failures this design is trying to stop:

- impersonated higher-trust authority
- cross-user or cross-session bleed
- downstream privilege drift

That is the right frame because ASI03 is less about one stolen token and more about authority moving farther than the task should allow.

---

## STEP 5

SHOW: Cryptographic identity verification

D1, Cryptographic identity verification, asks for proof at every trust hop.

Not just a familiar display name.
Not just an internal-looking role.
Not just a message that appears to come from the right place.

Signed identity proof is what tells the system who actually issued the action or approval.

Proof is identity.

In plain language, signatures and verified identity claims let the receiver check both origin and integrity:
who issued this, and has it been altered on the way?

That matters in ASI03 because the attack tries to borrow higher-trust authority without truly possessing it.

Without this layer, an approval-shaped message or inherited token can be mistaken for legitimate authority.

---

## STEP 6

SHOW: Minimum privilege enforcement

D2, Minimum privilege enforcement, answers the next question:

even if the identity is real, how much power should it carry?

Least privilege means each task, sub-agent, and peer interaction receives only the smallest authority required.

Research does not silently become inbox access.
Shared help does not quietly remain consultant-admin by default.

That is what stops a valid identity from becoming an overpowered identity.

Without this layer, the actor may be genuine, but the blast radius of that actor is still far too large for the task.

---

## STEP 7

SHOW: Privilege escalation detection & hold

D3 watches for the moment authority tries to grow.

New scope requests.
Unexpected token persistence.
Cross-user session reuse.
Mid-task authority expansion.

Those are treated as threat signals, and the workflow pauses before escalation becomes action.

This is the point where the architecture treats privilege growth itself as a security event.

Without it, scope expansion can look like ordinary workflow progress until the agent is already acting far beyond the original request.

---

## STEP 8

SHOW: Cross-agent trust validation

D4, Cross-agent trust validation, is how the receiver refuses to trust "approval-shaped" content on appearance alone.

Downstream agents verify who really issued an instruction, who signed it, and whether that provenance still matches policy.

Pipeline position is not proof.
Message format is not proof.
The chain must stay provable all the way through.

That specifically blocks the ASI03 pattern where one compromised or over-trusted hop tries to speak with someone else's authority.

Without this layer, downstream agents can become the amplifiers of a forged delegation chain.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

If the workflow genuinely needs more authority than the task started with, the D5 Human-in-the-Loop Gate makes that transition explicit.

A human reviews the escalation.

That is important here because the approval is protecting privilege, not just money movement or outbound actions.

The agent does not get to self-authorize its own scope growth.

Without that governance moment, the whole system is relying on the agent to be honest about when it deserves more power.

---

## STEP 10

SHOW: Approved identity outcome + D6 - Strong Observability

The Approved identity outcome shows the success condition:

the verified actor,
with the verified scope,
along the verified trust chain.

And D6 Strong Observability records the full lifecycle:

- identity issuance
- token checks
- delegation hops
- session reuse
- escalation attempts
- approvals

That gives the enterprise an authority path that stays explainable from start to finish.

---

## FINAL TAKEAWAY

The strongest defense against ASI03 is not simply "authenticate harder."

It is:

issue task-scoped identity,
prove provenance at every hop,
minimize privilege by default,
pause on escalation,
and never let downstream trust rest on assumption alone.
