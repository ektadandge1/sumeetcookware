# Hydrogen template: Skeleton

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [React Router](https://reactrouter.com/), the modern multi-strategy router for React. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with React Router](https://reactrouter.com/start/framework/routing)

## What's included

- React Router
- Hydrogen
- Oxygen
- Vite
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## Getting started

## Instagram Feed

The homepage Instagram gallery uses the official Instagram Graph API. Configure
these server-only variables in `.env` and in the production deployment:

```text
INSTAGRAM_ACCOUNT_ID=your_instagram_professional_account_id
INSTAGRAM_ACCESS_TOKEN=your_server_side_graph_api_token
```

The Instagram account must be a Professional account connected to a Facebook
Page. The access token is never sent to the browser. Without both variables,
the gallery remains hidden.

**Requirements:**

- Node.js version 22.x or 24.x

```bash
npm create @shopify/hydrogen@latest
```

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```

## Setup for using Customer Account API (`/account` section)

Customer login uses Shopify's hosted, passwordless login. The storefront handles
the callback at `/account/authorize`, stores the customer session in an HTTP-only
cookie, and signs out using a POST to `/account/logout` from the account page.

1. Enable **Customer accounts** (not legacy customer accounts) in Shopify Admin
   under **Settings → Customer accounts**.
2. Use the **Hydrogen** sales channel for this project. Shopify documents the
   account settings under **your storefront → Storefront settings → Customer
   Account API → Application setup**. If editable settings are available,
   the standard URLs are:
   - Callback/redirect URI: `https://<storefront-domain>/account/authorize`
   - JavaScript origin: `https://<storefront-domain>`
   - Logout URI: `https://<storefront-domain>`
3. Set `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`, `SHOP_ID`, and a stable, private
   `SESSION_SECRET` in `.env` and in the deployment environment. Use credentials
   from the same Hydrogen storefront linked to this project.
4. For local authentication, run `npm run dev` and open the **HTTPS
   `*.tryhydrogen.dev` tunnel URL** printed by the CLI. The
   `--customer-account-push` flag registers the tunnel's account URLs. Plain
   localhost (including `sumeetcookware.localhost`) and `npm run dev:local` are
   for storefront development only, not customer authentication.

Do not create a separate Headless storefront just to configure authentication.
For local development, let `--customer-account-push` register the tunnel URLs
against the linked Hydrogen storefront; manual callback editing isn't required
for that flow. For deployment, verify that the actual storefront domain is
allowed for the same Customer Account API client.

To verify: select **Sign in**, complete Shopify's email verification, confirm
that `/account` opens your orders, reload to check that the session persists,
then select **Sign out**. Opening `/account` afterwards should require login.
