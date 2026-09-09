import { useApp } from '../context';

const DISCS = ['ba', 'dev', 'pm', 'ops'] as const;
type Disc = typeof DISCS[number];
const DISC_LABELS: Record<Disc, string> = { ba: 'BA', dev: 'Dev', pm: 'PM', ops: 'Ops' };

const PERMISSION_INFO: { level: string; description: string }[] = [
  { level: 'Viewer', description: 'Read-only. Can open Portfolio overview and Prioritised ranking only; cannot edit any field.' },
  { level: 'Reviewer', description: 'Can see every screen and update the operational fields exposed in each workflow (stage, RAG, milestones, decisions).' },
  { level: 'Admin', description: 'Everything Reviewer can do, plus Settings, and can overwrite any field on a submitted initiative — including intake fields normally locked after submission.' },
];

export default function Settings() {
  const { capacityAvailable, setCapacityAvailable, showToast } = useApp();

  function handleCapChange(disc: Disc, val: string) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 0) setCapacityAvailable({ ...capacityAvailable, [disc]: n });
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Monthly available capacity (days)</p>
        <p className="text-xs text-gray-400 mb-3">Drives the capacity line on Prioritised ranking and the contention view on Capacity &amp; contention.</p>
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
                onBlur={() => showToast('Capacity settings updated')}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Access levels</p>
        <div className="divide-y divide-[#E4E7EA]">
          {PERMISSION_INFO.map(p => (
            <div key={p.level} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-xs font-bold text-[#0E2841]">{p.level}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
