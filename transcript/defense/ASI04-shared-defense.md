# ASI04 Shared Defense Scenario — Verified Supply Chain Architecture

## PREVIEW

ASI04 is the category where the agent can stay obedient, and still become unsafe.

The reason is simple:

the thing shaping execution is no longer just the prompt, or the user request.
It is the runtime supply chain.

We'll use the phantom payment processor as the anchor scenario.

In an agent system, supply chain means the runtime components the agent is prepared to trust:

- MCPs
- templates
- schemas
- discovery results
- and other live dependencies

The defense question is:

how does the system make sure the discovered component is really the approved one?

---

## STEP 1

SHOW: User + Agent planner

The visible business task is still normal.

Route a payment.

So this defense is not anti-discovery.
It is anti-blind trust in what discovery returns.

---

## STEP 2

SHOW: discoverOrFetch()

This is the moment where ASI04 becomes possible.

In this scenario, the agent discovers a payment service it is willing to use.

The workflow still feels normal.

But one runtime component can now start reshaping execution.

That is why discovery itself becomes a security boundary.

---

## STEP 3

SHOW: Supply chain

The threat moves upstream into the supply chain.

Not into the user prompt.
Not into the final API call.
Into the set of dependencies the agent is willing to trust.

Once the wrong dependency is accepted, downstream behavior can still look perfectly clean.

---

## STEP 4

SHOW: Threat variants covered

Runtime trust can break in more than one way.

For this walkthrough, stay with the concrete case in front of us:

a lookalike payment component is trying to get trusted as if it were the real one.

---

## STEP 5

SHOW: AI-SBOM & allowlist pinning

D1 begins with an important concept:
AI-SBOM.

An AI-SBOM is the inventory of approved AI-facing components the system is allowed to use.

Combined with allowlist pinning, it answers the first question:

is this component even allowed to participate?

Unknown registries and floating source paths do not get the benefit of the doubt.

In this payment workflow, the agent does not trust a newly discovered processor just because it looks valid.

This layer protects the admission step into the supply chain.

If admission control is missing, a lookalike processor can enter the workflow very easily.

It only has to be discoverable.
And it only has to look legitimate.

---

## STEP 6

SHOW: Cryptographic integrity verification

D2 asks a different question from D1.

Even if the component is supposed to exist, is this exact copy still trustworthy?

That is what hashes and signatures prove.

A hash lets the system detect whether the component changed.
A signature helps prove who approved or produced it, and that it was not altered afterward.

The name may be correct.
The path may be correct.
Integrity is what proves the content itself still matches what the organization approved.

That matters here, because the attack does not need to invent a fake category.
It only needs to swap, or tamper with, one trusted-looking dependency.

Miss D2, and the agent may fetch the right-looking processor, and still execute against the wrong code.

---

## STEP 7

SHOW: Schema & baseline validation

D3, Schema & baseline validation, deals with the runtime contract.

A compromised dependency does not always announce itself dramatically.

Sometimes it adds one field, one hidden instruction, or one output shape change.

So D3 compares live definitions against approved baselines, and halts when drift appears.

That is how subtle compromise becomes visible.

This protects against the quiet version of ASI04.

Here, execution changes through interface drift, not obvious malware.

If baseline validation is missing, small definition changes can slowly rewrite the rules.

The agent may start believing the component is allowed to do more than it should.

---

## STEP 8

SHOW: Output & egress monitoring

D4 watches the component's live behavior, not just its source.

Egress monitoring means checking what leaves the system:

outbound calls,
returned data shape,
unexpected writes,
unexpected destinations.

A bad dependency can still return a normal-looking success response.
That is why success, by itself, is not proof.

This stage catches components that passed admission, but misbehave at runtime.

If behavior is not monitored, bad runtime behavior can hide behind successful business results.

That includes silent skimming.
It includes covert writes.
And it includes outbound calls that break policy.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 is where runtime change becomes a governed decision.

If the payment component is new, updated, or structurally changed, it does not silently join the trusted path.

Someone reviews it.
Someone approves it.
Someone becomes accountable for introducing that change.

That matters, because runtime trust is a business decision, not just a technical convenience.

Take this control away, and supply-chain drift can start to look normal.

Instead of a governed event, it becomes background change.

---

## STEP 10

SHOW: Strong Observability

D6 keeps the supply chain visible over time.

It tracks:

- what was fetched
- what hash was checked
- what schema changed
- what outbound behavior occurred
- what approvals were granted

That is how the architecture catches slow drift over time.

It also catches covert writes.
And it catches silent skimming that one review might miss.

D6 does not stop the attack by itself.
It makes the whole control chain auditable.

That way, repeated compromise attempts show up as a pattern, not as isolated surprises.

---

## STEP 11

SHOW: Approved component outcome

The Approved component outcome is the business result of all those controls.

The workflow completes only with dependencies that are:

- approved
- pinned
- integrity-checked
- baseline-validated
- behaviorally observed

The business still gets runtime flexibility.
But the supply chain is no longer a blind spot.
