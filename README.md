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
