import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const template = readFileSync(resolve(process.cwd(), 'infra/billing/template.yaml'), 'utf8');
const handler = readFileSync(resolve(process.cwd(), 'infra/billing/src/index.mjs'), 'utf8');

describe('billing sandbox infrastructure', () => {
  it('protects browser routes with Cognito and leaves only the signed webhook public', () => {
    expect(template).toContain('DefaultAuthorizer: CognitoJwt');
    expect(template.match(/AuthorizationScopes:/g)).toHaveLength(3);
    expect(template).toMatch(/StripeWebhook:[\s\S]*?Authorizer: NONE/);
  });

  it('keeps Stripe credentials in Secrets Manager', () => {
    expect(template).toContain('AWS::SecretsManager::Secret');
    expect(template).toContain('STRIPE_SECRET_ARN');
    expect(template).not.toMatch(/sk_test_[A-Za-z0-9]/);
    expect(template).not.toMatch(/whsec_[A-Za-z0-9]/);
  });

  it('verifies the raw webhook body before processing events', () => {
    expect(handler).toContain('stripe.webhooks.constructEvent(requestBody(event)');
    expect(handler).toContain("event.isBase64Encoded ? Buffer.from(raw, 'base64')");
  });

  it('uses webhook subscription state as the entitlement authority', () => {
    expect(handler).toContain("stripeEvent.type === 'customer.subscription.updated'");
    expect(handler).toContain('stripe.subscriptions.retrieve(stripeEvent.data.object.id)');
    expect(handler).toContain('await syncSubscription(currentSubscription)');
  });

  it('rate limits the API and bounds untrusted request bodies', () => {
    expect(template).toContain('ThrottlingBurstLimit: 20');
    expect(template).toContain('ThrottlingRateLimit: 10');
    expect(handler).toContain('MAX_JSON_BODY_BYTES');
    expect(handler).toContain('MAX_WEBHOOK_BODY_BYTES');
    expect(handler).toContain("'cache-control': 'no-store'");
  });

  it('deduplicates signed Stripe webhook events with expiring records', () => {
    expect(handler).toContain('ConditionExpression: \'attribute_not_exists(accountId)\'');
    expect(handler).toContain('stripe-event#${stripeEvent.id}');
    expect(template).toContain('AttributeName: expiresAt');
    expect(template).toContain('Enabled: true');
  });
});
