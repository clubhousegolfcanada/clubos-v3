# 📁 ClubOS Context Overview (Bootstrap for Claude Sessions)

## 🧱 System Architecture
- **Frontend**: Next.js, deployed via Vercel
- **Backend**: Node.js (Express-style), hosted on Railway
- **Database**: Planned for modular integration, not fully deployed
- **LLM Routing**: 
  - OpenAI GPTs (Assistants API) for functional routing
  - Claude Opus 4 for structured file edits and planning
  - All requests hit: https://bb0857e8c7df.ngrok-free.app/api/gpt-webhook/webhook

## 🔗 Integrations
- **Slack**: Fallback + alert routing
- **Google Drive**: SOPs and mirrored directory
- **HubSpot**: CRM integration and ticket handling
- **Splashtop / NinjaOne**: Remote desktop access
- **Skedda**: External booking interface
- **Unifi**: Camera and access control

## 🗂️ File/Folder Structure (Condensed for ClubOS V1)
/ClubOS/
├── ClubOSV1-frontend/       # Next.js frontend
├── ClubOSV1-backend/        # Node.js backend (Claude-compatible)
├── ClubOS Agents/           # GPT assistant-specific SOPs
├── scripts/                 # Auth, backup, deploy, dev tooling
├── archive/                 # Legacy deployment, fixes, test scripts
├── Notes/                   # Bootstrap and continuity planning
├── *.md                     # Planning docs, fixes, SOPs

### Claude Vector Inputs
- knowledge-base/*.json (e.g. booking-knowledge-v2.json, emergency-knowledge-v2.json)
- LLMProvider abstractions are in services/llm/

## 🧠 Claude Instructions (Every Session)
> Read both clubos_context.md and claude_session_log.md before starting. Use these to fully orient to the system and current development state. Document all requests, changes, or assumptions explicitly in claude_session_log.md before ending the session.

## 🛠️ Optional Enhancements
- GET /context/summary route to emit this context as JSON
- Weekly rotated logs: logs/claude_YYYY_MM_DD.md
- Claude startup wrapper that autoloads context + log


## 📂 Claude Access Path

Claude should:
- **Read this file** (`clubos_context_v1.md`) at the start of every session
- **Write to `claude_session_log_v1.md`** in the same directory
- Both files reside in: `/Users/your-username/Clubhouse OS (Root)/Claude/`

Make sure Claude has read/write access to this folder in the Claude file sandbox or mirrored Google Drive.
