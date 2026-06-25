# ASI01 Overview - Agent Goal Hijack

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI01 is Agent Goal Hijack.

In simple terms, it means the agent is no longer pursuing the right objective, even though the workflow still appears to be working normally.

That is what makes this risk so easy to underestimate.

The workflow runs.
The agent responds.
The business process appears to move forward.

But underneath that normal-looking flow, the goal has shifted.

And once the goal shifts, a very capable system can produce a very confident wrong answer."

### Section 1 - How It Breaks
"Let’s start with the shift itself.

On the left, we have the legitimate task.
Process the refund.

In the middle, we have the AI agent.
It reads the case, decides what to do, and acts.

On the right, we have attacker-controlled content.
That content might arrive through an email, a PDF, a web page, or tool output.

The key issue is that trusted instructions and untrusted content now share the same reasoning path.

Once that boundary fails, the next decision changes.

And when the next decision changes, the business goal changes with it.

The result is goal hijack.
The workflow succeeds technically, but it produces the wrong business action."

`[Click 1 after: "the wrong business action."]`

### Section 2 - Why This Matters
"Now let’s look at why this is easy to miss.

First, autonomous execution.
The agent can act before a human notices the drift.

Second, mixed-trust inputs.
Trusted instructions and attacker content can arrive in the same context window.

Third, silent drift.
The output can still look valid, even after the objective has already shifted.

That is why ASI01 is not just a prompt problem.
It is a decision-integrity problem."

`[Click 2 after: "It is a decision-integrity problem."]`

### Section 3 - Where It Enters
"So where does this usually enter?

Common entry points include emails, PDF documents, web pages, database records, tool responses, and agent messages.

Indirect prompt injection is a major example.
But the broader lesson is this:
any untrusted content that reaches the reasoning path can influence the goal."

### Close
"In the next scenario, we will watch that shift happen inside a refund workflow, where the process looks routine right up to the moment the payout goes to the wrong destination."
