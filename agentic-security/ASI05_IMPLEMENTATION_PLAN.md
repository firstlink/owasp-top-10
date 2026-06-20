# ASI05 Implementation Plan

## Goal
Add ASI05 to the current OWASP Agentic Security website in the same style and structure as ASI01, ASI02, and ASI04, then validate that the new category, scenarios, and walkthroughs behave correctly across the existing site.

## Important Constraints
- Treat `/Users/firstlink/Downloads/guardrails_md/ASI05_Code_Execution_Scenarios.md` as the narrative source.
- Treat the three ASI05 SVGs as reference-only inputs, not as site assets to drop in directly.
- Follow the current site architecture used by ASI01, ASI02, and ASI04.
- Create a new interactive template only if the existing walkthrough template cannot clearly express ASI05 code-execution flows.
- The current worktree already has local edits in shared site files, so implementation should avoid overwriting unrelated changes.

## Current Site Structure

### Category layer
- `/Users/firstlink/Documents/owasp/agentic-security/index.html` renders the home grid.
- Category cards and scenario cards are driven from `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`.
- Dedicated category pages are thin wrappers:
  - `/Users/firstlink/Documents/owasp/agentic-security/asi01.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi02.html`
  - `/Users/firstlink/Documents/owasp/agentic-security/asi04.html`
- `ASI05` already exists in `asi-data.js`, but it is still a placeholder with `status: "planned"` and `href: "#"`.

### Scenario layer
- `/Users/firstlink/Documents/owasp/agentic-security/scenario.html` is a shared detail page.
- It reads `asi` and `scenario` query params and loads attack/defense views from `asi-data.js`.
- Tabs switch between Attack View and Defense View.

### Interactive layer
- `/Users/firstlink/Documents/owasp/agentic-security/interactive.html` loads:
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
  - `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`
- Most scenarios use the default attack template.
- ASI02 has one custom attack template (`attackTemplate: "asi02-loop"`), which proves the site already supports introducing a new specialized template when needed.

### Validation layer
- `/Users/firstlink/Documents/owasp/test/site.test.mjs` currently performs smoke checks for:
  - home page
  - one category page
  - one scenario page
  - one interactive page
  - shared CSS asset

## ASI05 Content to Add

### Category
- `ASI05`
- Title: `Unexpected Code Execution (RCE)` or the final title you want to keep from the current placeholder
- Summary: replace the current placeholder summary with production-ready copy aligned to the other live categories
- Status: change from `planned` to `in-progress` or `built`, depending on rollout preference
- Href: `./asi05.html`

### Scenario set
Map the markdown scenarios into three site scenarios:

1. `asi05-self-healing-disaster`
- Title: `The Self-Healing Disaster`
- Domain: DevOps / Infrastructure
- Theme: unsafe autonomous shell cleanup deletes backups

2. `asi05-pharmacy-sql-injection`
- Title: `The Drug Interaction Query Injection`
- Domain: Healthcare / Hospital Pharmacy
- Theme: natural-language-to-SQL pipeline executes injected destructive statements

3. `asi05-retail-inventory-shell`
- Title: `The Inventory Analytics Shell Escape`
- Domain: Retail / Supply Chain Operations
- Theme: uploaded CSV note becomes executable Python and launches a shell payload

These IDs should stay short, URL-safe, and consistent across `asi-data.js`, `walkthrough-data.js`, and query-string links.

## Recommended Delivery Approach

### Phase 1: Activate the ASI05 category
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/asi05.html`
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Create `asi05.html` as a near-copy of the live category pages, only changing:
  - page title
  - breadcrumb label
  - `data-asi-id="ASI05"`
  - hero heading
- Update the ASI05 category record in `asi-data.js` so the home card becomes clickable.

Acceptance check:
- Home page shows ASI05 as an active card.
- Opening `/asi05.html` renders the shared category layout and shows three scenario cards.

### Phase 2: Add ASI05 scenario metadata
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Add a full `scenarios` array under the `ASI05` category.
- For each scenario, provide the same fields used by ASI01/02/04:
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
- Rewrite the markdown source into site copy instead of pasting it verbatim.
- Keep copy length and tone consistent with ASI01/02/04.

Content guidance:
- Emphasize that ASI05 is about the agent generating or executing code/commands unsafely.
- Keep the “agentic” explanation distinct from ASI02 and ASI04:
  - ASI02: misuse of legitimate tools or execution authority
  - ASI04: runtime dependency trust failure
  - ASI05: untrusted input or unsafe reasoning produces executable code/commands

Acceptance check:
- Each ASI05 scenario card opens correctly via `scenario.html?asi=ASI05&scenario=...`
- Breadcrumbs, title, and tabs render correctly without additional scenario-page code changes.

### Phase 3: Add static attack/defense diagrams in the existing site format
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`

Work:
- Define `views.attack.diagram` and `views.defense.diagram` for all three ASI05 scenarios using the same node/edge structure already used by live categories.
- Use the SVG references only to inform story flow and major actors.
- Rebuild the diagrams in the site’s native visual language:
  - 6 major nodes
  - primary/danger/safe/neutral tones
  - short labels
  - clear left-to-right causal flow

Scenario-specific diagram intent:
- Scenario 1 should make the unsafe command scope error visually obvious.
- Scenario 2 should make the NL-to-SQL translation boundary visually obvious.
- Scenario 3 should make the data-to-code collapse visually obvious.

Acceptance check:
- If interactive walkthroughs are temporarily absent, the scenario pages should still render correctly using diagram fallback.

### Phase 4: Add interactive walkthroughs
Files:
- `/Users/firstlink/Documents/owasp/agentic-security/assets/walkthrough-data.js`
- Possibly `/Users/firstlink/Documents/owasp/agentic-security/assets/interactive-player.js`

Work:
- Add ASI05 attack and defense walkthrough entries for all three scenarios.
- Reuse the default attack/defense templates if they communicate the flow clearly.
- Introduce a new template only if needed for code-execution-specific semantics such as:
  - generated script panel
  - SQL statement chain
  - data field becoming executable code

Recommendation:
- Start by trying the default attack template for all three ASI05 scenarios.
- Add a new template only if one of these breaks readability:
  - command-generation emphasis
  - multi-statement SQL injection emphasis
  - data-to-code execution emphasis

Likely template decision:
- Scenario 1 and Scenario 2 can probably fit the default template.
- Scenario 3 may benefit most from a custom template if the “CSV content becomes live Python” transition feels too implicit.

Acceptance check:
- `/interactive.html?scenario=<id>&view=attack`
- `/interactive.html?scenario=<id>&view=defense`
- Each walkthrough loads, steps advance cleanly, and no “Walkthrough not found” state appears.

### Phase 5: Tighten category consistency
Files:
- Possibly `/Users/firstlink/Documents/owasp/agentic-security/assets/asi-data.js`
- Possibly `/Users/firstlink/Documents/owasp/test/site.test.mjs`

Work:
- Verify ASI05 matches the maturity and shape of ASI01/02/04.
- Confirm no assumptions in shared rendering break when a fourth live category is enabled.
- Keep ASI03 and ASI06-ASI10 as placeholders unless explicitly requested otherwise.

## Validation Plan

### Automated validation
Primary command:

```bash
npm test
```

Expand `/Users/firstlink/Documents/owasp/test/site.test.mjs` to cover ASI05 explicitly:
- Home page contains an active ASI05 entry or link target.
- `/asi05.html` returns 200 and includes `data-asi-id="ASI05"`.
- `/scenario.html?asi=ASI05&scenario=asi05-self-healing-disaster` returns 200 and contains scenario tabs.
- `/interactive.html?scenario=asi05-self-healing-disaster&view=attack` returns 200 and loads walkthrough assets.

Recommended additional assertions:
- Verify the ASI05 scenario page updates document structure similarly to other live categories.
- Verify at least one ASI05 interactive route per scenario family, not just one route total.

### Manual validation
Run the local server:

```bash
npm start
```

Manual checklist:
- Open the home page and confirm the ASI05 card is no longer “Coming soon”.
- Open `/asi05.html` and confirm all three scenario cards render with correct titles and short descriptions.
- Open each ASI05 scenario page and verify:
  - breadcrumb points back to `ASI05`
  - Attack View tab loads the right content
  - Defense View tab loads the right content
  - iframe height settles correctly
- Open each interactive view and click through every step.
- Check mobile-width behavior for:
  - ASI05 category page
  - one scenario page
  - one interactive walkthrough

### Content validation
Reviewer checklist:
- Ensure scenario language is distinct from ASI01, ASI02, and ASI04.
- Confirm every ASI05 attack centers on unsafe execution, not just bad tool selection.
- Confirm defenses map to code-execution controls such as:
  - sandboxing
  - parameterization
  - execution approval
  - dry-run mode
  - filesystem scope restrictions
  - subprocess restrictions
- Confirm SVG influence does not leak into a mismatched visual style.

## Risks and Decision Points

### 1. Shared files are already dirty
Risk:
- `asi-data.js`, `walkthrough-data.js`, `interactive-player.js`, `site.js`, `styles.css`, and several HTML files already have uncommitted changes.

Plan:
- Implement ASI05 incrementally and review current file contents before patching.
- Avoid large rewrites of shared files.

### 2. The default walkthrough template may or may not fit ASI05
Risk:
- Code-execution scenarios sometimes need a more explicit “generated code” or “statement chain” panel than the default template naturally conveys.

Plan:
- Prototype with the default template first.
- Add one focused ASI05-specific template only if readability fails in review.

### 3. Reference SVGs may tempt one-to-one copying
Risk:
- Directly mimicking the SVGs could create a visual break from the site’s current native diagrams.

Plan:
- Preserve only the narrative sequence and key actors from the SVGs.
- Re-express them in the site’s existing node-edge diagram style.

## Recommended Build Order
1. Add `asi05.html`.
2. Activate the ASI05 category record in `asi-data.js`.
3. Add all three ASI05 scenarios with static attack/defense diagrams.
4. Verify category and scenario routes work before touching interactive walkthroughs.
5. Add walkthrough data for all three scenarios.
6. Add a new interactive template only if one scenario still reads poorly.
7. Expand tests for ASI05.
8. Run `npm test`.
9. Run manual browser smoke checks.

## Definition of Done
- ASI05 is visible and clickable from the home page.
- `/asi05.html` exists and matches the current category-page structure.
- All three ASI05 scenarios render through the shared scenario page.
- Attack and defense views are available for each scenario.
- Walkthroughs load without missing-data errors.
- Automated tests pass.
- Manual smoke validation confirms layout, routing, and copy quality.
