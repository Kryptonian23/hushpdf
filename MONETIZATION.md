# HushPDF Monetization Foundation

## Product position

HushPDF is a paid, privacy-first PDF workspace. The hosted product sells a maintained experience, signed desktop builds, updates, workflow convenience, and support. PDF document contents continue to be processed locally and are never sent to the billing or identity systems.

The project remains licensed under the GNU AGPLv3. Customer-facing pages must retain a prominent Source link and the required legal notices, but the hosted service must not be marketed as a free service.

## Initial offer

### Ad-supported access

- One voluntary rewarded-ad completion unlocks supported browser tools for 30 minutes
- Maximum of three unlocks per day
- Web only; no ads in the desktop application or browser extension
- Large LibreOffice-backed conversions remain paid-only at launch
- No live provider integration until the production domain, consent controls, privacy disclosures, and provider approval are complete
- Rewarded access is a secondary acquisition path, not the primary product position

### Private Trial

- 7 days
- No document-count telemetry
- Access to the Personal plan
- Payment method not required for the initial launch experiment

### Personal

- $7 monthly or $49 annually
- Core edit, convert, organize, optimize, and security tools
- Signed desktop application
- Product updates
- Local project history

### Professional

- $12 monthly or $99 annually
- Everything in Personal
- Batch processing
- Workflow builder and reusable workflow templates
- Advanced OCR, automation, and prepress tools
- Priority support

### Teams

- $15 per user monthly when billed annually
- Three-seat minimum
- Everything in Professional
- Centralized billing and seat administration
- Organization policy presets
- Deployment assistance and business support

Prices are launch hypotheses, not permanent commitments. Stripe price identifiers must come from environment configuration so pricing can change without embedding secrets or provider IDs in the client bundle.

## Entitlement model

The initial feature keys are:

- `rewarded_access`
- `core_tools`
- `desktop_app`
- `local_projects`
- `batch_processing`
- `workflow_builder`
- `advanced_tools`
- `priority_support`
- `team_admin`
- `policy_presets`

The application should make access decisions from a short-lived, signed entitlement response. It must fail closed for paid-only capabilities and provide a clear path to sign in, start a trial, or manage a subscription.

Because the code is AGPL-licensed, entitlement checks protect the official hosted HushPDF service; they are not presented as restricting a recipient's license rights to inspect, modify, or self-host the corresponding source.

## AWS and Stripe architecture

### Static product plane

- AWS Amplify Hosting serves the current Next.js static export.
- CloudFront serves large, cacheable WASM assets—especially LibreOffice—so those downloads do not dominate application hosting costs.
- PDF files remain in browser memory, browser storage, or explicitly selected local desktop paths.
- No document bytes, filenames, extracted text, thumbnails, or content-derived hashes are sent to the control plane.

### Account and billing control plane

- Amazon Cognito User Pools provide sign-up, sign-in, recovery, and session tokens.
- API Gateway validates Cognito tokens for account and billing endpoints.
- AWS Lambda creates Stripe Checkout and Customer Portal sessions and returns normalized entitlements.
- Stripe Checkout handles subscription collection.
- Stripe webhooks are signature-verified before changing access.
- DynamoDB stores the Cognito user ID, Stripe customer ID, subscription state, trial dates, plan, and normalized entitlement keys.
- AWS Secrets Manager stores Stripe secret keys and webhook signing secrets.

### Required endpoints

- `POST /billing/checkout`
- `POST /billing/portal`
- `POST /billing/webhook`
- `GET /me/entitlements`
- `GET /me/subscription`

The webhook handler must be idempotent, tolerate out-of-order delivery, and retrieve current Stripe state when an event is incomplete or stale.

## Privacy contract

Billing and identity may store only what is required to operate the account:

- account identifier and verified email;
- subscription, invoice, and entitlement identifiers;
- trial start and expiration times;
- security and operational logs with short documented retention.

HushPDF must not meter trials by inspecting documents or transmitting document metadata. Product analytics should use coarse events such as page views, checkout starts, subscription conversions, and feature-category activation only after the privacy policy and consent behavior are defined.

## Commercial copy rules

Remove customer-facing claims including:

- "free PDF tools";
- "free forever";
- "completely free";
- "no premium tiers";
- "no registration required";
- pricing-related uses of "no limits" or "no hidden costs."

Do not mechanically replace technical phrases such as "DRM-free," "error-free," "free-text," or the legal term "free software."

Use these product messages consistently:

- Headline: **Professional PDF tools. Zero uploads.**
- Supporting line: **Edit, convert, secure, and automate sensitive PDFs directly on your device.**
- Primary pre-billing CTA: **Explore HushPDF**
- Primary post-billing CTA: **Start your private trial**
- Secondary CTA: **View plans**

Until checkout and entitlements work end to end, the website must not claim that a trial has started or show a functional purchase button that cannot complete.

## Rollout

### Phase 1 — Honest commercial positioning

- Add a pricing page that labels plans as launch pricing and uses a non-transactional launch CTA.
- Add Pricing to navigation.
- Remove zero-price marketing claims from visible pages and SEO metadata.
- Keep Source, License, attribution, privacy, and warranty notices accessible.
- Update tests to enforce the commercial-copy rules.

### Phase 2 — Sandbox billing control plane

- Provision Cognito, API Gateway, Lambda, DynamoDB, and Secrets Manager as infrastructure as code.
- Create Stripe sandbox products, prices, features, and webhook destination.
- Implement sign-in, Checkout, Customer Portal, webhook processing, and entitlement reads.
- Add integration tests for trial, activation, renewal, cancellation, payment failure, and duplicate/out-of-order webhooks.
- Define a provider adapter and server-verifiable grant for rewarded access before enabling any ad code.

### Phase 3 — Product enforcement

- Gate Professional and Teams capabilities by normalized feature keys.
- Enforce the 30-minute, three-per-day rewarded-access policy for eligible standard web tools; keep LibreOffice-backed tools paid-only.
- Add account, subscription, trial-expiration, and upgrade UI.
- Reuse the same entitlement API for the Tauri application.
- Confirm that entitlement traffic never includes PDF content or document metadata.

### Phase 4 — Launch readiness

- Finalize the domain and production AWS environment.
- Publish terms, subscription/cancellation terms, privacy policy, refund policy, and support contact information.
- Complete tax and payment settings in Stripe.
- Run browser, desktop, accessibility, billing, privacy, and recovery smoke tests.
- Switch Stripe and AWS configuration from sandbox to production only after an explicit launch review.

## Phase 1 acceptance criteria

- No customer-facing page describes the hosted HushPDF service as free.
- Pricing and trial language does not imply working billing before it exists.
- Homepage, Tools, About, FAQ, category metadata, footer, and SEO copy use the commercial position.
- Source and License remain prominent and correct.
- All locales contain the required message keys and the application builds statically.
- TypeScript, lint, unit tests, and production build pass.
