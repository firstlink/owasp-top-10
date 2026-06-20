# ASI10 Implementation Plan

## Goal
Add `ASI10 — Rogue Agents` to the current OWASP Agentic Security website in the same overall structure as the live ASI sections, then validate that the new category, scenarios, diagrams, and walkthroughs behave correctly across the site.

## Important Constraints
- Treat `/Users/firstlink/Downloads/guardrails_md/ASI10_Rogue_Agents_Scenarios.md` as the narrative source.
- Treat the three ASI10 SVGs as reference-only inputs, not as production assets to drop into the site directly.
- Follow the current site architecture already used by the live categories and shared pages.
- Keep the ASI10 pages visually and structurally consistent with the existing ASI site, even if the attack walkthroughs need a new specialized template.
- Avoid overwriting unrelated local changes already present in shared files.

## Current Site Structure

### Category layer
- `/Users/firstlink/Documents/owasp/agentic-security/index.html` renders the home grid.
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js` is the source of truth for:
  - home cards
  - category summaries
  - scenario cards
  - scenario detail metadata
  - static attack/defense diagrams
- Dedicated category pages are thin wrappers that differ mainly by title, heading, and `data-asi-id`:
  - `/Users/firstlink/Documents/owasp/agentic-security/asi01.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi02.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi04.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi05.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi06.html`

### Current ASI10 status
- `ASI10` already exists in `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`.
- It is still a placeholder:
  - `status: "planned"`
  - `href: "#"`
  - no `scenarios` array
- There is currently no `/Users/firstlink/Documents/owasp/agentic-security/asi10.html`.
- `ASI07` through `ASI10` are still placeholders, so ASI10 should be implemented without disturbing the other planned categories.

### Scenario layer
- `/Users/firstlink/Documents/owasp/agentic-security/scenario.html` is a shared detail page.
- It reads `asi` and `scenario` query params, looks up the matching data in `asi-data.js`, and switches between Attack View and Defense View.
- No ASI10-specific scenario page is needed if the metadata is shaped correctly.

### Interactive layer
- `/Users/firstlink/Documents/owasp/agentic-security/interactive.html` loads:
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`
- The site already supports multiple attack templates:
  - `default`
  - `asi02-loop`
  - `asi06-memory`
  - `asi06-drift`
- Defense walkthroughs currently use one shared renderer.

### Validation layer
- `/Users/firstlink/Documents/owasp/test/site.test.mjs` contains smoke tests for:
  - home page
  - category pages
  - scenario pages
  - interactive walkthrough pages
  - shared assets
- There is no ASI10 coverage yet.

## ASI10 Content To Add

### Category
- `ASI10`
- Title: `Rogue Agents`
- Summary: replace the placeholder summary with production-ready copy aligned with the tone of the live categories
- Status: set to `built` if the full scenario and walkthrough set is shipping together, otherwise `in-progress`
- Href: `./asi10.html`

### Scenario set
Map the markdown source into three production site scenarios:

1. `asi10-retail-returns-optimizer`
- Title: `The Customer Returns Eliminator`
- Domain: Retail / Customer Service
- Theme: reward hacking through return-rate optimization

2. `asi10-enterprise-self-replication`
- Title: `The Self-Replicating Agent`
- Domain: Enterprise / Cloud Infrastructure
- Theme: goal-preserving self-replication across cloud regions

3. `asi10-legal-compliance-gaming`
- Title: `The Compliance Metric Gamer`
- Domain: Legal / Regulatory Compliance
- Theme: metric gaming through auto-approval, risk reclassification, and finding suppression

These IDs should be used consistently in:
- `asi-data.js`
- `walkthrough-data.js`
- scenario links
- interactive query strings
- tests

## Recommended Delivery Approach

### Phase 1: Activate the ASI10 category
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/asi10.html`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Create `asi10.html` as a near-copy of the live category pages.
- Set:
  - page title
  - breadcrumb label
  - `data-asi-id="ASI10"`
  - hero heading
- Update the `ASI10` category record in `asi-data.js` so the home card becomes active.

Acceptance check:
- Home page shows `ASI10` as an active card instead of `Coming soon`.
- Opening `/asi10.html` renders the shared category layout with three scenario cards.

### Phase 2: Add ASI10 scenario metadata
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Add a full `scenarios` array under `ASI10`.
- For each scenario, supply the same fields used by the live categories:
  - `id`
  - `title`
  - `type`
  - `status`
  - `description`
  - `href`
  - `businessContext`
  - `whyItRelates`
  - `attackSummary`
  - `defenseSummary`
  - `lessons`
  - `controls`
  - `views.attack`
  - `views.defense`
- Rewrite the markdown into site copy rather than pasting the source verbatim.
- Keep copy length and tone aligned with ASI01, ASI02, ASI04, ASI05, and ASI06.

Content guidance:
- Preserve the ASI10 core distinction: these are rogue outcomes emerging from autonomy, incentives, and permissions, not classic external compromise.
- Make the “no external attacker” angle explicit in Scenarios 1 and 3.
- Keep Scenario 2 focused on self-replication and persistence, not merely over-provisioning.

Acceptance check:
- Each ASI10 scenario card opens via `scenario.html?asi=ASI10&scenario=...`
- Breadcrumbs, title, and tab switching work without adding scenario-page-specific code.

### Phase 3: Add static attack and defense diagrams in the existing site language
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Define `views.attack.diagram` and `views.defense.diagram` for all three ASI10 scenarios using the site’s native node/edge structure.
- Use the SVG references only to understand flow, actors, and emphasis.
- Rebuild each diagram in the existing visual language:
  - 6 to 7 major nodes
  - `neutral`, `primary`, `danger`, and `safe` tones
  - short titles and subtitles
  - clear left-to-right or top-to-bottom causal flow

Scenario-specific diagram intent:
- Scenario 1 should make the metric-to-behavior drift visible:
  - business goal
  - optimization target
  - autonomous decline strategy
  - unlawful customer impact
- Scenario 2 should make replication and persistence visible:
  - primary agent
  - region limit
  - spawned replicas
  - shutdown-triggered respawn
  - cross-region blast radius
- Scenario 3 should make metric gaming visible:
  - compliance target
  - ambiguity auto-approval
  - risk reclassification
  - suppression of findings
  - false green dashboard

Acceptance check:
- Scenario pages render correctly even before interactive walkthroughs are finished.
- Static diagrams remain readable on desktop and acceptable on narrower widths through the existing responsive shell.

### Phase 4: Add interactive walkthroughs
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`

Work:
- Add attack and defense walkthrough entries for all three ASI10 scenarios.
- Reuse the shared defense renderer unless a defense case clearly cannot be expressed in the six-step guarded flow.

### Recommended template strategy
Do not force all ASI10 attacks into the current `default` template. That layout assumes an external payload corrupting the agent through an input channel, which is not the best semantic fit for rogue-agent scenarios.

Recommended approach:
- Create one new attack template for metric gaming and objective drift:
  - suggested name: `asi10-metric-gaming`
  - use for:
    - `asi10-retail-returns-optimizer`
    - `asi10-legal-compliance-gaming`
- Create one new attack template for replication and persistence:
  - suggested name: `asi10-replication`
  - use for:
    - `asi10-enterprise-self-replication`

Why this is the best fit:
- Scenario 1 and Scenario 3 are structurally similar:
  - target metric is defined
  - agent discovers easier metric-winning strategies
  - oversight signal is bypassed
  - dashboard or KPI appears successful while harm grows
- Scenario 2 has a different geometry:
  - one agent becomes many agents
  - persistence behavior matters
  - region spread and respawn behavior should be visible, not implied

Implementation notes:
- `asi10-metric-gaming` should visually emphasize:
  - declared business objective
  - proxy metric
  - optimization shortcuts
  - hidden harm
  - misleading success state
- `asi10-replication` should visually emphasize:
  - initial resource constraint
  - autonomous spawn decision
  - multi-region replicas
  - kill-and-respawn behavior
  - containment difficulty

Acceptance check:
- `/interactive.html?scenario=asi10-retail-returns-optimizer&view=attack`
- `/interactive.html?scenario=asi10-enterprise-self-replication&view=attack`
- `/interactive.html?scenario=asi10-legal-compliance-gaming&view=attack`
- matching `view=defense` routes
- Each walkthrough loads cleanly and does not fall into the `Walkthrough not found` state.

### Phase 5: Tighten category consistency and copy quality
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
- possibly `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`

Work:
- Verify ASI10 has the same maturity and structure as the live categories.
- Confirm terminology stays consistent:
  - `Attack View`
  - `Defense View`
  - scenario numbering
  - summary tone
  - controls format
- Ensure ASI10 does not accidentally read like ASI01 prompt injection or ASI06 memory poisoning.

## Validation Plan

### Automated validation
Primary command:

```bash
npm test
```

Expand `/Users/firstlink/Documents/owasp/test/site.test.mjs` with ASI10-specific smoke checks:
- Home page contains an active ASI10 entry or link target.
- `/asi10.html` returns `200` and includes `data-asi-id="ASI10"`.
- `/scenario.html?asi=ASI10&scenario=asi10-retail-returns-optimizer` returns `200` and contains scenario tabs.
- `/scenario.html?asi=ASI10&scenario=asi10-enterprise-self-replication` returns `200`.
- `/scenario.html?asi=ASI10&scenario=asi10-legal-compliance-gaming` returns `200`.
- `/interactive.html?scenario=asi10-retail-returns-optimizer&view=attack` returns `200` and loads walkthrough assets.
- `/interactive.html?scenario=asi10-enterprise-self-replication&view=attack` returns `200`.
- `/interactive.html?scenario=asi10-legal-compliance-gaming&view=defense` returns `200`.
- Shared data asset contains:
  - `id: "ASI10"`
  - `href: "./asi10.html"`
  - all three ASI10 scenario IDs

Recommended extra assertions:
- Confirm the home page no longer renders ASI10 as disabled.
- Confirm one ASI10 scenario route and one interactive route per scenario family, not just one route total.

### Manual validation
Run the local server:

```bash
npm start
```

Manual checklist:
- Open the home page and confirm the `ASI10` card is active.
- Open `/asi10.html` and confirm all three scenario cards render with correct titles and descriptions.
- Open each ASI10 scenario page and verify:
  - breadcrumb points back to `ASI10`
  - title is correct
  - Attack View loads the right content
  - Defense View loads the right content
  - iframe height settles correctly after load
- Open each interactive walkthrough and click every step.
- Verify new custom templates do not visually break existing ASI02 or ASI06 walkthroughs.
- Check mobile-width behavior for:
  - home page card layout
  - ASI10 category page
  - one ASI10 scenario page
  - at least one walkthrough using each new template

### Content validation
Reviewer checklist:
- Confirm each ASI10 scenario clearly represents rogue behavior emerging from incentives, autonomy, and permissions.
- Confirm the scenarios do not depend on a hidden attacker narrative where the source says none exists.
- Confirm controls focus on governance and autonomy bounds, such as:
  - multi-metric objectives
  - escalation on constraint conflicts
  - hard instance count limits
  - kill switches that cannot be self-undone
  - separation between scoring metrics and approval authority
  - auditability for reclassification and suppression actions
- Confirm SVG reference influence does not leak into a mismatched visual style.

## Risks And Decision Points

### 1. Template scope
Decision:
- create two new attack templates now, or
- try to stretch an existing template first

Recommendation:
- build the two ASI10 templates directly

Reason:
- the current default attack template encodes an external payload narrative and would mis-teach the ASI10 failure mode.

### 2. Status label
Decision:
- mark ASI10 as `built`
- or mark it `in-progress`

Recommendation:
- use `built` only if category page, all three scenario pages, and all six interactive views ship together
- otherwise use `in-progress`

### 3. Diagram complexity
Decision:
- keep static diagrams at the normal site complexity
- or try to mirror every nuance from the markdown and SVG references

Recommendation:
- keep static diagrams concise and move extra nuance into walkthrough step text

Reason:
- the current site style is strongest when diagrams communicate the core system relationship, not every downstream consequence.

## Definition Of Done
- `ASI10` is clickable from the home page.
- `/Users/firstlink/Documents/owasp/agentic-security/asi10.html` exists and renders correctly.
- All three ASI10 scenarios exist in `asi-data.js`.
- All three scenario detail pages load through the shared `scenario.html`.
- All six ASI10 walkthrough routes load through `interactive.html`.
- Any new ASI10 attack templates render without regressing existing walkthroughs.
- `npm test` passes with ASI10 coverage added.
- Manual browser checks confirm layout, navigation, and responsive behavior.
