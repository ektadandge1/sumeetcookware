import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {WishlistButton} from '~/components/WishlistButton';
import {AddToCartButton, CartIcon} from '~/components/AddToCartButton';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
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
    <div className="product-item-shell">
      <Link
        className="product-item"
        key={product.id}
        prefetch="intent"
        to={variantUrl}
      >
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        <h4>{product.title}</h4>
        <small>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
      </Link>
      <div className="product-item-actions">
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
    </div>
  );
}
