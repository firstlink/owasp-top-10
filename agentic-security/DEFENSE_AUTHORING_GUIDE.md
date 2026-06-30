# Defense Authoring Guide

This project already has strong attack storytelling. Defense pages should match that quality bar, but the real goal is not theatrical narration. The real goal is teaching.

Defense pages must help a learner:

1. identify the security concept being explained right now
2. understand what that concept means in this ASI category
3. see how that concept interrupts the specific attack path
4. understand how later controls add layered protection
5. transfer the idea into a new agent implementation later

If a defense page feels stylish but the learner cannot explain the concept back in plain language, the page is not done.

## Teaching Rule

Every defense page must answer five learner questions in order:

1. What business workflow are we protecting?
2. What security boundary matters in this category?
3. What exact concept or control does this box represent?
4. How does that control help against this attack path?
5. Why does the workflow still complete safely after the full sequence?

## Box-By-Box Rule

When a walkthrough reveals a specific box, the narration must make it obvious that this box is the topic now.

For each box-level step, do all four:

1. name the box or control explicitly
2. define the concept in plain language
3. explain what it means in this ASI category
4. connect it to the attack path or trust boundary

Bad:

- "Now we move deeper into the workflow."
- "This is where the system becomes more secure."

Good:

- "This `Supply chain` box marks the runtime trust boundary."
- "Supply chain here means the set of MCPs, templates, and schemas the agent is willing to trust."
- "If the wrong dependency is accepted here, the rest of the workflow can still look normal while execution has already been reshaped."

## Vocabulary Rule

The learner should leave each defense page with new vocabulary, not just a vague sense of protection.

When a concept first appears in the course, define it clearly.

Examples:

- "Task-scoped identity"
- "AI-SBOM"
- "Intent Capsule"
- "Blast radius"
- "Outcome-level audit"
- "Cross-reference validation"

When that concept appears again in a later category, do not repeat the full beginner definition. Instead:

1. briefly remind the learner what it means
2. explain what it means here
3. explain what is different in this category

Example:

- "You have seen allowlisting before. In ASI04, the allowlist is not about user input. It is about which runtime components are even allowed to shape execution."

## Storytelling Rule

Storytelling is useful only when it improves understanding and retention.

Do not force a dramatic narrative if the learner would learn more from a clean operational explanation.

The best defense walkthroughs in this project should feel like:

- an experienced AI security architect
- teaching a real student
- while walking through a real system diagram

That means the copy should be:

- concrete
- concept-rich
- box-specific
- operational
- memorable without becoming theatrical

## Project-Specific Template Strategy

- `asi01-shared`
  Use when the core lesson is instruction-versus-data separation and protected intent.
- `asi02-shared-compact`
  Use when the flow is: request, planning or boundary, attack-pattern family, D1-D5 controls, safe outcome, observability.
- `shared-compact`
  Use when the category needs an explicit D6 stage before the final approved outcome.

If a category's trust boundary does not fit these orders cleanly, add a new reusable template instead of forcing the wrong one.

## Visual Constraints From The Current Site

- Node titles should fit in two lines.
- Node body text should fit in two lines.
- Arrow labels should be short transition phrases, not paragraphs.
- High-detail explanation belongs in the bottom step panel, not in the SVG node.
- Untrusted or dangerous content should read visually distinct from safe-path controls.
- Governance and outcome stages should appear late in the flow, after the earlier technical controls.
- The diagram must still read left-to-right or top-to-bottom in one continuous path.

## Shared Defense Page Construction

For each ASI shared defense page:

1. Choose one main defended scenario.
2. Keep the learner inside that one scenario unless a brief variant mention adds real value.
3. Name the trust boundary clearly and early.
4. Make each revealed box teach one named concept.
5. Show how each layer helps, what it does not solve alone, and why the next layer still matters.
6. End with a safe business outcome plus observability.

Do not keep re-listing all three attack scenarios throughout the walkthrough if that steals attention from the defense lesson.
Use other variants only when they help explain why the same control pattern matters more broadly.

Do not make the shared defense page abstract if a concrete defended workflow can carry the lesson better.

## Preferred Step Rhythm

For compact defense templates, prefer this rhythm:

1. Legitimate business task begins.
2. Name the business goal and what must still be allowed.
3. The agent or pipeline prepares the risky operation.
4. The trust boundary or attack surface is reached.
5. Explain the boundary in plain language.
6. D1 applies and is defined.
7. D2 applies and explains what survives D1.
8. D3 applies as an independent or external check.
9. D4 applies as a live constraint or action boundary.
10. D5 applies as governance or approval where needed.
11. Safe execution completes under D6-style observability.

For categories that truly need a separate D6 card, keep a final outcome step after D6 rather than merging them too early.

## Step Detail Formula

When writing step details for the interactive walkthrough, use this formula:

1. Name the box.
2. Define the concept.
3. Explain why it matters here.
4. Explain how it helps against the attack.

Example:

- "The `Supply chain` box is the runtime trust boundary."
- "Supply chain here means the templates, schemas, and MCPs the agent is willing to trust."
- "That matters because the agent can stay obedient while a poisoned dependency quietly reshapes execution."
- "This is why later controls verify membership, integrity, schema drift, and live behavior instead of trusting discovery by default."

## Review Loop

After editing a defense page:

1. Run the site tests.
2. Open the shared defense page in the browser.
3. Step through the walkthrough and confirm every narrative step appears in order.
4. Check whether the learner would know exactly which box or concept is being explained at each step.
5. Check for overlap, cramped labels, or cards that hide the real security lesson.
6. Tighten copy until the page is intuitive without narration.

## Files That Usually Need Changes

- `prompts/story-telling-defense.md`
  Universal defense authoring prompt.
- `agentic-security/assets/walkthrough-data.js`
  Step-by-step defense story and node copy.
- `agentic-security/assets/interactive-player.js`
  Template reveal order and reusable diagram structure.
- `agentic-security/assets/asi-data.js`
  Category card descriptions, summaries, and shared-defense captions when the page framing changes.

## Definition Of Done

A defense page is ready when:

- the step builder reveals every intended narrative step
- the page covers the attack differences it claims to cover
- each box teaches a specific concept rather than vague reassurance
- the learner can say what each control means in this category
- the learner can explain how each layer contributes to stopping the attack
- the control sequence is logically ordered
- the page remains visually readable
- the final outcome explains how the business process stays safe, not merely blocked
