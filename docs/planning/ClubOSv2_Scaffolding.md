
# ClubOSv2 — Full System Scaffolding

## OVERVIEW

ClubOSv2 is a modular, OpenAI-powered LLM infrastructure that routes and manages all customer and ops support requests. It is designed for scale, precision, and full autonomy across agents, systems, and customer interactions.

### Core Capabilities
- Modular LLM agents (GPT-4o) routed via a shared controller
- SOP/file editing and Drive sync powered by Claude
- PostgreSQL backend
- Web UI for internal control (Mission Control)
- Two-way Slack integration for fallback and escalation
- Remote reset functionality via NinjaOne
- Customer approval flow using OpenPhone
- Full logging and traceability of agent behavior

...

## NOTES

- Claude is **not** used for LLM routing or logic
- Claude only handles structured file IO (SOPs, logs, config templates)
- GPT-4o is used for all real-time routing, resets, fallback triage, Slack triggers
