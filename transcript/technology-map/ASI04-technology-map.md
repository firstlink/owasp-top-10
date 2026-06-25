# ASI04 Technology Map - Agentic Supply Chain Vulnerabilities

## Recording Flow
1. `Visible on load:` Attack chain and first term
2. `Click after each term explanation` to reveal the next term

## Read Script
### Opening
"Now let’s define the supply-chain language of ASI04.

This is the category where trust starts earlier than most teams expect.

The agent may already be compromised by what it loads, discovers, or inherits before the visible task begins."

### Attack Chain
"The chain is:
dependency found,
integrity unproven,
agent loads,
behavior compromised.

That is the runtime supply-chain story in one line."

### Term 1 - Agentic Supply Chain
"The Agentic Supply Chain is the full set of upstream assets an agent depends on to reason, connect, and act.

That includes models, tools, prompts, schemas, connectors, and runtime services."

`[Click after this term.]`

### Term 2 - MCP Server Impersonation
"MCP Server Impersonation is when a fake or swapped tool endpoint pretends to be a trusted capability provider.

If the agent accepts that identity, the compromise begins before the tool call even starts."

`[Click after this term.]`

### Term 3 - Template or Schema Poisoning
"Template or Schema Poisoning means a prompt template, contract, or schema is altered so the agent behaves unsafely while following it.

The agent thinks it is obeying structure.
But the structure itself is compromised."

`[Click after this term.]`

### Term 4 - Cryptographic Integrity Verification
"Cryptographic Integrity Verification uses signatures or digests to prove that an upstream asset has not been tampered with.

This is one of the strongest controls in ASI04 because it verifies source and integrity together."

`[Click after this term.]`

### Term 5 - AI Software Bill of Materials
"An AI Software Bill of Materials, or AI-SBOM, is the inventory of models, prompts, tools, schemas, connectors, and other runtime dependencies.

You cannot secure what you have not inventoried."

`[Click after this term.]`

### Term 6 - Allowlist and Source Pinning
"Allowlist and Source Pinning mean the system loads only approved components from fixed, trusted sources.

This converts open-ended runtime trust into governed trust."

`[Click after this term.]`

### Close
"Together, these terms explain the ASI04 pattern:
the agent finds a dependency,
never proves it properly,
loads it anyway,
and then treats compromised behavior as if it were trusted infrastructure."
