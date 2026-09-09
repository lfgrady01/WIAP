import { useState } from 'react';
import { useApp } from '../context';
import { DRIVERS, BUSINESS_AREAS } from '../utils';
import type { Driver, BusinessArea, FundingType, BudgetConfidence } from '../types';

export default function IdeaCapture() {
  const { addInitiative, navigateTo, showToast } = useApp();

  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [driver, setDriver] = useState<Driver | ''>('');
  const [benefit, setBenefit] = useState('');
  const [requestingArea, setRequestingArea] = useState('');
  const [businessArea, setBusinessArea] = useState<BusinessArea | ''>('');
  const [fundingType, setFundingType] = useState<FundingType | ''>('');
  const [roughCost, setRoughCost] = useState('');
  const [budgetConfidence, setBudgetConfidence] = useState<BudgetConfidence | ''>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required';
    if (!objective.trim()) e.objective = 'Required';
    if (!driver) e.driver = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    addInitiative({
      id: `idea-${Date.now()}`,
      name: name.trim(),
      objective: objective.trim(),
      driver: driver as Driver,
      stage: 'Idea capture',
      rag: 'Green',
      priority: 'Medium',
      valueScore: 0,
      proposedScore: 0,
      agreedScore: 0,
      sponsorName: requestingArea.trim() || 'Not yet assigned',
      benefits: benefit.trim() || undefined,
      indicativeBudget: roughCost ? parseInt(roughCost) : undefined,
      businessArea: businessArea || undefined,
      fundingType: fundingType || undefined,
      budgetConfidence: budgetConfidence || undefined,
      businessOwner: requestingArea.trim() || '',
      projectManager: '',
      demand: { ba: 0, dev: 0, pm: 0, ops: 0 },
      systemsTouched: [],
      fundingStatus: 'Not yet submitted',
      budget: 0,
      startDate: '',
      endDate: '',
      nextMilestone: 'BA assessment',
      nextMilestoneDate: '',
      lenderVisible: false,
      capacityConfirmed: false,
      accelerated: false,
    });

    showToast("Idea captured — a BA will pick this up for assessment");
    navigateTo('portfolio');
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <div className="bg-white border border-[#E4E7EA] rounded-[10px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E7EA] bg-sky-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0 text-sky-600 text-base mt-0.5">
              💡
            </div>
            <div>
              <h2 className="font-semibold text-[#0E2841] text-base">Submit an idea</h2>
              <p className="text-xs text-sky-700 mt-0.5">
                Quick capture — no scoring needed. A BA will review your idea, do a full assessment, and route it appropriately.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              What is the idea? <span className="text-[#E3018C]">*</span>
            </label>
            <input
              type="text"
              className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] ${errors.name ? 'border-[#E3018C]' : 'border-[#E4E7EA]'}`}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Automated valuation report delivery"
            />
            {errors.name && <p className="text-xs text-[#B0003D] mt-1">{errors.name}</p>}
          </div>

          {/* Objective */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              What problem does it solve? <span className="text-[#E3018C]">*</span>
            </label>
            <textarea
              rows={3}
              className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] resize-none ${errors.objective ? 'border-[#E3018C]' : 'border-[#E4E7EA]'}`}
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="Describe the opportunity, pain point, or outcome you have in mind."
            />
            {errors.objective && <p className="text-xs text-[#B0003D] mt-1">{errors.objective}</p>}
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Driver */}
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

            {/* Business area */}
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

            {/* Funding type */}
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

            {/* Requesting area */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Your team</label>
              <input
                type="text"
                className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                value={requestingArea}
                onChange={e => setRequestingArea(e.target.value)}
                placeholder="e.g. Operations"
              />
            </div>
          </div>

          {/* Benefit */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Expected benefit <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
            <textarea
              rows={2}
              className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841] resize-none"
              value={benefit}
              onChange={e => setBenefit(e.target.value)}
              placeholder="What improvement or outcome do you expect?"
            />
          </div>

          {/* Rough cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Rough cost estimate (£k) <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <input
                type="number"
                min={0}
                className="w-full text-sm border border-[#E4E7EA] rounded px-3 py-2 focus:outline-none focus:border-[#0E2841]"
                value={roughCost}
                onChange={e => setRoughCost(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Budget confidence <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
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
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E4E7EA] bg-[#FAFAFA] flex items-center justify-between gap-3">
          <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs">
            A BA will assess this idea and determine whether it needs POB approval before progressing.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('portfolio')}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded border border-[#E4E7EA] hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm bg-sky-600 text-white font-medium px-5 py-1.5 rounded hover:bg-sky-700 transition-colors"
            >
              Submit idea
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
