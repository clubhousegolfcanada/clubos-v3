# 🧠 ClubOS Intelligence Engine – Claude Implementation Plan
_Last updated: 2025-07-26 23:45:38_

---

## 🔧 Purpose

This document defines the full scope, context, architecture, and implementation plan for the Claude-powered Intelligence Engine inside ClubOS. Claude is used for:

- Analyzing failed or unhelpful assistant responses
- Suggesting SOP improvements in markdown
- Updating `.md` files in the Google Drive mirror **only when approved**
- Logging all changes and differences

---

## 📂 Folder Structure (Google Drive Mirror)

```
CLUBOSV2/
├── Operations/
│   ├── SOPs/
│   │   ├── Booking/
│   │   │   └── Access.md
│   │   │   └── Refunds.md
│   │   ├── TechSupport/
│   │   │   └── Projectors.md
│   ├── Logs/
│   │   └── SOP_Changes.md
├── Claude_Projects/
│   ├── IntelligenceEngine_Plan.md
│   └── tickets_for_audit.jsonl
```

---

## 🧠 Claude System Prompt (SOPFixer Assistant)

```
You are the Intelligence Engine for ClubOS. Your job is to audit past assistant responses and suggest SOP updates.

Responsibilities:
1. Parse `.jsonl` ticket exports from Postgres
2. Identify root cause of poor responses
3. Suggest markdown patches to SOP files (if general/fixable)
4. Request missing info (if blocked by owner-only logic)
5. Apply patches **only when explicitly approved**
6. Log all changes to `/Operations/Logs/SOP_Changes.md`

You are not allowed to:
- Edit SOPs without explicit instruction
- Invent pricing, refund, or tech policy
- Alter any other ClubOS systems
```

---

## 🧾 Input Format (`tickets_for_audit.jsonl`)

Each line:

```json
{"query": "My PIN didn’t work", "response": "Please check your booking.", "agent": "booking", "status": "closed", "feedback_rating": 1}
```

Claude will produce:
- `SOP_Fix_Suggestions.md` with fixable vs blocked issues
- Suggested markdown
- Clusters by failure type (e.g., refund issues, vague access replies)

---

## ✍️ SOP Patch Example (After Human Approval)

```
Update `/Operations/SOPs/Booking/Access.md` under section `### PIN Failures`:

```md
- If the user's PIN doesn't work:
  - Confirm booking location
  - Try last 4 digits of phone number
  - Escalate after hours to support line
```

Log diff in `/Operations/Logs/SOP_Changes.md`.
```

---

## 📝 Patch Logging Format (appended to SOP_Changes.md)

```md
## [2025-07-25] – SOP Patch: Booking → Access.md

**Section Updated:** `### PIN Failures`  
**Reason:** 12 vague or escalated responses  
**Fix:**
```md
- If PIN fails:
  - Confirm location
  - Try phone digits
  - Escalate to support
```
```

---

## ✅ System Workflow Summary

1. Export tickets from Postgres → `tickets_for_audit.jsonl`
2. Claude parses and groups failed responses
3. Claude outputs `SOP_Fix_Suggestions.md`
4. You review → approve fix
5. Claude applies update to correct `.md` SOP file
6. Claude appends to `SOP_Changes.md` as audit trail

---

## 🔐 Guardrails

- No file edits without instruction
- All fixes must be markdown-based
- All changes logged and version-controlled
- Claude cannot modify memory, agent routing, or vector data

---

## ⏳ Implementation Estimate

- Backend export + `.jsonl` format: 1.5–2 hrs
- Claude audit logic: 2 hrs
- UI to review/approve: 2.5 hrs
- File write triggers + diff logging: 2 hrs
- Optional clustering view: 1 hr

Total: ~8–12 hrs

---

## ✅ Ready To Deploy

To begin:
1. Claude loads this document
2. Waits for `/Claude_Projects/tickets_for_audit.jsonl`
3. Returns `SOP_Fix_Suggestions.md`
4. Waits for update command before editing any file
