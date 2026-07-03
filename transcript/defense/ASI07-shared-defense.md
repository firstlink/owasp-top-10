# ASI07 Shared Defense Scenario — Trusted Inter-Agent Channel Architecture

## PREVIEW

By the time a message moves between agents, many teams stop treating it as hostile.

That is exactly the assumption ASI07 exploits.

We'll use the tampered prescription case as the main frame.

The defense question is:

how does the receiving agent know this message is real, fresh, and safe to trust?

---

## STEP 1

SHOW: User + Sending agent

Here, the workflow begins as a normal multi-agent collaboration.

The business still needs peer coordination.

So the defense is not trying to eliminate agent-to-agent exchange.
It is trying to make that trust explicit, instead of assumed.

---

## STEP 2

SHOW: sendOrDiscoverAgent()

This is where ASI07 starts.

The system either prepares a peer message, or discovers a downstream specialist.

That means it is deciding two things.

Who it is talking to.
And what message will be believed.

---

## STEP 3

SHOW: Agent channel

The agent channel is the real control surface:

messages,
registries,
approval tokens,
routing metadata.

If the receiver trusts those based on location, or formatting alone, the architecture is already fragile.

---

## STEP 4

SHOW: Threat variants covered

Most failures in this category fall into three patterns:

- tampering in transit
- replay of valid older messages
- malicious or spoofed peer registration

The pattern is consistent:
the traffic looks credible, even though it should not be trusted yet.

---

## STEP 5

SHOW: Mutual TLS (mTLS)

D1 introduces mTLS, or mutual TLS.

That means both peers authenticate the transport channel before the conversation begins.

No internal-network shortcut.
No, "it came from the right subnet, so accept it."

If the secure channel cannot be proven, the exchange does not proceed.

This matters in ASI07, because the first question is not yet whether the message is good.
It is whether the peer is even the right peer.

Without mTLS, a spoofed or unauthorized agent can still get a seat at the conversation.

---

## STEP 6

SHOW: Digital message signing

D2 protects the payload itself.

This is a different question from mTLS.

The channel may be real, and the content can still be altered after it leaves the sender.

Digital signing makes the message prove its own integrity before the receiver processes it.

In simple terms, the signature helps the receiver check two things.

Who signed the message.
And whether the payload changed afterward.

That blocks the ASI07 pattern where trusted transport is used to carry tampered instructions.

Without this layer, the receiver may trust a real channel carrying altered content.

---

## STEP 7

SHOW: Message freshness controls

D3 handles one of the most realistic ASI07 problems:
replay.

The message may be real.
The signature may be real.
The approval may once have been real.

Freshness controls include nonces, expiries, and one-time processing.

They make "valid once" mean "valid only now."

That is how the system stops an old approval, or prescription message, from being reused out of context.

Without freshness controls, yesterday's legitimate message can become today's unauthorized action.

---

## STEP 8

SHOW: Authenticated agent registry

D4 protects peer discovery itself.

Even a perfect message protocol fails if discovery points to the wrong specialist.

So only verified, allowlisted agents appear in routing results.

Friendly naming does not create trust.
Priority flags do not create trust.
Registration itself has to be authenticated and governed.

This matters because discovery is where a fake specialist can insert itself.

That can happen before any payload check even starts.

Without an authenticated registry, the workflow can be routed to the wrong agent.

And to the team, everything may still look normal.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 protects sensitive rerouting.

If prescription data is about to move to a new, or unusual, destination, the workflow pauses for review.

These paths do not self-reroute simply because a new peer looks available.

Without this gate, the system can still make a sensitive routing change too easily.

That may be a legal issue.
It may be a clinical issue.
And it may happen on automated peer selection alone.

---

## STEP 10

SHOW: Approved inter-agent outcome + D6 - Strong Observability

The Approved inter-agent outcome shows the safe version of the exchange.

Only traffic that is:

- channel-authenticated
- payload-signed
- fresh
- registry-verified
- appropriately approved

is allowed to proceed.

And D6, Strong Observability, records the full trust path:

handshakes,
signature checks,
nonce use,
TTL failures,
discovery events,
routing approvals.

That is what gives defenders real visibility into inter-agent trust.

---

## FINAL TAKEAWAY

The strongest defense against ASI07 is not, "encrypt internal traffic."

It is:

prove the channel,
prove the payload,
prove the timing,
prove the peer,
and force sensitive rerouting through governance before any downstream agent acts.
