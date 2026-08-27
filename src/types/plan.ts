export type PlanId = "bronze" | "prata" | "ouro";

export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  badge: string;
  tagline: string;
  audience: string;
  monthly: number;
  yearly: number;
  featured: boolean;
  cta: string;
  includes: string[];
  perks: string[];
}

export interface CompareRow {
  group: string;
  feature: string;
  values: Record<PlanId, boolean | string>;
}

export interface PlanFaq {
  question: string;
  answer: string;
}
