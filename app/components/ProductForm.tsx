import {Link, useNavigate} from 'react-router';
import {useState} from 'react';
import {Money, type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  MoneyV2,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeMessage, setPincodeMessage] = useState('');
  const cartLines = selectedVariant
    ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}]
    : [];
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-options" key={option.name}>
            <h2>Choose {option.name}</h2>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  firstSelectableVariant,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className={`product-options-item${selected ? ' is-selected' : ''}`}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{opacity: available ? 1 : 0.45}}
                    >
                      <ProductOptionCard
                        name={name}
                        swatch={swatch}
                        variant={firstSelectableVariant}
                      />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`product-options-item${
                        exists && !selected ? ' link' : ''
                      }${selected ? ' is-selected' : ''}`}
                      key={option.name + name}
                      style={{opacity: available ? 1 : 0.45}}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionCard
                        name={name}
                        swatch={swatch}
                        variant={firstSelectableVariant}
                      />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
      <div className="product-purchase-row">
        <form
          className="product-pincode"
          onSubmit={(event) => {
            event.preventDefault();
            setPincodeMessage(
              /^\d{6}$/.test(pincode)
                ? 'Delivery availability will be confirmed at checkout.'
                : 'Enter a valid 6-digit pincode.',
            );
          }}
        >
          <label>
            <span className="visually-hidden">Delivery pincode</span>
            <input
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setPincode(event.target.value.replace(/\D/g, ''));
                setPincodeMessage('');
              }}
              placeholder="Search Pincode"
              value={pincode}
            />
          </label>
          <button type="submit">Pincode</button>
        </form>
        <div className="product-quantity" aria-label="Quantity">
          <span>Quantity</span>
          <button
            aria-label="Decrease quantity"
            disabled={quantity === 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            type="button"
          >
            −
          </button>
          <output>{quantity}</output>
          <button
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => value + 1)}
            type="button"
          >
            +
          </button>
        </div>
      </div>
      {pincodeMessage ? (
        <p className="product-pincode-message" role="status">
          {pincodeMessage}
        </p>
      ) : null}
      <form
        className="product-business-pricing"
        onSubmit={(event) => {
          event.preventDefault();
          void navigate('/#business-enquiry');
        }}
      >
        <p>Save up to 2% with business pricing and GST input tax credit</p>
        <label>
          <span className="visually-hidden">GST number</span>
          <input name="gst-number" placeholder="GST number" required />
        </label>
        <button type="submit">Submit</button>
      </form>
      <Link className="product-bulk-link" to="/#business-enquiry">
        For Business Bulk Buyer <span aria-hidden="true">⌄</span>
      </Link>
      <div className="product-buy-actions">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          lines={cartLines}
          onSuccess={() => {
            if (window.matchMedia('(max-width: 48em)').matches) {
              window.requestAnimationFrame(() => open('cart'));
            }
          }}
        >
          {(isPending, isAdded) =>
            isPending
              ? 'Adding...'
              : isAdded
                ? 'Added to cart'
              : selectedVariant?.availableForSale
                ? 'Add to cart'
                : 'Sold out'
          }
        </AddToCartButton>
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          lines={cartLines}
          redirectToCheckout
        >
          {(isPending) =>
            isPending
              ? 'Preparing checkout...'
              : selectedVariant?.availableForSale
                ? (
                    <>
                      <span className="product-buy-label-desktop">Buy it now</span>
                      <span className="product-buy-label-mobile">Buy now</span>
                    </>
                  )
                : 'Sold out'
          }
        </AddToCartButton>
      </div>
    </div>
  );
}

function ProductOptionCard({
  swatch,
  name,
  variant,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
  variant?: Maybe<{
    compareAtPrice?: Maybe<MoneyV2>;
    price: MoneyV2;
    title: string;
  }>;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  return (
    <>
      <strong>{name}</strong>
      {variant ? (
        <span className="product-option-card-details">
          {variant.title !== 'Default Title' ? <small>{variant.title}</small> : null}
          <b><Money data={variant.price} /></b>
          {variant.compareAtPrice ? <s><Money data={variant.compareAtPrice} /></s> : null}
        </span>
      ) : null}
      {image || color ? (
        <span
          aria-hidden="true"
          className="product-option-label-swatch"
          style={{backgroundColor: color || 'transparent'}}
        >
          {image ? <img src={image} alt="" /> : null}
        </span>
      ) : null}
    </>
  );
}
