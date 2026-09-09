import { useApp } from '../context';
import { effectiveScore } from '../utils';

const TILE_DEFS = [
  { key: 'sequence',    label: 'Sequence',    desc: 'Top items by effective score',                        border: '#0E2841', bg: '#E8EEF4' },
  { key: 'contention',  label: 'Contention',  desc: 'Named SPOF or scarce resource risk',                  border: '#E3018C', bg: '#FCE7F3' },
  { key: 'protection',  label: 'Protection',  desc: 'Lender-mandated / regulatory — must not be displaced',border: '#7C3AED', bg: '#F5F3FF' },
  { key: 'intake',      label: 'Intake',      desc: 'POB-approved, awaiting PMO triage',                   border: '#2563EB', bg: '#EFF6FF' },
  { key: 'intervention',label: 'Intervention',desc: 'Red RAG items needing a decision',                    border: '#EA580C', bg: '#FFF7ED' },
  { key: 'escalation',  label: 'Escalation',  desc: "High-value items stuck in 'Under assessment'",        border: '#0D9488', bg: '#F0FDFA' },
] as const;

type TileKey = typeof TILE_DEFS[number]['key'];

export default function PlanOnAPage() {
  const { initiatives, capacityAvailable } = useApp();

  const active = initiatives.filter(
    i => !['Closed', 'Transitioning to BAU', 'Rejected', 'Ratification rejected',
            'Awaiting arbitration', 'Awaiting POB assessment'].includes(i.stage),
  );

  const ranked = [...active]
    .filter(i => ['Under assessment', 'Approved, not started', 'In delivery'].includes(i.stage))
    .sort((a, b) => effectiveScore(b) - effectiveScore(a));

  const tileItems: Record<TileKey, typeof active> = {
    sequence:    ranked.slice(0, 5),
    contention:  active.filter(i => !!i.spofNote),
    protection:  active.filter(i => ['Lender mandated or client request', 'Regulatory or compliance'].includes(i.driver) && i.stage === 'In delivery'),
    intake:      initiatives.filter(i => i.stage === 'Idea or request'),
    intervention:active.filter(i => i.rag === 'Red'),
    escalation:  active.filter(i => i.stage === 'Under assessment' && effectiveScore(i) >= 9),
  };

  const intakeDays = tileItems.intake.reduce(
    (sum, i) => ({ ba: sum.ba + i.demand.ba, dev: sum.dev + i.demand.dev, pm: sum.pm + i.demand.pm, ops: sum.ops + i.demand.ops }),
    { ba: 0, dev: 0, pm: 0, ops: 0 },
  );

  const total = active.length;
  const inDelivery = active.filter(i => i.stage === 'In delivery').length;
  const offTrack = active.filter(i => i.rag === 'Red').length;
  const onTrack = active.filter(i => i.rag === 'Green').length;

  const g = active.filter(i => i.rag === 'Green').length;
  const a = active.filter(i => i.rag === 'Amber').length;
  const r = active.filter(i => i.rag === 'Red').length;

  const inDeliveryItems = initiatives.filter(i => i.stage === 'In delivery');
  const committed = inDeliveryItems.reduce(
    (sum, i) => ({ ba: sum.ba + i.demand.ba, dev: sum.dev + i.demand.dev, pm: sum.pm + i.demand.pm, ops: sum.ops + i.demand.ops }),
    { ba: 0, dev: 0, pm: 0, ops: 0 },
  );

  const driverGroups = [
    { label: 'Strategic',           drivers: ['Strategic programme'], color: '#0E2841' },
    { label: 'Lender & regulatory', drivers: ['Lender mandated or client request', 'Regulatory or compliance'], color: '#E3018C' },
    { label: 'Operational & other', drivers: ['Operational improvement', 'Cost reduction', 'Technology or infrastructure', 'Other'], color: '#E97132' },
  ];
  const deliveryTotal = inDeliveryItems.length || 1;
  const driverTotals = driverGroups.map(g => ({
    ...g,
    count: inDeliveryItems.filter(i => g.drivers.includes(i.driver)).length,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active initiatives', value: total,      color: '#0E2841' },
          { label: 'In delivery',        value: inDelivery, color: '#196B24' },
          { label: 'On track (green)',   value: onTrack,    color: '#4EA72E' },
          { label: 'Off track (red)',    value: offTrack,   color: '#B0003D' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-[#E4E7EA] rounded-[10px] px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-3xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Portfolio RAG health</p>
        <div className="flex h-6 rounded-full overflow-hidden gap-px">
          {g > 0 && <div className="bg-[#4EA72E] flex items-center justify-center text-[10px] text-white font-bold" style={{ flex: g }}>{g}</div>}
          {a > 0 && <div className="bg-[#E97132] flex items-center justify-center text-[10px] text-white font-bold" style={{ flex: a }}>{a}</div>}
          {r > 0 && <div className="bg-[#E3018C] flex items-center justify-center text-[10px] text-white font-bold" style={{ flex: r }}>{r}</div>}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4EA72E] inline-block" />{g} Green</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E97132] inline-block" />{a} Amber</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E3018C] inline-block" />{r} Red</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TILE_DEFS.map((tile, tileIdx) => {
          const items = tileItems[tile.key];
          return (
            <div key={tile.key} className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden" style={{ borderTopWidth: 3, borderTopColor: tile.border }}>
              <div className="px-4 py-3 border-b border-[#E4E7EA]" style={{ backgroundColor: tile.bg }}>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: tile.border }}>
                    {tileIdx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tile.border }}>{tile.label}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{tile.desc}</p>
                  </div>
                  <span className="ml-auto text-sm font-bold" style={{ color: tile.border }}>{items.length}</span>
                </div>
              </div>
              <div className="px-4 py-3 min-h-[80px]">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-300">None</p>
                ) : (
                  <ul className="space-y-1.5">
                    {items.slice(0, 5).map(i => (
                      <li key={i.id} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${i.rag === 'Red' ? 'bg-[#E3018C]' : i.rag === 'Amber' ? 'bg-[#E97132]' : 'bg-[#4EA72E]'}`} />
                        {i.name}
                      </li>
                    ))}
                    {items.length > 5 && <li className="text-[10px] text-gray-400">+{items.length - 5} more</li>}
                  </ul>
                )}
                {tile.key === 'intake' && items.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-2">
                    If all accepted: BA {intakeDays.ba}d · Dev {intakeDays.dev}d · PM {intakeDays.pm}d · Ops {intakeDays.ops}d/mo
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Capacity committed this month</p>
          <div className="space-y-2.5">
            {(['ba', 'dev', 'pm', 'ops'] as const).map(d => {
              const used = committed[d];
              const avail = capacityAvailable[d];
              const pctVal = avail > 0 ? Math.min(100, Math.round((used / avail) * 100)) : 0;
              const color = pctVal > 100 ? '#E3018C' : pctVal >= 80 ? '#E97132' : '#4EA72E';
              return (
                <div key={d}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#0E2841] uppercase">{d}</span>
                    <span className="text-gray-500">{used}/{avail}d ({pctVal}%)</span>
                  </div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pctVal, 100)}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Delivery mix by driver</p>
          <div className="space-y-2.5">
            {driverTotals.map(g => {
              const pctVal = Math.round((g.count / deliveryTotal) * 100);
              return (
                <div key={g.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">{g.label}</span>
                    <span className="text-gray-500">{g.count} ({pctVal}%)</span>
                  </div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pctVal}%`, backgroundColor: g.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
