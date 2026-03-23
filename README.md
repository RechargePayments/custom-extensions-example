# featured-product

A Lit Web Component that renders a featured product from a Recharge storefront. Displays the product image, title, and description with a shimmer loading state. Includes an "Add to order" button that adds the product to the customer's next queued charge and dispatches an `Affinity:refresh` custom event on success.

## Requirements

- A [Recharge](https://rechargepayments.com) storefront access token (`strfnt_...`)
- A Shopify product ID to feature
- Node.js 18+

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```
VITE_RECHARGE_STOREFRONT_TOKEN=strfnt_your_token_here
VITE_SHOPIFY_PRODUCT_ID=your_product_id_here
VITE_SHOPIFY_VARIANT_ID=your_variant_id_here   # optional
```

`VITE_SHOPIFY_VARIANT_ID` is optional. When omitted, the first variant of the product is used.

## Development

```bash
npm run dev
```

Opens a local dev server with the component registered and rendered at `http://localhost:5173`.

## Build

```bash
npm run build
```

Outputs a single ESM bundle to `dist/featured-product.js` with all dependencies included.

## Usage

The component is exported as a default class and does not self-register, giving consumers control over the custom element name.

```js
import FeaturedProduct from 'featured-product';

customElements.define('featured-product', FeaturedProduct);
```

```html
<featured-product></featured-product>
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_RECHARGE_STOREFRONT_TOKEN` | Yes | Recharge storefront access token |
| `VITE_SHOPIFY_PRODUCT_ID` | Yes | External Shopify product ID to feature |
| `VITE_SHOPIFY_VARIANT_ID` | No | External Shopify variant ID — defaults to first variant |
