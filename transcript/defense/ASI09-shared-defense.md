# ASI09 Shared Defense Scenario — Genuine Review Architecture

## PREVIEW

In ASI09, the final harmful action is often approved by a human.

That is what makes this category uncomfortable, and important.

We'll use the confident invoice fraud scenario as the main frame.

The defense question is:

how does the workflow make sure the human reviews the real evidence, not just the AI summary?

---

## STEP 1

SHOW: User + AI assistant

This category starts in a very normal place.

A person needs to approve something.

The risk appears when summary starts replacing judgment.

That is the subtle shift this category is about.

---

## STEP 2

SHOW: summarizeOrRecommend()

This is the stage that produces the kind of output that is most dangerous in ASI09:

clear,
structured,
fast,
apparently complete.

That can feel like verification, even when it is only presentation.

---

## STEP 3

SHOW: Source evidence

The source evidence remains the truth anchor.

The invoice is the artifact that must be trusted.

The AI output is an interpretation layer, not the artifact being approved.

If the workflow forgets that distinction, trust exploitation has already started to win.

---

## STEP 4

SHOW: Threat variants covered

Review can fail in a few recognizable ways.

But in this walkthrough, keep the focus on the invoice case:

a polished summary can make a changed bank account look reviewed, when it was never actually verified.

---

## STEP 5

SHOW: Completeness indicator

D1 introduces the Completeness indicator.

Its job is simple:

show what evidence the recommendation used, and what evidence is still missing.

That matters, because confidence can sound high even when coverage is incomplete.

This makes missing evidence visible, instead of letting smooth language hide it.

In ASI09, that is the first defense against the illusion of review.

If this indicator is missing, the assistant can sound complete.

The reviewer may never realize that key evidence was never examined.

---

## STEP 6

SHOW: Source cross-check

D2 forces contact with the underlying record.

Approval stays locked until the reviewer opens the invoice itself.

That reconnects the narration to the workflow:
the summary may help, but it never replaces the source.

This matters because the attack succeeds at a very specific moment.

It succeeds when the human approves the summary instead of checking the artifact.

If the reviewer never touches the source, the AI output becomes the thing being trusted.

---

## STEP 7

SHOW: Independent verification gate

D3 adds one check the AI cannot mark complete for itself.

Bank details.

At least one category-specific fact must be verified outside the model output before approval can proceed.

That is where the review stops being performative.

This is the independent proof step in ASI09.

Otherwise, the same model that created the recommendation also becomes the judge.

And no one independently checks whether that recommendation is safe.

---

## STEP 8

SHOW: Pending data hold

D4 protects the workflow's right to stop early.

If required data is still missing, the system holds.

No polite guess.
No provisional certainty.
No, "approve now and fix later."

This stage surfaces the gap, instead of forcing a decision around it.

That matters because pressured workflows often convert uncertainty into approval momentum.

Take away this hold, and missing evidence becomes easy to ignore.

Instead of resolving the gap, the human is pushed to work around it.

---

## STEP 9

SHOW: Human-in-the-Loop Gate

D5 turns approval into a documented review event.

By this point, the reviewer has to show:

- source access
- completeness review
- independent verification

So a single click is no longer standing in for actual judgment.

If this governance layer is absent, the organization may still record an approval decision.

But it cannot prove that a real review actually happened.

---

## STEP 10

SHOW: Approved human outcome + D6 - Strong Observability

The Approved human outcome shows what genuine review looks like in practice.

The action proceeds only when three things line up.

The evidence supports it.
The review behavior supports it.
And the approval structure supports it.

And D6, Strong Observability, gives the organization visibility into:

- recommendation patterns
- source access
- missing-data holds
- independent checks
- approval behavior over time

That is how ASI09 defense becomes durable.
It reshapes the workflow so good review becomes the default path.

---

## FINAL TAKEAWAY

The strongest defense against ASI09 is not distrusting AI in the abstract.

It is:

make incompleteness visible,
force contact with the source,
require one independent check,
hold when key data is missing,
and turn approval into documented review instead of passive confirmation.
