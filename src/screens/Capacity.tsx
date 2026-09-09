import { useApp } from '../context';

const MONTHS = [
  { label: 'Sep 2026', start: '2026-09-01', end: '2026-09-30' },
  { label: 'Oct 2026', start: '2026-10-01', end: '2026-10-31' },
  { label: 'Nov 2026', start: '2026-11-01', end: '2026-11-30' },
  { label: 'Dec 2026', start: '2026-12-01', end: '2026-12-31' },
];

const DISCIPLINES = [
  { key: 'ba' as const,  label: 'BA' },
  { key: 'dev' as const, label: 'Dev' },
  { key: 'pm' as const,  label: 'PM' },
  { key: 'ops' as const, label: 'Ops' },
];

// 6-month window for timeline
const TIMELINE_START = new Date('2026-09-01');
const TIMELINE_END   = new Date('2027-02-28');
const TOTAL_DAYS = (TIMELINE_END.getTime() - TIMELINE_START.getTime()) / 86400000;

function pct(committed: number, available: number) {
  return Math.round((committed / available) * 100);
}

function heatCell(p: number) {
  if (p > 100) return { bg: 'bg-[#FCE7F3]', text: 'text-[#B0003D]', border: 'border-[#E3018C]/30' };
  if (p >= 80)  return { bg: 'bg-[#FDF0E7]', text: 'text-[#B5570E]', border: 'border-[#E97132]/30' };
  return { bg: 'bg-[#E8F5E1]', text: 'text-[#196B24]', border: 'border-[#4EA72E]/30' };
}

function barColor(p: number) {
  if (p > 100) return 'bg-[#E3018C]';
  if (p >= 80)  return 'bg-[#E97132]';
  return 'bg-[#4EA72E]';
}

export default function Capacity() {
  const { initiatives, capacityAvailable } = useApp();

  const inDelivery = initiatives.filter(i => i.stage === 'In delivery');

  // Heatmap: committed per discipline per month
  function committedDays(disc: keyof typeof capacityAvailable, month: { start: string; end: string }) {
    const ms = new Date(month.start);
    const me = new Date(month.end);
    return inDelivery
      .filter(i => {
        if (!i.startDate || !i.endDate) return false;
        const is = new Date(i.startDate);
        const ie = new Date(i.endDate);
        return is <= me && ie >= ms;
      })
      .reduce((sum, i) => sum + i.demand[disc], 0);
  }

  // Timeline lanes
  function barStyle(startDate: string, endDate: string) {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const left = Math.max(0, (s.getTime() - TIMELINE_START.getTime()) / 86400000 / TOTAL_DAYS * 100);
    const right = Math.min(100, (e.getTime() - TIMELINE_START.getTime()) / 86400000 / TOTAL_DAYS * 100);
    const width = Math.max(right - left, 1);
    if (right < 0 || left > 100) return null;
    return { left: `${left}%`, width: `${width}%` };
  }

  const lanes = [
    { label: 'In flight', items: inDelivery },
    { label: 'Queued', items: initiatives.filter(i => ['Under assessment', 'Approved, not started'].includes(i.stage)) },
    { label: 'On hold', items: initiatives.filter(i => i.stage === 'On hold') },
  ];

  const spofItems = initiatives.filter(i => i.spofNote && i.stage !== 'Closed');

  // Timeline month markers
  const timelineMonths = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

  return (
    <div className="flex flex-col gap-4">
      {/* Heatmap */}
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E4E7EA] bg-[#F3F4F6]">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Capacity heatmap — committed vs available (next 4 months)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E7EA]">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 w-24">Discipline</th>
                {MONTHS.map(m => (
                  <th key={m.label} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5">{m.label}</th>
                ))}
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">Available/mo</th>
              </tr>
            </thead>
            <tbody>
              {DISCIPLINES.map(d => (
                <tr key={d.key} className="border-b border-[#E4E7EA] last:border-0">
                  <td className="px-4 py-3 font-semibold text-xs text-[#0E2841] uppercase">{d.label}</td>
                  {MONTHS.map(m => {
                    const committed = committedDays(d.key, m);
                    const available = capacityAvailable[d.key];
                    const p = pct(committed, available);
                    const c = heatCell(p);
                    return (
                      <td key={m.label} className="px-3 py-3 text-center">
                        <div className={`inline-block px-3 py-1.5 rounded border ${c.bg} ${c.border}`}>
                          <p className={`text-sm font-bold ${c.text}`}>{p}%</p>
                          <p className={`text-[10px] ${c.text} opacity-75`}>{committed}/{available}d</p>
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-xs text-gray-500">{capacityAvailable[d.key]} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-[#E4E7EA] bg-[#F3F4F6] flex gap-4 text-[10px]">
          {[
            { cls: 'bg-[#E8F5E1] border-[#4EA72E]/30', label: '< 80% — headroom' },
            { cls: 'bg-[#FDF0E7] border-[#E97132]/30', label: '80–100% — approaching capacity' },
            { cls: 'bg-[#FCE7F3] border-[#E3018C]/30', label: '> 100% — overcommitted' },
          ].map(l => (
            <span key={l.label} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border ${l.cls} text-gray-600`}>{l.label}</span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E4E7EA] bg-[#F3F4F6]">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Timeline — Sep 2026 to Feb 2027</h2>
        </div>
        <div className="p-4">
          {/* Month ruler */}
          <div className="flex mb-3 pl-28">
            {timelineMonths.map(m => (
              <div key={m} className="flex-1 text-[10px] text-gray-400 font-medium">{m}</div>
            ))}
          </div>
          {lanes.map(lane => (
            <div key={lane.label} className="mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{lane.label}</p>
              {lane.items.length === 0 && (
                <p className="text-xs text-gray-300 pl-28">None</p>
              )}
              {lane.items.map(item => {
                const style = barStyle(item.startDate, item.endDate);
                const ragDot = item.rag === 'Green' ? '#4EA72E' : item.rag === 'Amber' ? '#E97132' : '#E3018C';
                return (
                  <div key={item.id} className="flex items-center mb-1.5 group">
                    <div className="w-28 shrink-0 pr-3">
                      <p className="text-[11px] text-gray-600 truncate leading-tight">{item.name}</p>
                    </div>
                    <div className="flex-1 relative h-5 bg-[#F3F4F6] rounded">
                      {/* Month gridlines */}
                      {[1/6,2/6,3/6,4/6,5/6].map((p, idx) => (
                        <div key={idx} className="absolute top-0 bottom-0 w-px bg-[#E4E7EA]" style={{ left: `${p*100}%` }} />
                      ))}
                      {style ? (
                        <div
                          className="absolute top-0.5 bottom-0.5 rounded-sm flex items-center px-1.5 overflow-hidden"
                          style={{ ...style, backgroundColor: ragDot + '33', borderLeft: `3px solid ${ragDot}` }}
                        >
                          <span className="text-[10px] text-gray-700 font-medium truncate">{item.name}</span>
                        </div>
                      ) : (
                        <div className="absolute inset-y-0 left-1 flex items-center">
                          <span className="text-[10px] text-gray-300">dates TBC</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Contention flags */}
      {spofItems.length > 0 && (
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E4E7EA] bg-[#F3F4F6]">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contention flags — single point of failure</h2>
          </div>
          <div className="divide-y divide-[#E4E7EA]">
            {spofItems.map(item => (
              <div key={item.id} className="px-5 py-3 flex gap-3 items-start">
                <span className="text-[#E3018C] font-bold text-sm mt-0.5 shrink-0">⚠</span>
                <div>
                  <p className="text-sm font-medium text-[#0E2841]">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.spofNote}</p>
                </div>
                <span className={`ml-auto shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  item.rag === 'Red' ? 'bg-[#FCE7F3] text-[#B0003D]' :
                  item.rag === 'Amber' ? 'bg-[#FDF0E7] text-[#B5570E]' :
                  'bg-[#E8F5E1] text-[#196B24]'
                }`}>{item.rag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
