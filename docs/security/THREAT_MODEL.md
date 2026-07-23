# HushPDF threat model

Last reviewed: 2026-07-23

## Security objective

HushPDF protects customer accounts, subscription state, infrastructure, and
service availability while keeping PDF document processing on the user's
device. The hosted service must never imply that browser-delivered code is an
unbreakable authorization boundary.

## Scope and architecture

| Component | Trust level | Sensitive data | Authority |
| --- | --- | --- | --- |
| Browser PDF runtime | Untrusted client | User-selected files and derived document data | None for billing or access |
| CloudFront and private S3 origin | Public delivery edge | Static application code and public content | Canonical hosted release |
| Cognito | Managed identity boundary | Credentials, tokens, verified email | User authentication |
| Billing HTTP API and Lambda | Trusted service boundary | Account ID and billing operations | Authenticated billing actions |
| DynamoDB entitlement store | Trusted data boundary | Plan, status, Stripe identifiers | Hosted feature entitlement |
| Stripe | External trusted processor | Payment and subscription records | Subscription lifecycle |
| Analytics and advertising | Optional external processors | Must not receive PDF content or document metadata | Never an entitlement authority by themselves |

PDF files, filenames, extracted text, annotations, and document metadata must
not be sent to Cognito, Stripe, the billing API, analytics, advertising, or
application logs.

## Trust boundaries and data flows

1. Static code crosses from CloudFront into a user-controlled browser.
2. Cognito OAuth authorization-code flow with PKCE returns tokens to the browser.
3. The browser sends a Cognito access token to protected billing routes.
4. API Gateway validates token signature, issuer, audience, expiration, and scope.
5. Billing Lambda reads Stripe credentials from Secrets Manager and stores only
   billing entitlements in DynamoDB.
6. Stripe sends signed webhook bodies to the only unauthenticated billing route.
7. Webhook state, not redirects or browser claims, changes hosted entitlements.

## Attacker profiles

- A normal user modifying JavaScript, local storage, network responses, or UI state.
- An automated bot creating accounts, scraping public pages, or exhausting APIs.
- A credential attacker attempting password reuse, token theft, or OAuth abuse.
- A billing fraudster replaying requests or attempting to forge subscription state.
- A supply-chain attacker compromising a package, build system, or deployment identity.
- A malicious document attempting parser exploitation or browser resource exhaustion.
- A malicious extension that can inspect or alter browser content.

## Principal threats and controls

| Threat | Impact | Enforced controls | Remaining work |
| --- | --- | --- | --- |
| Client bypasses a subscription component | Lost hosted revenue | Server-owned entitlement record; protected hosted APIs | Keep premium value in hosted services; never trust UI state |
| Forged, replayed, or out-of-order Stripe webhook | Unauthorized access | Raw-body signature verification, timestamp tolerance, event-ID deduplication, current-state reconciliation, webhook-authoritative state | Monitor signature failures and delayed events |
| Checkout or portal open redirect | Phishing or token exposure | Exact origin and localized account-path allowlist; query, fragment, and credentials rejected | Replace staging allowlist with production domain |
| API flood or oversized body | Cost and availability | API Gateway throttling, strict body limits, JWT scopes | Add WAF rate rules and alarms before public launch |
| Token theft | Account takeover | Authorization code with PKCE, short access-token lifetime, token revocation | Add optional TOTP/passkeys and session-revocation UX |
| Cross-site scripting | Account/token compromise | CSP, no object embedding, frame denial, MIME protections, React escaping | Remove legacy `unsafe-inline` and `unsafe-eval` requirements incrementally |
| Malicious PDF exhausts CPU or memory | Browser denial of service | Local execution, file-size/tool limits, worker isolation | Add per-tool timeouts and cancellation coverage |
| Public S3 access or deployment overwrite | Site compromise | Private bucket, origin access control, public-access block, least-privilege deploy role, versioning | Add signed release provenance and deployment approval |
| Secrets exposed in browser or repository | Billing compromise | Secrets Manager and secret-free public client | Add automated secret scanning and rotation runbook |
| Dependency compromise | Site compromise | Lockfiles and reproducible builds | Add dependency review, SBOM, and scheduled vulnerability scans |
| Advertising script compromise | XSS or privacy breach | Not currently trusted by CSP | Review vendors and extend CSP only when monetization is integrated |

## Browser-side access and ad blockers

The browser, local storage, downloaded JavaScript, and all UI gates are attacker
controlled. Minification, obfuscation, extension detection, and ad-block checks
are deterrents or product UX, not security controls. HushPDF therefore:

- does not store secrets in browser code;
- does not grant hosted entitlements from a client redirect or local flag;
- treats ad completion as an input to a server-issued, short-lived entitlement;
- offers subscription or allowlisting as alternatives when ads are blocked;
- assumes a determined user can modify or self-host the AGPL client application.

The commercial moat is the trustworthy hosted experience, maintained releases,
accounts, workflows, synchronization, support, and team capabilities—not an
unbreakable client-side tool gate.

## Data and logging rules

- Never log request authorization headers, Cognito tokens, Stripe secrets,
  complete webhook bodies, PDF data, filenames, extracted text, or metadata.
- Log request IDs, route, outcome, latency, safe error category, Stripe event ID,
  and account ID only where necessary for security investigation.
- Encrypt data at rest and in transit. Restrict production log retention and
  access. Treat email addresses and stable account IDs as personal data.
- API responses containing account or entitlement data use `Cache-Control: no-store`.

## Launch-blocking security requirements

- Production domain, HTTPS certificate, exact Cognito callbacks, and exact CORS origins.
- Stripe live secrets stored and rotated in a production-only Secrets Manager secret.
- Stripe webhook signature failures, Lambda errors, API throttles, and spend alarms.
- AWS administrator identity protected by phishing-resistant MFA; no routine root use.
- WAF managed rules and rate-based rules sized from staging traffic.
- Dependency, secret, and infrastructure scans in CI.
- Tested backup/rollback, entitlement reconciliation, key rotation, and incident response.
- Security and privacy review of every analytics or advertising domain before CSP changes.

## Residual risks

The current PDF tool bundle requires inline scripts and dynamic evaluation for
some static-export and WASM workflows, so the deployed CSP temporarily includes
`'unsafe-inline'` and `'unsafe-eval'`. Removing those allowances is a high-value
hardening project. Local processing reduces server exposure but cannot protect a
document from a compromised browser, operating system, or extension.

Review this model whenever authentication, billing, advertising, analytics,
cloud processing, file synchronization, or team collaboration changes.
