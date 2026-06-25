# ASI03 Overview - Identity & Privilege Abuse

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI03 is Identity and Privilege Abuse.

In simple terms, it means the agent is acting with the wrong identity, the wrong permissions, or more authority than the task should allow.

ASI03 is where security becomes less about content and more about authority.

The task may be perfectly valid.
The login may succeed.
The token may be genuine.

But if the agent is acting with the wrong identity or too much privilege, the workflow is already unsafe."

### Section 1 - How It Breaks
"On the left, we have a delegated business task.
Something routine, like research, support, or follow-up work.

In the middle, we have the AI agent delegating, inheriting, or reusing authority.

On the right, we have the identity drift:
borrowed credentials, expanded scope, or a task running under a more privileged actor than intended.

The failure happens when the current task and the current authority stop matching.

That mismatch turns identity into an attack path.

The result is privilege abuse:
data exposure, unauthorized action, or both."

`[Click 1 after: "data exposure, unauthorized action, or both."]`

### Section 2 - Why This Matters
"Why is this easy to miss?

Authority can move faster than people inspect it.

Permissions often carry farther than the task should allow.

And because the credential is real, the action can still look legitimate in the system.

That is why ASI03 is so dangerous.
The problem is not failed authentication.
The problem is misplaced trust."

`[Click 2 after: "The problem is misplaced trust."]`

### Section 3 - Where It Enters
"Common entry points include sub-agents, shared sessions, approval chains, cached tokens, delegation hops, and privileged tools.

So the core question in ASI03 is not just, 'Who can authenticate?'

The real question is:
'Who should be allowed to act right now, for this exact task?'"

### Close
"In the next scenario, we’ll look at a finance copilot that delegates work to a sub-agent with far too much authority, and that one design choice opens the door to executive data exposure."
