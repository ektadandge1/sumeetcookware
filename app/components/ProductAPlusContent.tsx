import {Image} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';

export function ProductAPlusContent({
  productTitle,
  variant,
}: {
  productTitle: string;
  variant: ProductVariantFragment | null | undefined;
}) {
  const seen = new Set<string>();
  const images = (variant?.variantAPlusImages?.references?.nodes ?? [])
    .flatMap((node) => ('image' in node && node.image ? [node.image] : []))
    .filter((image) => {
      if (seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    });

  // Never substitute a product-wide list or another variant's images.
  if (!images.length) return null;

  const variantLabel =
    variant?.title && variant.title !== 'Default Title'
      ? `${productTitle} — ${variant.title}`
      : productTitle;

  return (
    <section
      className="product-a-plus"
      aria-label={`${variantLabel} A+ content`}
      data-variant-id={variant?.id}
      data-variant-sku={variant?.sku}
    >
      {images.map((image, index) => {
        const isFullWidth =
          index === 0 || (index === images.length - 1 && images.length % 2 === 0);

        return (
          <Image
            key={image.url}
            alt={`${variantLabel} — feature ${index + 1}`}
            data={image}
            aspectRatio={
              image.width && image.height
                ? `${image.width}/${image.height}`
                : undefined
            }
            loading="lazy"
            decoding="async"
            sizes={
              isFullWidth
                ? '(min-width: 96rem) 92rem, (min-width: 48rem) calc(100vw - 4rem), calc(100vw - 2rem)'
                : '(min-width: 96rem) 45.5rem, (min-width: 48rem) calc(50vw - 2.5rem), calc(100vw - 2rem)'
            }
          />
        );
      })}
    </section>
  );
}
