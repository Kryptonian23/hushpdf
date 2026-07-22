import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCOUNT_ENV_KEYS, getPublicAccountConfig } from '@/config/account';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

describe('public account configuration', () => {
  it('fails closed when Cognito is not configured', () => {
    for (const key of ACCOUNT_ENV_KEYS) {
      vi.stubEnv(key, '');
    }
    vi.stubEnv('NEXT_PUBLIC_BILLING_API_URL', '');

    const config = getPublicAccountConfig();
    expect(config.authEnabled).toBe(false);
    expect(config.billingEnabled).toBe(false);
    expect(config.missingAuthConfiguration).toEqual(ACCOUNT_ENV_KEYS);
  });

  it('enables auth only when every public Cognito identifier exists', () => {
    vi.stubEnv('NEXT_PUBLIC_COGNITO_USER_POOL_ID', 'us-east-1_example');
    vi.stubEnv('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID', 'public-client-id');
    vi.stubEnv('NEXT_PUBLIC_COGNITO_DOMAIN', 'https://hushpdf.auth.us-east-1.amazoncognito.com/');
    vi.stubEnv('NEXT_PUBLIC_BILLING_API_URL', 'https://api.example.com/');

    expect(getPublicAccountConfig()).toMatchObject({
      authEnabled: true,
      billingEnabled: true,
      cognitoDomain: 'hushpdf.auth.us-east-1.amazoncognito.com',
      billingApiUrl: 'https://api.example.com',
      missingAuthConfiguration: [],
    });
  });

  it('does not enable billing without its API URL', () => {
    vi.stubEnv('NEXT_PUBLIC_COGNITO_USER_POOL_ID', 'us-east-1_example');
    vi.stubEnv('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID', 'public-client-id');
    vi.stubEnv('NEXT_PUBLIC_COGNITO_DOMAIN', 'hushpdf.auth.us-east-1.amazoncognito.com');
    vi.stubEnv('NEXT_PUBLIC_BILLING_API_URL', '');

    const config = getPublicAccountConfig();
    expect(config.authEnabled).toBe(true);
    expect(config.billingEnabled).toBe(false);
  });
});
