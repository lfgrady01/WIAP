import { useApp } from '../context';
import { effectiveScore, scoreBg } from '../utils';

const DISCS = ['ba', 'dev', 'pm', 'ops'] as const;
type Disc = typeof DISCS[number];
const DISC_LABELS: Record<Disc, string> = { ba: 'BA', dev: 'Dev', pm: 'PM', ops: 'Ops' };

const ACTIVE_STAGES = ['Under assessment', 'Approved, not started', 'In delivery'];

export default function PrioritisedRanking() {
  const { initiatives, capacityAvailable, setCapacityAvailable } = useApp();

  const ranked = initiatives
    .filter(i => ACTIVE_STAGES.includes(i.stage))
    .sort((a, b) => effectiveScore(b) - effectiveScore(a));

  const cum: Record<Disc, number> = { ba: 0, dev: 0, pm: 0, ops: 0 };
  let lineIndex = ranked.length;
  let lineDisc: Disc | null = null;

  const cumRows: Record<Disc, number>[] = [];
  for (let i = 0; i < ranked.length; i++) {
    const d = ranked[i].demand;
    const next = { ba: cum.ba + d.ba, dev: cum.dev + d.dev, pm: cum.pm + d.pm, ops: cum.ops + d.ops };
    const exceeded = DISCS.find(k => next[k] > capacityAvailable[k]);
    if (exceeded && lineIndex === ranked.length) {
      lineIndex = i;
      lineDisc = exceeded;
    }
    cumRows.push({ ...next });
    Object.assign(cum, next);
  }

  function handleCapChange(disc: Disc, val: string) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0) setCapacityAvailable({ ...capacityAvailable, [disc]: n });
  }

  const aboveLine = ranked.slice(0, lineIndex);
  const belowLine = ranked.slice(lineIndex);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Monthly available capacity (days)</p>
        <div className="grid grid-cols-4 gap-3">
          {DISCS.map(d => (
            <div key={d}>
              <label className="block text-xs font-bold text-[#0E2841] uppercase mb-1">{DISC_LABELS[d]}</label>
              <input
                type="number"
                min={0}
                className="w-full text-sm font-semibold border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                value={capacityAvailable[d]}
                onChange={e => handleCapChange(d, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Ranked by effective score (agreed score, overridden by POB where flagged). Changing capacity inputs recalculates the line instantly.</p>
      </div>

      {aboveLine.length > 0 && (
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#F3F4F6] border-b border-[#E4E7EA]">
            <span className="text-xs font-semibold text-[#196B24] uppercase tracking-wide">▲ Resourced this period — being delivered</span>
          </div>
          <RankTable rows={aboveLine} cumRows={cumRows.slice(0, lineIndex)} startRank={1} capacityAvailable={capacityAvailable} dimmed={false} />
        </div>
      )}

      {lineIndex < ranked.length && (
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t-2 border-dashed border-[#E3018C]" />
          <span className="text-xs font-semibold text-[#E3018C] px-2 whitespace-nowrap uppercase tracking-wide">
            CAPACITY LINE{lineDisc ? ` — ${DISC_LABELS[lineDisc]} fully committed` : ''}
          </span>
          <div className="flex-1 border-t-2 border-dashed border-[#E3018C]" />
        </div>
      )}

      {belowLine.length > 0 && (
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden opacity-60">
          <div className="px-4 py-2.5 bg-[#F3F4F6] border-b border-[#E4E7EA]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">▽ Waiting on resource</span>
          </div>
          <RankTable rows={belowLine} cumRows={cumRows.slice(lineIndex)} startRank={lineIndex + 1} capacityAvailable={capacityAvailable} dimmed />
        </div>
      )}

      {ranked.length === 0 && (
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-10 text-center text-sm text-gray-400">
          No active initiatives to rank.
        </div>
      )}
    </div>
  );
}

function RankTable({
  rows, cumRows, startRank, capacityAvailable, dimmed,
}: {
  rows: ReturnType<typeof useApp>['initiatives'];
  cumRows: { ba: number; dev: number; pm: number; ops: number }[];
  startRank: number;
  capacityAvailable: { ba: number; dev: number; pm: number; ops: number };
  dimmed: boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#E4E7EA]">
          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2 w-10">#</th>
          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Initiative</th>
          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2">Driver</th>
          <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">Score</th>
          {DISCS.map(d => (
            <th key={d} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">{d.toUpperCase()} (d)</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((item, idx) => {
          const score = effectiveScore(item);
          const cum = cumRows[idx];
          const pobOverride = item.pobOverrideScore !== undefined;
          return (
            <tr key={item.id} className="border-b border-[#E4E7EA] last:border-0 hover:bg-[#FAFAFA]">
              <td className="px-4 py-2 text-xs font-semibold text-gray-400">{startRank + idx}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-1.5">
                  <p className={`font-medium text-xs ${dimmed ? 'text-gray-500' : 'text-[#0E2841]'}`}>{item.name}</p>
                  {pobOverride && (
                    <span className="text-[9px] font-bold bg-[#FCE7F3] text-[#B0003D] px-1 rounded shrink-0">POB ⚠</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.stage}</p>
              </td>
              <td className="px-4 py-2 text-xs text-gray-500 max-w-[140px]">
                <span className="truncate block">{item.driver}</span>
              </td>
              <td className="px-3 py-2 text-center">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${scoreBg(score)}`}>{score}</span>
              </td>
              {DISCS.map(d => {
                const over = cum && cum[d] > capacityAvailable[d];
                return (
                  <td key={d} className="px-3 py-2 text-center">
                    <span className={`text-xs font-medium ${over ? 'text-[#B0003D] font-bold' : 'text-gray-600'}`}>
                      {item.demand[d]}
                    </span>
                    {cum && <span className={`block text-[10px] ${over ? 'text-[#E3018C]' : 'text-gray-400'}`}>∑{cum[d]}</span>}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
