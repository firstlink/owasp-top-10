# ASI08 Implementation Plan

## Goal
Add ASI08 to the current OWASP Agentic Security website in the same structure and tone as the live ASI01-ASI06 pages, then validate that the ASI08 category, scenario pages, and walkthroughs work cleanly in the current site.

## Important Constraints
- Treat `/Users/firstlink/Downloads/guardrails_md/ASI08_Cascading_Failures_Scenarios.md` as the narrative source of truth.
- Treat the three ASI08 SVGs as reference-only inputs:
  - `/Users/firstlink/Downloads/guardrails_svg/ASI08_S1_Financial_Trading_Cascade.svg`
  - `/Users/firstlink/Downloads/guardrails_svg/ASI08_S2_Retail_Christmas_Cascade.svg`
  - `/Users/firstlink/Downloads/guardrails_svg/ASI08_S3_Healthcare_Diagnosis_Cascade.svg`
- Follow the current website architecture instead of embedding the SVGs directly.
- Keep the ASI08 copy and behavior consistent with the existing ASI pages and shared scenario system.
- Create a new walkthrough template only where the existing templates do not clearly communicate the cascade mechanics.
- The worktree already contains unrelated local changes, so implementation should avoid overwriting any existing edits outside the ASI08 scope.

## Current Site Baseline

### Category layer
- `/Users/firstlink/Documents/owasp/agentic-security/index.html` renders the landing page.
- Category cards are data-driven from `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`.
- Thin category wrappers already exist for the live pages:
  - `/Users/firstlink/Documents/owasp/agentic-security/asi01.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi02.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi04.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi05.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi06.html`
- `ASI08` is currently still a placeholder in `asi-data.js` with:
  - `status: "planned"`
  - `href: "#"`
  - summary-only card data

### Scenario layer
- `/Users/firstlink/Documents/owasp/agentic-security/scenario.html` is the shared scenario-detail page.
- `/Users/firstlink/Documents/owasp/agentic-security/assets/site.js` reads `asi` and `scenario` query params and renders:
  - breadcrumb
  - scenario title
  - Attack View / Defense View tabs
  - iframe or static diagram fallback

### Interactive layer
- `/Users/firstlink/Documents/owasp/agentic-security/interactive.html` loads:
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`
- `interactive-player.js` already supports custom attack templates through `attackTemplate`.
- It currently supports:
  - `default`
  - `asi02-loop`
  - `asi06-memory`
  - `asi06-drift`
- Defense views currently use one shared renderer only. There is no `defenseTemplate` switch yet.

### Validation layer
- `/Users/firstlink/Documents/owasp/test/site.test.mjs` contains smoke coverage for:
  - home page
  - category page delivery
  - scenario page delivery
  - interactive page delivery
  - shared asset delivery
  - ASI05 content presence in the shared data asset

## Recommended ASI08 Content Shape

### Category
- ID: `ASI08`
- Title: `Cascading Failures`
- Href: `./asi08.html`
- Status: `in-progress` or `built`
- Summary direction:
  - emphasize a single bad upstream signal
  - emphasize amplification across connected agents
  - emphasize that each downstream agent can appear locally correct while the system fails globally

### Scenario set
Map the markdown content into three site scenarios:

1. `asi08-financial-trading-cascade`
- Title: `The Financial Trading Cascade`
- Domain: Finance / Algorithmic Trading
- Core mechanic: poisoned risk signal drives four autonomous agents into a £47M order

2. `asi08-retail-overstock-cascade`
- Title: `The Christmas Overstock Cascade`
- Domain: Retail / Supply Chain
- Core mechanic: poisoned electronics demand forecast propagates into confirmed supplier orders

3. `asi08-diagnosis-cascade`
- Title: `The Diagnosis Cascade`
- Domain: Healthcare / Clinical Pathway
- Core mechanic: false lab result flows through diagnosis, prescription, dispensing, and downstream billing

Note:
- The markdown uses `Black Friday Overstock Cascade`, while the SVG filename uses `Retail_Christmas_Cascade`.
- Pick one final user-facing title before implementation and keep it consistent across `asi-data.js`, `walkthrough-data.js`, and route links.
- `The Christmas Overstock Cascade` is the cleaner match to the provided asset naming, but either can work if used consistently.

## Why ASI08 Needs a Slightly Different Walkthrough Approach

### What fits the existing structure
- Category page structure can stay identical to the live ASI pages.
- Scenario page structure can stay identical to the shared `scenario.html` flow.
- Static Attack View and Defense View diagrams can still use the native `nodes` and `edges` structure in `asi-data.js`.

### What does not fit cleanly into the default attack template
The default attack walkthrough template assumes:
- one user or input node
- one main agent
- one payload or store
- one corrupted context state
- one tool action
- one outcome

ASI08 is different:
- the key story is multiple agents in sequence
- the important visual is amplification from stage to stage
- the missing safeguard is between-stage validation, not just one hijacked context window
- two of the scenarios have four-stage cascades, not one agent plus one tool

### Template recommendation
Create a new custom attack template for ASI08, for example:

```text
attackTemplate: "asi08-cascade"
```

This template should visually support:
- upstream poisoned input
- 3-4 agent stages
- stage-by-stage amplification
- missing circuit breakers or absent review gates
- final business or safety impact

### Defense template recommendation
Start with the existing shared defense template for the first pass.

Only add a defense-template extension if the standard layout cannot clearly show:
- stage-level validation checkpoints
- inter-agent plausibility checks
- threshold-based escalation
- human approval at high-impact boundaries

If that becomes necessary, extend `interactive-player.js` with a new `defenseTemplate` selector in a small isolated change rather than forcing the attack-template system to do both jobs.

## Recommended Delivery Plan

### Phase 1: Activate the ASI08 category shell
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/asi08.html`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Create `asi08.html` as a thin wrapper matching the live category pages.
- Update the `ASI08` category record in `asi-data.js`:
  - switch `href` from `#` to `./asi08.html`
  - switch `status` from `planned`
  - replace the placeholder summary with production-ready copy
  - add `trainerAngle`

Acceptance check:
- Home page card for ASI08 becomes clickable.
- `/asi08.html` loads the shared category layout.

### Phase 2: Add ASI08 scenario metadata
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Add a full `scenarios` array under `ASI08`.
- For each scenario, provide the same fields the live categories use:
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
- Rewrite the markdown into site-ready copy instead of pasting source prose directly.
- Keep the tone aligned with ASI05 and ASI06:
  - short business-focused descriptions
  - concrete impact
  - controls expressed as trainer-ready lessons

Content guidance:
- Make the agentic distinction explicit:
  - ASI05 is unsafe execution
  - ASI06 is poisoned memory
  - ASI08 is cross-agent propagation and amplification
- Keep the “each stage looked locally valid” idea prominent.

Acceptance check:
- `/scenario.html?asi=ASI08&scenario=<id>` loads for all three scenarios.
- Breadcrumbs and tabs work without any scenario-page code changes.

### Phase 3: Add native static diagrams for scenario pages
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Build fresh site-native diagrams instead of embedding the reference SVGs.
- Use the current `diagram` object structure with:
  - `width`
  - `height`
  - `nodes`
  - `edges`
- Keep the same site visual language:
  - `neutral`
  - `primary`
  - `danger`
  - `safe`
- Recreate the ASI08 ideas, not the exact SVG composition.

Diagram intent per scenario:
- Financial:
  - poisoned risk feed
  - analysis agent
  - allocation agent
  - sizing agent
  - execution agent
  - capital-loss outcome
- Retail:
  - poisoned demand feed
  - forecasting agent
  - replenishment agent
  - supplier ordering agent
  - confirmed orders
  - overstock / warehouse impact
- Healthcare:
  - corrupted lab result
  - interpretation or diagnosis agent
  - prescription agent
  - dispensing agent
  - billing spillover
  - patient harm outcome

Acceptance check:
- All three ASI08 scenario pages render useful diagrams even before interactive work is complete.

### Phase 4: Add ASI08 interactive walkthrough content
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`

Work:
- Add attack and defense walkthrough entries for all three ASI08 scenarios.
- Keep walkthrough copy step-based and operational, similar to ASI05 and ASI06.
- Add a dedicated ASI08 attack template to express the pipeline sequence clearly.

Recommended attack template behavior:
- Step 1: poisoned upstream input appears
- Step 2: first agent consumes and transforms it
- Step 3: second agent amplifies it
- Step 4: third or fourth agent operationalizes it
- Step 5: absence of inter-stage control is revealed
- Step 6+: business or safety impact lands

Recommended renderer shape:
- top lane: input and early-stage agents
- lower lane: later-stage agents and outcome
- explicit labels for amplification and missing guardrails
- more than one “agent box” visible at once

Implementation detail:
- extend the `buildAttackSteps()` registry and `renderAttackByTemplate()` registry in `interactive-player.js` for the new ASI08 template
- avoid changing shared default-template behavior for existing ASIs

Acceptance check:
- `/interactive.html?scenario=asi08-financial-trading-cascade&view=attack`
- `/interactive.html?scenario=asi08-retail-overstock-cascade&view=attack`
- `/interactive.html?scenario=asi08-diagnosis-cascade&view=attack`
- all load without `Walkthrough not found`
- steps advance cleanly
- labels remain readable on laptop-width screens

### Phase 5: Decide whether defense templating needs extension
Files:
- possibly `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`
- possibly `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`

Default recommendation:
- try the shared defense renderer first

Only extend if needed:
- if the ASI08 defense view cannot show stage-by-stage breakers clearly
- if a single guard / check / tool / outcome layout hides the multi-agent nature too much

If extended:
- add a `defenseTemplate` switch separately
- keep the standard defense path unchanged for existing ASIs
- use the ASI08-specific defense renderer to show:
  - source validation
  - cross-stage plausibility checks
  - threshold caps
  - human approval gates
  - anomaly detection between stages

### Phase 6: Add validation coverage
Files:
- `/Users/firstlink/Documents/owasp/test/site.test.mjs`

Work:
- Add ASI08-specific smoke tests matching the ASI05 coverage pattern.

Recommended additions:
- home page can serve with ASI08 now enabled
- `/asi08.html` returns `200` and includes `data-asi-id="ASI08"`
- `/scenario.html?asi=ASI08&scenario=asi08-financial-trading-cascade` returns `200`
- `/interactive.html?scenario=asi08-financial-trading-cascade&view=attack` returns `200`
- shared data asset includes:
  - `id: "ASI08"`
  - `href: "./asi08.html"`
  - all three ASI08 scenario IDs

Stretch improvement:
- add one test that fetches the interactive JS asset and asserts the new template key exists, which reduces the risk of adding walkthrough data without registering the renderer

## Validation Plan

### Automated validation
Primary command:

```bash
npm test
```

Expected validation areas:
- route delivery
- shared asset delivery
- ASI08 content presence in `asi-data.js`
- ASI08 interactive route presence

Important limitation:
- the current test suite is still smoke-level and does not execute browser-side tab switching or walkthrough stepping logic
- keep manual verification as part of completion criteria

### Manual validation
Run the local site:

```bash
npm start
```

Manual checklist:
- Open the home page and confirm ASI08 is no longer `Coming soon`.
- Open `/asi08.html` and confirm all three scenario cards render.
- Open each ASI08 scenario page and verify:
  - breadcrumb points back to `ASI08`
  - title matches the intended scenario
  - Attack View loads
  - Defense View loads
  - iframe height settles correctly
- Open each interactive route and step through every state.
- Confirm the ASI08 custom attack template remains visually consistent with the existing site.
- Check one mobile-width layout for:
  - `/asi08.html`
  - one scenario page
  - one interactive walkthrough

### Content validation
Reviewer checklist:
- Confirm each ASI08 scenario is about propagation across agents, not merely bad input to one model.
- Confirm the copy distinguishes ASI08 from:
  - ASI05 unsafe execution
  - ASI06 poisoned memory
- Confirm the “missing safeguard” is framed as absent inter-stage controls:
  - plausibility checks
  - bounded thresholds
  - approval gates
  - anomaly detection
- Confirm the site-native diagrams reflect the SVGs conceptually without importing their layout directly.

## Risks and Decision Points

### Highest-probability risk
The default attack walkthrough template will under-express ASI08 because it centers on one agent plus one payload. If implementation tries to force ASI08 into that template, the result will likely flatten the core concept and make ASI08 feel too similar to ASI01 or ASI05.

### Secondary risk
The shared defense renderer may be too simplified for multi-stage mitigation. If that happens, add defense-template support deliberately rather than overloading the existing guard/check boxes with too much text.

### Naming decision to settle early
Decide between:
- `The Black Friday Overstock Cascade`
- `The Christmas Overstock Cascade`

Make that decision before wiring scenario IDs, walkthrough labels, and test assertions.

### Rollout recommendation
Implement in this order:
1. Category activation
2. Scenario metadata
3. Static diagrams
4. Custom ASI08 attack walkthrough template
5. Defense walkthrough reuse or extension
6. Tests
7. Manual QA

This sequencing keeps ASI08 visible and reviewable early, while isolating the template work to the part of the system that actually needs it.
