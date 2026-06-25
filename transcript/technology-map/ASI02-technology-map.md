# ASI02 Technology Map - Tool Misuse & Exploitation

## Recording Flow
1. `Visible on load:` Attack chain and first term
2. `Click after each term explanation` to reveal the next term

## Read Script
### Opening
"Now let’s map the language behind ASI02.

What I want you to notice here is that the tool itself is often not the villain.

The real story is how the agent invokes it, repeats it, or trusts it without enough restraint."

### Attack Chain
"At the top, the chain is:
tool requested,
guard missed,
tool executes,
unsafe outcome.

That gives us the whole pattern before we even define the terms."

### Term 1 - Tool Misuse
"Tool Misuse means a legitimate enterprise capability is invoked in an unsafe or unintended way.

The tool may be real,
approved,
and functioning correctly.

The failure is in how the agent chooses to use it."

`[Click after this term.]`

### Term 2 - Execution Guardrail
"An Execution Guardrail is the policy or runtime check that prevents repeated, overscoped, or contextually unsafe tool actions.

In ASI02, this is one of the most important controls because it decides when the agent must stop."

`[Click after this term.]`

### Term 3 - Idempotency
"Idempotency means the same request should not create multiple side effects when it is replayed or retried.

This matters because many ASI02 failures happen when the agent repeats an action that should only ever happen once."

`[Click after this term.]`

### Term 4 - State Validation
"State Validation means the agent checks the current system state before acting again.

If the system is already in the desired state, the tool call should not repeat."

`[Click after this term.]`

### Term 5 - Tool Output Validation
"Tool Output Validation means returned data is checked for integrity and plausibility before the agent uses it for a follow-on action.

Without this, poisoned or misleading output can drive a harmful next step."

`[Click after this term.]`

### Term 6 - Least-Privilege Tool Scope
"Least-Privilege Tool Scope means each tool exposes only the minimum action surface required for the task.

Even if the agent makes a bad choice, the available blast radius is smaller."

`[Click after this term.]`

### Close
"Together, these terms tell the ASI02 story:
the capability is legitimate,
the guard is not strong enough,
the agent keeps pressing forward,
and normal automation turns into unsafe action."
