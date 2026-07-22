export const ACCOUNT_ENV_KEYS = [
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID',
  'NEXT_PUBLIC_COGNITO_DOMAIN',
] as const;

export interface PublicAccountConfig {
  authEnabled: boolean;
  billingEnabled: boolean;
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
  billingApiUrl: string;
  missingAuthConfiguration: readonly string[];
}

function clean(value: string | undefined): string {
  return value?.trim() ?? '';
}

function cleanDomain(value: string | undefined): string {
  return clean(value).replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function cleanUrl(value: string | undefined): string {
  return clean(value).replace(/\/$/, '');
}

export function getPublicAccountConfig(): PublicAccountConfig {
  const userPoolId = clean(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
  const userPoolClientId = clean(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID);
  const cognitoDomain = cleanDomain(process.env.NEXT_PUBLIC_COGNITO_DOMAIN);
  const billingApiUrl = cleanUrl(process.env.NEXT_PUBLIC_BILLING_API_URL);
  const values = [userPoolId, userPoolClientId, cognitoDomain];
  const missingAuthConfiguration = ACCOUNT_ENV_KEYS.filter((_, index) => !values[index]);

  return {
    authEnabled: missingAuthConfiguration.length === 0,
    billingEnabled: missingAuthConfiguration.length === 0 && billingApiUrl.length > 0,
    userPoolId,
    userPoolClientId,
    cognitoDomain,
    billingApiUrl,
    missingAuthConfiguration,
  };
}
