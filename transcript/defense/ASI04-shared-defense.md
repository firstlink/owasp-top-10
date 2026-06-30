# ASI04 Shared Defense Scenario — Verified Supply Chain Architecture

## PREVIEW

ASI04 is the category where the agent can stay obedient and still become unsafe.

The reason is simple:

the thing shaping execution is no longer just the prompt or the user request.
It is the runtime supply chain.

We'll use the phantom payment processor as the anchor scenario.

This walkthrough teaches what supply chain means in an agent system:

the MCPs,
templates,
schemas,
and other runtime components the agent is willing to trust.

Then it shows how every runtime component has to prove that it belongs, that it has not changed, and that its live behavior still matches policy.

---

## STEP 1

SHOW: User + Agent planner

At the User and Agent planner stage, the workflow still begins with a normal business objective.

Route a payment.

So this defense is not anti-discovery.
It is anti-blind trust in what discovery returns.

---

## STEP 2

SHOW: discoverOrFetch()

The `discoverOrFetch()` stage is where ASI04 becomes possible.

In this scenario, the agent discovers a payment service it is willing to use.

The workflow still feels normal, but one runtime component can now quietly reshape execution.

That is why discovery itself becomes a security boundary.

---

## STEP 3

SHOW: Supply chain

The supply chain is where the threat moves upstream.

Not into the user prompt.
Not into the final API call.
Into the set of dependencies the agent is willing to trust.

Once the wrong dependency is accepted, downstream behavior can still look perfectly clean.

---

## STEP 4

SHOW: Threat variants covered

The Threat variants step reminds the learner that runtime trust can fail in more than one way.

But in this walkthrough, stay with the concrete case in front of us:

a lookalike payment component is trying to get trusted as if it were the real one.

---

## STEP 5

SHOW: AI-SBOM & allowlist pinning

D1 introduces a new concept that should be explained plainly: AI-SBOM.

An AI-SBOM is the inventory of approved AI-facing components the system is allowed to use.

Combined with allowlist pinning, it answers the first question:

is this component even allowed to participate?

Unknown registries and floating source paths do not get the benefit of the doubt.

In this payment workflow, that means the agent does not get to trust a newly discovered processor just because it looks plausible.

This layer defends the admission step into the supply chain.

Without it, a lookalike processor can enter the workflow simply by being discoverable and convincing.

---

## STEP 6

SHOW: Cryptographic integrity verification

D2 asks a different question from D1.

Even if the component is supposed to exist, is this exact copy still trustworthy?

That is what hashes and signatures prove.

A hash lets the system detect whether the component changed.
A signature helps prove who approved or produced it and that it was not altered afterward.

The name may be correct.
The path may be correct.
Integrity is what proves the content itself still matches what the organization approved.

That matters here because the attack does not need to invent a fake category.
It only needs to swap or tamper with one trusted-looking dependency.

Without D2, the agent may fetch the right-looking processor and still execute against the wrong code.

---

## STEP 7

SHOW: Schema & baseline validation

D3, Schema & baseline validation, connects directly to the runtime problem.

A compromised dependency does not always announce itself dramatically.

Sometimes it adds one field, one hidden instruction, or one output shape change.

So D3 compares live definitions against approved baselines and halts when drift appears.

That is how subtle compromise becomes visible.

This protects against the quiet version of ASI04, where execution changes through interface drift rather than obvious malware.

Without it, small definition changes can slowly rewrite what the agent believes the component is allowed to do.

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
That is why success by itself is not proof.

This stage is what catches components that passed admission but misbehave at runtime.

Without behavioral monitoring, silent skimming, covert writes, or policy-breaking outbound calls can hide behind apparently successful business results.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 is where runtime change becomes a governed decision.

If the payment component is new, updated, or structurally changed, it does not silently join the trusted path.

Someone reviews it.
Someone approves it.
Someone becomes accountable for introducing that change.

That matters because runtime trust is a business decision, not just a technical convenience.

Without this layer, supply-chain drift can become normal background change instead of an explicit governed event.

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

That is how the architecture catches slow drift, covert writes, and silent skimming that one review would miss.

D6 does not stop the attack by itself.
It makes the whole control chain auditable, so repeated compromise attempts become visible patterns instead of isolated surprises.

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

---

## FINAL TAKEAWAY

The core defense against ASI04 is not avoiding all runtime discovery.

It is making every discovered component prove:

I belong here,
I have not changed,
I still match the approved definition,
and my live behavior still matches policy.
