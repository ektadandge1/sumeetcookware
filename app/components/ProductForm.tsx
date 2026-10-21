import {Await, Link, useNavigate} from 'react-router';
import {
  Children,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  reviews,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  reviews: Promise<Array<{rating: number}>>;
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
            <ProductOptionsGrid>
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
                        reviews={reviews}
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
                        reviews={reviews}
                        swatch={swatch}
                        variant={firstSelectableVariant}
                      />
                    </button>
                  );
                }
              })}
            </ProductOptionsGrid>
          </div>
        );
      })}
      <div className="product-desktop-purchase-controls">
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
        <Link className="product-bulk-link" to="/#business-enquiry">
          For Business Bulk Buyer <span aria-hidden="true">⌄</span>
        </Link>
      </div>
      {pincodeMessage ? (
        <p className="product-pincode-message" role="status">
          {pincodeMessage}
        </p>
      ) : null}
      <div className="product-desktop-business-row">
        <div className="product-desktop-bulk-offer">
          Up to <strong>20% OFF</strong> on bulk purchases
        </div>
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
      </div>
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
            isPending ? (
              'Preparing checkout...'
            ) : selectedVariant?.availableForSale ? (
              <>
                <span className="product-buy-label-desktop">Buy it now</span>
                <span className="product-buy-label-mobile">Buy now</span>
              </>
            ) : (
              'Sold out'
            )
          }
        </AddToCartButton>
      </div>
    </div>
  );
}

function ProductOptionsGrid({children}: {children: ReactNode}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [activeDot, setActiveDot] = useState(0);
  const dotCount = 4;

  useEffect(() => {
    const scroller = gridRef.current;
    if (!scroller) return;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let activePointerId: number | null = null;
    let didDrag = false;

    const updatePosition = () => {
      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      setHasOverflow(maxScrollLeft > 1);
      setActiveDot(
        maxScrollLeft > 1
          ? Math.round((scroller.scrollLeft / maxScrollLeft) * (dotCount - 1))
          : 0,
      );
    };

    const handleWheel = (event: WheelEvent) => {
      if (
        !window.matchMedia('(min-width: 64em)').matches ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX)
      ) {
        return;
      }

      const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
      if (maxScrollLeft <= 0) return;

      const isAtStart = scroller.scrollLeft <= 0;
      const isAtEnd = scroller.scrollLeft >= maxScrollLeft - 1;
      if (
        (event.deltaY < 0 && isAtStart) ||
        (event.deltaY > 0 && isAtEnd)
      ) {
        return;
      }

      const distance =
        event.deltaMode === window.WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 24
          : event.deltaMode === window.WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * scroller.clientWidth
            : event.deltaY;

      event.preventDefault();
      scroller.scrollLeft += distance;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.pointerType === 'touch' ||
        event.button !== 0 ||
        !window.matchMedia('(min-width: 64em)').matches
      ) {
        return;
      }

      dragStartX = event.clientX;
      dragStartScrollLeft = scroller.scrollLeft;
      activePointerId = event.pointerId;
      didDrag = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;

      const distance = event.clientX - dragStartX;
      if (Math.abs(distance) < 4) return;

      if (!scroller.hasPointerCapture(event.pointerId)) {
        scroller.setPointerCapture(event.pointerId);
      }
      didDrag = true;
      event.preventDefault();
      scroller.scrollLeft = dragStartScrollLeft - distance;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (
        activePointerId === event.pointerId &&
        scroller.hasPointerCapture(event.pointerId)
      ) {
        scroller.releasePointerCapture(event.pointerId);
      }

      activePointerId = null;
      if (didDrag) {
        window.setTimeout(() => {
          didDrag = false;
        }, 0);
      }
    };

    const preventClickAfterDrag = (event: MouseEvent) => {
      if (!didDrag) return;
      event.preventDefault();
      event.stopPropagation();
      didDrag = false;
    };

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(scroller);
    scroller.addEventListener('scroll', updatePosition, {passive: true});
    scroller.addEventListener('wheel', handleWheel, {passive: false});
    scroller.addEventListener('pointerdown', handlePointerDown);
    scroller.addEventListener('pointermove', handlePointerMove, {
      passive: false,
    });
    scroller.addEventListener('pointerup', handlePointerUp);
    scroller.addEventListener('pointercancel', handlePointerUp);
    scroller.addEventListener('click', preventClickAfterDrag, true);
    updatePosition();

    return () => {
      resizeObserver.disconnect();
      scroller.removeEventListener('scroll', updatePosition);
      scroller.removeEventListener('wheel', handleWheel);
      scroller.removeEventListener('pointerdown', handlePointerDown);
      scroller.removeEventListener('pointermove', handlePointerMove);
      scroller.removeEventListener('pointerup', handlePointerUp);
      scroller.removeEventListener('pointercancel', handlePointerUp);
      scroller.removeEventListener('click', preventClickAfterDrag, true);
    };
  }, [dotCount]);

  const scrollToDot = (index: number) => {
    const scroller = gridRef.current;
    if (!scroller) return;

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    scroller.scrollTo({
      behavior: 'smooth',
      left: maxScrollLeft * (index / (dotCount - 1)),
    });
  };

  return (
    <div className={`product-options-carousel${hasOverflow ? ' has-overflow' : ''}`}>
      <div className="product-options-grid" ref={gridRef}>
        {children}
      </div>
      <div className="product-options-dots" aria-label="More product options">
        {Array.from({length: dotCount}, (_, index) => (
          <button
            aria-label={`Show product options ${index + 1} of ${dotCount}`}
            aria-current={activeDot === index ? 'true' : undefined}
            className={activeDot === index ? 'is-active' : undefined}
            key={index}
            onClick={() => scrollToDot(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

function ProductOptionCard({
  swatch,
  name,
  reviews,
  variant,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
  reviews: Promise<Array<{rating: number}>>;
  variant?: Maybe<{
    compareAtPrice?: Maybe<MoneyV2>;
    price: MoneyV2;
    product?: {title: string};
    selectedOptions?: Array<{name: string; value: string}>;
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
          <small className="product-option-card-subtitle">
            {variant.product?.title ?? variant.title}
          </small>
          {variant.selectedOptions?.map((option) => (
            <span className="product-option-card-spec" key={option.name}>
              {option.name}: <b>{option.value}</b>
            </span>
          ))}
          <Suspense fallback={<ProductOptionRating reviews={[]} />}>
            <Await
              resolve={reviews}
              errorElement={<ProductOptionRating reviews={[]} />}
            >
              {(productReviews) => (
                <ProductOptionRating reviews={productReviews} />
              )}
            </Await>
          </Suspense>
          <span className="product-option-card-prices">
            <b>
              <Money data={variant.price} />
            </b>
            {variant.compareAtPrice ? (
              <s>
                <Money data={variant.compareAtPrice} />
              </s>
            ) : null}
          </span>
          <small className="product-option-card-tax-note">
            Tax included. Shipping calculated at checkout
          </small>
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

function ProductOptionRating({reviews}: {reviews: Array<{rating: number}>}) {
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) /
      reviews.length
    : 0;

  return (
    <span className="product-option-card-rating">
      <small>
        {average.toFixed(1)} Rating ({reviews.length})
      </small>
      <span aria-label={`${average.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            className={star <= Math.round(average) ? 'is-filled' : ''}
            key={star}
          >
            ★
          </i>
        ))}
      </span>
    </span>
  );
}
