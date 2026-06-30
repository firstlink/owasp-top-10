# ASI02 Shared Defense Scenario — Bounded Execution Architecture

## PREVIEW

ASI02 punishes teams that trust legitimate tools too quickly.

The tool may be real.
The credentials may be real.
The damage still happens when sequence, scope, or parameters drift away from intent.

We'll use the refund-loop case as the main frame.

This walkthrough is about one practical question:

how does the system make tool use earn trust, step by step, before anything high-impact runs?

---

## STEP 1

SHOW: User + Agent planner

At the User and Agent planner stage, the workflow begins with an ordinary business task.

Refund one case.

Nothing is wrong yet.

ASI02 starts when that simple request is translated into a chain of live tool calls.

---

## STEP 2

SHOW: planToolCalls()

The `planToolCalls()` stage is where execution risk first becomes visible.

The planner decides:

- which tool runs
- in what order
- with which arguments
- whether a retry or follow-on action should happen

That planning layer matters because unsafe orchestration can exist before a single tool executes.

---

## STEP 3

SHOW: planToolCalls() + Tool layer

The Tool layer marks the real ASI02 boundary.

The refund API can be legitimate.
The file connector can be legitimate.
The shell wrapper can be legitimate.

The problem is not fake capability.
It is real capability used with the wrong scope, the wrong target, or the wrong sequence.

---

## STEP 4

SHOW: Threat variants covered

The Threat variants step narrows the failure patterns the architecture is designed for:

- recursive loops
- unsafe multi-step chains
- parameter overreach

That framing matters because bounded execution is about controlling these recurring shapes, not about predicting one exact payload.

---

## STEP 5

SHOW: Tool call rate limiter

D1, Tool call rate limiter, is the first hard brake.

A rate limiter is the call budget around one workflow.

Combined with idempotency keys and one-time locks, it stops the same refund, restart, or transfer path from firing over and over just because the agent is uncertain or persistent.

This is what keeps a useful automation path from becoming a damage-multiplying loop.

In ASI02, that matters because the tool may be legitimate while the repetition pattern is not.

Without this layer, one bad decision can be multiplied into ten bad executions before anyone realizes the agent is stuck in a harmful loop.

---

## STEP 6

SHOW: Zero-Trust Tooling

D2, Zero-Trust Tooling, explains a new concept for this category.

Zero-Trust Tooling means the system does not trust tool arguments simply because they came from the model or from another tool.

Every argument is validated for shape, scope, and target before the live tool sees it.

Wildcards, broad paths, open-ended shell targets, and oversized trade parameters are rejected unless they match a constrained approved form.

That is how the architecture blocks parameter overreach before a real tool turns it into a real side effect.

Without this layer, a valid tool can still be weaponized through over-broad arguments, even though the tool itself was never compromised.

---

## STEP 7

SHOW: Tool chain validator

D3, Tool chain validator, checks the full sequence instead of one call at a time.

A safe read can become unsafe when it is immediately followed by a send.
A harmless inspect step can become dangerous when it automatically triggers disable or delete.

That is why the chain itself is reviewed against approved business patterns before execution starts.

This is important because ASI02 often hides in orchestration, not in one obviously bad command.

Without a chain-level check, every individual call can look reasonable while the combined sequence still crosses the business boundary.

---

## STEP 8

SHOW: Just-in-Time permissions

D4 introduces another term that deserves a quick definition: Just-in-Time permissions.

It means the workflow receives the minimum privilege needed for one approved action, for one short window, inside one bounded runtime.

The privilege is temporary.
It is scoped.
And it is revoked immediately after the call.

So even if an earlier check was imperfect, the live action still has very little room to expand.

That helps ASI02 because a tool chain cannot quietly accumulate broader authority as it moves.

Without Just-in-Time permissions, one approved action can become a bridge into wider access, wider retries, or wider damage.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 is where destructive paths stop being self-service.

Delete.
Transfer.
Restart.
External post.

Those actions stay behind explicit approval.

This is the point where the architecture says: tool realism is not the same thing as permission.

The tool may technically be able to do it.
The workflow still has to prove it is appropriate to do it now.

Without this gate, the agent can turn operational confidence into operational authority too easily.

---

## STEP 10

SHOW: Approved tool outcome + D6 - Strong Observability

The Approved tool outcome shows what a bounded run looks like.

The action proceeds only after:

- repetition is bounded
- arguments are validated
- the chain is approved
- privilege is temporary and scoped
- destructive paths are gated

And D6 Strong Observability keeps the full story visible:

every call,
every parameter,
every approval,
every unusual retry,
every rejected chain.

That is the defended version of ASI02:
automation still works, but execution no longer drifts just because the tools are real.

---

## FINAL TAKEAWAY

The core defense against ASI02 is not removing tools.

It is making tool use prove, step by step, that it remains inside the task:

bounded frequency,
validated arguments,
approved sequences,
temporary privilege,
and human review where the blast radius demands it.
