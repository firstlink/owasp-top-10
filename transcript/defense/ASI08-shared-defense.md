# ASI08 Shared Defense Scenario — Cascade Containment Architecture

## PREVIEW

ASI08 is where locally reasonable automation becomes globally dangerous.

One bad upstream signal is allowed to gain credibility every time another stage accepts it.

We'll use the financial trading cascade as the main frame.

The defense question is:

how does the pipeline stop one bad signal from turning into a larger chain reaction?

---

## STEP 1

SHOW: User + Pipeline orchestrator

At the start, this looks like an efficient multi-agent pipeline.

The business wants speed and specialization across stages.

So the answer cannot be, "put a human inside every handoff."
It has to be built into the design itself.

---

## STEP 2

SHOW: runPipelineStage()

This is where the workflow becomes a stage-by-stage chain.

Each agent consumes a prior signal, transforms it, and hands off a result.

That is efficient.

It is also how one bad value can travel farther before anyone notices.

---

## STEP 3

SHOW: Pipeline signal

The pipeline signal is the real control surface.

An external feed.
An upstream output.
A prior-stage instruction.

If the architecture lets that signal keep flowing without challenge, the cascade has already found its route.

---

## STEP 4

SHOW: Threat variants covered

In practice, the cascade grows through three recognizable patterns:

- corrupted input values
- progressive amplification at each stage
- fast downstream harm before review can catch up

We are defending the path through which decisions accumulate.

---

## STEP 5

SHOW: Input plausibility validation

D1 asks the first practical question:

does this signal make sense at all?

Not just syntactically.
Historically.
Operationally.
Statistically.

A well-formed value can still be absurd, and this is where the pipeline says so early.

That matters because cascades often start with a signal that looks valid on the surface.

But in real operations, it makes no sense.

Skip that first check, and every later stage starts from a false premise that keeps gaining credibility.

---

## STEP 6

SHOW: Per-agent output circuit breaker

D2 introduces a key containment concept:
the circuit breaker.

A circuit breaker is the hard stop between stages when an output exceeds policy bounds.

If an exposure is too large, the handoff breaks.
If a forecast jumps too far, the handoff breaks.
If a recommendation becomes too high-impact, the handoff breaks.

Not a warning.
A stop.

This is what prevents one bad stage from buying momentum from the next stage.

If there is no circuit breaker, the pipeline keeps converting local error into wider systemic impact.

---

## STEP 7

SHOW: Cross-agent plausibility check

D3 removes one of the most dangerous assumptions in pipelines:

"someone earlier must have checked this already."

Each downstream agent re-validates what it receives.

That way, one weak threshold upstream does not become permission for every later stage.

This is important because ASI08 is an amplification problem.

Remove the re-check, and upstream confidence is inherited automatically, instead of earned repeatedly.

---

## STEP 8

SHOW: Blast-radius cap enforcement

D4 checks the whole run, not one stage at a time.

Blast radius means the maximum allowed impact from a single pipeline execution.

Even if multiple stages remain locally plausible, the overall run can still be too dangerous.

So the orchestrator blocks runs whose projected impact exceeds the declared cap.

That is how the system limits organization-wide damage.

That matters because several small decisions can each look acceptable on their own.

Without a blast-radius cap, locally safe steps can still combine into a globally unsafe outcome.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 protects the high-impact downstream action.

Large trades.

These do not move on autonomous momentum alone.

Pipeline speed never becomes permission.

If that gate is absent, the last and most consequential step can still execute.

That can happen just because every earlier automation stage kept saying yes.

---

## STEP 10

SHOW: Approved pipeline outcome + D6 - Strong Observability

The Approved pipeline outcome shows a run that stayed bounded end to end.

The workflow proceeds only if:

- the input is plausible
- every stage output stays bounded
- downstream stages keep re-checking
- overall blast radius stays acceptable
- high-impact actions are approved

And D6, Strong Observability, records the entire cascade path for monitoring and replay.

That is what turns ASI08 defense into a resilient chain, instead of a fast, fragile one.

---

## FINAL TAKEAWAY

The best defense against ASI08 is not making every agent smarter in isolation.

It is:

validate the signal,
break unsafe stage outputs,
re-check every handoff,
cap total impact,
and require governance before the pipeline's speed outruns enterprise judgment.
