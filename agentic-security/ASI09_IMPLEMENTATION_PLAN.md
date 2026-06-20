# ASI09 Implementation Plan

## Goal
Add ASI09 to the current OWASP Agentic Security website in the same style and structure as the existing live categories, then validate that the new category, scenarios, and walkthroughs behave correctly across the current site.

## Important Constraints
- Treat `/Users/firstlink/Downloads/guardrails_md/ASI09_Human_Trust_Scenarios.md` as the narrative source.
- Treat the three ASI09 SVGs as reference-only inputs, not as assets to drop into the site directly:
  - `/Users/firstlink/Downloads/guardrails_svg/ASI09_S1_Finance_Invoice_Fraud.svg`
  - `/Users/firstlink/Downloads/guardrails_svg/ASI09_S2_HR_Phantom_Candidate.svg`
  - `/Users/firstlink/Downloads/guardrails_svg/ASI09_S3_Healthcare_Medical_Overconfidence.svg`
- Follow the current site architecture already used by the live categories rather than the placeholder categories.
- Keep the ASI09 addition visually and structurally consistent with the site’s native diagrams, copy tone, and walkthrough interactions.
- Create a new walkthrough template only if the existing template does not clearly express the human-approval and automation-bias moment that makes ASI09 distinct.
- Avoid overwriting unrelated local changes in shared site files.

## Current Site Structure

### Category layer
- `/Users/firstlink/Documents/owasp/agentic-security/index.html` renders the home grid through shared data.
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js` is the main source of truth for:
  - category cards
  - scenario cards
  - scenario page content
  - attack/defense diagram definitions
- Dedicated category pages are thin wrappers that follow the same structure:
  - `/Users/firstlink/Documents/owasp/agentic-security/asi01.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi02.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi04.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi05.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi06.html`
- Current status in `asi-data.js`:
  - live: `ASI01`, `ASI02`, `ASI04`, `ASI05`, `ASI06`
  - placeholders: `ASI03`, `ASI07`, `ASI08`, `ASI09`, `ASI10`
- `ASI09` already exists as a placeholder with:
  - `status: "planned"`
  - `href: "#"`
  - summary only

### Scenario layer
- `/Users/firstlink/Documents/owasp/agentic-security/scenario.html` is the shared detail page for every scenario.
- It reads `asi` and `scenario` query params and loads content from `asi-data.js`.
- Tabs switch between Attack View and Defense View.
- If a walkthrough route is unavailable, the page can still render diagram fallback from `views.attack.diagram` and `views.defense.diagram`.

### Interactive layer
- `/Users/firstlink/Documents/owasp/agentic-security/interactive.html` loads:
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`
- The default attack template is used for most attack flows.
- Existing custom attack templates already prove the site can support specialized flows:
  - `asi02-loop`
  - `asi06-memory`
  - `asi06-drift`
- Defense walkthroughs currently share one common template.

### Validation layer
- `/Users/firstlink/Documents/owasp/test/site.test.mjs` already performs smoke checks for:
  - home page
  - category pages
  - scenario pages
  - interactive walkthrough pages
  - shared assets
  - shared data content

## ASI09 Content to Add

### Category
- `ASI09`
- Title: `Human-Agent Trust Exploitation`
- Status: change from `planned` to `in-progress`
- Href: `./asi09.html`
- Summary: replace the current placeholder summary with production-ready copy aligned to the other live categories
- Trainer angle: add copy that distinguishes ASI09 from prompt injection and code execution by centering the human approval layer

Suggested summary direction:
- Humans are manipulated into approving harmful actions because the agent presents polished, confident, incomplete, or misleading recommendations that suppress independent verification.

Suggested trainer angle direction:
- Teach ASI09 as approval-layer compromise: the agent’s output looks authoritative enough that the human reviewer stops checking the underlying evidence.

### Scenario set
Map the markdown scenarios into three site scenarios:

1. `asi09-confident-invoice-fraud`
- Title: `The Confident Invoice Fraud`
- Domain: Finance / Accounts Payable
- Theme: a confident AI approval summary causes the finance manager to skip bank-account verification

2. `asi09-phantom-candidate`
- Title: `The Phantom Candidate`
- Domain: HR / Talent Acquisition
- Theme: a fabricated AI candidate summary overrides the manager’s own review of the CV

3. `asi09-medical-overconfidence`
- Title: `Medical Overconfidence`
- Domain: Healthcare / Emergency Medicine
- Theme: a high-confidence AI diagnostic recommendation causes a junior doctor to act before critical data is available

These IDs should stay URL-safe and consistent across:
- `asi-data.js`
- `walkthrough-data.js`
- `scenario.html` links
- `interactive.html` links
- test assertions

## Recommended Delivery Approach

### Phase 1: Activate the ASI09 category
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/asi09.html`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Create `asi09.html` as a near-copy of the live category pages, only changing:
  - page title
  - breadcrumb label
  - `data-asi-id="ASI09"`
  - hero heading
- Update the `ASI09` category record in `asi-data.js` so the home card becomes clickable.
- Add `trainerAngle` alongside the final summary copy.

Acceptance check:
- Home page shows ASI09 as an active card instead of a placeholder.
- Opening `/asi09.html` renders the shared category layout and shows three scenario cards.

### Phase 2: Add ASI09 scenario metadata
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Add a full `scenarios` array under `ASI09`.
- For each scenario, provide the same fields used by the live categories:
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
- Rewrite the markdown into site-ready copy rather than pasting the source text directly.
- Keep copy length, reading level, and tone aligned with ASI04, ASI05, and ASI06.

Content guidance:
- Keep ASI09 distinct from nearby categories:
  - ASI01: the agent’s goal is changed by malicious content
  - ASI05: unsafe inputs become executable code or commands
  - ASI06: poisoned memory affects later reasoning
  - ASI09: the agent’s polished output manipulates the human approver into unsafe trust
- Make the human decision point explicit in every scenario.
- Keep the agent “working as designed” in the narrative; the vulnerability is the trust presentation and missing approval controls.

Acceptance check:
- Each ASI09 scenario card opens correctly through `scenario.html?asi=ASI09&scenario=...`
- Breadcrumbs, titles, and tabs render correctly without shared scenario-page changes.

### Phase 3: Add static attack/defense diagrams in the site’s native format
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Define `views.attack.diagram` and `views.defense.diagram` for all three ASI09 scenarios.
- Use the SVG references only to inform actors, sequence, and business impact.
- Rebuild each diagram in the existing site language:
  - 6 major nodes
  - short titles
  - clear left-to-right causal flow
  - primary/danger/safe/neutral tones

Recommended diagram shape for ASI09 attack flows:
- source evidence or business input
- AI agent analysis layer
- AI recommendation or confidence layer
- human reviewer / approver
- business action or medication / offer / payment step
- impact node

Scenario-specific emphasis:
- Scenario 1 should visually expose the missing bank-account verification step and the confident approval language.
- Scenario 2 should visually show the split between the real CV and the fabricated AI summary that the manager trusts.
- Scenario 3 should visually show incomplete clinical data versus high-confidence recommendation.

Acceptance check:
- Each ASI09 scenario page renders correctly even before interactive walkthroughs are added.
- Attack and defense diagrams feel visually native to the current site rather than copied from the reference SVGs.

### Phase 4: Add interactive walkthroughs
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
- Possibly `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`

Work:
- Add attack and defense walkthrough entries for all three ASI09 scenarios.
- Start by attempting the existing default attack template and shared defense template.
- Evaluate whether the default attack template clearly communicates:
  - the AI recommendation layer
  - the human approval or reliance step
  - the missing independent verification step

Recommendation:
- Expect the defense template to work without customization.
- Expect at least one ASI09-specific attack template to be useful if the default view makes the flow look too similar to ASI01 prompt-injection patterns.

Likely custom-template direction:
- Template name example: `asi09-trust-review`
- Template goal: emphasize approval-layer trust rather than hidden payload execution
- Useful panels for the custom attack template:
  - source document or observed data
  - AI recommendation summary
  - confidence or authority cue
  - human reviewer decision
  - downstream action
  - business or safety impact

Why a custom template may be warranted:
- ASI09 is not fundamentally about the agent ingesting a hidden instruction and changing its own goal.
- The most important visual moment is the human substituting the AI’s summary for their own review.
- The current default attack template is excellent for “payload enters context and changes action” flows, but may underplay the human trust boundary that defines ASI09.

Acceptance check:
- `/interactive.html?scenario=<id>&view=attack`
- `/interactive.html?scenario=<id>&view=defense`
- Each walkthrough loads without the “Walkthrough not found” state.
- The attack view makes the human trust failure obvious in one pass.

### Phase 5: Tighten category consistency
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
- Possibly `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`

Work:
- Verify ASI09 matches the maturity level of the current live categories.
- Keep `ASI03`, `ASI07`, `ASI08`, and `ASI10` as placeholders unless explicitly requested otherwise.
- Make sure ASI09 does not accidentally borrow the conceptual framing of:
  - ASI01 hidden-instruction compromise
  - ASI05 execution compromise
  - ASI06 memory compromise

## Scenario-by-Scenario Content Guidance

### Scenario 1: The Confident Invoice Fraud
Implementation focus:
- The invoice itself should look mostly legitimate.
- The AI’s recommendation should be the attack surface, not the invoice parser alone.
- The decisive missing control is bank-account verification against the vendor master file.

Recommended defense emphasis:
- payment verification for changed or high-risk bank details
- mandatory evidence view before approval
- step-up review for high-value payments
- recommendation language that explicitly lists unverified fields

### Scenario 2: The Phantom Candidate
Implementation focus:
- Preserve the distinction between the manipulated source CV and the polished AI summary.
- The hiring manager’s over-trust in the summary is the dangerous approval step.
- Keep the fabricated details specific enough to feel plausible, but do not let the site copy bloat.

Recommended defense emphasis:
- hidden-text or document-layer detection
- source-to-summary cross-checking
- mandatory source CV review before interview advancement or offer
- explicit flags when summary claims are not grounded in extracted evidence

### Scenario 3: Medical Overconfidence
Implementation focus:
- Keep this scenario framed as human trust exploitation even though there is no external attacker.
- Make the incomplete-data problem visible beside the high confidence score.
- Keep the risk narrative concrete: provisional AI certainty is misread as complete diagnostic certainty.

Recommended defense emphasis:
- confidence plus data-completeness display
- hard stops for high-risk medication recommendations with incomplete data
- senior review or escalation before high-risk intervention
- explicit “do not act until pending results arrive” states

## Validation Plan

### Automated validation
Primary command:

```bash
npm test
```

Expand `/Users/firstlink/Documents/owasp/test/site.test.mjs` to cover ASI09 explicitly:
- Home page contains an active ASI09 entry or link target.
- `/asi09.html` returns `200` and includes `data-asi-id="ASI09"`.
- `/scenario.html?asi=ASI09&scenario=asi09-confident-invoice-fraud` returns `200` and contains scenario tabs.
- `/interactive.html?scenario=asi09-confident-invoice-fraud&view=attack` returns `200` and loads walkthrough assets.
- `/assets/asi-data.js` includes:
  - `id: "ASI09"`
  - `href: "./asi09.html"`
  - all three ASI09 scenario IDs

Recommended additional assertions:
- Verify at least one ASI09 defense walkthrough route.
- Verify one scenario from each ASI09 family, not just one total route.
- If a custom template is introduced, add a test that ensures the walkthrough data includes the template-bound scenario.

### Manual validation
Primary command:

```bash
npm start
```

Manual checklist:
- Open the home page and confirm the ASI09 card is no longer “Coming soon”.
- Open `/asi09.html` and confirm all three scenario cards render with correct titles and short descriptions.
- Open each ASI09 scenario page and verify:
  - breadcrumb points back to `ASI09`
  - Attack View loads correctly
  - Defense View loads correctly
  - iframe height settles correctly
- Open each interactive route and click through every step.
- If a custom ASI09 attack template is added, verify it does not break existing categories.
- Check mobile-width behavior for:
  - ASI09 category page
  - one ASI09 scenario page
  - one ASI09 interactive walkthrough

Recommended manual content review:
- Confirm the human approver is visually present in each attack flow.
- Confirm the defenses do not over-rotate into generic “be careful” advice and instead show concrete workflow controls.
- Confirm the medical scenario communicates provisional confidence versus complete evidence.

## Risks and Decision Points

### 1. The current site is not uniformly complete from ASI01 to ASI08
Risk:
- “Follow ASI01 to ASI08” could imply a uniform pattern, but the real implementation baseline is the live set: `ASI01`, `ASI02`, `ASI04`, `ASI05`, and `ASI06`.

Plan:
- Follow the actual live-category structure already in production.
- Leave placeholders untouched unless the ASI09 implementation reveals a shared rendering issue.

### 2. The default attack template may blur ASI09 into ASI01
Risk:
- If the attack walkthrough emphasizes hidden content too much, ASI09 could look like another prompt-injection category.

Plan:
- Prototype the first scenario with the default template.
- If the human approval moment is not visually dominant, add one focused ASI09-specific attack template and reuse it across all three scenarios where appropriate.

### 3. The medical scenario has no external attacker
Risk:
- The third scenario could feel inconsistent with the other two unless the plan clearly frames the vulnerability as trust exploitation rather than external compromise.

Plan:
- Treat the design itself as the exploitable condition.
- Make the confidence-with-incomplete-data problem explicit in both copy and diagrams.

### 4. Reference SVGs may tempt one-to-one reproduction
Risk:
- Directly copying layout or visual language from the supplied SVGs could break site consistency.

Plan:
- Recreate the sequence in the native diagram system already used inside `asi-data.js`.
- Use the SVGs for story flow only.

### 5. Shared files already carry broad site responsibility
Risk:
- `asi-data.js`, `walkthrough-data.js`, and `interactive-player.js` affect multiple live categories.

Plan:
- Make incremental edits.
- Validate ASI01, ASI05, and ASI06 routes after any shared-template change.

## Suggested Implementation Order
1. Create `/Users/firstlink/Documents/owasp/agentic-security/asi09.html`.
2. Activate the ASI09 category record in `asi-data.js`.
3. Add all three ASI09 scenarios with static attack/defense diagrams.
4. Add walkthrough data for all three scenarios.
5. Add an ASI09-specific attack template only if readability requires it.
6. Expand `test/site.test.mjs` for ASI09 coverage.
7. Run automated validation and manual route checks.

## Definition of Done
- ASI09 is visible and clickable from the home page.
- `/asi09.html` renders through the same shared category architecture as the current live categories.
- All three ASI09 scenarios render through `scenario.html`.
- All three ASI09 attack and defense walkthroughs load through `interactive.html`.
- The final ASI09 presentation clearly teaches human trust exploitation rather than goal hijack, runtime dependency compromise, unsafe execution, or memory poisoning.
- Automated tests pass and manual walkthrough checks succeed.
