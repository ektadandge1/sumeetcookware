import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {useEffect, useRef, useState, type PointerEvent} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {AddToCartButton, CartIcon} from '~/components/AddToCartButton';
import {WishlistButton} from '~/components/WishlistButton';
import {SectionHeading} from './SectionHeading';

type RecommendedProduct = RecommendedProductsQuery['products']['nodes'][number];

export function HomeProductBand({
  heading,
  products,
  collectionUrl,
  isBestSeller = false,
  productRatings = {},
}: {
  heading: string;
  products: RecommendedProduct[];
  collectionUrl?: string;
  isBestSeller?: boolean;
  productRatings?: Record<string, {average: number; count: number}>;
}) {
  const [cardsPerSlide, setCardsPerSlide] = useState(4);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [variantProduct, setVariantProduct] =
    useState<RecommendedProduct | null>(null);
  const dragStartX = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const headingId = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const availableProducts = products.filter(
    (product) =>
      product.availableForSale &&
      product.selectedOrFirstAvailableVariant?.availableForSale,
  );
  const slides = chunkProducts(availableProducts, cardsPerSlide);
  const showCarousel = isBestSeller && slides.length > 1;

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !showCarousel ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }

    if (
      event.target instanceof Element &&
      event.target.closest('button, input, select, textarea, form')
    ) {
      return;
    }

    dragStartX.current = event.clientX;
    setDragOffset(0);
    setIsDragging(true);
    setIsPaused(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;
    setDragOffset(event.clientX - dragStartX.current);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return;

    const distance = event.clientX - dragStartX.current;
    const threshold = Math.min(70, event.currentTarget.clientWidth * 0.12);
    const wasDragged = Math.abs(distance) >= 8;

    if (Math.abs(distance) >= threshold) {
      setCurrentSlide((slide) =>
        distance < 0
          ? (slide + 1) % slides.length
          : (slide - 1 + slides.length) % slides.length,
      );
    }

    dragStartX.current = null;
    setDragOffset(0);
    setIsDragging(false);
    if (event.pointerType !== 'mouse') setIsPaused(false);
    suppressClick.current = wasDragged;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cancelDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = null;
    setDragOffset(0);
    setIsDragging(false);
    if (event.pointerType !== 'mouse') setIsPaused(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 48em)');
    const tabletQuery = window.matchMedia('(max-width: 64em)');
    const updateCardsPerSlide = () =>
      setCardsPerSlide(mobileQuery.matches ? 3 : tabletQuery.matches ? 2 : 4);

    updateCardsPerSlide();
    mobileQuery.addEventListener('change', updateCardsPerSlide);
    tabletQuery.addEventListener('change', updateCardsPerSlide);
    return () => {
      mobileQuery.removeEventListener('change', updateCardsPerSlide);
      tabletQuery.removeEventListener('change', updateCardsPerSlide);
    };
  }, []);

  useEffect(() => {
    setCurrentSlide((slide) => Math.min(slide, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    if (
      !showCarousel ||
      isPaused ||
      window.matchMedia('(max-width: 48em)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused, showCarousel, slides.length]);

  const productCards = (slideProducts: RecommendedProduct[]) =>
    slideProducts.map((product) => (
      <div className="home-product-card" key={product.id}>
        <HomeProductCard
          isBestSeller={isBestSeller}
          product={product}
          onSelectVariant={() => setVariantProduct(product)}
          rating={
            productRatings[product.handle] ??
            productRatings[product.id] ??
            productRatings[product.id.split('/').at(-1) ?? '']
          }
        />
      </div>
    ));

  return (
    <section
      className={`home-section home-products${isBestSeller ? ' home-best-sellers' : ''}`}
      aria-labelledby={headingId}
    >
      {collectionUrl ? (
        <Link
          className="home-section-heading-link"
          prefetch="intent"
          to={collectionUrl}
        >
          <SectionHeading id={headingId} title={heading} />
        </Link>
      ) : (
        <SectionHeading id={headingId} title={heading} />
      )}
      {availableProducts.length ? (
        showCarousel ? (
          <div className="home-product-carousel-shell">
            <button
              aria-label="Previous bestseller products"
              className="home-product-carousel-arrow is-previous"
              onClick={() =>
                setCurrentSlide(
                  (slide) => (slide - 1 + slides.length) % slides.length,
                )
              }
              type="button"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <div
              className={`home-product-carousel${isDragging ? ' is-dragging' : ''}`}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsPaused(false);
                }
              }}
              onClickCapture={(event) => {
                if (!suppressClick.current) return;
                event.preventDefault();
                event.stopPropagation();
              }}
              onDragStart={(event) => event.preventDefault()}
              onFocus={() => setIsPaused(true)}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onLostPointerCapture={cancelDrag}
              onPointerCancel={cancelDrag}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={finishDrag}
            >
              <div
                className="home-product-track"
                style={{
                  transform: `translateX(calc(-${currentSlide * (cardsPerSlide === 3 ? 120 : 100)}% + ${dragOffset}px))`,
                }}
              >
                {slides.map((slide) => (
                  <div className="home-product-grid" key={slide[0]?.id}>
                    {productCards(slide)}
                  </div>
                ))}
              </div>
            </div>
            <button
              aria-label="Next bestseller products"
              className="home-product-carousel-arrow is-next"
              onClick={() =>
                setCurrentSlide((slide) => (slide + 1) % slides.length)
              }
              type="button"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        ) : (
          <div className="home-product-grid">
            {productCards(availableProducts)}
          </div>
        )
      ) : (
        <p className="home-empty">
          Products will appear here once your Shopify catalog is connected.
        </p>
      )}
      {showCarousel ? (
        <div className="home-product-dots">
          {slides.map((slide, index) => (
            <button
              aria-label={`Show bestseller slide ${index + 1}`}
              aria-pressed={index === currentSlide}
              className={index === currentSlide ? 'is-active' : undefined}
              key={slide[0]?.id}
              onClick={() => setCurrentSlide(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
      <Link
        className="home-text-link"
        prefetch="intent"
        to={collectionUrl ?? '/collections/all'}
      >
        {isBestSeller ? 'Shop best sellers →' : 'View all products →'}
      </Link>
      {variantProduct ? (
        <HomeVariantDialog
          onClose={() => setVariantProduct(null)}
          product={variantProduct}
        />
      ) : null}
    </section>
  );
}

function chunkProducts<T>(products: T[], size: number) {
  return Array.from({length: Math.ceil(products.length / size)}, (_, index) =>
    products.slice(index * size, (index + 1) * size),
  );
}

function HomeProductCard({
  product,
  isBestSeller,
  rating,
  onSelectVariant,
}: {
  product: RecommendedProduct;
  isBestSeller: boolean;
  rating?: {average: number; count: number};
  onSelectVariant: () => void;
}) {
  const image = product.featuredImage;
  const variant = product.selectedOrFirstAvailableVariant;
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const hasMultipleVariants = product.variants.nodes.length > 1;
  const wishlistItem = {
    id: product.id,
    handle: product.handle,
    title: product.title,
    imageAlt: image?.altText || product.title,
    imageUrl: image?.url,
    price: product.priceRange.minVariantPrice.amount,
    currencyCode: product.priceRange.minVariantPrice.currencyCode,
  };

  return (
    <>
      <div className="home-product-card-media">
        {isBestSeller ? (
          <span className="home-product-badge">Bestseller</span>
        ) : null}
        <div className="home-product-card-actions">
          <WishlistButton item={wishlistItem} />
          {variant?.id && hasMultipleVariants ? (
            <button
              aria-label={`Choose options for ${product.title}`}
              onClick={onSelectVariant}
              type="button"
            >
              <CartIcon />
            </button>
          ) : variant?.id ? (
            <AddToCartButton
              disabled={!variant.availableForSale}
              lines={[
                {
                  merchandiseId: variant.id,
                  quantity: 1,
                  selectedVariant: variant,
                },
              ]}
              analytics={{productId: product.id}}
            >
              {(isPending) => (
                <>
                  <CartIcon />
                  <span className="sr-only">
                    {isPending
                      ? `Adding ${product.title} to cart`
                      : variant.availableForSale
                        ? `Add ${product.title} to cart`
                        : `${product.title} is sold out`}
                  </span>
                </>
              )}
            </AddToCartButton>
          ) : null}
        </div>
        <Link
          className="home-product-image-link"
          prefetch="intent"
          to={`/products/${product.handle}`}
        >
          {image ? (
            <Image
              alt={image.altText || product.title}
              aspectRatio="1/1"
              data={image}
              loading="lazy"
              sizes="(min-width: 48em) 25vw, 42vw"
            />
          ) : (
            <span className="home-product-image-placeholder" />
          )}
        </Link>
        {rating ? (
          <div
            className="home-product-rating"
            aria-label={`${rating.average} out of 5 stars from ${rating.count} reviews`}
          >
            <span aria-hidden="true">
              {[0, 1, 2, 3, 4].map((star) => (
                <i
                  className={
                    star < Math.round(rating.average) ? 'is-filled' : undefined
                  }
                  key={star}
                >
                  ★
                </i>
              ))}
            </span>
            <small>
              {rating.average.toFixed(1)} Rating({rating.count})
            </small>
          </div>
        ) : null}
      </div>
      <Link
        className="home-product-title"
        prefetch="intent"
        to={`/products/${product.handle}`}
      >
        {product.title}
      </Link>
      <div className="home-product-price">
        {isBestSeller ? (
          <span className="money">
            RS. {formatBestSellerPrice(price.amount)}
          </span>
        ) : (
          <Money data={price} />
        )}
        {variant?.compareAtPrice ? (
          <s>
            {isBestSeller ? (
              <span className="money">
                RS. {formatBestSellerPrice(variant.compareAtPrice.amount)}
              </span>
            ) : (
              <Money data={variant.compareAtPrice} />
            )}
          </s>
        ) : null}
      </div>
      {variant?.id && hasMultipleVariants ? (
        <button
          className="home-product-variant-trigger"
          onClick={onSelectVariant}
          type="button"
        >
          Choose options
        </button>
      ) : variant?.id ? (
        <AddToCartButton
          disabled={!variant.availableForSale}
          lines={[
            {
              merchandiseId: variant.id,
              quantity: 1,
              selectedVariant: variant,
            },
          ]}
          analytics={{productId: product.id}}
        >
          {(isPending, isAdded) =>
            isAdded
              ? 'Added to cart'
              : isPending
                ? 'Adding...'
                : variant.availableForSale
                  ? 'Add to cart'
                  : 'Sold out'
          }
        </AddToCartButton>
      ) : (
        <Link
          className="home-product-cta"
          prefetch="intent"
          to={`/products/${product.handle}`}
        >
          View product
        </Link>
      )}
    </>
  );
}

function formatBestSellerPrice(amount: string) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function HomeVariantDialog({
  onClose,
  product,
}: {
  onClose: () => void;
  product: RecommendedProduct;
}) {
  const availableVariants = product.variants.nodes.filter(
    (variant) => variant.availableForSale,
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.selectedOrFirstAvailableVariant?.id ?? availableVariants[0]?.id,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const selectedVariant =
    product.variants.nodes.find(
      (variant) => variant.id === selectedVariantId,
    ) ?? availableVariants[0];
  const image = selectedVariant?.image ?? product.featuredImage;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div
      className="home-variant-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="home-variant-title"
        aria-modal="true"
        className="home-variant-dialog"
        role="dialog"
      >
        <button
          aria-label="Close product options"
          className="home-variant-close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          ×
        </button>
        <div className="home-variant-media">
          {image ? (
            <Image
              alt={image.altText || product.title}
              aspectRatio="1/1"
              data={image}
              loading="eager"
              sizes="(max-width: 48em) 38vw, 300px"
            />
          ) : null}
        </div>
        <div className="home-variant-content">
          <p className="home-variant-eyebrow">Choose your option</p>
          <h2 id="home-variant-title">{product.title}</h2>
          <div className="home-variant-options" role="radiogroup">
            {product.variants.nodes.map((variant) => (
              <button
                aria-checked={variant.id === selectedVariant?.id}
                className={
                  variant.id === selectedVariant?.id ? 'is-selected' : undefined
                }
                disabled={!variant.availableForSale}
                key={variant.id}
                onClick={() => setSelectedVariantId(variant.id)}
                role="radio"
                type="button"
              >
                <span>
                  {variant.selectedOptions
                    .map((option) => option.value)
                    .join(' / ') || variant.title}
                </span>
                <Money data={variant.price} />
              </button>
            ))}
          </div>
          {selectedVariant ? (
            <div className="home-variant-footer">
              <div className="home-variant-price">
                <Money data={selectedVariant.price} />
                {selectedVariant.compareAtPrice ? (
                  <s>
                    <Money data={selectedVariant.compareAtPrice} />
                  </s>
                ) : null}
              </div>
              <AddToCartButton
                analytics={{productId: product.id}}
                disabled={!selectedVariant.availableForSale}
                lines={[
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                    selectedVariant,
                  },
                ]}
                onSuccess={() => window.setTimeout(onClose, 1200)}
              >
                {(isPending, isAdded) =>
                  isAdded
                    ? 'Added to cart'
                    : isPending
                      ? 'Adding...'
                      : 'Add to cart'
                }
              </AddToCartButton>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
