import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {AddToCartButton, CartIcon} from '~/components/AddToCartButton';
import {WishlistButton} from '~/components/WishlistButton';
import {SectionHeading} from './SectionHeading';

export function HomeProductBand({
  heading,
  products,
  collectionUrl,
  isBestSeller = false,
}: {
  heading: string;
  products: RecommendedProductsQuery['products']['nodes'];
  collectionUrl?: string;
  isBestSeller?: boolean;
}) {
  const headingId = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-');
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
        <div className="home-product-grid">
          {products.map((product) => (
            <div className="home-product-card" key={product.id}>
              <HomeProductCard product={product} isBestSeller={isBestSeller} />
            </div>
          ))}
        </div>
      ) : (
        <p className="home-empty">Products will appear here once your Shopify catalog is connected.</p>
      )}
      {isBestSeller ? (
        <div className="home-product-dots" aria-hidden="true">
          <i className="is-active" />
          <i />
          <i />
        </div>
      ) : null}
      <Link className="home-text-link" to={collectionUrl ?? '/collections'}>
        {isBestSeller ? 'Shop best sellers →' : 'View all products →'}
      </Link>
    </section>
  );
}

function HomeProductCard({
  product,
  isBestSeller,
}: {
  product: RecommendedProductsQuery['products']['nodes'][number];
  isBestSeller: boolean;
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
        <Link className="home-product-image-link" to={`/products/${product.handle}`}>
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
        <div className="home-product-rating" aria-label="Average 4.2 rating">
          <span aria-hidden="true">★★★★<i>★</i></span>
          <small>Average 4.2 Rating</small>
        </div>
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
