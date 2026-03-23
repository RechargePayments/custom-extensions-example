import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { initRecharge, loginCustomerPortal, productSearch, type ProductImage } from '@rechargeapps/storefront-client';

initRecharge({
  storeIdentifier: 'rc-bundles.myshopify.com',
});

const sessionPromise = loginCustomerPortal();

const SHOPIFY_PRODUCT_ID = import.meta.env.VITE_SHOPIFY_PRODUCT_ID;
const SHOPIFY_VARIANT_ID = import.meta.env.VITE_SHOPIFY_VARIANT_ID;

function pickImage(image: ProductImage): string | null {
  // medium (~240px) is the closest appropriate size for a 200px display
  return image.medium ?? image.large ?? image.original ?? image.small ?? null;
}

interface FeaturedProductData {
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export default class FeaturedProduct extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .card {
      display: flex;
      flex-direction: row;
      gap: 16px;
      align-items: flex-start;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 16px;
    }

    .image {
      flex-shrink: 0;
      width: 110px;
      height: 110px;
      object-fit: cover;
      border-radius: 6px;
      display: block;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .title {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      line-height: 1.3;
      color: #111;
    }

    .description {
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .description p {
      margin: 0;
    }

    .loading {
      display: flex;
      flex-direction: row;
      gap: 16px;
      align-items: flex-start;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 16px;
    }

    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 6px;
    }

    .skeleton-image {
      flex-shrink: 0;
      width: 110px;
      height: 110px;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 4px;
    }

    .skeleton-title {
      height: 18px;
      width: 75%;
      border-radius: 4px;
    }

    .skeleton-line {
      height: 13px;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  @state() private _loading = true;
  @state() private _data: FeaturedProductData | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._fetchProduct();
  }

  private async _fetchProduct() {
    const session = await sessionPromise;
    const response = await productSearch(session, {
      format_version: '2022-06',
      external_product_ids: [SHOPIFY_PRODUCT_ID],
      limit: 1,
    });

    const product = response.products[0];
    if (!product) return;

    const variant = SHOPIFY_VARIANT_ID
      ? (product.variants.find(v => v.external_variant_id === SHOPIFY_VARIANT_ID) ?? product.variants[0])
      : product.variants[0];

    const images = [...product.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const imageUrl = images[0] ? pickImage(images[0]) : null;

    this._data = {
      title: product.title,
      description: product.description,
      imageUrl,
    };
    this._loading = false;
  }

  render() {
    if (this._loading) return html`
      <div class="loading">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-line" style="width: 100%"></div>
          <div class="skeleton skeleton-line" style="width: 90%"></div>
          <div class="skeleton skeleton-line" style="width: 60%"></div>
        </div>
      </div>
    `;

    if (!this._data) return html``;

    return html`
      <div class="card">
        ${this._data.imageUrl ? html`<img class="image" src=${this._data.imageUrl} alt=${this._data.title} />` : ''}
        <div class="content">
          <h2 class="title">${this._data.title}</h2>
          ${this._data.description ? html`<div class="description">${unsafeHTML(this._data.description)}</div>` : ''}
        </div>
      </div>
    `;
  }
}
