import { useState } from 'react';
import { useApp } from '../context';
import { DRIVERS, VALUE_CATEGORIES, BUSINESS_AREAS } from '../utils';
import type { Driver, BusinessArea, FundingType, BudgetConfidence } from '../types';

export default function NewRequest() {
  const { addInitiative, navigateTo, showToast } = useApp();

  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [driver, setDriver] = useState<Driver | ''>('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorConfirmed, setSponsorConfirmed] = useState(false);
  const [requestingArea, setRequestingArea] = useState('');
  const [businessArea, setBusinessArea] = useState<BusinessArea | ''>('');
  const [fundingType, setFundingType] = useState<FundingType | ''>('');
  const [whatsChanged, setWhatsChanged] = useState('');
  const [benefits, setBenefits] = useState('');
  const [indicativeBudget, setIndicativeBudget] = useState('');
  const [budgetConfidence, setBudgetConfidence] = useState<BudgetConfidence | ''>('');
  const [systemsInput, setSystemsInput] = useState('');
  const [scores, setScores] = useState<number[]>(Array(7).fill(0));
  const [driverToggles, setDriverToggles] = useState<Record<string, boolean>>({
    Regulatory: false,
    Lender: false,
    Financial: false,
    Audit: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const baseScore = scores.reduce((a, b) => a + b, 0);
  const driverBonus = Object.values(driverToggles).filter(Boolean).length;
  const total = baseScore + driverBonus;

  function setScore(idx: number, val: number) {
    setScores(prev => prev.map((s, i) => (i === idx ? val : s)));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    if (!objective.trim()) e.objective = 'Required';
    if (!driver) e.driver = 'Required';
    if (!sponsorName.trim()) e.sponsorName = 'Required';
    if (!sponsorConfirmed) e.sponsorConfirmed = 'You must confirm the sponsor has agreed to this submission';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const id = `req-${Date.now()}`;
    addInitiative({
      id,
      name: name.trim(),
      objective: objective.trim(),
      driver: driver as Driver,
      stage: 'Awaiting arbitration',
      rag: 'Green',
      priority: 'Medium',
      valueScore: total,
      proposedScore: total,
      proposedScoreBreakdown: [...scores],
      driverUplift: Object.entries(driverToggles).filter(([, v]) => v).map(([k]) => k),
      agreedScore: total,
      sponsorName: sponsorName.trim(),
      sponsorConfirmed,
      businessArea: businessArea || undefined,
      fundingType: fundingType || undefined,
      budgetConfidence: budgetConfidence || undefined,
      businessOwner: requestingArea.trim() || sponsorName.trim(),
      projectManager: '',
      whatsChanged: whatsChanged.trim() || undefined,
      benefits: benefits.trim() || undefined,
      indicativeBudget: indicativeBudget ? parseInt(indicativeBudget) : undefined,
      demand: { ba: 0, dev: 0, pm: 0, ops: 0 },
      systemsTouched: systemsInput.split(',').map(s => s.trim()).filter(Boolean),
      fundingStatus: 'Not yet submitted',
      budget: 0,
      startDate: '',
      endDate: '',
      nextMilestone: 'Delivery Ops arbitration',
      nextMilestoneDate: '',
      lenderVisible: false,
      capacityConfirmed: false,
      accelerated: false,
    });

    showToast('Request submitted — awaiting Delivery Ops arbitration');
    navigateTo('portfolio');
  }

  const btnCls = (val: number, score: number) => {
    if (score !== val) return 'bg-white border-[#E4E7EA] text-gray-400 hover:border-[#0E2841] hover:text-[#0E2841]';
    if (val === 0) return 'bg-gray-100 border-gray-300 text-gray-600';
    if (val === 1) return 'bg-[#FDF0E7] border-[#E97132] text-[#B5570E]';
    return 'bg-[#E8F5E1] border-[#4EA72E] text-[#196B24]';
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Header */}
      <div className="bg-white border border-[#E4E7EA] rounded-t-[10px] px-5 py-3 border-b-0 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[#0E2841] text-base">New request</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Submitted to Delivery Ops for score arbitration, then POB for validity assessment before triage.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigateTo('portfolio')}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded border border-[#E4E7EA] hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="text-sm bg-[#E3018C] text-white font-medium px-5 py-1.5 rounded hover:bg-[#c90178] transition-colors"
          >
            Submit for arbitration
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 gap-0 border border-[#E4E7EA] rounded-b-[10px] overflow-hidden">
        {/* LEFT — details + sponsor + business case */}
        <div className="bg-white border-r border-[#E4E7EA] divide-y divide-[#E4E7EA]">

          {/* Basic details */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Details</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Initiative name <span className="text-[#E3018C]">*</span>
              </label>
              <input
                type="text"
                className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] ${errors.name ? 'border-[#E3018C]' : 'border-[#E4E7EA]'}`}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. NatWest API Refresh"
              />
              {errors.name && <p className="text-xs text-[#B0003D] mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Objective <span className="text-[#E3018C]">*</span>
              </label>
              <textarea
                rows={2}
                className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] resize-none ${errors.objective ? 'border-[#E3018C]' : 'border-[#E4E7EA]'}`}
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="What does this initiative deliver and why?"
              />
              {errors.objective && <p className="text-xs text-[#B0003D] mt-1">{errors.objective}</p>}
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Driver <span className="text-[#E3018C]">*</span>
                </label>
                <select
                  className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] bg-white ${errors.driver ? 'border-[#E3018C]' : 'border-[#E4E7EA]'}`}
                  value={driver}
                  onChange={e => setDriver(e.target.value as Driver)}
                >
                  <option value="">Select…</option>
                  {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.driver && <p className="text-xs text-[#B0003D] mt-1">{errors.driver}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Business area</label>
                <select
                  className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] bg-white"
                  value={businessArea}
                  onChange={e => setBusinessArea(e.target.value as BusinessArea)}
                >
                  <option value="">Select…</option>
                  {BUSINESS_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Funding type</label>
                <div className="flex gap-1 mt-1">
                  {(['CAPEX', 'OPEX'] as FundingType[]).map(ft => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => setFundingType(fundingType === ft ? '' : ft)}
                      className={`flex-1 text-xs font-semibold py-2 rounded border transition-all ${
                        fundingType === ft
                          ? ft === 'CAPEX' ? 'bg-violet-600 border-violet-600 text-white' : 'bg-teal-600 border-teal-600 text-white'
                          : 'bg-white border-[#E4E7EA] text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Requesting area</label>
                <input
                  type="text"
                  className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                  value={requestingArea}
                  onChange={e => setRequestingArea(e.target.value)}
                  placeholder="e.g. Operations"
                />
              </div>
            </div>
          </div>

          {/* Sponsor */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Sponsor</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                Named sponsor <span className="text-[#E3018C]">*</span>
              </label>
              <input
                type="text"
                className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] ${errors.sponsorName ? 'border-[#E3018C]' : 'border-[#E4E7EA]'}`}
                value={sponsorName}
                onChange={e => setSponsorName(e.target.value)}
                placeholder="e.g. Claire Donovan"
              />
              {errors.sponsorName && <p className="text-xs text-[#B0003D] mt-1">{errors.sponsorName}</p>}
            </div>
            <div>
              <label className={`flex items-start gap-2 cursor-pointer rounded p-2 border transition-colors ${sponsorConfirmed ? 'bg-[#E8F5E1] border-[#4EA72E]/40' : errors.sponsorConfirmed ? 'bg-[#FCE7F3] border-[#E3018C]/40' : 'border-[#E4E7EA] hover:bg-[#F3F4F6]'}`}>
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[#0E2841]"
                  checked={sponsorConfirmed}
                  onChange={e => setSponsorConfirmed(e.target.checked)}
                />
                <div>
                  <span className="text-xs font-medium text-gray-700">I confirm this submission has been agreed with the named sponsor</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">This attestation is your accountability — sponsors are not a login role.</p>
                </div>
              </label>
              {errors.sponsorConfirmed && <p className="text-xs text-[#B0003D] mt-1">{errors.sponsorConfirmed}</p>}
            </div>
          </div>

          {/* Business case */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Business case</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">What has changed / why now</label>
              <textarea
                rows={2}
                className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] resize-none"
                value={whatsChanged}
                onChange={e => setWhatsChanged(e.target.value)}
                placeholder="What has changed since last assessed, or why is this needed now?"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Benefits</label>
              <textarea
                rows={2}
                className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] resize-none"
                value={benefits}
                onChange={e => setBenefits(e.target.value)}
                placeholder="Expected outcomes and benefits?"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Budget (£k)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                  value={indicativeBudget}
                  onChange={e => setIndicativeBudget(e.target.value)}
                  placeholder="e.g. 250"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Budget confidence</label>
                <select
                  className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] bg-white"
                  value={budgetConfidence}
                  onChange={e => setBudgetConfidence(e.target.value as BudgetConfidence)}
                >
                  <option value="">Select…</option>
                  <option value="High">High — detailed estimate</option>
                  <option value="Medium">Medium — broad scope known</option>
                  <option value="Low">Low — early approximation</option>
                  <option value="Order of magnitude">Order of magnitude</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Systems touched</label>
                <input
                  type="text"
                  className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                  value={systemsInput}
                  onChange={e => setSystemsInput(e.target.value)}
                  placeholder="VAMS, Lender API…"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — scoring panel */}
        <div className="bg-[#FAFAFA] flex flex-col">
          <div className="px-5 py-4 border-b border-[#E4E7EA]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Proposed value-add score</p>
                <p className="text-xs text-gray-400 mt-0.5">Delivery Ops will arbitrate — adjustments need a written note.</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span className={`text-3xl font-bold leading-none ${total >= 10 ? 'text-[#196B24]' : total >= 6 ? 'text-[#B5570E]' : 'text-gray-400'}`}>
                  {total}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {driverBonus > 0 ? `${baseScore} base + ${driverBonus} driver` : 'out of 14'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-2 flex-1">
            {VALUE_CATEGORIES.map((cat, idx) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-gray-700 flex-1 min-w-0 leading-tight">{cat}</span>
                <div className="flex gap-1 shrink-0">
                  {[0, 1, 2].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScore(idx, val)}
                      className={`w-8 h-7 text-xs font-semibold rounded border transition-all ${btnCls(val, scores[idx])}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Driver uplift */}
          <div className="px-5 py-4 border-t border-[#E4E7EA]">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Driver uplift <span className="normal-case font-normal">(+1 each)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['Regulatory', 'Lender', 'Financial', 'Audit'] as const).map(d => {
                const active = driverToggles[d];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDriverToggles(prev => ({ ...prev, [d]: !prev[d] }))}
                    className={`text-xs font-semibold px-3 py-2 rounded border transition-all text-left flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#0E2841] border-[#0E2841] text-white'
                        : 'bg-white border-[#E4E7EA] text-gray-500 hover:border-[#0E2841] hover:text-[#0E2841]'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 text-[9px] font-bold ${active ? 'bg-white border-white text-[#0E2841]' : 'border-gray-300'}`}>
                      {active ? '✓' : ''}
                    </span>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
