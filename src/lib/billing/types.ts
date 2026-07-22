export type BillingPlan = 'personal' | 'professional' | 'teams';
export type BillingInterval = 'monthly' | 'annual';
export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled';

export interface EntitlementResponse {
  accountId: string;
  plan: BillingPlan | null;
  status: SubscriptionStatus;
  features: readonly string[];
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
}

export interface CheckoutRequest {
  plan: Exclude<BillingPlan, 'teams'>;
  interval: BillingInterval;
  returnUrl: string;
}

export interface RedirectSessionResponse {
  url: string;
}
