# Defense Authoring Guide

This project already has strong attack storytelling. Defense pages should match that quality bar by showing a defended business storyline, not a static control inventory.

## Working Rule

Every defense page must answer three learner questions in order:

1. What attack variations is this page defending against?
2. In what sequence does the architecture apply defenses?
3. Why does the workflow still complete safely?

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

1. Choose one defended storyline that can reasonably cover the category's three attacks.
2. Name the three attack variations inside the narrative early.
3. Identify the common trust boundary the attacks share.
4. Map D1-D5 or D1-D6 controls in the order they would actually execute.
5. End on approved business execution plus observability.

Do not make the shared defense page abstract if a concrete defended workflow can carry the lesson better.

## Preferred Step Rhythm

For compact defense templates, prefer this rhythm:

1. Legitimate business task begins.
2. The agent or pipeline prepares the risky operation.
3. The trust boundary or attack surface is reached.
4. The category's attack variants are named.
5. D1 applies.
6. D2 applies.
7. D3 applies.
8. D4 applies.
9. D5 applies.
10. Safe execution completes under D6-style observability.

For categories that truly need a separate D6 card, keep a final outcome step after D6 rather than merging them too early.

## Review Loop

After editing a defense page:

1. Run the site tests.
2. Open the shared defense page in the browser.
3. Step through the walkthrough and confirm every narrative step appears in order.
4. Check for overlap, cramped labels, or cards that hide the real security lesson.
5. Tighten copy until the page is intuitive without narration.

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
- the control sequence is logically ordered
- the page remains visually readable
- the final outcome explains how the business process stays safe, not merely blocked
