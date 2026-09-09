export type Driver =
  | 'Strategic programme'
  | 'Lender mandated or client request'
  | 'Regulatory or compliance'
  | 'Operational improvement'
  | 'Cost reduction'
  | 'Technology or infrastructure'
  | 'Other';

export type Stage =
  | 'Idea capture'
  | 'Awaiting BA assessment'
  | 'Awaiting arbitration'
  | 'Awaiting POB assessment'
  | 'Idea or request'
  | 'Under assessment'
  | 'Approved, not started'
  | 'In delivery'
  | 'On hold'
  | 'Transitioning to BAU'
  | 'Rejected'
  | 'Ratification rejected'
  | 'Closed';

export type RAG = 'Green' | 'Amber' | 'Red';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Role = 'Requester' | 'Delivery Ops' | 'Portfolio Delivery' | 'POB';

export type BusinessArea =
  | 'Central Ops'
  | 'Field Ops'
  | 'Technical'
  | 'Customer Care'
  | 'Finance'
  | 'IQ'
  | 'New Build'
  | 'Props'
  | 'Quality'
  | 'Risk';

export type FundingType = 'CAPEX' | 'OPEX';
export type BudgetConfidence = 'High' | 'Medium' | 'Low' | 'Order of magnitude';

export interface Initiative {
  id: string;
  name: string;
  objective: string;
  driver: Driver;
  businessArea?: BusinessArea;
  fundingType?: FundingType;
  budgetConfidence?: BudgetConfidence;
  stage: Stage;
  rag: RAG;
  priority: Priority;
  // Scores
  valueScore: number;        // legacy; kept for seed compat
  proposedScore: number;     // sponsor's proposed 0–14
  proposedScoreBreakdown?: number[]; // per-category (7 × 0–2)
  driverUplift?: string[]; // active driver toggles at submission
  agreedScore: number;       // post-arbitration; drives all downstream logic
  // Intake
  sponsorName: string;
  sponsorConfirmed?: boolean;
  whatsChanged?: string;
  benefits?: string;
  indicativeBudget?: number;
  businessOwner: string;
  projectManager: string;
  demand: { ba: number; dev: number; pm: number; ops: number };
  systemsTouched: string[];
  fundingStatus: string;
  budget: number;
  startDate: string;
  endDate: string;
  nextMilestone: string;
  nextMilestoneDate: string;
  spofNote?: string;
  lenderVisible: boolean;
  capacityConfirmed?: boolean;
  // Arbitration
  arbitrationNote?: string;
  arbitratedBy?: string;
  // POB assessment
  pobDecision?: 'Approved' | 'Rejected' | 'Deferred';
  pobDecisionReason?: string;
  deferredToSession?: string;
  pobOverrideScore?: number;
  pobOverrideReason?: string;
  // Acceleration
  accelerated?: boolean;
  accelerationReason?: string;
  chairDecision?: 'Approved' | 'Rejected';
  chairDecisionBy?: string;
  ratificationStatus?: 'Pending' | 'Ratified' | 'Rejected';
}

export interface DecisionLogEntry {
  id: string;
  date: string;
  initiative: string;
  decision: string;
  owner: string;
  reason?: string;
  type?: 'arbitration' | 'pob-assessment' | 'chair-decision' | 'ratification' | 'board-decision';
}

export type Screen =
  | 'portfolio'
  | 'new-request'
  | 'idea'
  | 'arbitration'
  | 'pob-assessment'
  | 'triage'
  | 'capacity'
  | 'ranking'
  | 'plan'
  | 'board';
