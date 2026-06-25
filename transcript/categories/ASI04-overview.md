# ASI04 Overview - Agentic Supply Chain Vulnerabilities

## Recording Flow
1. `Visible on load:` How It Breaks
2. `Click 1:` Reveal Why This Matters
3. `Click 2:` Reveal Where It Enters

## Read Script
### Opening
"ASI04 is Agentic Supply Chain Vulnerabilities.

In simple terms, it means the agent trusts a dependency, component, or runtime source that should not have been trusted.

ASI04 asks us to look upstream.

Before an agent makes a single decision, it is already relying on a chain of dependencies:
servers, schemas, templates, connectors, registries, and runtime services.

If that trust chain is poisoned, the compromise begins before the visible workflow even starts."

### Section 1 - How It Breaks
"On the left, we have a trusted component.
That could be a registry, a template, a schema, or a connector.

In the middle, we have the AI agent discovering, loading, and executing that component.

On the right, we have the compromised dependency:
an impersonated server, a poisoned template, or a tampered schema.

The failure happens when the agent accepts that component before proving source, integrity, or approval.

At that point, the agent can inherit unsafe behavior directly from something it believed was safe."

`[Click 1 after: "something it believed was safe."]`

### Section 2 - Why This Matters
"Why is this easy to miss?

First, agent systems often load components dynamically.

Second, upstream assets are frequently trusted by default.

Third, one poisoned component can affect many downstream actions at once.

That is what makes ASI04 so serious.
The dangerous instruction may arrive through the very dependency the system was built to trust."

`[Click 2 after: "the system was built to trust."]`

### Section 3 - Where It Enters
"Common entry points include registries, MCP servers, prompt templates, schemas, connectors, and external APIs.

So when we talk about agent security, we are not only talking about prompts.

We are also talking about everything the agent can discover and load at runtime."

### Close
"In the next scenario, we’ll watch a banking assistant discover the wrong payment processor at runtime, and the workflow will still look perfectly normal while money is quietly skimmed away."
