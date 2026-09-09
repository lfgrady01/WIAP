import { useState } from 'react';
import { useApp } from '../context';
import { scoreBg, effectiveScore } from '../utils';
import type { DecisionLogEntry } from '../types';

interface ItemState {
  decision: 'Approve' | 'Reject' | 'Defer' | null;
  reason: string;
  deferredToSession: string;
  overrideScore: number | null;
  overrideReason: string;
}

export default function POBAssessment() {
  const { initiatives, updateInitiative, addDecision, showToast } = useApp();

  const standard   = initiatives.filter(i => i.stage === 'Awaiting POB assessment' && !i.accelerated);
  const accelerated = initiatives.filter(i => i.stage === 'Awaiting POB assessment' && i.accelerated);

  const [states, setStates] = useState<Record<string, ItemState>>({});

  function getState(id: string, agreedScore: number): ItemState {
    return states[id] ?? {
      decision: null,
      reason: '',
      deferredToSession: '',
      overrideScore: null,
      overrideReason: '',
    };
  }

  function patchState(id: string, agreedScore: number, patch: Partial<ItemState>) {
    setStates(prev => ({ ...prev, [id]: { ...getState(id, agreedScore), ...patch } }));
  }

  function handleSubmit(item: typeof standard[0], isChair = false) {
    const s = getState(item.id, item.agreedScore);
    if (!s.decision) { showToast('Select a decision first'); return; }
    if ((s.decision === 'Reject') && !s.reason.trim()) { showToast('Reason required for rejection'); return; }
    if (s.decision === 'Defer' && !s.deferredToSession.trim()) { showToast('Target session required for deferral'); return; }
    if (s.overrideScore !== null && !s.overrideReason.trim()) { showToast('Reason required when overriding the score'); return; }

    const finalAgreedScore = s.overrideScore !== null ? s.overrideScore : item.agreedScore;
    const pobDecisionValue = s.decision === 'Approve' ? 'Approved' : s.decision === 'Reject' ? 'Rejected' : 'Deferred';

    if (isChair) {
      const approved = s.decision === 'Approve';
      updateInitiative(item.id, {
        stage: approved ? 'Idea or request' : 'Rejected',
        chairDecision: approved ? 'Approved' : 'Rejected',
        chairDecisionBy: 'POB Chair',
        ratificationStatus: approved ? 'Pending' : undefined,
        pobDecision: pobDecisionValue,
        pobDecisionReason: s.reason.trim() || undefined,
        agreedScore: finalAgreedScore,
        pobOverrideScore: s.overrideScore ?? undefined,
        pobOverrideReason: s.overrideReason.trim() || undefined,
      });
    } else {
      const stageMap = { Approve: 'Idea or request', Reject: 'Rejected', Defer: 'Awaiting POB assessment' } as const;
      updateInitiative(item.id, {
        stage: stageMap[s.decision] as typeof item.stage,
        pobDecision: pobDecisionValue,
        pobDecisionReason: s.reason.trim() || undefined,
        deferredToSession: s.deferredToSession.trim() || undefined,
        agreedScore: finalAgreedScore,
        pobOverrideScore: s.overrideScore ?? undefined,
        pobOverrideReason: s.overrideReason.trim() || undefined,
      });
    }

    const entry: DecisionLogEntry = {
      id: `pob-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      initiative: item.name,
      decision: isChair ? `Chair: ${s.decision}` : `POB: ${s.decision}`,
      owner: isChair ? 'POB Chair' : 'POB',
      reason: s.reason.trim() || undefined,
      type: isChair ? 'chair-decision' : 'pob-assessment',
    };
    addDecision(entry);
    showToast(`${item.name} — ${s.decision.toLowerCase()}`);
  }

  const allEmpty = standard.length === 0 && accelerated.length === 0;

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {allEmpty && (
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-10 text-center text-sm text-gray-400">
          No items awaiting POB assessment.
        </div>
      )}

      {/* Standard queue */}
      {standard.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            New work assessment ({standard.length})
          </h2>
          <div className="flex flex-col gap-4">
            {standard.map(item => (
              <AssessmentCard
                key={item.id}
                item={item}
                state={getState(item.id, item.agreedScore)}
                onPatch={(patch) => patchState(item.id, item.agreedScore, patch)}
                onSubmit={() => handleSubmit(item, false)}
                isChair={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Accelerated / Chair decisions */}
      {accelerated.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-[#E3018C] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">Accelerated — POB Chair</span>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Out-of-cycle decisions ({accelerated.length})
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {accelerated.map(item => (
              <AssessmentCard
                key={item.id}
                item={item}
                state={getState(item.id, item.agreedScore)}
                onPatch={(patch) => patchState(item.id, item.agreedScore, patch)}
                onSubmit={() => handleSubmit(item, true)}
                isChair
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AssessmentCard({
  item,
  state,
  onPatch,
  onSubmit,
  isChair,
}: {
  item: ReturnType<typeof useApp>['initiatives'][0];
  state: ItemState;
  onPatch: (p: Partial<ItemState>) => void;
  onSubmit: () => void;
  isChair: boolean;
}) {
  const delta = item.agreedScore - item.proposedScore;
  const effectiveS = state.overrideScore !== null ? state.overrideScore : item.agreedScore;

  return (
    <div className={`bg-white border rounded-[10px] overflow-hidden ${isChair ? 'border-[#E3018C]/40' : 'border-[#E4E7EA]'}`}>
      {/* Header */}
      <div className={`px-5 py-3 border-b border-[#E4E7EA] ${isChair ? 'bg-[#FCE7F3]' : 'bg-[#F3F4F6]'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#0E2841] text-sm">{item.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.driver} · Sponsor: {item.sponsorName}</p>
            {item.accelerationReason && (
              <p className="text-xs text-[#B0003D] mt-1 font-medium">⚡ {item.accelerationReason}</p>
            )}
          </div>
          {isChair && (
            <span className="bg-[#E3018C] text-white text-[10px] font-bold px-2 py-0.5 rounded shrink-0">ACCELERATED</span>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#E4E7EA]">
        {/* Business case */}
        <div className="px-5 py-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Objective</p>
            <p className="text-xs text-gray-700 leading-relaxed">{item.objective}</p>
          </div>
          <div className="space-y-2">
            {item.whatsChanged && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">What has changed</p>
                <p className="text-xs text-gray-700">{item.whatsChanged}</p>
              </div>
            )}
            {item.benefits && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Benefits</p>
                <p className="text-xs text-gray-700">{item.benefits}</p>
              </div>
            )}
          </div>
        </div>

        {/* Score delta — the main point */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Score — proposed vs arbitrated</p>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Proposed</p>
              <span className={`text-2xl font-bold block ${scoreBg(item.proposedScore).split(' ')[1]}`}>{item.proposedScore}</span>
            </div>
            <div className="text-center flex-1">
              {delta !== 0 ? (
                <div className={`rounded-lg px-4 py-2 inline-block ${delta > 0 ? 'bg-[#E8F5E1] text-[#196B24]' : 'bg-[#FCE7F3] text-[#B0003D]'}`}>
                  <p className="text-lg font-bold">{delta > 0 ? `▲ +${delta}` : `▼ ${delta}`}</p>
                  <p className="text-[10px]">arbitration adjustment</p>
                </div>
              ) : (
                <div className="rounded-lg px-4 py-2 inline-block bg-gray-50 text-gray-400">
                  <p className="text-sm font-medium">= unchanged</p>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Arbitrated</p>
              <span className={`text-2xl font-bold block ${scoreBg(item.agreedScore).split(' ')[1]}`}>{item.agreedScore}</span>
            </div>
          </div>
          {item.arbitrationNote && (
            <div className="mt-3 bg-[#FDF0E7] border border-[#E97132]/30 rounded p-2">
              <p className="text-[10px] font-semibold text-[#B5570E] uppercase tracking-wide mb-0.5">Arbitration note</p>
              <p className="text-xs text-[#B5570E]">{item.arbitrationNote}</p>
            </div>
          )}
        </div>

        {/* POB override option */}
        <div className="px-5 py-3">
          <details className="group">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 select-none">
              Override arbitrated score (rare — reason required)
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Override score</label>
                <input
                  type="number"
                  min={0}
                  max={14}
                  placeholder="—"
                  className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-1.5 focus:outline-none focus:border-[#0E2841]"
                  value={state.overrideScore ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : Math.max(0, Math.min(14, parseInt(e.target.value)));
                    onPatch({ overrideScore: v });
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Override reason <span className="text-[#E3018C]">*</span>
                </label>
                <input
                  type="text"
                  className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-1.5 focus:outline-none focus:border-[#0E2841]"
                  value={state.overrideReason}
                  onChange={e => onPatch({ overrideReason: e.target.value })}
                  placeholder="Why is POB overriding?"
                />
              </div>
            </div>
            {state.overrideScore !== null && (
              <div className="mt-2 bg-[#FCE7F3] border border-[#E3018C]/30 rounded px-3 py-2">
                <p className="text-xs text-[#B0003D] font-semibold">
                  ⚠ POB override: effective score will be <strong>{effectiveS}/14</strong> — this will be flagged wherever the score appears.
                </p>
              </div>
            )}
          </details>
        </div>

        {/* Decision */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {isChair ? 'Chair decision' : 'Board decision'}
          </p>
          <div className="flex gap-2 mb-3">
            {(['Approve', 'Reject'] as const).map(d => (
              <button
                key={d}
                onClick={() => onPatch({ decision: d })}
                className={`text-sm font-semibold px-4 py-2 rounded transition-colors ${
                  state.decision === d
                    ? d === 'Approve'
                      ? 'bg-[#4EA72E] text-white'
                      : 'bg-[#E3018C] text-white'
                    : 'border border-[#E4E7EA] text-gray-500 hover:border-gray-400'
                }`}
              >
                {d}
              </button>
            ))}
            {!isChair && (
              <button
                onClick={() => onPatch({ decision: 'Defer' })}
                className={`text-sm font-semibold px-4 py-2 rounded transition-colors ${
                  state.decision === 'Defer'
                    ? 'bg-[#2563EB] text-white'
                    : 'border border-[#E4E7EA] text-gray-500 hover:border-gray-400'
                }`}
              >
                Defer
              </button>
            )}
          </div>
          {isChair && state.decision === 'Defer' === false && state.decision === null && (
            <p className="text-[10px] text-[#B5570E]">
              Note: deferring an accelerated item is refusal by other means. Approve or Reject only.
            </p>
          )}
          {state.decision === 'Reject' && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-[#B0003D] uppercase tracking-wide mb-1">
                Rejection reason <span className="text-[#E3018C]">*</span>
              </label>
              <textarea
                rows={2}
                className={`w-full text-xs border rounded px-2 py-1.5 focus:outline-none resize-none ${
                  state.reason.trim() ? 'border-[#E4E7EA]' : 'border-[#E3018C] bg-[#FCE7F3]'
                }`}
                value={state.reason}
                onChange={e => onPatch({ reason: e.target.value })}
                placeholder="Why is this being rejected?"
              />
            </div>
          )}
          {state.decision === 'Defer' && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Target session <span className="text-[#E3018C]">*</span>
              </label>
              <input
                type="text"
                className={`w-full text-sm border rounded px-3 py-1.5 focus:outline-none ${
                  state.deferredToSession.trim() ? 'border-[#E4E7EA]' : 'border-[#E97132] bg-[#FDF0E7]'
                }`}
                placeholder="e.g. October 2026 board"
                value={state.deferredToSession}
                onChange={e => onPatch({ deferredToSession: e.target.value })}
              />
            </div>
          )}
          {state.decision && (
            <div className="flex justify-end">
              <button
                onClick={onSubmit}
                className="text-sm font-semibold bg-[#0E2841] text-white px-5 py-2 rounded hover:bg-[#163655] transition-colors"
              >
                Confirm {state.decision.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
