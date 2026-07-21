import { describe, expect, it } from 'vitest';
import { hasSubscriptionAccess, PROFESSIONAL_TOOL_IDS, requiredPlanForTool } from '@/lib/billing/access';
import { tools } from '@/config/tools';
import type { BillingPlan, EntitlementResponse, SubscriptionStatus } from '@/lib/billing/types';

function entitlement(plan: BillingPlan | null, status: SubscriptionStatus): EntitlementResponse {
  return {
    accountId: 'account-test',
    plan,
    status,
    features: [],
    trialEndsAt: null,
    currentPeriodEndsAt: null,
  };
}

describe('hosted subscription access policy', () => {
  it('classifies only real catalog tools as Professional', () => {
    const toolIds = new Set(tools.map((tool) => tool.id));
    expect(new Set(PROFESSIONAL_TOOL_IDS).size).toBe(PROFESSIONAL_TOOL_IDS.length);
    for (const toolId of PROFESSIONAL_TOOL_IDS) {
      expect(toolIds.has(toolId), `${toolId} must exist in the tool catalog`).toBe(true);
      expect(requiredPlanForTool(toolId)).toBe('professional');
    }
  });

  it('defaults standard tools to Personal', () => {
    expect(requiredPlanForTool('merge-pdf')).toBe('personal');
    expect(requiredPlanForTool('compress-pdf')).toBe('personal');
    expect(requiredPlanForTool('word-to-pdf')).toBe('personal');
  });

  it('allows active Personal accounts to use Personal tools only', () => {
    const personal = entitlement('personal', 'active');
    expect(hasSubscriptionAccess(personal, 'personal')).toBe(true);
    expect(hasSubscriptionAccess(personal, 'professional')).toBe(false);
  });

  it('allows active Professional and Teams accounts to use both levels', () => {
    for (const plan of ['professional', 'teams'] as const) {
      const paid = entitlement(plan, 'active');
      expect(hasSubscriptionAccess(paid, 'personal')).toBe(true);
      expect(hasSubscriptionAccess(paid, 'professional')).toBe(true);
    }
  });

  it('allows trials but denies inactive and payment-failure states', () => {
    expect(hasSubscriptionAccess(entitlement('professional', 'trialing'), 'professional')).toBe(true);
    for (const status of ['none', 'past_due', 'canceled'] as const) {
      expect(hasSubscriptionAccess(entitlement('professional', status), 'personal')).toBe(false);
      expect(hasSubscriptionAccess(entitlement('professional', status), 'professional')).toBe(false);
    }
  });
});
