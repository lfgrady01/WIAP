# Figma Make prompt — e.surv Work Ingestion & Planning Tool

Paste the block below into Figma Make as your build prompt.

---

Build a web app called **"Work Ingestion & Planning"** for e.surv, a UK property survey/valuation firm. It replaces a spreadsheet-based change inventory and BOSCARD intake process with one tool spanning intake, triage, portfolio tracking, capacity, prioritisation, and board reporting.

## Brand
- Navy `#0E2841` (primary/header), magenta `#E3018C` (accent/CTA/alerts), white surfaces, light grey background `#F3F4F6`.
- RAG colors: Green `#4EA72E`/text `#196B24`, Amber `#E97132`/text `#B5570E`, Red `#E3018C`/text `#B0003D`.
- Font: system sans (Calibri/Segoe UI/Helvetica). Cards: white, 1px `#E4E7EA` border, 10px radius. Compact, data-dense, no gradients or emoji.

## Global shell
- Top bar: "e.surv" wordmark + "Work Ingestion & Planning" label (left), a 3-way role switcher — **Requester / PMO / Delivery lead** — as a pill toggle (right), and a magenta "+ New request" button.
- Left nav (changes by role):
  - Requester: Portfolio overview (read-only), New request
  - PMO: Portfolio overview, New request, Triage queue (badge = count awaiting triage), Capacity & contention, Prioritised ranking, Plan on a page, Board pack
  - Delivery lead: Portfolio overview, Capacity & contention
- Clicking any initiative row anywhere opens a right-side detail drawer (440px, slide-over with dim overlay) showing objective, value score, priority, editable stage/RAG/milestone dropdowns, sponsor/owner/PM, demand (BA/Dev/PM/Ops days per month), systems touched, funding, budget, lender-visibility, and a single-point-of-failure warning callout if flagged.

## Data model (seed ~30 initiatives)
Each initiative: id, name, objective (1 sentence), driver (Strategic programme / Lender mandated or client request / Regulatory or compliance / Operational improvement / Cost reduction / Technology or infrastructure / Other), stage (Idea or request → Under assessment → Approved, not started → In delivery → On hold → Transitioning to BAU → Closed), RAG (Green/Amber/Red), priority (Low/Medium/High/Critical), value score (0–14), sponsor, business owner, project manager, monthly demand in days for **BA, Dev, PM, Ops** disciplines, systems touched, funding status, budget, start/end dates, next milestone + date, optional single-point-of-failure note, lender-visible flag.

Use realistic e.surv-flavoured names (AVM Operating Model, Barclays Direct Integration, CRM Dynamics 365 migration, e.survIQ phases — Triage/Data Lake/Decision Engine/Portal/Assisted AVM, Scottish Single Survey Migration, Panel Hub Capacity Uplift, Data Retention/GDPR Remediation, etc.) across the seven drivers and all seven stages, so every screen has real variety.

## Screens

**1. Portfolio overview** — 4 stat cards (Total / In delivery / Off track red / Awaiting triage). Search + filters (driver, stage, RAG). Table: Initiative, Driver, Stage (pill), RAG (dot + label), Value score, Owner, Next milestone. Row click opens drawer.

**2. New request (intake)** — Single-page BOSCARD-style form: name, one-sentence objective, driver dropdown, sponsor/requesting area. Below: a **value-add scoring block** — 7 categories (market position/lender retention, financial impact, FTE impact, service quality, staff retention/morale, business risk if not delivered, legal/regulatory compliance), each scored 0/1/2 via three small buttons, live total out of 14. Submit sends it to the triage queue as "Idea or request."

**3. Triage queue** (PMO) — One card per pending request: name, objective, driver/sponsor, big value score. A note banner explaining the rule: *the 0–14 score alone no longer waves work through — an item only becomes "Sequenced" when its score is 8+ AND a checkbox confirms capacity is named against a discipline; otherwise it's Queued, not started.* Each card has a "capacity confirmed" checkbox, "Return to requester," and an Accept button whose label/color changes based on whether the threshold+capacity condition is met ("Sequence into delivery" green vs "Queue — pending capacity" blue).

**4. Capacity & contention** (PMO/Delivery) — (a) A 4-discipline × 4-month heatmap (BA/Dev/PM/Ops × next 4 months) showing committed vs available days per month as % with a 3-color scale (<80% green, 80–100% amber, >100% magenta/red). (b) A timeline section grouping initiatives into "In flight" / "Queued" / "On hold" lanes with horizontal bars positioned/sized by their start–end dates across a 6-month window. (c) A "Contention flags" list surfacing initiatives with a named single-point-of-failure risk.

**5. Prioritised ranking (above/below the line)** (PMO) — This is the key planning view. Editable inputs for monthly available capacity per discipline (BA/Dev/PM/Ops, in days). Below that, every active/approved/under-assessment initiative ranked by value score descending, in a table with rank, name, driver, value score, and BA/Dev/PM/Ops day columns. Running totals are accumulated top-down per discipline; the first row where a discipline's running total would exceed its available capacity becomes **the capacity line** — rendered as a dashed magenta divider labeled "CAPACITY LINE — [discipline] fully committed." Rows above the line render normally ("resourced this period, being delivered"); rows below render dimmed/greyed ("waiting on resource") in a visually separated table. Changing a capacity input live-recalculates where the line falls.

**6. Plan on a page** (PMO) — One dashboard screen answering the six questions the monthly Portfolio Operations Board needs, laid out as: 4 headline stat cards; a full-width RAG health bar (segmented by Green/Amber/Red count with a legend); then 6 equal tile cards in a row, each with a colored top border + numbered circular badge + short list of names:
   - **Sequence** (navy) — top items by rank
   - **Contention** (magenta) — initiatives with a named SPOF/scarce-resource risk
   - **Protection** (purple) — active lender-mandated/regulatory items that must not be displaced
   - **Intake** (blue) — new "Idea or request" items + total days if all accepted
   - **Intervention** (orange) — Red-RAG items needing a decision
   - **Escalation** (teal) — high-value items stuck in "Under assessment" beyond delivery's authority
   Below the tiles: two side-by-side panels — capacity committed this month (progress bars per discipline, colored by load) and delivery mix by driver category (progress bars: Strategic / Lender & regulatory / Operational & other).

**7. Board pack** (PMO) — Ranked sequence list (top 8 by value score); "new demand since last session" and "off track (red)" counters; a "decisions needed this session" queue — each item shows RAG, the issue, and three action buttons (Approve to proceed / Escalate / Pause) that log the decision and remove it from the queue; a decision log table (date, initiative, decision, owner) that new decisions prepend to.

## Interaction rules
- All state is in-session (no backend): submitting intake adds to the list and jumps to triage; triage actions move initiatives between stages; drawer edits (stage/RAG/milestone) persist live everywhere else the initiative appears; capacity inputs and decision actions recompute their screens instantly.
- Toast confirmation on submit/accept/return/decision actions, auto-dismissing after ~2.5s.
- Keep interactions and copy terse and operational — this is an internal ops tool for a PMO team, not a consumer product.
