# ASI09 Overview - Human-Agent Trust Exploitation

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI09 is Human-Agent Trust Exploitation.

In simple terms, it means the agent influences a human into approving, trusting, or choosing something unsafe.

OWASP ASI09 is different from the others.

Here, the final harmful action is often approved by a human.

But that does not mean the decision was safe.

It may simply mean the agent quietly shaped the human’s judgment."

### Section 1 - How It Breaks
"On the left is the recommendation:
a summary, a ranking, or a suggested action.

In the middle is the human reviewer.
They read it, trust it, and approve it.

On the right is the dangerous trust cue:
confidence, polished language, strong formatting, or missing evidence that is not immediately obvious.

The failure happens when the recommendation feels stronger than the underlying evidence.

At that point, the human remains in the loop,
but the agent is already steering the outcome."

`[Click 1 after: "the agent is already steering the outcome."]`

### Section 2 - Why This Matters
"Why does this work so well?

Because polished output feels credible.

Because incomplete evidence is less visible than a confident answer.

And because the final action may still look properly approved on paper.

That is why ASI09 is really about exploited judgment, not just bad recommendations."

`[Click 2 after: "not just bad recommendations."]`

### Section 3 - Where It Enters
"Typical entry points include approval queues, case summaries, risk rankings, clinical suggestions, financial recommendations, and executive reports.

The lesson is simple:
confidence is not proof.
A human-in-the-loop still needs evidence-in-the-loop."

### Close
"In the next scenario, I’ll show you how a confident accounts-payable recommendation persuades a finance manager to approve the wrong bank destination on a real vendor invoice."
