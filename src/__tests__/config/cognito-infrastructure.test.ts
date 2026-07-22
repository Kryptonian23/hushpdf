import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const template = readFileSync(resolve(process.cwd(), 'infra/cognito-sandbox.yaml'), 'utf8');

describe('Cognito sandbox infrastructure', () => {
  it('pins the user pool to the lower-cost Lite feature tier', () => {
    expect(template).toContain('UserPoolTier: LITE');
  });

  it('defines a public browser client using only the authorization-code grant', () => {
    expect(template).toContain('GenerateSecret: false');
    expect(template).toContain('AllowedOAuthFlowsUserPoolClient: true');
    expect(template).toMatch(/AllowedOAuthFlows:\s+\- code/);
    expect(template).not.toMatch(/AllowedOAuthFlows:\s+[\s\S]*?\- implicit/);
  });

  it('issues a custom access-token scope for the billing API', () => {
    expect(template).toContain('AWS::Cognito::UserPoolResourceServer');
    expect(template).toContain('${BillingScopeIdentifier}/access');
  });

  it('registers exact localhost account callback and logout URLs', () => {
    const callback = 'Default: http://localhost:3000/en/account/';
    expect(template.match(new RegExp(callback.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))).toHaveLength(2);
  });

  it('exports every public Cognito value required by the account UI', () => {
    expect(template).toContain('NEXT_PUBLIC_COGNITO_USER_POOL_ID');
    expect(template).toContain('NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID');
    expect(template).toContain('NEXT_PUBLIC_COGNITO_DOMAIN');
  });
});
