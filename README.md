# featured-product

A Lit Web Component that renders a featured product from a Recharge storefront. Displays the product image, title, and description with a shimmer loading state. Includes an "Add to order" button that adds the product to the customer's next queued charge, dispatches an `Affinity:refresh` custom event on success, and shows "Already in order" if the product is already in the next charge.

## Requirements

- A Shopify product ID to feature
- Node.js 18+

The component authenticates via `loginCustomerPortal()` and requires the page to be served in a Recharge Customer Portal context.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```
VITE_SHOPIFY_PRODUCT_ID=your_product_id_here
VITE_SHOPIFY_VARIANT_ID=your_variant_id_here   # optional
```

`VITE_SHOPIFY_VARIANT_ID` is optional. When omitted, the first variant of the product is used.

## Build

```bash
npm run build
```

Outputs a single ESM bundle to `dist/featured-product.js` with all dependencies included.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SHOPIFY_PRODUCT_ID` | Yes | External Shopify product ID to feature |
| `VITE_SHOPIFY_VARIANT_ID` | No | External Shopify variant ID — defaults to first variant |
| `CLOUDFLARE_API_TOKEN` | For upload | Cloudflare API token with R2:Edit permission |
| `R2_BUCKET` | For upload | Name of the target R2 bucket |

## Uploading to Cloudflare R2

```bash
npm run upload
```

This builds the component and uploads `dist/featured-product.js` to your R2 bucket.

### 1. Set your account ID in `wrangler.toml`

```toml
name = "featured-product"
account_id = "your-cloudflare-account-id"
```

Find your account ID in the [Cloudflare dashboard](https://dash.cloudflare.com) — it appears in the URL (`dash.cloudflare.com/<account_id>/`) and in the right sidebar of any zone's overview page.

### 2. Create an R2 bucket

If you don't have one yet, create it at [dash.cloudflare.com > R2 > Create bucket](https://dash.cloudflare.com/?to=/:account/r2/new).

### 3. Create an API token

Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) and create a token with the **R2:Edit** permission scoped to your account.

Set it in `.env`:

```
CLOUDFLARE_API_TOKEN=your-token-here
R2_BUCKET=your-bucket-name
```

### 4. Upload

```bash
npm run upload
```
