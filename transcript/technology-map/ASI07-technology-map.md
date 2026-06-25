# ASI07 Technology Map - Insecure Inter-Agent Communication

## Recording Flow
1. `Visible on load:` Attack chain and first term
2. `Click after each term explanation` to reveal the next term

## Read Script
### Opening
"Now let’s give precise names to the trust failures in ASI07.

This category is about communication channels that feel internal but are not yet verified."

### Attack Chain
"The chain is:
peer found,
trust assumed,
message consumed,
action misled.

That is the internal-trust failure pattern."

### Term 1 - Peer-Agent Trust Failure
"Peer-Agent Trust Failure means one agent accepts messages or actions from another agent without enough identity and integrity assurance.

The trust exists socially in the architecture,
not technically in the message."

`[Click after this term.]`

### Term 2 - Mutual TLS
"Mutual TLS, or mTLS, means both sides of an internal connection authenticate each other before they exchange messages.

This is a foundational control because it proves both endpoints, not just one."

`[Click after this term.]`

### Term 3 - Payload Signature
"A Payload Signature gives the recipient a way to detect tampering or forgery inside the message itself.

Even if transport exists, payload integrity still matters."

`[Click after this term.]`

### Term 4 - Authenticated Agent Registry
"An Authenticated Agent Registry ties discovery to a trusted registry rather than unauthenticated naming or lookup.

This is crucial because discovery is often where false peers first enter the system."

`[Click after this term.]`

### Term 5 - Message Freshness
"Message Freshness uses timestamps, nonces, or expirations to prove that the message is recent and not a replay.

Without freshness, yesterday’s valid message can become today’s attack."

`[Click after this term.]`

### Term 6 - Discovery Spoofing
"Discovery Spoofing means an attacker inserts or advertises a fake peer so traffic is routed to the wrong agent.

This is dangerous because the receiving system may never realize it trusted the wrong destination."

`[Click after this term.]`

### Close
"Together, these terms explain ASI07:
the wrong peer is trusted,
the message is accepted,
and a harmful internal action follows."
