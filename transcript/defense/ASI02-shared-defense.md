# ASI02 Shared Defense Scenario — Bounded Execution Architecture

## PREVIEW

ASI02 is the category where everything can look legitimate.

The tool is real.
The access is real.
The damage is still real.

So the issue is not fake software.
The issue is ungoverned execution.

We'll use the refund-loop case as the main frame.

The defense question is:

how does the system check, before any tool runs, that the action is still inside the approved task?

---

## STEP 1

SHOW: User + Agent planner

At the top of the flow, the request is completely ordinary.

Refund one case.

Nothing looks unsafe yet.

ASI02 begins when that simple request is translated into a chain of live tool calls.

---

## STEP 2

SHOW: planToolCalls()

This is the point where execution risk first becomes visible.

The planner decides:

- which tool runs
- in what order
- with which arguments
- whether a retry or follow-on action should happen

That matters, because a workflow can become dangerous before a single tool has actually fired.

---

## STEP 3

SHOW: planToolCalls() + Tool layer

This Tool layer is the real ASI02 boundary.

The refund API can be legitimate.
The file connector can be legitimate.
The shell wrapper can be legitimate.

The problem is not fake capability.
It is a real capability used the wrong way.

The scope may be wrong.
The target may be wrong.
The sequence may be wrong.

---

## STEP 4

SHOW: Threat variants covered

In practice, the damage usually appears in three patterns:

- recursive loops
- unsafe multi-step chains
- parameter overreach

That framing matters.

Bounded execution is not about catching one exact bad action.
It is about controlling the common ways execution goes wrong.

---

## STEP 5

SHOW: Tool call rate limiter

D1, Tool call rate limiter, is the first hard brake.

A rate limiter is the call budget around one workflow, one case, or one task.

Combined with idempotency keys and one-time locks, it stops the same refund path from firing again and again.

The same idea also applies to restarts and transfers.

That matters when the agent is uncertain.
It also matters when the agent keeps pushing the same action.

This is how a useful automation path is stopped from turning into a damage-multiplying loop.

That matters here, because the tool may be legitimate while the repetition pattern clearly is not.

If this layer is missing, one bad decision can turn into many bad executions.

By the time someone notices, the agent may already be trapped in a loop.

---

## STEP 6

SHOW: Zero-Trust Tooling

D2, Zero-Trust Tooling, deals with the next question:

can this call be trusted at the argument level?

Zero-Trust Tooling means the system does not trust tool arguments by default.

It does not trust them just because they came from the model.
It does not trust them just because they came from another tool upstream.

Every argument is validated for shape, scope, and target before the live tool sees it.

Wildcards are rejected.
Broad paths are rejected.
Open-ended shell targets are rejected.
Oversized trade parameters are rejected.

They only pass if they match a tightly approved form.

That is how the architecture blocks parameter overreach before a real tool turns it into a real side effect.

If you skip this layer, a valid tool can still be misused through over-broad arguments.

The tool itself may be fine.
The arguments are what make it dangerous.

---

## STEP 7

SHOW: Tool chain validator

D3, Tool chain validator, looks at the sequence as a whole, not just one call at a time.

A safe read can become unsafe when it is immediately followed by a send.
A harmless inspect step can become dangerous when it automatically triggers disable or delete.

So the chain itself is reviewed against approved business patterns before execution starts.

That is important, because ASI02 often hides in orchestration, not in one obviously bad command.

Without a chain-level check, each individual call may look reasonable.

But the combined sequence can still cross the business boundary.

---

## STEP 8

SHOW: Just-in-Time permissions

D4 narrows authority at the moment of action.

Just-in-Time permissions mean the workflow gets only the minimum access it needs.

That access is for one approved action.
It is for one short window.
And it exists inside one bounded runtime.

The privilege is temporary.
It is scoped.
And it is revoked immediately after the call.

So even if an earlier check was imperfect, the live action still has very little room to expand.

That helps in ASI02 because a tool chain should not gain more power as it moves.

Without Just-in-Time permissions, one approved action can open the door to wider access.

It can also lead to wider retries.
And then to wider damage.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 is where destructive paths stop being self-service.

Delete.
Transfer.
Restart.
External post.

Those actions stay behind explicit approval.

This is where the system draws a very important line:
a real tool is not the same thing as permission.

The tool may technically be able to do it.
The workflow still has to prove it is appropriate to do it now.

Without this gate, the agent can turn confidence into authority far too easily.

---

## STEP 10

SHOW: Approved tool outcome + D6 - Strong Observability

The Approved tool outcome shows what bounded execution looks like in practice.

The action proceeds only after:

- repetition is bounded
- arguments are validated
- the chain is approved
- privilege is temporary and scoped
- destructive paths are gated

And D6, Strong Observability, keeps the whole run visible:

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

It is making tool use prove, call by call, that it remains inside the task:

bounded frequency,
validated arguments,
approved sequences,
temporary privilege,
and human review where the blast radius demands it.
