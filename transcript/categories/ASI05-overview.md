# ASI05 Overview - Unexpected Code Execution (RCE)

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI05 is Unexpected Code Execution.

In simple terms, it means agent-controlled or generated text crosses the boundary from data into executable action.

ASI05 is the category where language turns into execution.

Up to this point, the system may look like it is only handling text.
But the moment generated output becomes shell, SQL, Python, or runnable script, the risk changes completely.

This is where an interpretation step becomes an execution step."

### Section 1 - How It Breaks
"On the left, we begin with normal input:
a prompt, a file, or user data.

In the middle, the AI agent turns that input into commands, queries, or code.

On the right, a runtime interpreter executes it:
a shell, a SQL engine, a script runner, or another execution path.

The failure happens when the data-to-code boundary is weak.

Instead of staying inert, generated text becomes something the system actually runs.

And once that happens, the impact becomes immediate:
files can change, commands can run, or data can be destroyed."

`[Click 1 after: "or data can be destroyed."]`

### Section 2 - Why This Matters
"Why is this easy to miss?

Because the text can look like ordinary automation.

Because one unsafe execution step can escalate very quickly.

And because the most dangerous moment is often only a few characters away from something that looks harmless.

That is why ASI05 is not just about code.
It is about boundary discipline."

`[Click 2 after: "It is about boundary discipline."]`

### Section 3 - Where It Enters
"Common entry points include shell commands, SQL queries, Python scripts, CI jobs, templates, and automation runners.

So the core lesson is this:
if generated output can cross into execution, the boundary has to be extremely tight."

### Close
"In the next scenario, we’ll follow a self-healing DevOps agent that generates a cleanup script which looks helpful, reports success, and still wipes out the only recent production backups."
