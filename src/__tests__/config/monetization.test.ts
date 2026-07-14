import { describe, expect, it } from 'vitest';
import {
  PAID_ONLY_HEAVY_TOOL_IDS,
  PRICING_PLANS,
  REWARDED_ACCESS_POLICY,
  isRewardedAccessEnabled,
  isRewardedToolEligible,
} from '@/config/monetization';
import { LIBREOFFICE_TOOL_IDS } from '@/lib/libreoffice/shared-converter';

describe('monetization policy', () => {
  it('keeps live rewarded access disabled by default', () => {
    expect(isRewardedAccessEnabled()).toBe(false);
  });

  it('defines a bounded, web-only reward', () => {
    expect(REWARDED_ACCESS_POLICY.durationMinutes).toBe(30);
    expect(REWARDED_ACCESS_POLICY.maxUnlocksPerDay).toBe(3);
    expect(REWARDED_ACCESS_POLICY.webOnly).toBe(true);
  });

  it('keeps every LibreOffice-backed tool paid-only', () => {
    expect(new Set(PAID_ONLY_HEAVY_TOOL_IDS)).toEqual(LIBREOFFICE_TOOL_IDS);
    for (const toolId of PAID_ONLY_HEAVY_TOOL_IDS) {
      expect(isRewardedToolEligible(toolId)).toBe(false);
    }
    expect(isRewardedToolEligible('merge-pdf')).toBe(true);
  });

  it('publishes the launch pricing hypotheses without a zero-price claim', () => {
    expect(PRICING_PLANS.map((plan) => plan.id)).toEqual([
      'ad-supported',
      'personal',
      'professional',
      'teams',
    ]);
    expect(JSON.stringify(PRICING_PLANS).toLowerCase()).not.toContain('free');
    expect(PRICING_PLANS.find((plan) => plan.id === 'personal')?.priceLabel).toBe('$7');
    expect(PRICING_PLANS.find((plan) => plan.id === 'professional')?.priceLabel).toBe('$12');
  });
});
