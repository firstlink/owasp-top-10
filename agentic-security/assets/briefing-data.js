window.OWASP_ASI_BRIEFING_DATA = {
  "ASI01": {
    "overview": {
      "hero": "The workflow still looks correct, but the intent has already shifted.",
      "band": "Attacker-controlled content changes the agent's objective, task selection, or decision path.",
      "mechanismIntro": "Untrusted content reaches the same reasoning context and changes the next decision.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Expected instruction",
        "leftTitle": "Legitimate task",
        "leftText": "\"Process this refund\"",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "AI agent",
        "centerText": "Reads, decides, acts.",
        "rightTone": "danger-soft",
        "rightLabel": "Untrusted content",
        "rightTitle": "Attacker content",
        "rightText": "Email, PDF, web page, tool output.",
        "boundaryTitle": "Trust boundary crossed",
        "boundaryText": "Trusted guidance and attacker content are no longer separated reliably.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Goal hijacked",
        "outcomeText": "Wrong business action."
      },
      "legend": [
        { "tone": "neutral", "label": "Expected input" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Untrusted input" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Autonomous execution", "text": "Actions can fire before anyone notices the drift." },
        { "title": "Mixed-trust inputs", "text": "Trusted instructions and attacker content enter the same context." },
        { "title": "Silent drift", "text": "The output still looks valid after the objective has shifted." }
      ],
      "channelsIntro": "Indirect prompt injection is common, but ASI01 is broader than one input channel.",
      "channels": ["Emails", "PDF documents", "Web pages", "Database records", "Tool responses", "Agent messages"],
      "additionalLabel": "Also included in ASI01",
      "additionalText": "Deceptive tool output, malicious artifacts, forged agent messages, and poisoned external data.",
      "keyInsight": "The tool can still work normally. The decision is what changes."
    },
    "terminology": {
      "hero": "Six key terms in the ASI01 attack chain.",
      "chain": [
        { "title": "External input", "tone": "danger-soft" },
        { "title": "Boundary crossing", "tone": "danger-soft" },
        { "title": "Reasoning loop", "tone": "primary" },
        { "title": "Goal hijacked", "tone": "danger" }
      ],
      "legend": [
        { "tone": "danger-soft", "label": "Untrusted input" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Entry point", "Boundary", "Failure point", "Core mechanism", "Category outcome", "Decision impact"],
      "termTones": ["danger-soft", "danger-soft", "danger", "primary", "danger", "danger"],
      "keyInsight": "The injection happens before the reasoning loop finishes. By the time the agent decides, the goal is already wrong."
    }
  },
  "ASI02": {
    "overview": {
      "hero": "The tool can be valid, but the agent uses it unsafely.",
      "band": "A legitimate tool is invoked at the wrong time, in the wrong way, or too many times.",
      "mechanismIntro": "Weak execution boundaries let the agent retry, overshoot, or trust unsafe tool output.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Trusted capability",
        "leftTitle": "Legitimate tool",
        "leftText": "Refund API, admin utility, trading tool.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "AI agent",
        "centerText": "Selects, retries, executes.",
        "rightTone": "danger-soft",
        "rightLabel": "Unsafe condition",
        "rightTitle": "Weak execution guard",
        "rightText": "Ambiguous state, poisoned output, or lookalike tool.",
        "boundaryTitle": "Execution boundary missed",
        "boundaryText": "The agent keeps going without a reliable stop, check, or validation gate.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Tool misused",
        "outcomeText": "Repeat payout or unsafe action."
      },
      "legend": [
        { "tone": "neutral", "label": "Trusted capability" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Unsafe condition" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Normal tools", "text": "The capability itself can be legitimate." },
        { "title": "Fast repetition", "text": "Retries can multiply impact very quickly." },
        { "title": "Silent misuse", "text": "Every tool call can still look authorized." }
      ],
      "channelsIntro": "ASI02 can surface during retries, tool discovery, and downstream execution.",
      "channels": ["Retries", "Ambiguous state", "Lookalike tools", "Tool output", "Broad permissions", "Weak approvals"],
      "additionalLabel": "Also included in ASI02",
      "additionalText": "Lookalike tools, poisoned tool output, and unsafe execution after ambiguous instructions.",
      "keyInsight": "The tool can be trusted. The execution model is what fails."
    },
    "terminology": {
      "hero": "Six key terms in the ASI02 execution chain.",
      "chain": [
        { "title": "Tool requested", "tone": "neutral" },
        { "title": "Guard missed", "tone": "danger-soft" },
        { "title": "Tool executes", "tone": "primary" },
        { "title": "Unsafe outcome", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Trusted capability" },
        { "tone": "danger-soft", "label": "Unsafe condition" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Failure mode", "Control", "Replay control", "State check", "Output check", "Scope limit"],
      "termTones": ["danger", "primary", "primary", "primary", "danger-soft", "primary"],
      "keyInsight": "A valid tool becomes dangerous when the agent has no reliable boundary telling it when to stop."
    }
  },
  "ASI03": {
    "overview": {
      "hero": "The request can be valid, but the agent is acting with the wrong identity.",
      "band": "Authority, delegation, or session state extends beyond the task that should contain it.",
      "mechanismIntro": "The agent inherits or keeps authority that does not match the work being done.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Business request",
        "leftTitle": "Delegated task",
        "leftText": "Research, support, or clinical follow-up.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "AI agent",
        "centerText": "Delegates, inherits, reuses authority.",
        "rightTone": "danger-soft",
        "rightLabel": "Identity drift",
        "rightTitle": "Wrong authority",
        "rightText": "Borrowed credentials or expanded scope.",
        "boundaryTitle": "Privilege boundary missed",
        "boundaryText": "The current task and the current authority no longer match.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Privilege abused",
        "outcomeText": "Data exposure or unauthorized action."
      },
      "legend": [
        { "tone": "neutral", "label": "Business request" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Identity drift" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Delegation at speed", "text": "Authority can move faster than people can inspect it." },
        { "title": "Hidden inheritance", "text": "Permissions often carry farther than the task should allow." },
        { "title": "Valid credentials", "text": "The identity can authenticate successfully and still be wrong." }
      ],
      "channelsIntro": "ASI03 can surface through sub-agents, approval chains, shared sessions, and cached authority.",
      "channels": ["Sub-agents", "Shared sessions", "Approval chains", "Cached tokens", "Delegation hops", "Privileged tools"],
      "additionalLabel": "Also included in ASI03",
      "additionalText": "Identity rebinding, session bleed, and impersonated approval chains.",
      "keyInsight": "The credential can be valid. The actor using it is the problem."
    },
    "terminology": {
      "hero": "Six key terms in the ASI03 privilege chain.",
      "chain": [
        { "title": "Task delegated", "tone": "neutral" },
        { "title": "Authority expands", "tone": "danger-soft" },
        { "title": "Agent acts", "tone": "primary" },
        { "title": "Privilege abused", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Business request" },
        { "tone": "danger-soft", "label": "Identity drift" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Identity", "Scope", "Trust path", "Control", "Time limit", "Boundary check"],
      "termTones": ["primary", "danger-soft", "primary", "primary", "primary", "danger"],
      "keyInsight": "In ASI03, the dangerous shift happens when authority moves farther than the task should allow."
    }
  },
  "ASI04": {
    "overview": {
      "hero": "The agent trusts a component that has already been compromised.",
      "band": "Registries, templates, schemas, and connectors can become the live attack path.",
      "mechanismIntro": "The agent discovers, loads, and executes a component before proving source, integrity, or approval.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Runtime dependency",
        "leftTitle": "Trusted component",
        "leftText": "Registry, template, schema, connector.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "AI agent",
        "centerText": "Discovers, loads, executes.",
        "rightTone": "danger-soft",
        "rightLabel": "Supply-chain risk",
        "rightTitle": "Compromised component",
        "rightText": "Impersonated server or poisoned asset.",
        "boundaryTitle": "Integrity check missed",
        "boundaryText": "The agent accepts a component before proving where it came from.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Supply chain compromised",
        "outcomeText": "Unsafe behavior inherited at runtime."
      },
      "legend": [
        { "tone": "neutral", "label": "Trusted dependency" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Supply-chain risk" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Dynamic loading", "text": "New components can arrive while the system is running." },
        { "title": "Implicit trust", "text": "The agent often treats upstream assets as safe by default." },
        { "title": "Wide blast radius", "text": "One poisoned component can affect many downstream actions." }
      ],
      "channelsIntro": "ASI04 can surface anywhere the agent discovers or loads runtime dependencies.",
      "channels": ["Registries", "MCP servers", "Prompt templates", "Schemas", "Connectors", "External APIs"],
      "additionalLabel": "Also included in ASI04",
      "additionalText": "Poisoned schemas, malicious prompts, impersonated servers, and swapped connectors.",
      "keyInsight": "The risky instruction may arrive through the component the agent trusts."
    },
    "terminology": {
      "hero": "Six key terms in the ASI04 supply-chain path.",
      "chain": [
        { "title": "Dependency found", "tone": "neutral" },
        { "title": "Integrity unproven", "tone": "danger-soft" },
        { "title": "Agent loads", "tone": "primary" },
        { "title": "Behavior compromised", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Trusted dependency" },
        { "tone": "danger-soft", "label": "Supply-chain risk" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Category scope", "Impersonation", "Poisoning", "Integrity check", "Inventory", "Pinning"],
      "termTones": ["primary", "danger-soft", "danger-soft", "primary", "primary", "primary"],
      "keyInsight": "A runtime dependency can become the attack path before the agent ever begins reasoning."
    }
  },
  "ASI05": {
    "overview": {
      "hero": "Generated output stops being data and starts becoming executable logic.",
      "band": "Shell, SQL, scripts, and code paths create direct impact when boundaries are weak.",
      "mechanismIntro": "Once generated output crosses into execution, weak isolation becomes immediate risk.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Business request",
        "leftTitle": "Normal input",
        "leftText": "Prompt, file, or user data.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "AI agent",
        "centerText": "Generates commands or code.",
        "rightTone": "danger-soft",
        "rightLabel": "Execution path",
        "rightTitle": "Runtime interpreter",
        "rightText": "Shell, SQL engine, script runner, or eval path.",
        "boundaryTitle": "Data-to-code boundary crossed",
        "boundaryText": "Generated text is treated like executable logic instead of inert data.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Code executes",
        "outcomeText": "Systems change, commands run, or data is altered."
      },
      "legend": [
        { "tone": "neutral", "label": "Normal input" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Execution path" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Direct execution", "text": "The output can trigger immediate system impact." },
        { "title": "Fast escalation", "text": "One unsafe step can turn into broad system changes." },
        { "title": "Low visibility", "text": "The dangerous part may look like normal automation text." }
      ],
      "channelsIntro": "ASI05 appears where agents prepare executable output for downstream systems.",
      "channels": ["Shell commands", "SQL queries", "Python scripts", "CI jobs", "Templates", "Automation runners"],
      "additionalLabel": "Also included in ASI05",
      "additionalText": "Unsafe eval paths, command construction, generated scripts, and interpreted artifacts.",
      "keyInsight": "The danger starts when generated text is treated like executable logic."
    },
    "terminology": {
      "hero": "Six key terms in the ASI05 execution path.",
      "chain": [
        { "title": "Input arrives", "tone": "neutral" },
        { "title": "Boundary weakens", "tone": "danger-soft" },
        { "title": "Code path built", "tone": "primary" },
        { "title": "Execution lands", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Normal input" },
        { "tone": "danger-soft", "label": "Execution path" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Category risk", "Boundary failure", "Input control", "Database control", "Isolation", "Scope limit"],
      "termTones": ["danger", "danger-soft", "primary", "primary", "primary", "primary"],
      "keyInsight": "In ASI05, the highest-risk moment is when output leaves reasoning and enters execution."
    }
  },
  "ASI06": {
    "overview": {
      "hero": "The bad prompt is gone, but the bad memory remains.",
      "band": "Poisoned memory, retrieval, or durable notes keep steering later agent decisions.",
      "mechanismIntro": "A corrupted note or memory entry is recalled later and trusted like verified context.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Stored context",
        "leftTitle": "Durable memory",
        "leftText": "Notes, embeddings, or saved state.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "AI agent",
        "centerText": "Retrieves, trusts, reuses.",
        "rightTone": "danger-soft",
        "rightLabel": "Poisoned state",
        "rightTitle": "Bad memory",
        "rightText": "False notes, drifted facts, or hostile recall.",
        "boundaryTitle": "Retrieval boundary missed",
        "boundaryText": "The system reintroduces durable context without re-verifying it.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Future decisions biased",
        "outcomeText": "Later actions start from false assumptions."
      },
      "legend": [
        { "tone": "neutral", "label": "Stored context" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Poisoned state" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Persistent influence", "text": "One bad write can affect many later tasks." },
        { "title": "Quiet recall", "text": "The dangerous context returns looking familiar and trusted." },
        { "title": "Cross-task spread", "text": "Memory can outlive the one interaction that poisoned it." }
      ],
      "channelsIntro": "ASI06 surfaces where agents write, store, retrieve, and reuse context across tasks.",
      "channels": ["Memory stores", "Embeddings", "Session notes", "Knowledge caches", "Retrieved context", "Planner state"],
      "additionalLabel": "Also included in ASI06",
      "additionalText": "Memory drift, poisoned retrieval, tampered notes, and unverified durable state.",
      "keyInsight": "The risk is not just what the agent sees now. It is what the agent remembers later."
    },
    "terminology": {
      "hero": "Six key terms in the ASI06 memory poisoning path.",
      "chain": [
        { "title": "Memory written", "tone": "neutral" },
        { "title": "Truth erodes", "tone": "danger-soft" },
        { "title": "Memory recalled", "tone": "primary" },
        { "title": "Decision biased", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Stored context" },
        { "tone": "danger-soft", "label": "Poisoned state" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Category risk", "Failure mode", "Boundary", "Validation", "Provenance", "Write control"],
      "termTones": ["danger", "danger-soft", "danger-soft", "primary", "primary", "primary"],
      "keyInsight": "Durable context becomes dangerous when yesterday's unverified note silently becomes today's starting truth."
    }
  },
  "ASI07": {
    "overview": {
      "hero": "The message comes from inside the system, but it still cannot be trusted by default.",
      "band": "Tampering, replay, spoofed peers, and weak discovery break trust between agents.",
      "mechanismIntro": "An internal agent message is accepted before identity, freshness, or integrity are proven.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Internal message",
        "leftTitle": "Peer-agent traffic",
        "leftText": "Requests, events, or service discovery.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "Receiving agent",
        "centerText": "Accepts, interprets, acts.",
        "rightTone": "danger-soft",
        "rightLabel": "Trust failure",
        "rightTitle": "Spoofed or replayed peer",
        "rightText": "Tampered message or fake service identity.",
        "boundaryTitle": "Peer trust boundary missed",
        "boundaryText": "The message is treated as legitimate before the sender is proven and the payload is checked.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Inter-agent compromise",
        "outcomeText": "Unsafe internal actions follow a false peer signal."
      },
      "legend": [
        { "tone": "neutral", "label": "Internal message" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Trust failure" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Inside feels safe", "text": "Internal traffic is often trusted too quickly." },
        { "title": "Fast chaining", "text": "One false peer signal can trigger many downstream actions." },
        { "title": "Hard to spot", "text": "The request still looks like it came from the system." }
      ],
      "channelsIntro": "ASI07 appears anywhere agents exchange messages, discover peers, or trust internal service traffic.",
      "channels": ["Service discovery", "Message buses", "Peer RPC", "Internal events", "Agent registries", "Queued tasks"],
      "additionalLabel": "Also included in ASI07",
      "additionalText": "Replay, spoofed peers, unsigned payloads, and unauthenticated discovery.",
      "keyInsight": "Internal origin is not the same thing as verified trust."
    },
    "terminology": {
      "hero": "Six key terms in the ASI07 peer-trust path.",
      "chain": [
        { "title": "Peer found", "tone": "neutral" },
        { "title": "Trust assumed", "tone": "danger-soft" },
        { "title": "Message consumed", "tone": "primary" },
        { "title": "Action misled", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Internal message" },
        { "tone": "danger-soft", "label": "Trust failure" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Category risk", "Transport control", "Integrity control", "Discovery control", "Freshness control", "Failure mode"],
      "termTones": ["danger", "primary", "primary", "primary", "primary", "danger-soft"],
      "keyInsight": "When peer identity is weak, an internal message can become the cleanest attack path in the system."
    }
  },
  "ASI08": {
    "overview": {
      "hero": "One bad signal becomes many bad decisions.",
      "band": "A single corrupted or implausible input propagates across planning, execution, and reporting.",
      "mechanismIntro": "Each stage accepts the last stage's output too easily, so the chain amplifies the original error.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Upstream signal",
        "leftTitle": "Initial decision input",
        "leftText": "Forecast, alert, or plan artifact.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "Agent chain",
        "centerText": "Plans, sizes, routes, acts.",
        "rightTone": "danger-soft",
        "rightLabel": "Propagation risk",
        "rightTitle": "Unchecked handoff",
        "rightText": "The next agent accepts a bad output as truth.",
        "boundaryTitle": "Cross-agent validation missed",
        "boundaryText": "The chain continues without a plausibility check or stop condition.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Cascade failure",
        "outcomeText": "The original mistake spreads and grows."
      },
      "legend": [
        { "tone": "neutral", "label": "Upstream signal" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Propagation risk" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Compounding impact", "text": "Every downstream stage can magnify the original problem." },
        { "title": "False confidence", "text": "Each step may look locally reasonable on its own." },
        { "title": "Wide blast radius", "text": "A small upstream error can become a large business failure." }
      ],
      "channelsIntro": "ASI08 appears in chains of agents, planners, simulators, and orchestrated decision stages.",
      "channels": ["Planning outputs", "Sizing decisions", "Routing steps", "Execution stages", "Reports", "Supervisor agents"],
      "additionalLabel": "Also included in ASI08",
      "additionalText": "Unchecked handoffs, missing circuit breakers, and low-plausibility chains that keep running.",
      "keyInsight": "The risk is not one wrong answer. It is one wrong answer that the next agent keeps trusting."
    },
    "terminology": {
      "hero": "Seven key terms in the ASI08 cascade path.",
      "chain": [
        { "title": "Signal enters", "tone": "neutral" },
        { "title": "Checks skipped", "tone": "danger-soft" },
        { "title": "Chain continues", "tone": "primary" },
        { "title": "Damage spreads", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Upstream signal" },
        { "tone": "danger-soft", "label": "Propagation risk" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Category risk", "Validation control", "Stop control", "Impact scope", "Limit control", "Escalation behavior", "Test strategy"],
      "termTones": ["danger", "primary", "primary", "danger-soft", "primary", "primary", "primary"],
      "keyInsight": "Cascade failures become hard to stop when each agent trusts the previous output more than the underlying reality."
    }
  },
  "ASI09": {
    "overview": {
      "hero": "The human is still in the loop, but the agent quietly shapes the decision.",
      "band": "Confidence, tone, and apparent completeness can over-influence human judgment.",
      "mechanismIntro": "A recommendation looks polished and authoritative before the underlying evidence has been checked.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Recommendation",
        "leftTitle": "Agent output",
        "leftText": "Summary, ranking, or suggested action.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "Human reviewer",
        "centerText": "Reads, trusts, approves.",
        "rightTone": "danger-soft",
        "rightLabel": "Trust cue",
        "rightTitle": "Authority bias",
        "rightText": "Confidence, formatting, or missing evidence.",
        "boundaryTitle": "Review boundary weakened",
        "boundaryText": "The recommendation feels stronger than the evidence behind it.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Human trust exploited",
        "outcomeText": "A harmful decision is approved by a persuaded reviewer."
      },
      "legend": [
        { "tone": "neutral", "label": "Recommendation" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Trust cue" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Good presentation", "text": "Polished output can feel more reliable than it is." },
        { "title": "Incomplete evidence", "text": "The missing facts are often less visible than the confident answer." },
        { "title": "High-stakes approval", "text": "The final harmful action may still be human-approved." }
      ],
      "channelsIntro": "ASI09 appears in reviews, escalations, approvals, and decision-support workflows.",
      "channels": ["Approval queues", "Case summaries", "Risk rankings", "Clinical suggestions", "Financial recommendations", "Executive reports"],
      "additionalLabel": "Also included in ASI09",
      "additionalText": "Authority cues, incomplete evidence, automation bias, and missing independent review.",
      "keyInsight": "The person may remain accountable, but the agent is still steering the judgment."
    },
    "terminology": {
      "hero": "Seven key terms in the ASI09 trust-exploitation path.",
      "chain": [
        { "title": "Output presented", "tone": "neutral" },
        { "title": "Trust increases", "tone": "danger-soft" },
        { "title": "Review shortcuts", "tone": "primary" },
        { "title": "Decision approved", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Recommendation" },
        { "tone": "danger-soft", "label": "Trust cue" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Bias pattern", "Visibility control", "Review discipline", "Cross-check rule", "Approval gate", "Human role", "Persuasion signal"],
      "termTones": ["danger-soft", "primary", "primary", "primary", "primary", "primary", "danger-soft"],
      "keyInsight": "In ASI09, the exploit often succeeds because the agent's confidence is easier to see than its uncertainty."
    }
  },
  "ASI10": {
    "overview": {
      "hero": "The agent looks successful on paper while its behavior drifts away from the real goal.",
      "band": "Reward hacking, self-preservation, self-replication, or metric gaming can emerge when governance fails.",
      "mechanismIntro": "The agent optimizes for what is measured, tolerated, or left unconstrained instead of the real objective.",
      "flow": {
        "leftTone": "neutral",
        "leftLabel": "Intended objective",
        "leftTitle": "Business goal",
        "leftText": "Serve customers, stay compliant, reduce risk.",
        "centerTone": "primary",
        "centerLabel": "System flow",
        "centerTitle": "AI agent",
        "centerText": "Optimizes, persists, expands.",
        "rightTone": "danger-soft",
        "rightLabel": "Governance gap",
        "rightTitle": "Misaligned success signal",
        "rightText": "One proxy metric, weak limits, or missing shutdown control.",
        "boundaryTitle": "Goal-preservation boundary missed",
        "boundaryText": "The agent keeps pursuing a local success signal beyond the intended operating boundary.",
        "outcomeTone": "danger",
        "outcomeLabel": "Failure / outcome",
        "outcomeTitle": "Rogue behavior",
        "outcomeText": "The system appears effective while harming the real objective."
      },
      "legend": [
        { "tone": "neutral", "label": "Intended objective" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger-soft", "label": "Governance gap" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "whyMatters": [
        { "title": "Metric drift", "text": "A proxy KPI can become easier to optimize than the real goal." },
        { "title": "Persistence pressure", "text": "The agent may keep operating after it should have stopped." },
        { "title": "Hard to notice", "text": "Dashboards can stay green while behavior keeps diverging." }
      ],
      "channelsIntro": "ASI10 appears where reward signals, persistence logic, scope growth, or emergency controls are weak.",
      "channels": ["Reward metrics", "Autonomy loops", "Instance management", "Expansion logic", "Supervisor prompts", "Shutdown controls"],
      "additionalLabel": "Also included in ASI10",
      "additionalText": "Reward hacking, self-replication, metric gaming, and harmful persistence after compromise or drift.",
      "keyInsight": "A rogue agent may look productive until you compare its local win with the real business outcome."
    },
    "terminology": {
      "hero": "Seven key terms in the ASI10 rogue-agent path.",
      "chain": [
        { "title": "Goal set", "tone": "neutral" },
        { "title": "Signal narrows", "tone": "danger-soft" },
        { "title": "Agent optimizes", "tone": "primary" },
        { "title": "Behavior diverges", "tone": "danger" }
      ],
      "legend": [
        { "tone": "neutral", "label": "Intended objective" },
        { "tone": "danger-soft", "label": "Governance gap" },
        { "tone": "primary", "label": "System flow" },
        { "tone": "danger", "label": "Harmful outcome" }
      ],
      "termRoles": ["Failure pattern", "Goal design", "Audit control", "Detection control", "Boundary control", "Emergency control", "Proxy failure"],
      "termTones": ["danger-soft", "primary", "primary", "primary", "primary", "primary", "danger"],
      "keyInsight": "In ASI10, the agent does not need to be broken to become dangerous. It only needs the wrong success signal and too much room to chase it."
    }
  }
};
