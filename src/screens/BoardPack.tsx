import { useApp } from '../context';
import { scoreBg, RAG_STYLES, effectiveScore } from '../utils';
import type { DecisionLogEntry } from '../types';

export default function BoardPack() {
  const { initiatives, decisionLog, updateInitiative, addDecision, showToast } = useApp();

  const active = initiatives.filter(i => !['Closed', 'Transitioning to BAU', 'Rejected', 'Ratification rejected'].includes(i.stage));

  const ranked = [...active]
    .filter(i => !['Idea or request', 'Awaiting arbitration', 'Awaiting POB assessment'].includes(i.stage))
    .sort((a, b) => effectiveScore(b) - effectiveScore(a))
    .slice(0, 8);

  // Decisions queue
  const decisionsQueue = active.filter(
    i =>
      (i.rag === 'Red' && ['In delivery', 'Under assessment', 'Approved, not started'].includes(i.stage)) ||
      (i.stage === 'Under assessment' && effectiveScore(i) >= 9),
  ).filter(i => !decisionLog.some(d => d.initiative === i.name && d.type === 'board-decision'));

  // Pending ratification
  const ratificationQueue = initiatives.filter(i => i.accelerated && i.ratificationStatus === 'Pending');

  // Out-of-cycle count this cycle
  const outOfCycleCount = initiatives.filter(i => i.chairDecision === 'Approved').length;

  // POB session outcomes from decision log
  const pobOutcomes = decisionLog.filter(d => d.type === 'pob-assessment' || d.type === 'chair-decision');
  const approved = pobOutcomes.filter(d => d.decision.includes('Approve')).length;
  const rejected = pobOutcomes.filter(d => d.decision.includes('Reject')).length;
  const deferred = pobOutcomes.filter(d => d.decision.includes('Defer')).length;

  const newDemand = initiatives.filter(i => i.stage === 'Idea or request').length;
  const offTrack = active.filter(i => i.rag === 'Red').length;

  function handleDecision(item: typeof active[0], decision: 'Approve to proceed' | 'Escalate' | 'Pause') {
    const entry: DecisionLogEntry = {
      id: `dec-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      initiative: item.name,
      decision,
      owner: item.sponsorName || item.projectManager || 'Portfolio Delivery',
      type: 'board-decision',
    };
    addDecision(entry);
    if (decision === 'Approve to proceed') updateInitiative(item.id, { stage: 'In delivery', rag: 'Green' });
    else if (decision === 'Pause') updateInitiative(item.id, { stage: 'On hold' });
    showToast(`${item.name} — ${decision.toLowerCase()}`);
  }

  function handleRatification(item: typeof active[0], ratify: boolean) {
    const newStatus = ratify ? 'Ratified' : 'Rejected';
    updateInitiative(item.id, {
      ratificationStatus: newStatus,
      stage: ratify ? item.stage : 'Ratification rejected',
    });
    const entry: DecisionLogEntry = {
      id: `rat-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      initiative: item.name,
      decision: ratify ? 'Ratified' : 'Ratification rejected',
      owner: 'POB',
      type: 'ratification',
    };
    addDecision(entry);
    showToast(`${item.name} — ${ratify ? 'ratified' : 'ratification rejected'}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4 flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500">New demand (triage queue)</p>
            <p className="text-3xl font-bold text-[#B5570E]">{newDemand}</p>
          </div>
          <div className="w-px self-stretch bg-[#E4E7EA] mx-1" />
          <div>
            <p className="text-xs text-gray-500">Off track (Red)</p>
            <p className="text-3xl font-bold text-[#B0003D]">{offTrack}</p>
          </div>
        </div>
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4">
          <p className="text-xs text-gray-500 mb-1">New work assessed this session</p>
          <div className="flex gap-3">
            <div><span className="text-xl font-bold text-[#196B24]">{approved}</span><span className="text-xs text-gray-400 ml-1">approved</span></div>
            <div><span className="text-xl font-bold text-[#B0003D]">{rejected}</span><span className="text-xs text-gray-400 ml-1">rejected</span></div>
            <div><span className="text-xl font-bold text-[#2563EB]">{deferred}</span><span className="text-xs text-gray-400 ml-1">deferred</span></div>
          </div>
        </div>
        {/* Out-of-cycle counter — deliberately prominent */}
        <div className={`rounded-[10px] px-5 py-4 border-2 ${outOfCycleCount > 5 ? 'bg-[#FCE7F3] border-[#E3018C]' : outOfCycleCount > 2 ? 'bg-[#FDF0E7] border-[#E97132]' : 'bg-white border-[#E4E7EA]'}`}>
          <p className={`text-xs font-semibold mb-1 ${outOfCycleCount > 5 ? 'text-[#B0003D]' : outOfCycleCount > 2 ? 'text-[#B5570E]' : 'text-gray-500'}`}>
            Out-of-cycle approvals this cycle
          </p>
          <p className={`text-4xl font-bold ${outOfCycleCount > 5 ? 'text-[#E3018C]' : outOfCycleCount > 2 ? 'text-[#E97132]' : 'text-[#0E2841]'}`}>
            {outOfCycleCount}
          </p>
          {outOfCycleCount > 5 && (
            <p className="text-[10px] text-[#B0003D] mt-1 font-medium">
              Consider whether the monthly cadence needs changing.
            </p>
          )}
          {outOfCycleCount > 2 && outOfCycleCount <= 5 && (
            <p className="text-[10px] text-[#B5570E] mt-1">The mechanism is working. Monitor the trend.</p>
          )}
        </div>
      </div>

      {/* Approved out-of-cycle — for ratification */}
      {ratificationQueue.length > 0 && (
        <div className="bg-white border-2 border-[#E3018C]/40 rounded-[10px] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E4E7EA] bg-[#FCE7F3] flex items-center gap-3">
            <span className="bg-[#E3018C] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Out of cycle</span>
            <h2 className="text-xs font-semibold text-[#B0003D] uppercase tracking-wide">Approved out of cycle — for ratification ({ratificationQueue.length})</h2>
          </div>
          <div className="divide-y divide-[#E4E7EA]">
            {ratificationQueue.map(item => (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#0E2841]">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.driver}</p>
                  {item.accelerationReason && (
                    <p className="text-xs text-[#B5570E] mt-0.5">Acceleration reason: {item.accelerationReason}</p>
                  )}
                  {item.chairDecisionBy && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Approved by: {item.chairDecisionBy}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRatification(item, false)}
                    className="text-xs font-medium px-3 py-1.5 rounded bg-[#FCE7F3] text-[#B0003D] border border-[#E3018C]/30 hover:bg-[#f8c8e0] transition-colors"
                  >
                    Reject — stop work
                  </button>
                  <button
                    onClick={() => handleRatification(item, true)}
                    className="text-xs font-medium px-3 py-1.5 rounded bg-[#E8F5E1] text-[#196B24] border border-[#4EA72E]/30 hover:bg-[#d4edcc] transition-colors"
                  >
                    Ratify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranked sequence top 8 */}
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E4E7EA] bg-[#F3F4F6]">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ranked sequence — top 8 by effective score</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EA]">
              {['#', 'Initiative', 'Driver', 'Stage', 'RAG', 'Score'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranked.map((item, idx) => {
              const rag = RAG_STYLES[item.rag];
              const score = effectiveScore(item);
              const pobOverride = item.pobOverrideScore !== undefined;
              return (
                <tr key={item.id} className="border-b border-[#E4E7EA] last:border-0">
                  <td className="px-4 py-2.5 text-xs font-semibold text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-[#0E2841]">{item.name}</span>
                      {pobOverride && <span className="text-[9px] font-bold bg-[#FCE7F3] text-[#B0003D] px-1 rounded">POB ⚠</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[140px]"><span className="truncate block">{item.driver}</span></td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.stage === 'In delivery' ? 'bg-emerald-50 text-emerald-700' :
                      item.stage === 'Approved, not started' ? 'bg-violet-50 text-violet-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>{item.stage}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${rag.bg} ${rag.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rag.dot}`} />
                      {item.rag}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${scoreBg(score)}`}>{score}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Decisions queue */}
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E4E7EA] bg-[#F3F4F6] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Decisions needed this session</h2>
          <span className="text-xs text-gray-400">{decisionsQueue.length} items</span>
        </div>
        {decisionsQueue.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">No decisions pending.</div>
        ) : (
          <div className="divide-y divide-[#E4E7EA]">
            {decisionsQueue.map(item => {
              const rag = RAG_STYLES[item.rag];
              const issue = item.rag === 'Red'
                ? 'Off track — Red RAG. Intervention required.'
                : 'High-value item stuck in assessment — beyond PMO authority to progress.';
              return (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${rag.bg} ${rag.text} shrink-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rag.dot}`} />{item.rag}
                    </span>
                    <div>
                      <p className="font-semibold text-sm text-[#0E2841]">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{issue}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleDecision(item, 'Pause')} className="text-xs font-medium px-3 py-1.5 rounded border border-[#E4E7EA] text-gray-600 hover:border-gray-400 transition-colors">Pause</button>
                    <button onClick={() => handleDecision(item, 'Escalate')} className="text-xs font-medium px-3 py-1.5 rounded border border-[#E97132] text-[#B5570E] bg-[#FDF0E7] hover:bg-[#fce4d0] transition-colors">Escalate</button>
                    <button onClick={() => handleDecision(item, 'Approve to proceed')} className="text-xs font-medium px-3 py-1.5 rounded bg-[#4EA72E] text-white hover:bg-[#3d8a25] transition-colors">Approve to proceed</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision log */}
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E4E7EA] bg-[#F3F4F6]">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Decision log</h2>
        </div>
        {decisionLog.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">No decisions logged yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E7EA]">
                {['Date', 'Initiative', 'Decision', 'Owner', 'Reason'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decisionLog.map(entry => (
                <tr key={entry.id} className="border-b border-[#E4E7EA] last:border-0">
                  <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{entry.date}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-[#0E2841]">{entry.initiative}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      entry.decision.includes('Approv') || entry.decision.includes('Ratif') ? 'bg-[#E8F5E1] text-[#196B24]' :
                      entry.decision.includes('Reject') ? 'bg-[#FCE7F3] text-[#B0003D]' :
                      entry.decision.includes('Defer') ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{entry.decision}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{entry.owner}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 max-w-[200px]">
                    <span className="truncate block">{entry.reason || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
