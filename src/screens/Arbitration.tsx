import { useState } from 'react';
import { useApp } from '../context';
import { VALUE_CATEGORIES, scoreBg } from '../utils';
import type { DecisionLogEntry } from '../types';

interface ItemState {
  agreedScore: number;
  note: string;
  accelerated: boolean;
  accelerationReason: string;
}

interface IdeaAssessState {
  scores: number[];
  driverToggles: Record<string, boolean>;
  assessmentNote: string;
  indicativeBudget: string;
  sponsorName: string;
}

const ACCELERATION_DRIVERS = ['Lender mandated or client request', 'Regulatory or compliance'];
// Threshold: score >= 8 OR budget >= £100k requires POB assessment
const POB_SCORE_THRESHOLD = 8;
const POB_BUDGET_THRESHOLD = 100;

function defaultIdeaState(): IdeaAssessState {
  return {
    scores: Array(7).fill(0),
    driverToggles: { Regulatory: false, Lender: false, Financial: false, Audit: false },
    assessmentNote: '',
    indicativeBudget: '',
    sponsorName: '',
  };
}

export default function Arbitration() {
  const { initiatives, updateInitiative, addDecision, showToast } = useApp();

  const ideasQueue = initiatives.filter(i => i.stage === 'Idea capture');
  const queue = initiatives.filter(i => i.stage === 'Awaiting arbitration');

  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [ideaStates, setIdeaStates] = useState<Record<string, IdeaAssessState>>({});
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);

  function getIdeaState(id: string): IdeaAssessState {
    return ideaStates[id] ?? defaultIdeaState();
  }

  function patchIdeaState(id: string, patch: Partial<IdeaAssessState>) {
    setIdeaStates(prev => ({ ...prev, [id]: { ...getIdeaState(id), ...patch } }));
  }

  function setIdeaScore(id: string, idx: number, val: number) {
    const s = getIdeaState(id);
    const scores = s.scores.map((v, i) => (i === idx ? val : v));
    patchIdeaState(id, { scores });
  }

  function handleAssessIdea(item: (typeof ideasQueue)[0]) {
    const s = getIdeaState(item.id);
    if (!s.assessmentNote.trim()) {
      showToast('Assessment note is required');
      return;
    }
    const baseScore = s.scores.reduce((a, b) => a + b, 0);
    const driverBonus = Object.values(s.driverToggles).filter(Boolean).length;
    const agreedScore = baseScore + driverBonus;
    const budget = s.indicativeBudget ? parseInt(s.indicativeBudget) : (item.indicativeBudget ?? 0);
    const needsPOB = agreedScore >= POB_SCORE_THRESHOLD || budget >= POB_BUDGET_THRESHOLD;
    const nextStage = needsPOB ? 'Awaiting POB assessment' : 'Approved, not started';

    updateInitiative(item.id, {
      agreedScore,
      proposedScore: agreedScore,
      proposedScoreBreakdown: [...s.scores],
      driverUplift: Object.entries(s.driverToggles).filter(([, v]) => v).map(([k]) => k),
      sponsorName: s.sponsorName.trim() || item.sponsorName,
      indicativeBudget: s.indicativeBudget ? parseInt(s.indicativeBudget) : item.indicativeBudget,
      arbitrationNote: s.assessmentNote.trim(),
      arbitratedBy: 'Delivery Ops (BA)',
      stage: nextStage,
    });

    const entry: DecisionLogEntry = {
      id: `ba-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      initiative: item.name,
      decision: needsPOB
        ? `BA assessed — score ${agreedScore}, routed to POB assessment`
        : `BA assessed — score ${agreedScore}, approved (below threshold)`,
      owner: 'Delivery Ops',
      reason: s.assessmentNote.trim(),
      type: 'arbitration',
    };
    addDecision(entry);
    showToast(
      needsPOB
        ? `${item.name} — scored ${agreedScore}, sent to POB assessment`
        : `${item.name} — scored ${agreedScore}, approved directly (below threshold)`
    );
    setExpandedIdea(null);
  }

  function getState(id: string, proposedScore: number): ItemState {
    return states[id] ?? { agreedScore: proposedScore, note: '', accelerated: false, accelerationReason: '' };
  }

  function patchState(id: string, proposedScore: number, patch: Partial<ItemState>) {
    setStates(prev => ({ ...prev, [id]: { ...getState(id, proposedScore), ...patch } }));
  }

  function handleConfirm(item: typeof queue[0]) {
    const s = getState(item.id, item.proposedScore);
    const scoreChanged = s.agreedScore !== item.proposedScore;
    if (scoreChanged && !s.note.trim()) {
      showToast('Arbitration note required when score is adjusted');
      return;
    }
    if (s.accelerated && !s.accelerationReason.trim()) {
      showToast('Acceleration reason required');
      return;
    }

    updateInitiative(item.id, {
      agreedScore: s.agreedScore,
      arbitrationNote: s.note.trim() || undefined,
      arbitratedBy: 'Delivery Ops',
      accelerated: s.accelerated,
      accelerationReason: s.accelerationReason.trim() || undefined,
      stage: 'Awaiting POB assessment',
    });

    const entry: DecisionLogEntry = {
      id: `arb-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      initiative: item.name,
      decision: scoreChanged ? `Score adjusted ${item.proposedScore} → ${s.agreedScore}` : 'Score confirmed',
      owner: 'Delivery Ops',
      reason: s.note.trim() || undefined,
      type: 'arbitration',
    };
    addDecision(entry);
    showToast(`${item.name} — advanced to POB assessment`);
  }

  const btnCls = (val: number, score: number) => {
    if (score !== val) return 'bg-white border-[#E4E7EA] text-gray-300 hover:border-[#0E2841] hover:text-[#0E2841]';
    if (val === 0) return 'bg-gray-100 border-gray-300 text-gray-600';
    if (val === 1) return 'bg-[#FDF0E7] border-[#E97132] text-[#B5570E]';
    return 'bg-[#E8F5E1] border-[#4EA72E] text-[#196B24]';
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* ── Ideas awaiting BA assessment ─────────────────── */}
      {ideasQueue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Ideas awaiting BA assessment</span>
            <span className="bg-sky-100 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{ideasQueue.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {ideasQueue.map(item => {
              const s = getIdeaState(item.id);
              const baseScore = s.scores.reduce((a, b) => a + b, 0);
              const driverBonus = Object.values(s.driverToggles).filter(Boolean).length;
              const total = baseScore + driverBonus;
              const budget = s.indicativeBudget ? parseInt(s.indicativeBudget) : (item.indicativeBudget ?? 0);
              const needsPOB = total >= POB_SCORE_THRESHOLD || budget >= POB_BUDGET_THRESHOLD;
              const isExpanded = expandedIdea === item.id;

              return (
                <div key={item.id} className="bg-white border border-sky-200 rounded-[10px] overflow-hidden">
                  {/* Idea header */}
                  <button
                    type="button"
                    onClick={() => setExpandedIdea(isExpanded ? null : item.id)}
                    className="w-full text-left px-5 py-3 flex items-start justify-between gap-3 hover:bg-sky-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-sky-100 text-sky-700 font-semibold px-1.5 py-0.5 rounded">Idea</span>
                        <span className="font-semibold text-[#0E2841] text-sm">{item.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.driver}{item.businessOwner ? ` · ${item.businessOwner}` : ''}</p>
                    </div>
                    <span className="text-xs text-sky-600 shrink-0 mt-0.5">{isExpanded ? '▲ Close' : '▼ Assess'}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-sky-100">
                      {/* Idea details */}
                      <div className="px-5 py-3 bg-sky-50 grid grid-cols-2 gap-4 border-b border-sky-100">
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Idea / objective</p>
                          <p className="text-xs text-gray-700 leading-relaxed">{item.objective}</p>
                        </div>
                        <div className="space-y-2">
                          {item.benefits && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Expected benefit</p>
                              <p className="text-xs text-gray-700">{item.benefits}</p>
                            </div>
                          )}
                          {item.indicativeBudget != null && item.indicativeBudget > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Rough cost estimate</p>
                              <p className="text-xs text-gray-700">£{item.indicativeBudget.toLocaleString()}k</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BA assessment panel */}
                      <div className="px-5 py-4 grid grid-cols-2 gap-5 border-b border-[#E4E7EA]">
                        {/* Left: scoring */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Value-add score</p>
                            <span className={`text-lg font-bold ${total >= 10 ? 'text-[#196B24]' : total >= 6 ? 'text-[#B5570E]' : 'text-gray-400'}`}>
                              {total}
                              {driverBonus > 0 && <span className="text-xs font-normal text-gray-400 ml-1">({baseScore}+{driverBonus})</span>}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {VALUE_CATEGORIES.map((cat, idx) => (
                              <div key={cat} className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-600 flex-1 leading-tight">{cat}</span>
                                <div className="flex gap-0.5 shrink-0">
                                  {[0, 1, 2].map(val => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => setIdeaScore(item.id, idx, val)}
                                      className={`w-7 h-6 text-[11px] font-semibold rounded border transition-all ${btnCls(val, s.scores[idx])}`}
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Driver uplift */}
                          <div className="mt-3 pt-2 border-t border-[#E4E7EA]">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Driver uplift (+1 each)</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(['Regulatory', 'Lender', 'Financial', 'Audit'] as const).map(d => {
                                const active = s.driverToggles[d];
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => patchIdeaState(item.id, { driverToggles: { ...s.driverToggles, [d]: !active } })}
                                    className={`text-[11px] font-semibold px-2 py-1 rounded border transition-all ${
                                      active ? 'bg-[#0E2841] border-[#0E2841] text-white' : 'bg-white border-[#E4E7EA] text-gray-500 hover:border-[#0E2841]'
                                    }`}
                                  >
                                    {active ? '✓ ' : ''}{d}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Right: assessment metadata */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                              Sponsor / owner <span className="text-gray-400 normal-case font-normal">(update if known)</span>
                            </label>
                            <input
                              type="text"
                              className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                              value={s.sponsorName}
                              placeholder={item.sponsorName || "e.g. Claire Donovan"}
                              onChange={e => patchIdeaState(item.id, { sponsorName: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                              Indicative budget (£k) <span className="text-gray-400 normal-case font-normal">(update if known)</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                              value={s.indicativeBudget}
                              placeholder={item.indicativeBudget ? String(item.indicativeBudget) : "e.g. 150"}
                              onChange={e => patchIdeaState(item.id, { indicativeBudget: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Threshold: ≥ £{POB_BUDGET_THRESHOLD}k triggers POB assessment</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                              BA assessment note <span className="text-[#E3018C]">*</span>
                            </label>
                            <textarea
                              rows={3}
                              className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] resize-none ${
                                s.assessmentNote.trim() ? 'border-[#E4E7EA]' : 'border-amber-300 bg-amber-50'
                              }`}
                              placeholder="Summarise your assessment of this idea — viability, scope, risks, and routing rationale."
                              value={s.assessmentNote}
                              onChange={e => patchIdeaState(item.id, { assessmentNote: e.target.value })}
                            />
                          </div>

                          {/* Routing preview */}
                          <div className={`rounded px-3 py-2 text-xs font-medium border ${
                            needsPOB
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {needsPOB
                              ? `→ Will route to POB assessment (score ${total}${budget >= POB_BUDGET_THRESHOLD ? ` or budget £${budget}k` : ''})`
                              : `→ Will approve directly — below threshold (score ${total}, budget £${budget}k)`
                            }
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAssessIdea(item)}
                          className="text-sm font-semibold bg-sky-600 text-white px-5 py-2 rounded hover:bg-sky-700 transition-colors"
                        >
                          Complete assessment & route
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Arbitration queue ────────────────────────────── */}
      {queue.length === 0 && ideasQueue.length === 0 && (
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-10 text-center text-sm text-gray-400">
          No items awaiting arbitration or BA assessment.
        </div>
      )}

      {queue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Score arbitration queue</span>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{queue.length}</span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Confirm or adjust proposed scores before advancing to POB. A note is <strong>mandatory</strong> if the score is changed.
          </p>

        {queue.map(item => {
        const s = getState(item.id, item.proposedScore);
        const scoreChanged = s.agreedScore !== item.proposedScore;
        const delta = s.agreedScore - item.proposedScore;
        const eligibleForAcceleration = ACCELERATION_DRIVERS.includes(item.driver);
        const breakdown = item.proposedScoreBreakdown ?? [];

        return (
          <div key={item.id} className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
            {/* Header */}
            <div className="bg-[#F3F4F6] px-5 py-3 border-b border-[#E4E7EA]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#0E2841] text-sm">{item.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{item.driver} · Sponsor: {item.sponsorName}</p>
                </div>
                <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded ${scoreBg(item.proposedScore)}`}>
                  {item.proposedScore}/14 proposed
                </span>
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
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">What has changed / why now</p>
                      <p className="text-xs text-gray-700">{item.whatsChanged}</p>
                    </div>
                  )}
                  {item.benefits && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Benefits</p>
                      <p className="text-xs text-gray-700">{item.benefits}</p>
                    </div>
                  )}
                  {item.indicativeBudget != null && item.indicativeBudget > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Indicative budget</p>
                      <p className="text-xs text-gray-700">£{item.indicativeBudget.toLocaleString()}k</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="px-5 py-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Proposed score breakdown</p>
                <div className="space-y-1">
                  {VALUE_CATEGORIES.map((cat, idx) => {
                    const val = breakdown[idx] ?? 0;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 flex-1">{cat}</span>
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map(v => (
                            <span
                              key={v}
                              className={`w-7 h-5 text-[10px] font-semibold flex items-center justify-center rounded ${
                                v === val
                                  ? v === 2 ? 'bg-[#E8F5E1] text-[#196B24]' : v === 1 ? 'bg-[#FDF0E7] text-[#B5570E]' : 'bg-gray-100 text-gray-600'
                                  : 'text-gray-200'
                              }`}
                            >
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arbitration panel */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Agreed score (0–14)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={0}
                        max={14}
                        className={`w-20 text-lg font-bold border rounded px-3 py-2 focus:outline-none text-center ${
                          scoreChanged ? 'border-[#E97132] text-[#B5570E]' : 'border-[#E4E7EA] text-[#0E2841] focus:border-[#0E2841]'
                        }`}
                        value={s.agreedScore}
                        onChange={e => patchState(item.id, item.proposedScore, { agreedScore: Math.max(0, Math.min(14, parseInt(e.target.value) || 0)) })}
                      />
                      {scoreChanged && (
                        <span className={`text-sm font-bold ${delta > 0 ? 'text-[#196B24]' : 'text-[#B0003D]'}`}>
                          {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`} from proposed
                        </span>
                      )}
                      {!scoreChanged && (
                        <span className="text-xs text-gray-400">= proposed score</span>
                      )}
                    </div>
                    {scoreChanged && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-[#B5570E] uppercase tracking-wide mb-1">
                          Arbitration note <span className="text-[#E3018C]">*</span> (mandatory)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Why was the score adjusted?"
                          className={`w-full text-xs border rounded px-2 py-1.5 focus:outline-none resize-none ${
                            s.note.trim() ? 'border-[#E4E7EA]' : 'border-[#E97132] bg-[#FDF0E7]'
                          }`}
                          value={s.note}
                          onChange={e => patchState(item.id, item.proposedScore, { note: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Acceleration flag
                    </label>
                    {eligibleForAcceleration && (
                      <p className="text-[10px] text-indigo-600 bg-indigo-50 rounded px-2 py-1 mb-2">
                        Eligible by driver ({item.driver})
                      </p>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        className="accent-[#0E2841]"
                        checked={s.accelerated}
                        onChange={e => patchState(item.id, item.proposedScore, { accelerated: e.target.checked })}
                      />
                      <span className="text-xs text-gray-700">Flag for accelerated path (out-of-cycle POB Chair)</span>
                    </label>
                    {s.accelerated && (
                      <div>
                        <label className="block text-xs font-semibold text-[#B5570E] uppercase tracking-wide mb-1">
                          Acceleration reason <span className="text-[#E3018C]">*</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Why does this need out-of-cycle approval?"
                          className={`w-full text-xs border rounded px-2 py-1.5 focus:outline-none resize-none ${
                            s.accelerationReason.trim() ? 'border-[#E4E7EA]' : 'border-[#E97132] bg-[#FDF0E7]'
                          }`}
                          value={s.accelerationReason}
                          onChange={e => patchState(item.id, item.proposedScore, { accelerationReason: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleConfirm(item)}
                    className="text-sm font-semibold bg-[#0E2841] text-white px-5 py-2 rounded hover:bg-[#163655] transition-colors"
                  >
                    {s.accelerated ? 'Confirm & advance to POB Chair' : 'Confirm & advance to POB'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
        </div>
      )}

    </div>
  );
}
