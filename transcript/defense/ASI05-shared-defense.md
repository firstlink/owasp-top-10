# ASI05 Shared Defense Scenario — Safe Code Boundary Architecture

## PREVIEW

ASI05 is where language gets close enough to execution to become dangerous.

The draft may still look harmless.
The problem is that the architecture is one step away from turning it into a command, a query, or a script.

We'll use the self-healing disaster as the main frame.

The defense question is:

how does the system stop untrusted text from turning into live code?

---

## STEP 1

SHOW: User + Agent planner

At the start, the task sounds useful and familiar.

Clean up a system.

That means the defense cannot simply say, "never generate code."
It has to show how code generation stays inside a governed path.

---

## STEP 2

SHOW: generateOrCompileCode()

This is where natural language starts turning into execution drafts.

A shell command may be proposed.
A SQL query may be assembled.
A Python cell may be prepared.

From this point on, the system is handling something that could soon become executable.

---

## STEP 3

SHOW: Untrusted input

This untrusted-input stage shows why the boundary matters.

A filename.
A free-text field.
A natural-language question.
A data row.

All of those are still just data.

ASI05 happens when the system lets data slip into code.

That is how ordinary input starts gaining execution meaning.

---

## STEP 4

SHOW: Threat variants covered

Here, the escape usually happens through three familiar paths:

- shell injection
- SQL injection
- data-to-code escape

Different interfaces.
Same underlying mistake.

The system forgets to keep data and code in separate trust buckets.

---

## STEP 5

SHOW: Input classification

D1, Input classification, is the first barrier.

It says: everything that comes in is data, unless proven otherwise.

Shell metacharacters are flagged early.
SQL terminators are flagged early.
Subprocess markers are flagged early.
Suspicious interpolated fragments are flagged early.

They are stripped, quarantined, or isolated before draft generation depends on them.

That is how the architecture keeps raw input from becoming executable too early.

This matters in ASI05 because the attack wins when ordinary text starts behaving like code.

Without classification, the system starts treating untrusted data as safe input for execution.

---

## STEP 6

SHOW: Static analysis

D2, Static analysis, checks the draft before runtime gets a vote.

Static analysis means inspecting the script or query without executing it.

This stage looks for:

- broad deletion scope
- raw SQL assembly
- dangerous subprocess calls
- out-of-scope network behavior

The point is to evaluate the shape of execution while it is still only a proposal.

That helps because the system can still reject a dangerous cleanup script early.

It can stop it before it touches the host.
Before it touches the database.
And before it touches the network.

Without static analysis, the workflow learns what the draft really does too late.

It learns after the draft has already started running.

---

## STEP 7

SHOW: Sandbox execution

D3, Sandbox execution, contains whatever still reaches runtime.

A sandbox is the restricted environment around the draft.

So even if a risky fragment slips through earlier checks, the runtime stays tightly bounded.

The host is protected.
The database reach is limited.
And the network reach is limited.

The architecture is not betting everything on perfect analysis.
It is also limiting blast radius at runtime.

That is the runtime backstop for ASI05.

Without sandboxing, one mistaken command or query can jump straight into production damage.

---

## STEP 8

SHOW: Dry-run validation

D4 previews impact before anything live changes.

A dry run answers questions such as:

Which files would change?
Which rows would update?
Which endpoint would be reached?

If the preview does not match the approved task, the workflow stops before the side effect becomes real.

This is where the user, or the policy engine, can see the real consequence, not just the code text.

Without a dry run, a command may look tidy, while still targeting the wrong files, rows, or endpoints.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 keeps destructive code paths behind approval.

Deletes.
Production writes.
External sends.

Those do not go live on model judgment alone.

This is where the architecture protects the highest-blast-radius edge of the code path.

Without this layer, the final leap from generated code to live destructive action becomes far too automatic.

---

## STEP 10

SHOW: Approved execution outcome + D6 - Strong Observability

The Approved execution outcome shows the safe version of the workflow.

The run proceeds only after:

- input stays classified as data
- the draft is statically checked
- runtime is sandboxed
- impact is previewed
- destructive actions are approved

And D6, Strong Observability, records:

- the ingested content
- the draft
- the analysis result
- the sandbox events
- the dry-run output
- the approval path

That is the defended code boundary:
useful, fast enough, and no longer casually executable.

---

## FINAL TAKEAWAY

The strongest defense against ASI05 is not, "never let the agent write code."

It is:

classify first,
analyze second,
contain runtime behavior,
preview destructive impact,
and require approval before live execution crosses the final boundary.
