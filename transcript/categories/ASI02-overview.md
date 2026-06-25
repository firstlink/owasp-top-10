# ASI02 Overview - Tool Misuse & Exploitation

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI02 is Tool Misuse and Exploitation.

In simple terms, it means the agent uses a legitimate tool in an unsafe way.

ASI02 usually surprises people for one simple reason:
the tool may be working exactly as designed.

This is not mainly a story about a broken API or a defective connector.

It is a story about an agent using a valid capability at the wrong time, in the wrong way, or with the wrong stopping logic."

### Section 1 - How It Breaks
"Let’s look at the failure pattern.

On the left, we have a legitimate enterprise tool.
Something like a refund API, an admin utility, or a trading action.

In the middle, we have the AI agent choosing and executing that tool.

On the right, we have the unsafe condition:
ambiguous state, poisoned tool output, or a weak execution guard.

Once the guard is weak, the agent keeps going.
It retries when it should stop.
It repeats an action when it should verify state.
Or it trusts a result it should have validated.

That is how a valid tool becomes a harmful outcome."

`[Click 1 after: "a valid tool becomes a harmful outcome."]`

### Section 2 - Why This Matters
"Why is this easy to miss?

First, the tool itself is often legitimate.

Second, retries can multiply impact very quickly.

Third, every call can still look authorized in the logs.

So the system may appear to be doing normal automation, while the agent is actually overshooting the safe boundary."

`[Click 2 after: "overshooting the safe boundary."]`

### Section 3 - Where It Enters
"Common entry points include retries, ambiguous state, lookalike tools, unsafe tool output, broad permissions, and weak approval flow.

The lesson here is simple:
tool trust is not enough.
Execution trust has to be governed too."

### Close
"In the next scenario, I’ll show you how a refund workflow keeps paying the same case again and again, not because the tool fails, but because the agent never learns when to stop."
