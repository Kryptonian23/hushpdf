import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import Stripe from 'stripe';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const secretsManager = new SecretsManagerClient({});
const tableName = process.env.ACCOUNTS_TABLE_NAME;

const FEATURES = Object.freeze({
  personal: Object.freeze(['core-tools', 'desktop-app', 'product-updates', 'local-history']),
  professional: Object.freeze([
    'core-tools',
    'desktop-app',
    'product-updates',
    'local-history',
    'batch-processing',
    'workflow-builder',
    'advanced-ocr',
    'priority-support',
  ]),
});

let cachedSecrets;
let cachedStripe;

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function requestBody(event) {
  const raw = event.body ?? '';
  return event.isBase64Encoded ? Buffer.from(raw, 'base64').toString('utf8') : raw;
}

function parseJsonBody(event) {
  try {
    return JSON.parse(requestBody(event));
  } catch {
    throw Object.assign(new Error('The request body must be valid JSON.'), { statusCode: 400 });
  }
}

function accountIdFrom(event) {
  const accountId = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!accountId) {
    throw Object.assign(new Error('A valid HushPDF account is required.'), { statusCode: 401 });
  }
  return accountId;
}

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function validateReturnUrl(value, origins = allowedOrigins()) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Object.assign(new Error('A valid returnUrl is required.'), { statusCode: 400 });
  }
  if (!origins.includes(url.origin) || !url.pathname.endsWith('/account/')) {
    throw Object.assign(new Error('returnUrl must be an allowed HushPDF account page.'), { statusCode: 400 });
  }
  return url;
}

export function priceMap(environment = process.env) {
  return {
    personal: {
      monthly: environment.PRICE_PERSONAL_MONTHLY,
      annual: environment.PRICE_PERSONAL_ANNUAL,
    },
    professional: {
      monthly: environment.PRICE_PROFESSIONAL_MONTHLY,
      annual: environment.PRICE_PROFESSIONAL_ANNUAL,
    },
  };
}

export function planForPrice(priceId, environment = process.env) {
  const prices = priceMap(environment);
  for (const [plan, intervals] of Object.entries(prices)) {
    if (Object.values(intervals).includes(priceId)) return plan;
  }
  return null;
}

export function publicEntitlement(item, accountId) {
  return {
    accountId,
    plan: item?.plan ?? null,
    status: item?.status ?? 'none',
    features: item?.features ?? [],
    trialEndsAt: item?.trialEndsAt ?? null,
    currentPeriodEndsAt: item?.currentPeriodEndsAt ?? null,
  };
}

export function normalizeSubscriptionStatus(status) {
  if (status === 'trialing' || status === 'active' || status === 'past_due' || status === 'canceled') {
    return status;
  }
  if (status === 'unpaid' || status === 'paused') return 'past_due';
  if (status === 'incomplete_expired') return 'canceled';
  return 'none';
}

async function stripeSecrets() {
  if (cachedSecrets) return cachedSecrets;
  const result = await secretsManager.send(new GetSecretValueCommand({
    SecretId: process.env.STRIPE_SECRET_ARN,
  }));
  const parsed = JSON.parse(result.SecretString ?? '{}');
  if (!parsed.secretKey?.startsWith('sk_test_') || !parsed.webhookSecret?.startsWith('whsec_')) {
    throw Object.assign(new Error('Stripe test-mode secrets are not configured.'), { statusCode: 503 });
  }
  cachedSecrets = parsed;
  return cachedSecrets;
}

async function stripeClient() {
  if (cachedStripe) return cachedStripe;
  const secrets = await stripeSecrets();
  cachedStripe = new Stripe(secrets.secretKey, { maxNetworkRetries: 2 });
  return cachedStripe;
}

async function getAccount(accountId) {
  const result = await dynamo.send(new GetCommand({
    TableName: tableName,
    Key: { accountId },
    ConsistentRead: true,
  }));
  return result.Item;
}

async function updateAccount(accountId, values) {
  const names = {};
  const data = {};
  const assignments = [];
  for (const [key, value] of Object.entries(values)) {
    names[`#${key}`] = key;
    data[`:${key}`] = value;
    assignments.push(`#${key} = :${key}`);
  }
  names['#updatedAt'] = 'updatedAt';
  data[':updatedAt'] = new Date().toISOString();
  assignments.push('#updatedAt = :updatedAt');
  await dynamo.send(new UpdateCommand({
    TableName: tableName,
    Key: { accountId },
    UpdateExpression: `SET ${assignments.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: data,
  }));
}

async function entitlements(event) {
  const accountId = accountIdFrom(event);
  return response(200, publicEntitlement(await getAccount(accountId), accountId));
}

async function checkout(event) {
  const accountId = accountIdFrom(event);
  const { plan, interval, returnUrl } = parseJsonBody(event);
  const priceId = priceMap()[plan]?.[interval];
  if (!priceId || priceId.startsWith('price_replace_')) {
    throw Object.assign(new Error('That billing plan is not configured.'), { statusCode: 400 });
  }
  const returnPage = validateReturnUrl(returnUrl);
  const account = await getAccount(accountId);
  if (['active', 'trialing'].includes(account?.status)) {
    throw Object.assign(new Error('Manage the existing subscription in the billing portal.'), { statusCode: 409 });
  }

  const stripe = await stripeClient();
  let customerId = account?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create(
      { metadata: { accountId } },
      { idempotencyKey: `hushpdf-customer-${accountId}` },
    );
    customerId = customer.id;
    await updateAccount(accountId, { stripeCustomerId: customerId });
  }

  const successUrl = new URL(returnPage);
  successUrl.searchParams.set('checkout', 'success');
  const cancelUrl = new URL(returnPage);
  cancelUrl.searchParams.set('checkout', 'canceled');
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: accountId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { accountId, plan, interval } },
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
  });
  return response(200, { url: session.url });
}

async function portal(event) {
  const accountId = accountIdFrom(event);
  const { returnUrl } = parseJsonBody(event);
  const returnPage = validateReturnUrl(returnUrl);
  const account = await getAccount(accountId);
  if (!account?.stripeCustomerId) {
    throw Object.assign(new Error('No Stripe customer exists for this account yet.'), { statusCode: 409 });
  }
  const stripe = await stripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: returnPage.toString(),
  });
  return response(200, { url: session.url });
}

async function syncSubscription(subscription) {
  const accountId = subscription.metadata?.accountId;
  if (!accountId) return;
  const price = subscription.items?.data?.[0]?.price?.id;
  const plan = planForPrice(price);
  const status = normalizeSubscriptionStatus(subscription.status);
  const grantsAccess = status === 'active' || status === 'trialing';
  const periodEnd = subscription.current_period_end
    ?? subscription.items?.data?.[0]?.current_period_end;
  await updateAccount(accountId, {
    stripeCustomerId: typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id,
    stripeSubscriptionId: subscription.id,
    plan,
    status,
    features: grantsAccess && plan ? FEATURES[plan] : [],
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    currentPeriodEndsAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  });
}

async function webhook(event) {
  const signature = event.headers?.['stripe-signature'] ?? event.headers?.['Stripe-Signature'];
  if (!signature) return response(400, { error: 'Missing Stripe signature.' });
  const secrets = await stripeSecrets();
  const stripe = await stripeClient();
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(requestBody(event), signature, secrets.webhookSecret);
  } catch {
    return response(400, { error: 'Invalid Stripe signature.' });
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    if (session.client_reference_id && session.customer) {
      await updateAccount(session.client_reference_id, {
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer.id,
      });
    }
  }
  if (
    stripeEvent.type === 'customer.subscription.created'
    || stripeEvent.type === 'customer.subscription.updated'
    || stripeEvent.type === 'customer.subscription.deleted'
  ) {
    await syncSubscription(stripeEvent.data.object);
  }
  return response(200, { received: true });
}

export async function handler(event) {
  try {
    const routeKey = event.routeKey;
    if (routeKey === 'GET /me/entitlements') return await entitlements(event);
    if (routeKey === 'POST /billing/checkout') return await checkout(event);
    if (routeKey === 'POST /billing/portal') return await portal(event);
    if (routeKey === 'POST /billing/webhook') return await webhook(event);
    return response(404, { error: 'Not found.' });
  } catch (error) {
    console.error('Billing request failed', { name: error?.name, message: error?.message });
    return response(error?.statusCode ?? 500, {
      error: error?.statusCode ? error.message : 'The billing service could not complete the request.',
    });
  }
}
