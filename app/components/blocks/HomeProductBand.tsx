import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {useEffect, useState} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {AddToCartButton, CartIcon} from '~/components/AddToCartButton';
import {WishlistButton} from '~/components/WishlistButton';
import {SectionHeading} from './SectionHeading';

export function HomeProductBand({
  heading,
  products,
  collectionUrl,
  isBestSeller = false,
  productRatings = {},
}: {
  heading: string;
  products: RecommendedProductsQuery['products']['nodes'];
  collectionUrl?: string;
  isBestSeller?: boolean;
  productRatings?: Record<string, {average: number; count: number}>;
}) {
  const [cardsPerSlide, setCardsPerSlide] = useState(4);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const headingId = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const slides = chunkProducts(products, cardsPerSlide);
  const showCarousel = isBestSeller && slides.length > 1;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 64em)');
    const updateCardsPerSlide = () =>
      setCardsPerSlide(mediaQuery.matches ? 2 : 4);

    updateCardsPerSlide();
    mediaQuery.addEventListener('change', updateCardsPerSlide);
    return () => mediaQuery.removeEventListener('change', updateCardsPerSlide);
  }, []);

  useEffect(() => {
    setCurrentSlide((slide) => Math.min(slide, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    if (
      !showCarousel ||
      isPaused ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused, showCarousel, slides.length]);

  const productCards = (slideProducts: typeof products) =>
    slideProducts.map((product) => (
      <div className="home-product-card" key={product.id}>
        <HomeProductCard
          isBestSeller={isBestSeller}
          product={product}
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
        <Link className="home-section-heading-link" to={collectionUrl}>
          <SectionHeading id={headingId} title={heading} />
        </Link>
      ) : (
        <SectionHeading id={headingId} title={heading} />
      )}
      {products.length ? (
        showCarousel ? (
          <div
            className="home-product-carousel"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsPaused(false);
              }
            }}
            onFocus={() => setIsPaused(true)}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="home-product-track"
              style={{transform: `translateX(-${currentSlide * 100}%)`}}
            >
              {slides.map((slide) => (
                <div className="home-product-grid" key={slide[0]?.id}>
                  {productCards(slide)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="home-product-grid">{productCards(products)}</div>
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
      <Link className="home-text-link" to={collectionUrl ?? '/collections/all'}>
        {isBestSeller ? 'Shop best sellers →' : 'View all products →'}
      </Link>
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
}: {
  product: RecommendedProductsQuery['products']['nodes'][number];
  isBestSeller: boolean;
  rating?: {average: number; count: number};
}) {
  const image = product.featuredImage;
  const variant = product.selectedOrFirstAvailableVariant;
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
          {variant?.id ? (
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
              {rating.average.toFixed(1)} from {rating.count}{' '}
              {rating.count === 1 ? 'review' : 'reviews'}
            </small>
          </div>
        ) : null}
      </div>
      <Link className="home-product-title" to={`/products/${product.handle}`}>
        {product.title}
      </Link>
      <div className="home-product-price">
        <Money data={variant?.price ?? product.priceRange.minVariantPrice} />
        {variant?.compareAtPrice ? (
          <s>
            <Money data={variant.compareAtPrice} />
          </s>
        ) : null}
      </div>
      {variant?.id ? (
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
          {(isPending) =>
            isPending
              ? 'Adding...'
              : variant.availableForSale
                ? 'Add to cart'
                : 'Sold out'
          }
        </AddToCartButton>
      ) : (
        <Link className="home-product-cta" to={`/products/${product.handle}`}>
          View product
        </Link>
      )}
    </>
  );
}
