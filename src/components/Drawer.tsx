import { useApp } from '../context';
import { RAG_STYLES, STAGE_STYLES, STAGES, DRIVERS, fmtDate, scoreBg, effectiveScore } from '../utils';
import type { RAG, Stage, Driver, Priority } from '../types';

const RAGS: RAG[] = ['Green', 'Amber', 'Red'];
const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const inputCls = 'w-full text-xs border border-[#E4E7EA] rounded px-2 py-1.5 focus:outline-none focus:border-[#0E2841]';

export default function Drawer() {
  const { initiatives, selectedInitiativeId, closeDrawer, updateInitiative, showToast, permission } = useApp();
  const initiative = initiatives.find(i => i.id === selectedInitiativeId);

  if (!selectedInitiativeId) return null;

  const score = initiative ? effectiveScore(initiative) : 0;
  const pobOverride = initiative?.pobOverrideScore !== undefined;
  // Viewer: read-only. Reviewer: can edit the operational fields below (stage/RAG/milestones/flags).
  // Admin: can additionally overwrite the fields captured at submission (people, demand, systems, funding).
  const canEditOps = permission !== 'Viewer';
  const isAdmin = permission === 'Admin';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={closeDrawer} />
      <aside className="fixed top-0 right-0 h-full w-[440px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#0E2841] text-white px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-white/60 mb-0.5 uppercase tracking-wide font-medium">Initiative detail</p>
            <h2 className="font-semibold text-base leading-snug">{initiative?.name ?? '—'}</h2>
          </div>
          <button onClick={closeDrawer} className="text-white/70 hover:text-white mt-0.5 shrink-0 text-lg leading-none">✕</button>
        </div>

        {!initiative ? (
          <div className="p-5 text-sm text-gray-400">Not found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-[#E4E7EA]">
            {/* Objective */}
            <section className="px-5 py-4">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Objective</label>
              <p className="text-sm text-gray-800 leading-relaxed">{initiative.objective}</p>
            </section>

            {/* SPOF warning */}
            {initiative.spofNote && (
              <section className="px-5 py-3">
                <div className="bg-[#FCE7F3] border border-[#E3018C]/30 rounded-md p-3 flex gap-2">
                  <span className="text-[#E3018C] font-bold shrink-0 text-sm">⚠</span>
                  <div>
                    <p className="text-xs font-semibold text-[#B0003D] uppercase tracking-wide mb-0.5">Single point of failure</p>
                    <p className="text-xs text-[#B0003D]">{initiative.spofNote}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Score display */}
            <section className="px-5 py-4">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Score</label>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">Proposed</p>
                  <span className={`text-lg font-bold block ${scoreBg(initiative.proposedScore).split(' ')[1]}`}>{initiative.proposedScore}</span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">Agreed</p>
                  <span className={`text-lg font-bold block ${scoreBg(initiative.agreedScore).split(' ')[1]}`}>{initiative.agreedScore}</span>
                </div>
                {pobOverride && (
                  <div className="text-center">
                    <p className="text-[10px] text-[#B0003D] mb-0.5 font-semibold">POB override</p>
                    <span className="text-lg font-bold block text-[#B0003D]">{initiative.pobOverrideScore}</span>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">Effective</p>
                  <span className={`text-xl font-bold block ${scoreBg(score)}`}>{score}/14</span>
                </div>
              </div>
              {pobOverride && initiative.pobOverrideReason && (
                <div className="mt-2 bg-[#FCE7F3] border border-[#E3018C]/30 rounded px-3 py-2">
                  <p className="text-[10px] font-semibold text-[#B0003D] uppercase tracking-wide mb-0.5">POB override reason</p>
                  <p className="text-xs text-[#B0003D]">{initiative.pobOverrideReason}</p>
                </div>
              )}
              {initiative.arbitrationNote && (
                <div className="mt-2 bg-[#FDF0E7] border border-[#E97132]/30 rounded px-3 py-2">
                  <p className="text-[10px] font-semibold text-[#B5570E] uppercase tracking-wide mb-0.5">Arbitration note</p>
                  <p className="text-xs text-[#B5570E]">{initiative.arbitrationNote}</p>
                </div>
              )}
            </section>

            {/* Stage / RAG — editable for Reviewer & Admin */}
            <section className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Stage</label>
                {canEditOps ? (
                  <select
                    className="w-full text-xs border border-[#E4E7EA] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-[#0E2841]"
                    value={initiative.stage}
                    onChange={e => { updateInitiative(initiative.id, { stage: e.target.value as Stage }); showToast('Stage updated'); }}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${STAGE_STYLES[initiative.stage]}`}>{initiative.stage}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">RAG</label>
                {canEditOps ? (
                  <div className="flex gap-1.5">
                    {RAGS.map(r => {
                      const s = RAG_STYLES[r];
                      const active = initiative.rag === r;
                      return (
                        <button
                          key={r}
                          onClick={() => { updateInitiative(initiative.id, { rag: r }); showToast('RAG updated'); }}
                          className={`flex-1 text-xs py-1.5 rounded border transition-all font-medium ${active ? `${s.bg} ${s.text} border-transparent` : 'border-[#E4E7EA] text-gray-400 hover:border-gray-300'}`}
                        >
                          {r[0]}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${RAG_STYLES[initiative.rag].bg} ${RAG_STYLES[initiative.rag].text}`}>{RAG_STYLES[initiative.rag].label}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Priority</label>
                {isAdmin ? (
                  <select
                    className={inputCls}
                    value={initiative.priority}
                    onChange={e => { updateInitiative(initiative.id, { priority: e.target.value as Priority }); showToast('Priority updated'); }}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${STAGE_STYLES['Idea or request']}`}>{initiative.priority}</span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Driver</label>
                {isAdmin ? (
                  <select
                    className={inputCls}
                    value={initiative.driver}
                    onChange={e => { updateInitiative(initiative.id, { driver: e.target.value as Driver }); showToast('Driver updated'); }}
                  >
                    {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <p className="text-xs text-gray-700">{initiative.driver}</p>
                )}
              </div>
            </section>

            {/* Milestone — editable for Reviewer & Admin; start/end dates only for Admin */}
            <section className="px-5 py-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Next milestone</label>
                {canEditOps ? (
                  <input
                    type="text"
                    className={inputCls}
                    value={initiative.nextMilestone}
                    onChange={e => updateInitiative(initiative.id, { nextMilestone: e.target.value })}
                    onBlur={() => showToast('Milestone updated')}
                  />
                ) : (
                  <p className="text-xs text-gray-700">{initiative.nextMilestone || '—'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Milestone date</label>
                {canEditOps ? (
                  <input
                    type="date"
                    className={inputCls}
                    value={initiative.nextMilestoneDate}
                    onChange={e => updateInitiative(initiative.id, { nextMilestoneDate: e.target.value })}
                    onBlur={() => showToast('Milestone date updated')}
                  />
                ) : (
                  <p className="text-xs text-gray-700">{fmtDate(initiative.nextMilestoneDate)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Start / End</label>
                {isAdmin ? (
                  <div className="flex gap-1">
                    <input
                      type="date"
                      className={inputCls}
                      value={initiative.startDate}
                      onChange={e => updateInitiative(initiative.id, { startDate: e.target.value })}
                      onBlur={() => showToast('Start date updated')}
                    />
                    <input
                      type="date"
                      className={inputCls}
                      value={initiative.endDate}
                      onChange={e => updateInitiative(initiative.id, { endDate: e.target.value })}
                      onBlur={() => showToast('End date updated')}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-700">{fmtDate(initiative.startDate)} – {fmtDate(initiative.endDate)}</p>
                )}
              </div>
            </section>

            {/* People — Admin can overwrite what was submitted */}
            <section className="px-5 py-4 grid grid-cols-3 gap-3">
              {(
                [
                  ['Sponsor', 'sponsorName'],
                  ['Business owner', 'businessOwner'],
                  ['Project manager', 'projectManager'],
                ] as const
              ).map(([label, field]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      className={inputCls}
                      value={initiative[field] || ''}
                      onChange={e => updateInitiative(initiative.id, { [field]: e.target.value })}
                      onBlur={() => showToast(`${label} updated`)}
                    />
                  ) : (
                    <p className="text-xs text-gray-800">{initiative[field] || '—'}</p>
                  )}
                </div>
              ))}
            </section>

            {/* Demand — Admin can overwrite what was submitted */}
            <section className="px-5 py-4">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Monthly demand (days)</label>
              <div className="grid grid-cols-4 gap-2">
                {(['ba', 'dev', 'pm', 'ops'] as const).map(d => (
                  <div key={d} className="bg-[#F3F4F6] rounded p-2 text-center">
                    <p className="text-xs font-bold text-[#0E2841] uppercase">{d}</p>
                    {isAdmin ? (
                      <input
                        type="number"
                        min={0}
                        className="w-full text-center text-sm font-semibold text-gray-800 bg-transparent border border-transparent hover:border-[#E4E7EA] focus:border-[#0E2841] rounded focus:outline-none"
                        value={initiative.demand[d]}
                        onChange={e => {
                          const n = parseInt(e.target.value);
                          if (!isNaN(n) && n >= 0) updateInitiative(initiative.id, { demand: { ...initiative.demand, [d]: n } });
                        }}
                        onBlur={() => showToast('Demand updated')}
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-800">{initiative.demand[d]}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Systems / finance — Admin can overwrite what was submitted */}
            <section className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Systems touched</label>
                {isAdmin ? (
                  <input
                    type="text"
                    className={inputCls}
                    defaultValue={initiative.systemsTouched.join(', ')}
                    placeholder="VAMS, Lender API…"
                    onBlur={e => {
                      const systems = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      updateInitiative(initiative.id, { systemsTouched: systems });
                      showToast('Systems touched updated');
                    }}
                  />
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {initiative.systemsTouched.length > 0
                      ? initiative.systemsTouched.map(s => <span key={s} className="text-xs bg-[#F3F4F6] text-gray-600 px-1.5 py-0.5 rounded">{s}</span>)
                      : <span className="text-xs text-gray-300">—</span>}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Funding</label>
                  {isAdmin ? (
                    <input
                      type="text"
                      className={inputCls}
                      value={initiative.fundingStatus}
                      onChange={e => updateInitiative(initiative.id, { fundingStatus: e.target.value })}
                      onBlur={() => showToast('Funding status updated')}
                    />
                  ) : (
                    <p className="text-xs text-gray-700">{initiative.fundingStatus}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Budget (£k)</label>
                  {isAdmin ? (
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={initiative.budget}
                      onChange={e => {
                        const n = parseInt(e.target.value);
                        if (!isNaN(n) && n >= 0) updateInitiative(initiative.id, { budget: n });
                      }}
                      onBlur={() => showToast('Budget updated')}
                    />
                  ) : (
                    <p className="text-xs text-gray-700">
                      {initiative.budget > 0 ? `£${initiative.budget.toLocaleString()}k` : initiative.indicativeBudget ? `£${initiative.indicativeBudget.toLocaleString()}k (indicative)` : '—'}
                      {initiative.budgetConfidence && (
                        <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          initiative.budgetConfidence === 'High' ? 'bg-emerald-50 text-emerald-700' :
                          initiative.budgetConfidence === 'Medium' ? 'bg-amber-50 text-amber-700' :
                          initiative.budgetConfidence === 'Low' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{initiative.budgetConfidence}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Flags */}
            <section className="px-5 py-4 flex gap-4">
              {canEditOps ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[#E3018C]"
                    checked={initiative.lenderVisible}
                    onChange={e => { updateInitiative(initiative.id, { lenderVisible: e.target.checked }); showToast('Lender visibility updated'); }}
                  />
                  <span className="text-xs text-gray-700">Lender-visible</span>
                </label>
              ) : (
                <span className="text-xs text-gray-500">Lender-visible: {initiative.lenderVisible ? 'Yes' : 'No'}</span>
              )}
              {initiative.accelerated && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                  Accelerated path
                  {initiative.ratificationStatus ? ` — ${initiative.ratificationStatus}` : ''}
                </span>
              )}
            </section>
          </div>
        )}
      </aside>
    </>
  );
}
