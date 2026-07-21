'use client';

import 'aws-amplify/auth/enable-oauth-listener';
import { useCallback, useEffect, useState } from 'react';
import { Hub } from 'aws-amplify/utils';
import { CreditCard, LogIn, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getPublicAccountConfig } from '@/config/account';
import {
  beginCognitoSignIn,
  configureCognito,
  endCognitoSession,
  getAccountIdentity,
  type AccountIdentity,
} from '@/lib/auth/cognito';
import {
  createCheckoutSession,
  createPortalSession,
  getEntitlements,
} from '@/lib/billing/client';
import type {
  BillingInterval,
  EntitlementResponse,
} from '@/lib/billing/types';
import type { Locale } from '@/lib/i18n/config';

interface AccountPageClientProps {
  locale: Locale;
}

export default function AccountPageClient({ locale }: AccountPageClientProps) {
  const config = getPublicAccountConfig();
  const [identity, setIdentity] = useState<AccountIdentity | null>(null);
  const [loading, setLoading] = useState(config.authEnabled);
  const [billingLoading, setBillingLoading] = useState(false);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshIdentity = useCallback(async () => {
    if (!configureCognito(locale)) {
      setLoading(false);
      return;
    }
    setIdentity(await getAccountIdentity());
    setLoading(false);
  }, [locale]);

  useEffect(() => {
    const cancelAuthListener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signInWithRedirect') {
        void refreshIdentity();
      }
      if (payload.event === 'signedOut') {
        setIdentity(null);
        setLoading(false);
      }
      if (payload.event === 'signInWithRedirect_failure') {
        setError('Secure sign-in could not be completed. Please try again.');
        setLoading(false);
      }
    });

    void refreshIdentity();

    return cancelAuthListener;
  }, [refreshIdentity]);

  useEffect(() => {
    if (!identity || !config.billingEnabled) {
      setEntitlement(null);
      return;
    }
    let active = true;
    setBillingLoading(true);
    void getEntitlements()
      .then((result) => {
        if (active) setEntitlement(result);
      })
      .catch(() => {
        if (active) setError('Could not load subscription status. Please try again.');
      })
      .finally(() => {
        if (active) setBillingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [config.billingEnabled, identity]);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      configureCognito(locale);
      await beginCognitoSignIn();
    } catch (signInError) {
      if (signInError instanceof Error && signInError.name === 'UserAlreadyAuthenticatedException') {
        await refreshIdentity();
        return;
      }
      setError('Could not start secure sign-in. Check the Cognito sandbox configuration.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await endCognitoSession();
      setIdentity(null);
      setLoading(false);
    } catch {
      setError('Could not complete sign-out. Please try again.');
      setLoading(false);
    }
  };

  const accountReturnUrl = () => window.location.href.split('?')[0];

  const handleCheckout = async (
    plan: 'personal' | 'professional',
    interval: BillingInterval,
  ) => {
    setError(null);
    setBillingLoading(true);
    try {
      const session = await createCheckoutSession({
        plan,
        interval,
        returnUrl: accountReturnUrl(),
      });
      window.location.assign(session.url);
    } catch {
      setError('Could not start Stripe Checkout. Please try again.');
      setBillingLoading(false);
    }
  };

  const handlePortal = async () => {
    setError(null);
    setBillingLoading(true);
    try {
      const session = await createPortalSession(accountReturnUrl());
      window.location.assign(session.url);
    } catch {
      setError('Could not open the Stripe billing portal. Please try again.');
      setBillingLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--color-background))]">
      <Header locale={locale} />
      <main id="main-content" className="flex-1 pt-28 pb-20" tabIndex={-1}>
        <section className="container mx-auto px-4" aria-labelledby="account-heading">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[hsl(var(--color-primary)/0.1)] mb-5">
                <UserRound className="h-7 w-7 text-[hsl(var(--color-primary))]" aria-hidden="true" />
              </div>
              <h1 id="account-heading" className="text-4xl font-bold tracking-tight mb-4">Your HushPDF account</h1>
              <p className="text-[hsl(var(--color-muted-foreground))] leading-relaxed">
                Account and subscription services never receive your PDF files, filenames, extracted text, or document metadata.
              </p>
            </div>

            <Card className="p-7" hover={false}>
              {!config.authEnabled ? (
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="h-6 w-6 text-[hsl(var(--color-primary))] shrink-0" aria-hidden="true" />
                    <div>
                      <h2 className="text-xl font-bold mb-2">Sandbox authentication is not connected yet</h2>
                      <p className="text-sm text-[hsl(var(--color-muted-foreground))] leading-relaxed">
                        The account UI is ready, but sign-in stays disabled until the public Cognito identifiers are configured. No client secret belongs in the browser.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[hsl(var(--color-muted)/0.5)] p-4">
                    <p className="text-sm font-semibold mb-2">Missing public configuration</p>
                    <ul className="space-y-1 font-mono text-xs text-[hsl(var(--color-muted-foreground))]">
                      {config.missingAuthConfiguration.map((key) => <li key={key}>{key}</li>)}
                    </ul>
                  </div>
                </div>
              ) : identity ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-[hsl(var(--color-muted-foreground))] mb-1">Signed in as</p>
                    <h2 className="text-xl font-bold">{identity.email ?? identity.username}</h2>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-[hsl(var(--color-border))]">
                    <CreditCard className="h-5 w-5 text-[hsl(var(--color-muted-foreground))]" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">Subscription sandbox</p>
                      <p className="text-sm text-[hsl(var(--color-muted-foreground))]">
                        {config.billingEnabled
                          ? `${entitlement?.plan ?? 'No plan'} · ${entitlement?.status ?? 'not subscribed'}`
                          : 'Billing API configuration is still required.'}
                      </p>
                    </div>
                  </div>
                  {config.billingEnabled && ['active', 'trialing', 'past_due'].includes(entitlement?.status ?? '') ? (
                    <Button onClick={handlePortal} loading={billingLoading}>
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                      Manage billing with Stripe
                    </Button>
                  ) : config.billingEnabled ? (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold">Choose a Stripe test-mode subscription</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-[hsl(var(--color-border))] p-4 space-y-3">
                          <div>
                            <p className="font-bold">Personal</p>
                            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">$7 monthly · $49 annually</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleCheckout('personal', 'monthly')} loading={billingLoading}>Monthly</Button>
                            <Button size="sm" variant="outline" onClick={() => handleCheckout('personal', 'annual')} disabled={billingLoading}>Annual</Button>
                          </div>
                        </div>
                        <div className="rounded-xl border border-[hsl(var(--color-primary)/0.5)] p-4 space-y-3">
                          <div>
                            <p className="font-bold">Professional</p>
                            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">$12 monthly · $99 annually</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleCheckout('professional', 'monthly')} loading={billingLoading}>Monthly</Button>
                            <Button size="sm" variant="outline" onClick={() => handleCheckout('professional', 'annual')} disabled={billingLoading}>Annual</Button>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                        Sandbox only. Stripe test mode cannot create real charges.
                      </p>
                    </div>
                  ) : null}
                  <Button variant="outline" onClick={handleSignOut} loading={loading}>
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-5">
                  <h2 className="text-xl font-bold">Sign in securely</h2>
                  <p className="text-sm text-[hsl(var(--color-muted-foreground))] max-w-lg mx-auto">
                    HushPDF uses Cognito&apos;s authorization-code flow with PKCE. Your password is handled by the managed identity service, not the PDF application.
                  </p>
                  <Button onClick={handleSignIn} loading={loading}>
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Continue to secure sign-in
                  </Button>
                </div>
              )}

              {error && <p className="mt-5 text-sm text-red-600" role="alert">{error}</p>}
            </Card>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
