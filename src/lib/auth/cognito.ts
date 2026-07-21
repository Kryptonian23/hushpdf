'use client';

import { Amplify } from 'aws-amplify';
import {
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
  signOut,
} from 'aws-amplify/auth';
import { getPublicAccountConfig } from '@/config/account';
import type { Locale } from '@/lib/i18n/config';

export interface AccountIdentity {
  userId: string;
  username: string;
  email?: string;
}

let configuredRedirectUrl: string | null = null;

function accountRedirectUrl(locale: Locale): string {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');
  return `${window.location.origin}${basePath}/${locale}/account/`;
}

export function configureCognito(locale: Locale): boolean {
  const config = getPublicAccountConfig();
  if (!config.authEnabled || typeof window === 'undefined') {
    return false;
  }

  const redirectUrl = accountRedirectUrl(locale);
  if (configuredRedirectUrl === redirectUrl) {
    return true;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          oauth: {
            domain: config.cognitoDomain,
            scopes: ['openid', 'email', 'hushpdf-billing/access'],
            redirectSignIn: [redirectUrl],
            redirectSignOut: [redirectUrl],
            responseType: 'code',
          },
        },
      },
    },
  });
  configuredRedirectUrl = redirectUrl;
  return true;
}

export async function getAccountIdentity(): Promise<AccountIdentity | null> {
  try {
    const [user, session] = await Promise.all([
      getCurrentUser(),
      fetchAuthSession(),
    ]);
    const emailClaim = session.tokens?.idToken?.payload.email;
    return {
      userId: user.userId,
      username: user.username,
      email: typeof emailClaim === 'string' ? emailClaim : undefined,
    };
  } catch {
    return null;
  }
}

export async function beginCognitoSignIn(): Promise<void> {
  await signInWithRedirect();
}

export async function endCognitoSession(): Promise<void> {
  await signOut();
}

export async function getCognitoAccessToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();
  if (!token) {
    throw new Error('A valid HushPDF account session is required.');
  }
  return token;
}
