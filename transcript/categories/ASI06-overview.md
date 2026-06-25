# ASI06 Overview - Memory & Context Poisoning

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI06 is Memory and Context Poisoning.

In simple terms, it means bad or manipulated context gets stored, retrieved later, and then trusted as if it were true.

OWASP ASI06 is about something many teams underestimate:
the bad prompt may be gone,
but the bad memory remains.

This category is not just about one unsafe interaction.
It is about poisoned context being stored, retrieved, and trusted later as if it were true."

### Section 1 - How It Breaks
"Let’s walk through the mechanism.

On the left is durable memory:
notes, embeddings, saved context, or agent state.

In the middle is the AI agent retrieving and reusing that memory.

On the right is the poisoned state:
false notes, manipulated context, or drifted facts that should not be trusted anymore.

The failure happens when recalled context re-enters the reasoning path without being re-verified.

That means yesterday’s bad write can quietly become today’s starting truth.

And once the starting truth is wrong, the next decision is wrong too."

`[Click 1 after: "the next decision is wrong too."]`

### Section 2 - Why This Matters
"Here is why this category matters.

First, the influence is persistent.
One bad write can affect many later tasks.

Second, recall feels familiar.
When poisoned memory comes back, it often looks legitimate because the system itself retrieved it.

Third, the spread is quiet.
The original poisoning event may be long gone by the time the visible business error appears.

That delayed effect is what makes ASI06 so difficult to detect."

`[Click 2 after: "so difficult to detect."]`

### Section 3 - Where It Enters
"Typical entry points include memory stores, embeddings, session notes, knowledge caches, retrieved context, and planner state.

So the real lesson is this:
if an agent can remember, then memory becomes part of the attack surface."

### Close
"In the next scenario, I’ll show you how a travel-booking agent retrieves a poisoned fare from memory and presents it as trusted business truth."
