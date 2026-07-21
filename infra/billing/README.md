# HushPDF Stripe billing sandbox

This stack adds subscription billing without putting Stripe secrets in the
browser or sending PDF content to AWS or Stripe. Cognito access tokens protect
the browser routes, Stripe hosts Checkout and the Customer Portal, and signed
webhook events are the authority for entitlements.

## Before deploying

1. In the Stripe Dashboard, enable **test mode**.
2. Create `HushPDF Personal` and `HushPDF Professional` products.
3. Give each product one monthly and one yearly recurring price:
   - Personal: $7 monthly and $49 yearly.
   - Professional: $12 monthly and $99 yearly.
4. Set each Price's tax behavior to either inclusive or exclusive. Stripe's
   Customer Portal does not allow subscription changes while tax behavior is
   unspecified. HushPDF's sandbox uses exclusive tax behavior.
5. Copy the four test `price_...` identifiers. Do not copy secret keys into the
   repository or `.env.local`.
6. Redeploy `infra/cognito-sandbox.yaml` once so existing accounts can request
   the new `hushpdf-billing/access` OAuth scope. Users must sign out and back in
   after that update.

## Deploy

Install AWS SAM CLI, then run from this directory:

```bash
sam build
sam deploy --guided
```

Use stack name `hushpdf-billing-sandbox`, the same AWS Region as Cognito, and
enter the Cognito stack's `UserPoolId` and `UserPoolClientId` outputs. Enter the
four Stripe test price IDs when prompted. Keep `AllowedOrigin` set to
`http://localhost:3000` for local testing.

SAM packages the Lambda dependencies and deploys API Gateway, Lambda,
DynamoDB, and Secrets Manager. No PDF-processing infrastructure is created.

## Add Stripe secrets

After deployment, open **AWS Secrets Manager** and edit the secret named
`hushpdf/stripe/sandbox`. Replace the placeholders with JSON containing your
Stripe **test** secret key:

```json
{
  "secretKey": "sk_test_...",
  "webhookSecret": "replace-after-creating-the-webhook"
}
```

Use the `StripeWebhookUrl` stack output to create a Stripe test-mode webhook
destination. Subscribe only to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Reveal that destination's `whsec_...` signing secret and replace the remaining
placeholder in Secrets Manager. The Lambda caches secrets in warm execution
environments, so redeploy or wait for a fresh environment after changing them.

Configure the Stripe Customer Portal in test mode, then copy the
`BillingApiUrl` stack output into the web app:

```dotenv
NEXT_PUBLIC_BILLING_API_URL=https://example.execute-api.us-east-1.amazonaws.com/sandbox
```

Restart `npm run dev`, sign out and back in, and use Stripe's documented test
card `4242 4242 4242 4242` with any future expiry and CVC. Never use a real card
in test mode.

## Security behavior

- API Gateway validates the Cognito issuer, client ID, signature, expiry, and
  custom billing scope before Lambda runs.
- Checkout and portal return URLs must use the configured HushPDF origin and an
  `/account/` path.
- The webhook verifies Stripe's signature against the unmodified request body.
- Browser redirects do not grant access. Only subscription webhook state does.
- Unknown, incomplete, canceled, or unconfigured plans receive no features.
