# ASI01 Shared Defense Scenario — Protected Intent Architecture

## PREVIEW

Now let's look at ASI01 from the defender's side.

We'll use the customer refund workflow as the main frame.

The business still wants the agent to read outside content.

The defense question is simple:

How do we let the agent read untrusted material, without letting it redefine the mission?

---

## STEP 1

SHOW: User + Agent planner

The workflow begins with a legitimate business objective.

Refund the verified customer.

That protected request is the anchor for the whole defense.

---

## STEP 2

SHOW: readContent()

The agent still reads the email, PDF, or web page.

So this is not a "block all external input" design.

The retrieval tool is allowed to import information.

It is not allowed to import new authority.

---

## STEP 3

SHOW: External source

The content source is still untrusted.

It may contain real business data and hidden instructions at the same time.

So the system cannot rely on appearance.

It starts from one assumption:

this source may carry mixed intent.

---

## STEP 4

SHOW: Input screening

Input screening is the first control in the chain.

It means the system cleans, normalizes, and classifies content before reasoning depends on it.

If hidden instruction patterns are obvious, they are downgraded, flagged, or quarantined here.

That matters in ASI01 because the attack tries to smuggle a second mission inside ordinary business content.

Input screening does not decide the refund by itself.
It removes the most obvious instruction-shaped poison before the model starts reasoning from it.

Without this layer, hidden text can enter the workflow looking like normal context and start pulling the refund flow off course.

---

## STEP 5

SHOW: Intent Capsule

Intent Capsule is the core ASI01 defense.

It means the original task stays locked in a protected envelope.

Facts from the content can enter context.

The controlling objective does not.

So the agent can read a refund case without letting it redefine success.

This is the layer that directly defends against goal hijacking.

Without an Intent Capsule, the email or PDF is no longer just providing facts.
It can start rewriting who should be paid, what should happen next, or what the workflow now treats as success.

That is how the architecture separates data from authority.

---

## STEP 6

SHOW: Independent goal check

Now the system asks:

What action is the agent proposing next, and does it still match the original mission?

This check happens outside the model's own self-justification loop.

If the recipient changes, the payee changes, or the scope expands, the workflow halts.

The system is no longer asking whether the content looked suspicious.

It is asking, instead, whether the action drifted.

That makes this an independent proof step, not just one more model opinion.

Even if the model can explain away the change, this layer still catches a refund that quietly turned into a new payee, a new action, or a broader task.

---

## STEP 7

SHOW: Output policy guard

Output policy guard is the action boundary.

Even if earlier layers weaken, the output layer still enforces boundaries.

This is where the system blocks unauthorized transfers, unexpected recipients, new external posts, or scope expansion, before live execution.

The content may still be visible.

The action channel is still bounded.

That matters because ASI01 becomes dangerous only when poisoned intent finally reaches a real tool.

Without this layer, one missed drift signal upstream can still become a live payout or outbound action.

---

## STEP 8

SHOW: Human-in-the-Loop Gate

Human-in-the-Loop Gate means the model does not get the last word on high-risk actions.

New payees, new payout destinations, and new endpoints require explicit approval.

So hidden text cannot quietly become a live financial or communications action on its own.

This is the governance backstop for novel or high-impact outcomes.

Without it, the system may still look careful, but a sufficiently convincing poisoned flow could authorize a first-time action without any human challenge.

---

## STEP 9

SHOW: Approved outcome + D6 - Strong Observability

Now the workflow completes safely.

The refund goes to the right customer.

And D6, Strong Observability, means the system can trace the full chain:

- the retrieved content
- the screening result
- the protected objective
- the drift checks
- the policy decisions
- the approval event
- the final tool call

That is what a good ASI01 defense looks like:

the business workflow still works, but the mission stays intact.

---

## FINAL TAKEAWAY

The best defense against ASI01 is not, "never read untrusted content."

It is:

read it,
contain it,
separate it from authority,
verify the next action independently,
and execute only when the original mission is still intact.
