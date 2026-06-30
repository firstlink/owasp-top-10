# ASI06 Shared Defense Scenario — Governed Memory Architecture

## PREVIEW

ASI06 is dangerous because the attack does not need to win today.

It only needs to plant something that the system will keep trusting tomorrow.

We'll use the travel pricing ghost as the main frame.

This walkthrough follows how persistent memory is kept useful without letting it quietly become the loudest voice in the room over time.

---

## STEP 1

SHOW: User + Agent planner

At the User and Agent planner stage, the workflow begins with a normal task that benefits from continuity.

The business wants the agent to remember useful state across sessions.

So the memory layer is helpful by design.

The defense challenge is stopping that usefulness from becoming a quiet corruption channel.

---

## STEP 2

SHOW: readOrWriteMemory()

The `readOrWriteMemory()` stage is where ASI06 becomes architectural.

The agent either retrieves stored knowledge or proposes a persistent update.

The system is no longer deciding only what seems true right now.
It is deciding what future workflows may treat as trusted memory.

---

## STEP 3

SHOW: Memory store

The memory store marks the real trust boundary.

Vector records.
Belief entries.
Vendor memory.

These can outlive the original session and quietly steer later business decisions long after the first attack moment is gone.

---

## STEP 4

SHOW: Threat variants covered

The Threat variants step narrows the long-lived poisoning patterns:

- retrieval poisoning
- gradual belief drift
- document-borne memory plants

The system is defending against durable influence, not just one bad prompt.

---

## STEP 5

SHOW: Provenance & integrity

D1 introduces two key ideas: provenance and integrity.

Provenance asks where a memory entry came from.
Integrity asks whether it changed after it was stored.

Every entry carries source metadata and integrity evidence.

Low-trust, mismatched, or tampered records are downgraded or quarantined before they shape high-stakes decisions.

Similarity is not provenance.

That matters in ASI06 because poisoned memory often looks useful, familiar, and highly relevant.

Without provenance and integrity, the system cannot tell the difference between trusted experience and planted influence.

---

## STEP 6

SHOW: Cross-reference validation

D2 checks high-stakes memory against a live authority.

For important actions, memory alone is not enough.

A fare is checked against a live source.
A fraud pattern is checked against current authority.
A trust decision is checked against present approval state.

That is how the architecture stops stale or poisoned memory from becoming enterprise truth just because it was retrieved confidently.

This layer protects decisions from being governed by memory alone.

Without it, a confident retrieval can overrule the current source of truth long after the original poisoning moment has been forgotten.

---

## STEP 7

SHOW: Governed memory writes

D3 applies execution-grade governance to persistence.

Persistent memory updates are treated as privileged changes.

This is the same governance instinct we used in earlier categories, but now it protects memory instead of tools or code.

A document cannot simply announce a new vendor state.
A repeated chat claim cannot quietly become policy.

This is the control that protects the write path, not just the read path.

Without governed writes, the system slowly teaches itself the attack and then keeps replaying it later.

---

## STEP 8

SHOW: Drift detection & versioning

D4 watches for corruption that builds slowly.

One weak memory entry may not look dramatic.
Repeated reinforcement can still distort ranking, trust, and future decisions over time.

So the architecture looks for:

- sudden trust jumps
- outlier dominance
- conflicting entries
- reinforcement drift

And it keeps versioned rollback ready.

That matters because ASI06 is often cumulative.
One weak memory entry may do little, but repeated reinforcement can reshape ranking and trust over time.

Without drift detection and versioning, slow poisoning can become the new normal with no clean way back.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 keeps high-impact trust changes behind review.

Trust tiers.
Safe patterns.
Vendor status.
Approval rules.

Those still need explicit review before they become authoritative memory.

Without this governance point, the most sensitive memory classes can be rewritten by workflow momentum instead of deliberate approval.

---

## STEP 10

SHOW: Approved memory outcome + D6 - Strong Observability

The Approved memory outcome shows what governed memory looks like in practice.

Only verified, cross-checked, governed memory shapes future action.

And D6 Strong Observability traces:

- what was read
- what source it claimed
- what was cross-checked
- what was proposed for write
- what drift was detected
- what approval was granted

That is the real value of a strong ASI06 defense:
a trustworthy memory lifecycle.

---

## FINAL TAKEAWAY

The core defense against ASI06 is not "never store memory."

It is:

prove provenance,
cross-check important memory live,
govern the write path,
monitor long-term drift,
and keep rollback ready when persistence starts drifting away from truth.
