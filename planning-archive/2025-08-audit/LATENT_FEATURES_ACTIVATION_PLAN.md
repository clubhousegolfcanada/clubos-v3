# Latent Feature Activation Plan – ClubOS V3

These are dormant or underused capabilities in ClubOS V3 architecture that should be added to the Claude system plan. All features prioritize human review before automation and emphasize continuous learning from repeated customer patterns.

**Status**: NOT YET IMPLEMENTED - These features are not currently in the V3 roadmap but represent high-value additions.

---

## 1. Customer Behavior Pattern Recognition (Manual Review → Reflex Logic)

**Leverage:** Detect recurring user behaviors (e.g., cancellations, late arrivals, frequent resets) and surface them for review.

**Flow:**
- Log each behavior in structured format (timestamp, facility, reason)
- Flag patterns that match predefined thresholds (e.g., 2 resets in 7 days)
- Claude notifies operator with: "Flagged pattern match: TM Reset ×2 in 7 days – approve auto-comp path?"
- After human confirmation, system stores decision as reflex logic for future

**Next Trigger Result:**  
If same pattern recurs, LLM recalls approved past decision and proposes same resolution unless overridden.

**Implementation Requirements:**
- New table: `behavior_patterns` 
- New service: `patternDetector.js`
- Claude integration for pattern analysis

---

## 2. Historical Log Recall + Similarity Match

**Leverage:** Compare current customer situation with past logs to inform fastest human-reviewed path.

**Flow:**
- Claude compares current issue to archived logs using semantic similarity (≥95%)
- If match found, Claude replies:  
  "Similar issue detected (Aug 12 / Bedford / Refund given). Recommend same action?"
- Operator confirms/edits → Claude stores delta and justification for SOP improvement or logic refinement

**Future Learning:**  
Claude updates internal routing logic or annotated archive to reduce ambiguity on next match.

**Implementation Requirements:**
- Vector database for semantic search
- New API endpoint: `/api/similar-cases`
- Claude embeddings integration

---

## 3. Claude-Synced File Memory for SOP Evolution

**Leverage:** Use real case patterns to drive iterative improvement to SOPs and refund logic.

**Flow:**
- Claude tracks when same edge case or override occurs ≥3× in rolling 30-day window
- Triggers alert:  
  "Recurring override detected in `trackman_reset_logic.md` – propose update?"
- After approval, Claude appends update to file and version-controls it

**Example Outcome:**  
SOP evolves without engineer intervention. ClubOS reflexes get tighter without losing audit trail.

**Implementation Requirements:**
- New table: `sop_evolution_tracking`
- Git integration for SOP versioning
- Claude write access to SOP files

---

## 4. Remote Environment Control (NinjaOne, AV Stack)

**Leverage:** Controlled reset or system-level actions triggered by operator review + historical condition logic.

**Flow:**
- Sensor or assistant flags degraded state (e.g., projector offline)
- ClubOS asks:  
  "Trigger remote reset of Bay 2 Projector (TM session in 12 min)? [Y/N]"
- If confirmed, executes command via NinjaOne
- Claude logs context + outcome → used to improve predictive reset heuristics

**Reflex Development:**  
Future similar sensor inputs auto-suggest same successful sequence for rapid action.

**Implementation Requirements:**
- NinjaOne API integration (already planned)
- New service: `environmentController.js`
- Device status monitoring table

---

## 5. Session-Level Reflex Memory

**Leverage:** Track customer-agent interaction within a single session to adapt tone or escalation path.

**Flow:**
- ClubOS counts failures/tries in same session (e.g., "Still not working" x2)
- Claude shifts response tone/urgency:  
  "We've had two failed attempts. Would you like us to escalate or restart the process for you?"
- Stores pattern for future session tuning

**Human Feedback Option:**  
Operator reviews Claude's tone decisions post-session to refine what qualifies as "escalation-worthy."

**Implementation Requirements:**
- Session context tracking in `threads` table
- Tone adjustment logic in Claude prompt
- Post-session review UI

---

## 6. Time-Based + Location-Based Heuristic Injection

**Leverage:** Predictive logic based on when/where issues most commonly arise

**Flow:**
- Claude tracks incident clusters (e.g., Bedford Monday AMs = more resets)
- Alerts ops:  
  "4 resets in last 3 Monday mornings in Bedford. Pre-load reset SOP into routing for these slots?"
- Human confirms → logic applied proactively next week

**Outcome:**  
Claude begins injecting smart defaults into local ops decisions based on proven time/location clusters.

**Implementation Requirements:**
- Analytics service for pattern detection
- Location/time correlation tables
- Predictive SOP pre-loading

---

## Priority Implementation Order

Based on V3's current state and maximum impact:

1. **Session-Level Reflex Memory** (Easiest, immediate impact)
2. **Historical Log Recall** (Builds on existing thread data)
3. **Customer Behavior Patterns** (Natural extension of intent classification)
4. **Time/Location Heuristics** (Leverages existing timestamps)
5. **SOP Evolution** (Requires careful version control)
6. **Remote Environment Control** (Depends on external APIs)

---

## Integration with Current V3 Architecture

These features integrate seamlessly with V3's existing:
- Thread management system
- Intent classification
- SOP matching
- Action execution framework
- Claude integration points

All features maintain the core principle: **Human approval before automation**.

---

## Next Steps

1. Add to ROADMAP_LIVE.md as "Phase 3: Adaptive Learning"
2. Create detailed technical specs for top 2 features
3. Estimate development time and resources
4. Get stakeholder approval before implementation