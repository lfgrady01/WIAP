# Build spec v2 — POB assessment gate, score arbitration, accelerated path

Changes to the e.surv Work Ingestion & Planning Tool. Everything below is
agreed. Written to be handed to a build session as-is.

## Why

Today a request goes straight from a thin intake form into PMO's triage
queue, and PMO alone decides whether it sequences. That conflates two
different decisions — *should this exist* (governance) and *can we resource
it* (delivery) — and gives POB no sight of new work until it is already
in flight or already off track.

v2 splits those decisions and puts a validity gate in front of the
resourcing gate.

## The flow

```
Requester submits expanded intake
   ↓  Awaiting arbitration
Delivery Ops confirms or adjusts the value score
   ↓  Awaiting POB assessment
POB assesses validity          ──── accelerated ────→  POB Chair decides
   ↓  Approved                                            ↓  Approved
PMO Triage queue (capacity decision — unchanged)  ←───────┘
   ↓                                                      ↓
In delivery                              Next board: ratify or reject
```

## Roles

Four roles replace the current three:

| Role | Owns |
|---|---|
| Requester | Submits the intake. Names the sponsor and their proposed score. |
| Delivery Ops | Arbitrates the score. Can flag an item for acceleration. Retains the existing delivery views. |
| PMO | Triage and capacity decision. Unchanged from v1. |
| POB | Validity assessment. Chair holds the out-of-cycle decision. |

Sponsors are **not** a login role in this version. The requester names a
sponsor and ticks a "confirmed with sponsor" attestation. Revisit if
sponsors start disowning scores their name is on.

## Data model

New and changed fields per initiative:

- `proposedScore` — sponsor's 0–14, captured by the requester
- `agreedScore` — post-arbitration. **Drives all downstream logic**
  (sequencing threshold, prioritised ranking, board pack). Replaces
  `valueScore` everywhere.
- `sponsorName`, `sponsorConfirmed`
- `whatsChanged`, `benefits`, `indicativeBudget` — the business case
- `arbitrationNote`, `arbitratedBy`
- `pobDecision`, `pobDecisionReason`, `deferredToSession`
- `pobOverrideScore`, `pobOverrideReason`
- `accelerated` (bool), `accelerationReason`, `chairDecision`,
  `chairDecisionBy`, `ratificationStatus`

New stages: **Awaiting arbitration**, **Awaiting POB assessment**,
**Rejected**, **Ratification rejected**.

All four are excluded from capacity and ranking maths. `Rejected` and
`Ratification rejected` persist in the data — they are never deleted.
Replace the existing "Return to requester" delete with a stage change.

> Naming note: the existing `Under assessment` stage stays as-is and means
> something different (business case in progress, already through the gate).
> The new gate is deliberately `Awaiting POB assessment` to avoid a
> collision. Do not merge them.

## Screen 1 — Expanded intake (Requester)

Extend the existing form with: named sponsor, "confirmed with sponsor"
checkbox, what's changed / why now, benefits, indicative budget, systems
touched. The 0–14 category scoring stays but is now labelled **proposed**
score, and the form should say plainly that Delivery Ops arbitrates it.

Submits to `Awaiting arbitration`.

## Screen 2 — Arbitration (Delivery Ops)

Queue of items awaiting arbitration. Per item: full business case,
proposed score with the per-category breakdown.

Actions: confirm score, or adjust it. **If adjusted, `arbitrationNote` is
mandatory** — no silent moderation. Also here: flag for acceleration
(reason required).

Advances to `Awaiting POB assessment`.

## Screen 3 — New work assessment (POB)

The board's agenda item. Per request: full business case, and proposed vs
agreed score shown side by side with the arbitration note visible. The
delta is the point of this screen — surface it, don't bury it.

Actions:
- **Approve** → PMO Triage queue
- **Reject** → `Rejected`, reason required, stays in the data
- **Defer** → target board session required, resurfaces on that agenda

POB may override the arbitrated score. Reason required, and the override
must be visually flagged wherever the score appears — it should be
obvious, and rare.

## Accelerated assessment

Acceleration reorders governance; it does not skip it.

**Eligibility.** Available (not automatic) where driver is
"Lender mandated / client request" or "Regulatory or compliance". Delivery
Ops may also flag any item manually, with a reason. Requesters cannot
self-accelerate.

**Path.** Arbitration still happens — it is one person, no cadence
dependency. The item then goes to the **POB Chair** for an out-of-cycle
decision: approve or reject only. No defer; deferring an accelerated item
is refusal by other means. Approved items go straight to PMO triage.

**Ratification.** Every chair-approved item appears on the next board
agenda in a distinct **"Approved out of cycle — for ratification"** panel.
POB ratifies or rejects retrospectively. Rejection at ratification sets
`Ratification rejected` and stops the work **even if PMO has already
resourced it** — acceleration must not be functionally irreversible.

**The control that matters.** Show a count of out-of-cycle approvals per
board cycle on the board pack, prominently. Two is the mechanism working.
Eleven means the monthly cadence is wrong and the board should change the
cadence rather than have everyone route around it. Make that number
impossible to ignore.

## Board pack additions

- "New work assessed this session" — approved / rejected / deferred counts
- "Approved out of cycle — for ratification" panel
- Out-of-cycle approval count for the cycle
- Every arbitration and POB outcome writes to the existing decision log,
  with reason text

## Seed data migration

The 30 existing initiatives get `proposedScore` and `agreedScore` both set
to their current `valueScore`, with no arbitration note and
`accelerated: false`. Historically accurate — none of them went through
this process.

## Open, deliberately not solved in the tool

Whether the monthly cadence survives contact with real demand. The
out-of-cycle counter is there to answer that with evidence rather than
opinion, at which point it is a decision for POB, not a build change.