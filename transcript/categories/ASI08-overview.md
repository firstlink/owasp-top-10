# ASI08 Overview - Cascading Failures

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI08 is Cascading Failures.

In simple terms, it means one upstream agent mistake spreads across connected systems and becomes a much larger failure.

OWASP ASI08 is about amplification.

One bad signal enters the system.
The next agent trusts it.
Then the next one trusts it too.

And a small upstream problem turns into a much larger business failure."

### Section 1 - How It Breaks
"Here is the pattern.

On the left, we start with the upstream signal:
a forecast, an alert, or a planning artifact.

In the middle, we have the agent chain:
planning, sizing, routing, execution.

On the right, we have the unchecked handoff:
the next stage accepts the previous output without enough plausibility checking.

That is the failure point.

The original signal may be wrong only once.
But if every downstream stage treats it as truth, the chain multiplies the damage."

`[Click 1 after: "the chain multiplies the damage."]`

### Section 2 - Why This Matters
"This is easy to miss for three reasons.

First, the impact compounds.

Second, each step can look locally reasonable on its own.

Third, the blast radius grows faster than a person can inspect each handoff.

So by the time the final outcome becomes visible, the original mistake may be many steps behind it."

`[Click 2 after: "many steps behind it."]`

### Section 3 - Where It Enters
"Typical entry points include planning outputs, sizing decisions, routing steps, execution stages, reports, and supervisor agents.

ASI08 teaches one of the most important lessons in agentic systems:
every handoff is a trust decision."

### Close
"In the next scenario, I’ll show you how one poisoned market-risk signal moves through multiple trading agents and becomes a massive financial position before a human can step in."
