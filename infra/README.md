# HushPDF AWS sandbox

The initial stack creates only the Cognito resources needed to test browser
accounts. It does not receive or process PDF files, and it does not create any
Stripe or billing resources.

## Deploy with the AWS console

1. Open **CloudFormation** in the AWS region you want to use.
2. Choose **Create stack**, then **With new resources (standard)**.
3. Upload `infra/cognito-sandbox.yaml`.
4. Name the stack `hushpdf-auth-sandbox`.
5. Enter a globally unique `DomainPrefix`, such as
   `hushpdf-kryptonian23-sandbox`.
6. Keep the localhost callback and logout defaults while developing.
7. Create the stack and wait for `CREATE_COMPLETE`.
8. Copy the three public identifiers from the stack's **Outputs** tab into a
   local `.env.local` file:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId output>
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=<UserPoolClientId output>
NEXT_PUBLIC_COGNITO_DOMAIN=<CognitoDomain output>
NEXT_PUBLIC_BILLING_API_URL=
NEXT_PUBLIC_REWARDED_ACCESS_ENABLED=false
```

Restart `npm run dev` after changing `.env.local`, then visit
`http://localhost:3000/en/account/`.

## Deploy with the AWS CLI

After installing and configuring AWS CLI v2:

```bash
aws cloudformation deploy \
  --template-file infra/cognito-sandbox.yaml \
  --stack-name hushpdf-auth-sandbox \
  --parameter-overrides DomainPrefix=hushpdf-kryptonian23-sandbox \
  --no-fail-on-empty-changeset
```

Read the values for `.env.local` with:

```bash
aws cloudformation describe-stacks \
  --stack-name hushpdf-auth-sandbox \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
```

The browser client deliberately has `GenerateSecret: false` and uses only the
OAuth authorization-code grant. Amplify supplies PKCE for the redirect flow.
The classic hosted UI is used for this sandbox so the user pool can remain on
the lowest applicable feature tier; branded managed login can be introduced
when the production domain is ready.
