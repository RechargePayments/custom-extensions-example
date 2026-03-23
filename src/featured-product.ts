import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { initRecharge, loginCustomerPortal, productSearch, listCharges, createSubscription, type ProductImage } from '@rechargeapps/storefront-client';

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
  externalVariantId: string;
  chargeIntervalFrequency: number | null;
  orderIntervalFrequency: number | null;
  orderIntervalUnit: 'day' | 'week' | 'month' | null;
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
      align-items: center;
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
      flex: 1;
    }

    .actions {
      flex-shrink: 0;
    }

    .btn {
      appearance: none;
      border: none;
      cursor: pointer;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      transition: background 0.15s, opacity 0.15s;
      white-space: nowrap;
    }

    .btn-primary {
      background: #1a6bc4;
      color: #fff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1559a8;
    }

    .btn-success {
      background: #2e7d32;
      color: #fff;
      cursor: default;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
  @state() private _adding = false;
  @state() private _added = false;
  @state() private _alreadyInOrder = false;

  connectedCallback() {
    super.connectedCallback();
    this._fetchProduct();
  }

  private async _addToOrder() {
    if (!this._data) return;
    const { chargeIntervalFrequency, orderIntervalFrequency, orderIntervalUnit } = this._data;
    if (!chargeIntervalFrequency || !orderIntervalFrequency || !orderIntervalUnit) {
      console.error('[featured-product] Missing plan interval data:', { chargeIntervalFrequency, orderIntervalFrequency, orderIntervalUnit });
      return;
    }
    this._adding = true;

    const session = await sessionPromise;

    const { charges } = await listCharges(session, {
      status: ['queued'],
      sort_by: 'scheduled_at-asc',
      limit: 1,
    });

    const charge = charges[0];
    if (!charge) return;

    await createSubscription(session, {
      address_id: charge.address_id,
      external_variant_id: { ecommerce: this._data.externalVariantId },
      quantity: 1,
      next_charge_scheduled_at: charge.scheduled_at,
      charge_interval_frequency: chargeIntervalFrequency,
      order_interval_frequency: orderIntervalFrequency,
      order_interval_unit: orderIntervalUnit,
    });

    this._adding = false;
    this._added = true;
    this.dispatchEvent(new CustomEvent('Affinity:refresh', { bubbles: true, composed: true }));
  }

  private async _fetchProduct() {
    try {
      const session = await sessionPromise;
      const [response, { charges }] = await Promise.all([
        productSearch(session, {
          format_version: '2022-06',
          external_product_ids: [SHOPIFY_PRODUCT_ID],
          limit: 1,
        }),
        listCharges(session, {
          status: ['queued'],
          sort_by: 'scheduled_at-asc',
          limit: 1,
        }),
      ]);

      const product = response.products[0];
      if (!product) return;

      const variant = SHOPIFY_VARIANT_ID
        ? (product.variants.find(v => v.external_variant_id === SHOPIFY_VARIANT_ID) ?? product.variants[0])
        : product.variants[0];

      const charge = charges[0];
      if (charge) {
        this._alreadyInOrder = charge.line_items.some(
          li => li.external_variant_id.ecommerce === variant.external_variant_id
        );
      }

      const plan = product.plans.find(p => p.type !== 'onetime');
      if (!plan) console.error('[featured-product] No non-onetime plan found. Plans:', product.plans);
      const prefs = plan?.subscription_preferences;

      const images = [...product.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const imageUrl = images[0] ? pickImage(images[0]) : null;

      this._data = {
        title: product.title,
        description: product.description,
        imageUrl,
        externalVariantId: variant.external_variant_id,
        chargeIntervalFrequency: prefs?.charge_interval_frequency ?? null,
        orderIntervalFrequency: prefs?.order_interval_frequency ?? null,
        orderIntervalUnit: prefs?.interval_unit ?? null,
      };
    } finally {
      this._loading = false;
    }
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
        <div class="actions">
          <button
            class="btn ${this._added || this._alreadyInOrder ? 'btn-success' : 'btn-primary'}"
            ?disabled=${this._adding || this._added || this._alreadyInOrder}
            @click=${this._addToOrder}
          >
            ${this._alreadyInOrder ? 'Already in order' : this._added ? 'Added!' : this._adding ? 'Adding...' : 'Add to order'}
          </button>
        </div>
      </div>
    `;
  }
}
