# ASI05 Technology Map - Unexpected Code Execution (RCE)

## Recording Flow
1. `Visible on load:` Attack chain and first term
2. `Click after each term explanation` to reveal the next term

## Read Script
### Opening
"Now let’s define the execution language of ASI05.

This map revolves around one boundary, and it is one of the most important boundaries in the whole course:
the moment text stops being content and starts becoming something the system can execute."

### Attack Chain
"The chain is:
input arrives,
boundary weakens,
code path built,
execution lands.

That is the pattern we are naming."

### Term 1 - Unexpected Code Execution
"Unexpected Code Execution means agent-generated content is executed as active code or commands in a way the design did not safely contain.

The risk begins when output stops being only output."

`[Click after this term.]`

### Term 2 - Data-to-Code Boundary Failure
"A Data-to-Code Boundary Failure happens when untrusted data is treated as executable logic instead of remaining inert content.

This is the fundamental failure in ASI05."

`[Click after this term.]`

### Term 3 - Input Sanitisation
"Input Sanitisation means dangerous characters, tokens, or payload patterns are filtered or normalized before execution paths are constructed.

This reduces the chance that hostile input becomes live code."

`[Click after this term.]`

### Term 4 - Parameterised Query Enforcement
"Parameterised Query Enforcement means SQL values are bound safely rather than concatenated into executable query text.

This is one of the clearest examples of keeping data separate from code."

`[Click after this term.]`

### Term 5 - Hardware-Enforced Sandbox
"A Hardware-Enforced Sandbox runs execution inside an isolated environment with tight privilege and system boundaries.

If execution must happen, it should happen inside strong containment."

`[Click after this term.]`

### Term 6 - Least Agency
"Least Agency means the agent receives the smallest execution authority possible.

Even if something unsafe is generated, the environment limits how far it can go."

`[Click after this term.]`

### Close
"Together, these terms explain ASI05:
the line between data and execution weakens,
the system runs what should have remained inert,
and a text workflow becomes real operational impact."
