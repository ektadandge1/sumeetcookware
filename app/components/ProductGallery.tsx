import {Image} from '@shopify/hydrogen';
import type {Image as ShopifyImage} from '@shopify/hydrogen/storefront-api-types';
import {useEffect, useState} from 'react';
import type {ProductVariantFragment} from 'storefrontapi.generated';

type ProductGalleryImage = Pick<
  ShopifyImage,
  'altText' | 'height' | 'id' | 'url' | 'width'
> & {__typename?: 'Image'};

export function ProductGallery({
  images,
  selectedImage,
}: {
  images: ProductGalleryImage[];
  selectedImage:
    | ProductVariantFragment['image']
    | undefined;
}) {
  const galleryImages = selectedImage
    ? [selectedImage, ...images.filter((image) => image.id !== selectedImage.id)]
    : images;
  const [activeImageId, setActiveImageId] = useState(
    getImageKey(galleryImages[0]),
  );

  useEffect(() => {
    if (selectedImage) setActiveImageId(getImageKey(selectedImage));
  }, [selectedImage]);

  const activeImage =
    galleryImages.find((image) => getImageKey(image) === activeImageId) ??
    galleryImages[0];

  if (!activeImage) {
    return <div className="product-gallery product-gallery-empty" />;
  }

  return (
    <div className="product-gallery">
      {galleryImages.length > 1 ? (
        <div className="product-gallery-thumbnails" aria-label="Product images">
          {galleryImages.map((image, index) => (
            <button
              aria-label={`View product image ${index + 1}`}
              aria-pressed={getImageKey(image) === getImageKey(activeImage)}
              key={getImageKey(image)}
              onClick={() => setActiveImageId(getImageKey(image))}
              type="button"
            >
              <Image
                alt={image.altText || `Product image ${index + 1}`}
                data={image}
                sizes="72px"
              />
            </button>
          ))}
        </div>
      ) : null}
      <div className="product-gallery-stage">
        <Image
          alt={activeImage.altText || 'Product image'}
          data={activeImage}
          key={getImageKey(activeImage)}
          sizes="(min-width: 64em) 48vw, 100vw"
        />
      </div>
      {galleryImages.length > 1 ? (
        <div className="product-gallery-dots" aria-hidden="true">
          {galleryImages.slice(0, 5).map((image) => (
            <i
              className={
                getImageKey(image) === getImageKey(activeImage)
                  ? 'is-active'
                  : undefined
              }
              key={getImageKey(image)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getImageKey(image?: ProductGalleryImage) {
  return image?.id ?? image?.url ?? '';
}
