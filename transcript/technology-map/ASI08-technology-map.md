# ASI08 Technology Map - Cascading Failures

## Recording Flow
1. `Visible on load:` Attack chain and first term
2. `Click after each term explanation` to reveal the next term

## Read Script
### Opening
"Now let’s define the language of cascade behavior.

ASI08 is less about one mistake and more about how many systems agree to keep trusting it."

### Attack Chain
"The chain is:
signal enters,
checks skipped,
chain continues,
damage spreads.

That is the amplification story in one line."

### Term 1 - Cascade Failure
"A Cascade Failure means an upstream error or poisoned signal triggers a sequence of harmful downstream actions.

The first problem may be small.
The final impact is not."

`[Click after this term.]`

### Term 2 - Cross-Agent Plausibility Validation
"Cross-Agent Plausibility Validation means one stage checks whether the previous agent’s output is still believable before accepting it.

This is one of the most important defenses in multi-agent chains."

`[Click after this term.]`

### Term 3 - Circuit Breaker
"A Circuit Breaker halts the workflow when anomaly conditions suggest the chain should not continue.

Its purpose is simple:
stop propagation before scale turns a mistake into a crisis."

`[Click after this term.]`

### Term 4 - Blast Radius
"Blast Radius is the scope of systems, money, users, or operations that can be affected once the chain goes wrong.

This is how we think about downstream impact."

`[Click after this term.]`

### Term 5 - Blast-Radius Cap
"A Blast-Radius Cap puts a hard limit on how far that damage can spread before the chain is stopped.

If validation fails late, the cap still protects the system."

`[Click after this term.]`

### Term 6 - Halt-and-Escalate Behaviour
"Halt-and-Escalate Behaviour means unsafe or low-confidence conditions trigger a stop and human review instead of autonomous continuation.

This is how the system says, 'Do not trust the chain any further.'"

`[Click after this term.]`

### Term 7 - Digital Twin Testing
"Digital Twin Testing exercises the workflow in a safe simulation so multi-step failure paths can be found before production.

This matters because cascade risks are often easier to see in system motion than in isolated unit logic."

`[Click after this term.]`

### Close
"Together, these terms explain ASI08:
one weak signal enters,
checks fail,
handoffs continue,
and the chain magnifies the mistake."
