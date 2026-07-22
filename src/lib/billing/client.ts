'use client';

import { getPublicAccountConfig } from '@/config/account';
import { getCognitoAccessToken } from '@/lib/auth/cognito';
import type {
  CheckoutRequest,
  EntitlementResponse,
  RedirectSessionResponse,
} from './types';

async function billingRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getPublicAccountConfig();
  if (!config.billingEnabled) {
    throw new Error('HushPDF sandbox billing is not configured.');
  }

  const accessToken = await getCognitoAccessToken();
  const response = await fetch(`${config.billingApiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Billing request failed with status ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export function getEntitlements(): Promise<EntitlementResponse> {
  return billingRequest<EntitlementResponse>('/me/entitlements');
}

export function createCheckoutSession(request: CheckoutRequest): Promise<RedirectSessionResponse> {
  return billingRequest<RedirectSessionResponse>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function createPortalSession(returnUrl: string): Promise<RedirectSessionResponse> {
  return billingRequest<RedirectSessionResponse>('/billing/portal', {
    method: 'POST',
    body: JSON.stringify({ returnUrl }),
  });
}
