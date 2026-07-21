import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionGate } from '@/components/billing/SubscriptionGate';
import type { EntitlementResponse } from '@/lib/billing/types';

const mocks = vi.hoisted(() => ({
  getPublicAccountConfig: vi.fn(),
  configureCognito: vi.fn(),
  getAccountIdentity: vi.fn(),
  getEntitlements: vi.fn(),
}));

vi.mock('@/config/account', () => ({
  getPublicAccountConfig: mocks.getPublicAccountConfig,
}));

vi.mock('@/lib/auth/cognito', () => ({
  configureCognito: mocks.configureCognito,
  getAccountIdentity: mocks.getAccountIdentity,
}));

vi.mock('@/lib/billing/client', () => ({
  getEntitlements: mocks.getEntitlements,
}));

function entitlement(
  plan: EntitlementResponse['plan'],
  status: EntitlementResponse['status'],
): EntitlementResponse {
  return {
    accountId: 'account-test',
    plan,
    status,
    features: [],
    trialEndsAt: null,
    currentPeriodEndsAt: null,
  };
}

function renderGate(requiredPlan: 'personal' | 'professional' = 'personal') {
  return render(
    <SubscriptionGate locale="en" requiredPlan={requiredPlan} resourceName="Merge PDF">
      <div>Private tool interface</div>
    </SubscriptionGate>,
  );
}

describe('SubscriptionGate', () => {
  beforeEach(() => {
    mocks.getPublicAccountConfig.mockReturnValue({ billingEnabled: true });
    mocks.configureCognito.mockReturnValue(true);
    mocks.getAccountIdentity.mockResolvedValue({
      userId: 'user-test',
      username: 'user@example.com',
      email: 'user@example.com',
    });
    mocks.getEntitlements.mockResolvedValue(entitlement('personal', 'active'));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps source-only self-hosted builds usable when billing is not configured', () => {
    mocks.getPublicAccountConfig.mockReturnValue({ billingEnabled: false });
    renderGate();
    expect(screen.getByText('Private tool interface')).toBeInTheDocument();
  });

  it('asks signed-out hosted users to authenticate without rendering the tool', async () => {
    mocks.getAccountIdentity.mockResolvedValue(null);
    renderGate();
    expect(await screen.findByText('Sign in to use Merge PDF')).toBeInTheDocument();
    expect(screen.queryByText('Private tool interface')).not.toBeInTheDocument();
  });

  it('denies canceled subscriptions', async () => {
    mocks.getEntitlements.mockResolvedValue(entitlement('personal', 'canceled'));
    renderGate();
    expect(await screen.findByText('Choose a plan to use Merge PDF')).toBeInTheDocument();
    expect(screen.queryByText('Private tool interface')).not.toBeInTheDocument();
  });

  it('allows active Personal subscriptions to render standard tools', async () => {
    renderGate();
    expect(await screen.findByText('Private tool interface')).toBeInTheDocument();
  });

  it('asks Personal subscribers to upgrade for Professional resources', async () => {
    renderGate('professional');
    expect(await screen.findByText('Merge PDF requires Professional')).toBeInTheDocument();
    expect(screen.queryByText('Private tool interface')).not.toBeInTheDocument();
  });

  it('allows active Professional subscriptions to render Professional resources', async () => {
    mocks.getEntitlements.mockResolvedValue(entitlement('professional', 'active'));
    renderGate('professional');
    expect(await screen.findByText('Private tool interface')).toBeInTheDocument();
  });
});
