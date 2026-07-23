import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSubscriptionStatus,
  planForPrice,
  publicEntitlement,
  validateReturnUrl,
} from '../src/index.mjs';

const prices = {
  PRICE_PERSONAL_MONTHLY: 'price_personal_monthly',
  PRICE_PERSONAL_ANNUAL: 'price_personal_annual',
  PRICE_PROFESSIONAL_MONTHLY: 'price_professional_monthly',
  PRICE_PROFESSIONAL_ANNUAL: 'price_professional_annual',
};

test('return URLs must be an allowed account page', () => {
  assert.equal(
    validateReturnUrl('http://localhost:3000/en/account/', ['http://localhost:3000']).pathname,
    '/en/account/',
  );
  assert.throws(
    () => validateReturnUrl('https://attacker.example/en/account/', ['http://localhost:3000']),
    /allowed HushPDF account page/,
  );
  assert.throws(
    () => validateReturnUrl('http://localhost:3000/en/tools/', ['http://localhost:3000']),
    /allowed HushPDF account page/,
  );
  assert.throws(
    () => validateReturnUrl('http://localhost:3000/not-a-locale/account/', ['http://localhost:3000']),
    /allowed HushPDF account page/,
  );
  assert.throws(
    () => validateReturnUrl('http://localhost:3000/en/account/?next=evil', ['http://localhost:3000']),
    /allowed HushPDF account page/,
  );
});

test('Stripe price IDs map only to supported self-serve plans', () => {
  assert.equal(planForPrice('price_personal_annual', prices), 'personal');
  assert.equal(planForPrice('price_professional_monthly', prices), 'professional');
  assert.equal(planForPrice('price_unknown', prices), null);
});

test('Stripe statuses normalize to the public entitlement contract', () => {
  assert.equal(normalizeSubscriptionStatus('active'), 'active');
  assert.equal(normalizeSubscriptionStatus('paused'), 'past_due');
  assert.equal(normalizeSubscriptionStatus('incomplete_expired'), 'canceled');
  assert.equal(normalizeSubscriptionStatus('incomplete'), 'none');
});

test('accounts without a billing record fail closed', () => {
  assert.deepEqual(publicEntitlement(undefined, 'account-1'), {
    accountId: 'account-1',
    plan: null,
    status: 'none',
    features: [],
    trialEndsAt: null,
    currentPeriodEndsAt: null,
  });
});
