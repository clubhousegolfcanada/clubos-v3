# Clubhouse OS V2 Plan
This file defines the full automation plan for building ClubOS V2 using Claude and local scripts.

## ClubOS V2 Execution Plan – Auto-Build Setup

This file defines the precise Claude/GPT assistant behavior and system instructions required to autonomously build Clubhouse OS V2 according to the V2 architecture plan.

---

### 🎯 Objective

Create a shell-guided, Claude-executed sequence that:

- Reads the full ClubOS V2 Plan
- Executes each section in order
- Creates the correct folder structure and files
- Builds features, utilities, and bots phase-by-phase
- Logs each step
- Pauses only for tasks that require user permissions or external setup

---

### 🧠 Behavior of the Assistant

When this plan is invoked via `run_clubos_plan.sh` or equivalent bootstrap:

1. **Parse the plan file:** `/CLUBOSV1/Notes/Clubhouse OS V2 Plan.md`

2. **Establish working directory:** `/CLUBOSV1/` becomes the root project base for all output

3. **Create folders as defined:**

   - `/Core`, `/UI`, `/LLM`, `/API`, `/DB`, `/Logs`, `/Scripts`, `/Notes`, `/Public`, `/Assistants`

4. **Create base **``** files inside **``**:**

   - `README.md`, `ROUTER.md`, `DEPLOYMENT.md`, `NAMING.md`, `_chat_continuity.md`, `_bootstrap.md`, `Manifest.md`

5. **Create utility scripts in **``**:**

   - `simple.sh`
   - `update-bootstrap-with-context.sh`
   - `full-reload.sh`
   - `run_clubos_plan.sh`
   - `push_assistant_update.py`
   - `sync_vectors.sh`
   - `export_assistants.py`

6. **For each system feature in the V2 plan:**

   - Generate necessary routes, UI components, API files, vector hooks, etc
   - Use the structure in the plan to keep each bot/module scoped
   - Add system logging where defined

7. **Create Assistant folders under **``**:**

   - Each folder contains:
     - `instructions.md` — Local copy of OpenAI prompt
     - `tools.json` — Function schema
     - `sources.txt` — Vector file/dir references
     - `notes.md` — Version history and rationale

8. **Claude feedback + update loop for assistants:**

   - Users correct a misfire via UI ("Fix Answer" / "Unhelpful")
   - Claude reformats correction and appends to `notes.md`
   - If needed, Claude updates `instructions.md` or referenced SOP
   - All changes logged to `/Logs/assistant_updates.md`
   - If automated sync is enabled, Claude runs `push_assistant_update.py`

9. **Assistant usage model:**

   - Live requests go through OpenAI Assistants (via API)
   - Claude never handles real-time queries — it acts as an editor, not an endpoint
   - Claude operates downstream to improve, not serve

10. **Execution order:**

- Infra → Core APIs → Router → Claude/GPT integration → UI scaffolding → Ticketing → Slack → Assistant Sync → Final polish

11. **Logging:**

- All build steps appended to `/Logs/build.log`
- Claude auto-appends context notes to `_chat_continuity.md`

12. **Pauses only when:**

- Creating external service projects (e.g., Railway, Vercel, Slack App)
- Entering API keys, secrets, or passwords

---

### ✅ Trigger Command

From shell:

```bash
chmod +x run_clubos_plan.sh
./run_clubos_plan.sh
```

From Claude:

> Begin executing the ClubOS V2 build based on `/Notes/Clubhouse OS V2 Plan.md`. Use this execution strategy file for scope. Log all steps. Do not wait for prompts unless blocked by external setup.

---

This file is the manifest for zero-drift autonomous execution. All future improvements to Claude automation logic should begin here.


