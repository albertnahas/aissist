Here’s the final, definitive summary of everything you need to build and ship your MVP of Aissist — your local-first, AI-powered CLI personal assistant.

⸻

✅ Aissist — MVP Design (Final Summary)

🧠 Purpose:

A local-first, Markdown-based CLI assistant that:
	•	Stores your goals, reflections, history, and context logs
	•	Works across multiple scoped directories (e.g. ./work, ./diet)
	•	Supports semantic recall using Claude (no embeddings)
	•	Integrates with Claude Code slash commands
	•	Authenticates using Claude Agent SDK (no API key needed)
	•	Is fully open-source, hackable, and CLI-native

⸻

⚙️ TECH STACK

Layer	Tool/Lib
Language	TypeScript (Node.js)
CLI Framework	commander
Prompts/UI	@inquirer/core, chalk, ora
File I/O	Native fs, path
AI	@anthropic-ai/agent-sdk (Claude SDK)
Config/Schema	zod
Optional Testing	vitest


⸻

📦 DIRECTORY STRUCTURE

aissist/
├── bin/                     # CLI entry point
├── src/
│   ├── commands/
│   │   ├── init.ts
│   │   ├── goal.ts
│   │   ├── context.ts
│   │   ├── history.ts
│   │   ├── reflect.ts
│   │   ├── recall.ts
│   │   └── path.ts
│   ├── llm/
│   │   └── claude.ts        # Uses Agent SDK
│   ├── utils/
│   │   ├── storage.ts       # Resolves global vs local
│   │   ├── date.ts
│   │   └── search.ts
├── package.json
├── tsconfig.json
└── README.md


⸻

🧠 COMMANDS

aissist init
	•	With --global: sets up ~/.aissist/
	•	Otherwise: creates ./.aissist/ for local workspace
	•	Bootstraps:
	•	Config file (config.json)
	•	Claude Code slash command manifest (slash-commands/aissist.json)
	•	Data folders (goals/, history/, context/, reflections/)

⸻

aissist goal add <text>
	•	Stores entry in goals/YYYY-MM-DD.md

⸻

aissist history log <text>
	•	Adds to history/YYYY-MM-DD.md

⸻

aissist reflect
	•	Interactive questions → stored in reflections/YYYY-MM-DD.md

⸻

aissist context log <context> <input>
	•	Accepts either a string or file path
	•	Stores in context/<context>/YYYY-MM-DD.md

⸻

aissist recall "<query>"
	•	Searches all .md files for matching text
	•	Feeds matching excerpts to Claude via Agent SDK
	•	Returns summarized answer

⸻

aissist path
	•	Prints current memory path (./.aissist/ or ~/.aissist/)

⸻

🗂️ STORAGE SYSTEM

Layer	Path
Global memory	~/.aissist/
Per-project memory	./.aissist/ (one per workspace)
Config	config.json in each .aissist/
Slash command	slash-commands/aissist.json
Data files	Markdown (.md) by date, per type


⸻

🤖 CLAUDE INTEGRATION

Feature	Tool
Auth	@anthropic-ai/agent-sdk
Claude reasoning	agent.run()
Works in Claude Code CLI	✅
Supports slash command usage	✅
No .env API keys needed	✅


⸻

🧩 CLAUDE CODE INTEGRATION
	•	aissist init generates:
~/.aissist/slash-commands/aissist.json
	•	Slash command available as:

/aissist recall what did I say about motivation?


	•	Later: optional local server to support /aissist requests dynamically

⸻

🪄 MVP BEHAVIOR
	•	CLI works in any directory
	•	Detects and uses ./.aissist/ if present
	•	Falls back to global memory (~/.aissist/)
	•	All memory is Markdown, grep-able, Git-compatible
	•	Claude used only for summarizing matched text


Scan repository for implementation details to copy the features they use and use some dependencies like Chalk and others. 
https://github.com/Fission-AI/OpenSpec

https://docs.claude.com/en/api/agent-sdk/overview