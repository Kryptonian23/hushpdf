'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CreditCard, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { getPublicAccountConfig } from '@/config/account';
import { configureCognito, getAccountIdentity } from '@/lib/auth/cognito';
import { type AccessRequirement, hasSubscriptionAccess } from '@/lib/billing/access';
import { getEntitlements } from '@/lib/billing/client';
import type { EntitlementResponse } from '@/lib/billing/types';
import type { Locale } from '@/lib/i18n/config';

type GateState =
  | 'loading'
  | 'allowed'
  | 'signed-out'
  | 'subscription-required'
  | 'upgrade-required'
  | 'error';

interface SubscriptionGateProps {
  children: ReactNode;
  locale: Locale;
  requiredPlan: AccessRequirement;
  resourceName: string;
}
function linkStyles(variant: 'primary' | 'outline'): string {
  const common = 'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-ring))]';
  return variant === 'primary'
    ? `${common} bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))] hover:bg-[hsl(var(--color-primary-hover))]`
    : `${common} border-2 border-[hsl(var(--color-border))] text-[hsl(var(--color-foreground))] hover:bg-[hsl(var(--color-muted))]`;
}

export function SubscriptionGate({ children, locale, requiredPlan, resourceName }: SubscriptionGateProps) {
  const config = getPublicAccountConfig();
  const [state, setState] = useState<GateState>(config.billingEnabled ? 'loading' : 'allowed');
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(null);

  const checkAccess = useCallback(async () => {
    if (!config.billingEnabled) {
      setState('allowed');
      return;
    }

    setState('loading');
    try {
      configureCognito(locale);
      const identity = await getAccountIdentity();
      if (!identity) {
        setState('signed-out');
        return;
      }

      const nextEntitlement = await getEntitlements();
      setEntitlement(nextEntitlement);
      if (hasSubscriptionAccess(nextEntitlement, requiredPlan)) {
        setState('allowed');
      } else if (
        requiredPlan === 'professional'
        && nextEntitlement.plan === 'personal'
        && ['active', 'trialing'].includes(nextEntitlement.status)
      ) {
        setState('upgrade-required');
      } else {
        setState('subscription-required');
      }
    } catch {
      setState('error');
    }
  }, [config.billingEnabled, locale, requiredPlan]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  if (state === 'allowed') {
    return <>{children}</>;
  }

  if (state === 'loading') {
    return (
      <Card className="min-h-64 flex items-center justify-center text-center" hover={false}>
        <div className="space-y-3" role="status">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-[hsl(var(--color-primary))]" aria-hidden="true" />
          <p className="font-semibold">Checking your HushPDF subscription…</p>
          <p className="text-sm text-[hsl(var(--color-muted-foreground))]">Your documents remain on this device.</p>
        </div>
      </Card>
    );
  }

  const accountHref = `/${locale}/account/`;
  const pricingHref = `/${locale}/pricing/`;
  const isUpgrade = state === 'upgrade-required';
  const isPastDue = entitlement?.status === 'past_due';

  return (
    <Card className="min-h-64 flex items-center justify-center text-center" hover={false}>
      <div className="max-w-xl space-y-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--color-primary)/0.1)]">
          {state === 'error'
            ? <RefreshCw className="h-6 w-6 text-[hsl(var(--color-primary))]" aria-hidden="true" />
            : <LockKeyhole className="h-6 w-6 text-[hsl(var(--color-primary))]" aria-hidden="true" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {state === 'signed-out' && `Sign in to use ${resourceName}`}
            {isUpgrade && `${resourceName} requires Professional`}
            {state === 'subscription-required' && (isPastDue ? 'Update billing to restore access' : `Choose a plan to use ${resourceName}`)}
            {state === 'error' && 'Subscription status is temporarily unavailable'}
          </h2>
          <p className="text-[hsl(var(--color-muted-foreground))]">
            {state === 'signed-out' && 'Sign in securely to check your HushPDF subscription.'}
            {isUpgrade && 'Upgrade from Personal to unlock workflows, batch processing, advanced OCR, automation, and prepress tools.'}
            {state === 'subscription-required' && (isPastDue
              ? 'Open your account to update the payment method for this subscription.'
              : 'An active Personal or Professional subscription unlocks private, on-device PDF processing.')}
            {state === 'error' && 'Access fails closed when the billing service cannot be verified. Please retry in a moment.'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {state === 'error' ? (
            <button type="button" className={linkStyles('primary')} onClick={() => void checkAccess()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          ) : (
            <Link href={accountHref} className={linkStyles('primary')}>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              {state === 'signed-out' ? 'Sign in' : isUpgrade ? 'Upgrade plan' : 'View account'}
            </Link>
          )}
          <Link href={pricingHref} className={linkStyles('outline')}>Compare plans</Link>
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-[hsl(var(--color-muted-foreground))]">
          <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          Access checks receive no PDF files, filenames, extracted text, or document metadata.
        </p>
      </div>
    </Card>
  );
}
