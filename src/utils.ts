import type { RAG, Stage, Initiative } from './types';

export const BUSINESS_AREAS = [
  'Central Ops',
  'Field Ops',
  'Technical',
  'Customer Care',
  'Finance',
  'IQ',
  'New Build',
  'Props',
  'Quality',
  'Risk',
] as const;

export const RAG_STYLES: Record<RAG, { dot: string; text: string; bg: string; label: string }> = {
  Green: { dot: 'bg-[#4EA72E]', text: 'text-[#196B24]', bg: 'bg-[#E8F5E1]', label: 'Green' },
  Amber: { dot: 'bg-[#E97132]', text: 'text-[#B5570E]', bg: 'bg-[#FDF0E7]', label: 'Amber' },
  Red:   { dot: 'bg-[#E3018C]', text: 'text-[#B0003D]', bg: 'bg-[#FCE7F3]', label: 'Red'   },
};

export const STAGE_STYLES: Record<Stage, string> = {
  'Idea capture':            'bg-sky-50 text-sky-700',
  'Awaiting BA assessment':  'bg-cyan-50 text-cyan-700',
  'Awaiting arbitration':    'bg-amber-50 text-amber-700',
  'Awaiting POB assessment': 'bg-indigo-50 text-indigo-700',
  'Idea or request':         'bg-gray-100 text-gray-600',
  'Under assessment':        'bg-blue-50 text-blue-700',
  'Approved, not started':   'bg-violet-50 text-violet-700',
  'In delivery':             'bg-emerald-50 text-emerald-700',
  'On hold':                 'bg-orange-50 text-orange-700',
  'Transitioning to BAU':    'bg-teal-50 text-teal-700',
  'Rejected':                'bg-red-50 text-red-700',
  'Ratification rejected':   'bg-pink-50 text-pink-700',
  'Closed':                  'bg-gray-200 text-gray-500',
};

export const DRIVERS = [
  'Strategic programme',
  'Lender mandated or client request',
  'Regulatory or compliance',
  'Operational improvement',
  'Cost reduction',
  'Technology or infrastructure',
  'Other',
] as const;

export const STAGES = [
  'Idea capture',
  'Awaiting BA assessment',
  'Awaiting arbitration',
  'Awaiting POB assessment',
  'Idea or request',
  'Under assessment',
  'Approved, not started',
  'In delivery',
  'On hold',
  'Transitioning to BAU',
  'Rejected',
  'Ratification rejected',
  'Closed',
] as const;

export const VALUE_CATEGORIES = [
  'Market position / lender retention',
  'Financial impact',
  'FTE impact',
  'Service quality',
  'Staff retention / morale',
  'Business risk if not delivered',
  'Legal / regulatory compliance',
];

// The score that drives all downstream logic: POB override > agreed > proposed
export function effectiveScore(i: Initiative): number {
  return i.pobOverrideScore ?? i.agreedScore;
}

export function fmt(n: number, currency = false) {
  if (currency) return `£${n.toLocaleString()}k`;
  return n.toString();
}

export function fmtDate(d: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function scoreColor(score: number) {
  if (score >= 10) return 'text-[#196B24]';
  if (score >= 6)  return 'text-[#B5570E]';
  return 'text-gray-500';
}

export function scoreBg(score: number) {
  if (score >= 10) return 'bg-[#E8F5E1] text-[#196B24]';
  if (score >= 6)  return 'bg-[#FDF0E7] text-[#B5570E]';
  return 'bg-gray-100 text-gray-500';
}
