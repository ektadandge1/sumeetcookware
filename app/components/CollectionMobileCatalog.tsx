import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {Maybe, MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import type {ProductRatingMap} from '~/lib/judgeme.server';
import {WishlistButton} from './WishlistButton';

export type MobileCollectionProduct = Omit<
  CollectionItemFragment,
  'productType' | 'tags'
> & {
  tags?: string[];
  selectedOrFirstAvailableVariant?:
    | (NonNullable<CollectionItemFragment['selectedOrFirstAvailableVariant']> & {
        compareAtPrice?: Maybe<MoneyV2>;
      })
    | null;
};

export function CollectionMobileCatalog({
  collection,
  ratings,
}: {
  collection: {
    description: string;
    handle: string;
    image?: {
      altText?: string | null;
      url: string;
    } | null;
    products: {nodes: MobileCollectionProduct[]};
    title: string;
  };
  ratings: ProductRatingMap;
}) {
  return (
    <div className="collection-mobile-catalog">
      <section className="collection-mobile-hero">
        {collection.image ? (
          <img
            alt={collection.image.altText || collection.title}
            src={collection.image.url}
          />
        ) : null}
        <h1>{collection.title}</h1>
      </section>
      <nav className="collection-mobile-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span>/</span><span>{collection.title}</span>
      </nav>
      <div className="collection-mobile-grid">
        {collection.products.nodes.map((product, index) => (
          <div className="collection-mobile-grid-item" key={product.id}>
            <MobileProductCard
              product={product}
              rating={ratings[product.handle]}
            />
            {index === 5 ? (
              <MobileOfferCard
                imageUrl={collection.image?.url}
                title={collection.title}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MobileProductCard({
  product,
  rating,
}: {
  product: MobileCollectionProduct;
  rating?: {average: number; count: number};
}) {
  const variant = product.selectedOrFirstAvailableVariant;
  const isBestseller = product.tags?.some((tag) => /best[ -]?seller/i.test(tag));
  const discount = getDiscount(variant?.price.amount, variant?.compareAtPrice?.amount);

  return (
    <article className="collection-mobile-card">
      <div className="collection-mobile-card-media">
        {isBestseller || discount ? (
          <span>{isBestseller ? 'Bestseller' : `${discount}% OFF`}</span>
        ) : null}
        <WishlistButton
          item={{
            id: product.id,
            handle: product.handle,
            title: product.title,
            imageAlt: product.featuredImage?.altText || product.title,
            imageUrl: product.featuredImage?.url,
            price: variant?.price.amount ?? product.priceRange.minVariantPrice.amount,
            currencyCode:
              variant?.price.currencyCode ??
              product.priceRange.minVariantPrice.currencyCode,
          }}
        />
        <Link prefetch="intent" to={`/products/${product.handle}`}>
          {product.featuredImage ? (
            <Image
              alt={product.featuredImage.altText || product.title}
              data={product.featuredImage}
              loading="lazy"
              sizes="46vw"
            />
          ) : null}
        </Link>
      </div>
      <div className="collection-mobile-rating">
        <span aria-label={rating ? `${rating.average} out of 5 stars` : 'No reviews yet'}>
          {[1, 2, 3, 4, 5].map((position) => (
            <i className={rating && position <= Math.round(rating.average) ? 'is-filled' : undefined} key={position}>★</i>
          ))}
        </span>
        <small>{rating ? `Average ${rating.average.toFixed(1)} Rating` : 'No reviews'}</small>
      </div>
      <Link className="collection-mobile-card-title" prefetch="intent" to={`/products/${product.handle}`}>
        {product.title}
      </Link>
      <div className="collection-mobile-card-price">
        <Money data={variant?.price ?? product.priceRange.minVariantPrice} />
        {variant?.compareAtPrice ? <s><Money data={variant.compareAtPrice} /></s> : null}
      </div>
    </article>
  );
}

function MobileOfferCard({imageUrl, title}: {imageUrl?: string; title: string}) {
  return (
    <Link className="collection-mobile-offer" to="/#business-enquiry">
      <div><strong>20%<br />OFF</strong><span>{title}</span><b>Get Now</b></div>
      {imageUrl ? <img alt="" src={imageUrl} /> : null}
    </Link>
  );
}

function getDiscount(price?: string, compareAtPrice?: string) {
  const current = Number(price);
  const original = Number(compareAtPrice);
  if (!current || !original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}
