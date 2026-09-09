import { useState } from 'react';
import { useApp } from '../context';
import { RAG_STYLES, STAGE_STYLES, STAGES, DRIVERS, BUSINESS_AREAS, fmtDate, scoreBg, effectiveScore } from '../utils';
import type { RAG } from '../types';

export default function Portfolio() {
  const { initiatives, openDrawer } = useApp();
  const [search, setSearch] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterRAG, setFilterRAG] = useState('');
  const [filterArea, setFilterArea] = useState('');

  const total = initiatives.filter(i => !['Closed', 'Rejected', 'Ratification rejected'].includes(i.stage)).length;
  const inDelivery = initiatives.filter(i => i.stage === 'In delivery').length;
  const offTrack = initiatives.filter(i => i.rag === 'Red' && !['Closed', 'Rejected'].includes(i.stage)).length;
  const awaitingGate = initiatives.filter(
    i => i.stage === 'Awaiting arbitration' || i.stage === 'Awaiting POB assessment',
  ).length;

  const filtered = initiatives.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.objective.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterDriver && i.driver !== filterDriver) return false;
    if (filterStage && i.stage !== filterStage) return false;
    if (filterRAG && i.rag !== filterRAG) return false;
    if (filterArea && i.businessArea !== filterArea) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total (active)', value: total,        accent: '#0E2841' },
          { label: 'In delivery',   value: inDelivery,    accent: '#196B24' },
          { label: 'Off track (Red)',value: offTrack,     accent: '#B0003D' },
          { label: 'In governance', value: awaitingGate,  accent: '#7C3AED' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-[#E4E7EA] rounded-[10px] px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-3xl font-bold" style={{ color: c.accent }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E4E7EA] rounded-[10px] px-4 py-3 flex gap-3 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search initiatives…"
          className="text-sm border border-[#E4E7EA] rounded px-3 py-1.5 w-52 focus:outline-none focus:border-[#0E2841]"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="text-sm border border-[#E4E7EA] rounded px-3 py-1.5 focus:outline-none focus:border-[#0E2841] bg-white" value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
          <option value="">All drivers</option>
          {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="text-sm border border-[#E4E7EA] rounded px-3 py-1.5 focus:outline-none focus:border-[#0E2841] bg-white" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="">All stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="text-sm border border-[#E4E7EA] rounded px-3 py-1.5 focus:outline-none focus:border-[#0E2841] bg-white" value={filterRAG} onChange={e => setFilterRAG(e.target.value)}>
          <option value="">All RAG</option>
          {(['Green', 'Amber', 'Red'] as RAG[]).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="text-sm border border-[#E4E7EA] rounded px-3 py-1.5 focus:outline-none focus:border-[#0E2841] bg-white" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
          <option value="">All areas</option>
          {BUSINESS_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {(search || filterDriver || filterStage || filterRAG || filterArea) && (
          <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSearch(''); setFilterDriver(''); setFilterStage(''); setFilterRAG(''); setFilterArea(''); }}>Clear</button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} items</span>
      </div>

      <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EA] bg-[#F3F4F6]">
              {['Initiative', 'Area', 'Type', 'Driver', 'Stage', 'RAG', 'Score', 'Owner', 'Target completion', 'Next milestone'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">No initiatives match your filters.</td></tr>
            )}
            {filtered.map((i, idx) => {
              const rag = RAG_STYLES[i.rag];
              const score = effectiveScore(i);
              const pobOverride = i.pobOverrideScore !== undefined;
              return (
                <tr
                  key={i.id}
                  onClick={() => openDrawer(i.id)}
                  className={`border-b border-[#E4E7EA] last:border-0 cursor-pointer hover:bg-[#F3F4F6] transition-colors ${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-[#0E2841]">{i.name}</span>
                      {i.lenderVisible && <span className="text-[10px] text-[#0E2841] bg-blue-50 border border-blue-200 px-1 rounded">Lender</span>}
                      {pobOverride && <span className="text-[9px] font-bold bg-[#FCE7F3] text-[#B0003D] px-1 rounded">POB ⚠</span>}
                      {i.accelerated && i.ratificationStatus === 'Pending' && <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1 rounded">Ratification pending</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {i.businessArea
                      ? <span className="text-[11px] font-medium bg-[#E8EEF4] text-[#0E2841] px-1.5 py-0.5 rounded whitespace-nowrap">{i.businessArea}</span>
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    {i.fundingType
                      ? <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${i.fundingType === 'CAPEX' ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'}`}>{i.fundingType}</span>
                      : <span className="text-xs text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[140px]"><span className="truncate block">{i.driver}</span></td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_STYLES[i.stage]}`}>{i.stage}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${rag.bg} ${rag.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rag.dot} shrink-0`} />{i.rag}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreBg(score)}`}>{score}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{i.businessOwner || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(i.endDate)}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    <span>{i.nextMilestone || '—'}</span>
                    {i.nextMilestoneDate && <span className="ml-1 text-gray-400">{fmtDate(i.nextMilestoneDate)}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
