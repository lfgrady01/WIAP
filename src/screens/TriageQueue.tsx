import { useApp } from '../context';
import { scoreBg, effectiveScore } from '../utils';

export default function TriageQueue() {
  const { initiatives, updateInitiative, navigateTo, showToast } = useApp();

  // In v2, items arrive in triage only after POB approval — stage === 'Idea or request'
  const queue = initiatives.filter(i => i.stage === 'Idea or request');

  function handleAccept(id: string) {
    const item = initiatives.find(i => i.id === id);
    if (!item) return;
    const score = effectiveScore(item);
    const meetsThreshold = score >= 8 && item.capacityConfirmed;
    updateInitiative(id, {
      stage: meetsThreshold ? 'Approved, not started' : 'Under assessment',
    });
    showToast(meetsThreshold ? 'Sequenced into delivery' : 'Queued — pending capacity');
  }

  function handleReturn(id: string) {
    // Stage change (not deletion) per v2 spec
    updateInitiative(id, { stage: 'Awaiting arbitration' });
    showToast('Returned — item back at arbitration');
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="bg-[#FDF0E7] border border-[#E97132]/40 rounded-[10px] px-4 py-3 text-xs text-[#B5570E] leading-relaxed">
        <span className="font-semibold">Triage rule:</span> These items have been approved by POB. A score of 8+ alone does not sequence them —
        an item is <span className="font-semibold">Sequenced</span> only when score is 8+ <em>and</em> capacity is confirmed against a named discipline.
        Otherwise it is <span className="font-semibold">Queued — pending capacity</span>.
      </div>

      {queue.length === 0 && (
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-10 text-center text-sm text-gray-400">
          No items awaiting triage.{' '}
          <button className="text-[#0E2841] underline hover:no-underline" onClick={() => navigateTo('new-request')}>
            Submit a new request
          </button>
        </div>
      )}

      {queue.map(item => {
        const score = effectiveScore(item);
        const meetsThreshold = score >= 8 && item.capacityConfirmed;
        const pobOverridden = item.pobOverrideScore !== undefined;

        return (
          <div key={item.id} className="bg-white border border-[#E4E7EA] rounded-[10px] p-5">
            <div className="flex items-start gap-4">
              <div className={`shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center font-bold ${scoreBg(score)}`}>
                <span className="text-2xl leading-none">{score}</span>
                <span className="text-[10px] leading-none mt-0.5 opacity-70">/14</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-[#0E2841] text-sm">{item.name}</h3>
                  {pobOverridden && (
                    <span className="text-[10px] font-bold bg-[#FCE7F3] text-[#B0003D] border border-[#E3018C]/30 px-1.5 py-0.5 rounded">
                      POB override
                    </span>
                  )}
                  {item.accelerated && item.chairDecision === 'Approved' && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                      Chair-approved — pending ratification
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.objective}</p>
                <div className="flex gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                  <span>{item.driver}</span>
                  {item.sponsorName && <span>· Sponsor: {item.sponsorName}</span>}
                  {pobOverridden && <span>· Original score: {item.agreedScore}</span>}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border border-[#E4E7EA] rounded p-3 bg-[#F3F4F6]">
              <input
                id={`cap-${item.id}`}
                type="checkbox"
                className="accent-[#0E2841]"
                checked={!!item.capacityConfirmed}
                onChange={e => updateInitiative(item.id, { capacityConfirmed: e.target.checked })}
              />
              <label htmlFor={`cap-${item.id}`} className="text-xs text-gray-700 cursor-pointer">
                Capacity confirmed against a named discipline for this item
              </label>
            </div>

            {score < 8 && (
              <p className="mt-2 text-xs text-[#B5570E]">Score {score}/14 — needs 8+ to be eligible for sequencing</p>
            )}

            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => handleReturn(item.id)}
                className="text-xs font-medium px-4 py-2 rounded border border-[#E4E7EA] text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
              >
                Return to requester
              </button>
              <button
                onClick={() => handleAccept(item.id)}
                className={`text-xs font-medium px-4 py-2 rounded transition-colors text-white ${
                  meetsThreshold ? 'bg-[#4EA72E] hover:bg-[#3d8a25]' : 'bg-[#2563EB] hover:bg-[#1d4ed8]'
                }`}
              >
                {meetsThreshold ? 'Sequence into delivery' : 'Queue — pending capacity'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
