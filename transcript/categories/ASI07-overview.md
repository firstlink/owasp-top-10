# ASI07 Overview - Insecure Inter-Agent Communication

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI07 is Insecure Inter-Agent Communication.

In simple terms, it means one agent trusts messages, instructions, or state coming from another agent too easily.

OWASP ASI07 moves us away from user-to-agent input and into something equally important:
agent-to-agent trust.

This category asks a simple question.

What happens when one agent trusts another agent’s message too easily?"

### Section 1 - How It Breaks
"In this flow, the left side is peer-agent traffic:
internal requests, service calls, events, or discovery messages.

The center is the receiving agent.
It accepts the message, interprets it, and acts on it.

The right side is the trust failure:
a spoofed peer, a replayed message, or a tampered payload.

The danger is that the message looks internal.
And because it looks internal, it may be trusted faster than it should be.

That is the boundary failure here.
Inside the system does not automatically mean safe."

`[Click 1 after: "does not automatically mean safe."]`

### Section 2 - Why This Matters
"Why is this category easy to miss?

Because internal traffic feels trustworthy.

Because one false peer signal can trigger many downstream actions quickly.

And because the receiving agent may still believe it is following a legitimate internal request.

That makes the compromise hard to see and easy to propagate."

`[Click 2 after: "easy to propagate."]`

### Section 3 - Where It Enters
"Typical entry points include service discovery, message buses, peer RPC, internal events, agent registries, and queued tasks.

So the lesson is clear:
internal origin is not proof of integrity.
Peer identity and message trust still have to be verified."

### Close
"In the next scenario, I’ll show you how a tampered prescription message crosses an internal clinical agent bus and quietly changes a downstream medical record."
