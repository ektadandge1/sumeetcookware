import {Image} from '@shopify/hydrogen';
import type {Image as ShopifyImage} from '@shopify/hydrogen/storefront-api-types';
import {useEffect, useRef, useState} from 'react';
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
  selectedImage: ProductVariantFragment['image'] | undefined;
}) {
  const galleryImages = selectedImage
    ? [
        selectedImage,
        ...images.filter((image) => image.id !== selectedImage.id),
      ]
    : images;
  const [activeImageId, setActiveImageId] = useState(
    getImageKey(galleryImages[0]),
  );
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [thumbnailScroll, setThumbnailScroll] = useState({
    previous: false,
    next: false,
  });

  useEffect(() => {
    if (selectedImage) setActiveImageId(getImageKey(selectedImage));
  }, [selectedImage]);

  useEffect(() => {
    const gallery = galleryRef.current;
    const stage = stageRef.current;
    const thumbnails = thumbnailsRef.current;
    if (!gallery || !stage || !thumbnails) return;

    const updateScroll = () => {
      const vertical = getComputedStyle(thumbnails).flexDirection === 'column';
      const position = vertical ? thumbnails.scrollTop : thumbnails.scrollLeft;
      const maximum = vertical
        ? thumbnails.scrollHeight - thumbnails.clientHeight
        : thumbnails.scrollWidth - thumbnails.clientWidth;
      const previous = position > 1;
      const next = position < maximum - 1;
      setThumbnailScroll((current) =>
        current.previous === previous && current.next === next
          ? current
          : {previous, next},
      );
    };
    const updateLayout = () => {
      // Let the main image size the gallery, not the full thumbnail list.
      gallery.style.setProperty(
        '--product-gallery-stage-height',
        `${stage.getBoundingClientRect().height}px`,
      );
      scrollSelectedThumbnailIntoView(thumbnails);
      updateScroll();
    };

    const observer = new ResizeObserver(updateLayout);
    observer.observe(stage);
    observer.observe(thumbnails);
    thumbnails.addEventListener('scroll', updateScroll, {passive: true});
    updateLayout();
    return () => {
      observer.disconnect();
      thumbnails.removeEventListener('scroll', updateScroll);
    };
  }, [galleryImages.length]);

  useEffect(() => {
    const thumbnails = thumbnailsRef.current;
    if (thumbnails) scrollSelectedThumbnailIntoView(thumbnails);
  }, [activeImageId, galleryImages.length]);

  const activeImage =
    galleryImages.find((image) => getImageKey(image) === activeImageId) ??
    galleryImages[0];

  const scrollThumbnails = (direction: -1 | 1) => {
    const thumbnails = thumbnailsRef.current;
    if (!thumbnails) return;

    const vertical = getComputedStyle(thumbnails).flexDirection === 'column';
    const distance =
      direction *
      (vertical ? thumbnails.clientHeight : thumbnails.clientWidth) *
      0.8;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
      ? 'auto'
      : 'smooth';
    thumbnails.scrollBy(
      vertical ? {top: distance, behavior} : {left: distance, behavior},
    );
  };

  if (!activeImage) {
    return <div className="product-gallery product-gallery-empty" />;
  }

  return (
    <div className="product-gallery" ref={galleryRef}>
      {galleryImages.length > 1 ? (
        <div className="product-gallery-thumbnail-rail">
          <button
            aria-label="View previous product images"
            className="product-gallery-thumbnail-nav is-previous"
            disabled={!thumbnailScroll.previous}
            onClick={() => scrollThumbnails(-1)}
            type="button"
          >
            <span aria-hidden="true" />
          </button>
          <div
            className="product-gallery-thumbnails"
            aria-label="Product images"
            ref={thumbnailsRef}
          >
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
                  loading="lazy"
                  decoding="async"
                  sizes="72px"
                />
              </button>
            ))}
          </div>
          <button
            aria-label="View more product images"
            className="product-gallery-thumbnail-nav is-next"
            disabled={!thumbnailScroll.next}
            onClick={() => scrollThumbnails(1)}
            type="button"
          >
            <span aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <div className="product-gallery-stage" ref={stageRef}>
        <Image
          alt={activeImage.altText || 'Product image'}
          data={activeImage}
          key={getImageKey(activeImage)}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          sizes="(min-width: 64em) 48vw, 100vw"
        />
      </div>
      {galleryImages.length > 1 ? (
        <div className="product-gallery-dots" aria-hidden="true">
          {galleryImages.map((image) => (
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

function scrollSelectedThumbnailIntoView(thumbnails: HTMLDivElement) {
  const selected = thumbnails.querySelector<HTMLButtonElement>(
    'button[aria-pressed="true"]',
  );
  if (!selected) return;

  const vertical = getComputedStyle(thumbnails).flexDirection === 'column';
  const container = thumbnails.getBoundingClientRect();
  const image = selected.getBoundingClientRect();
  const start = vertical
    ? image.top - container.top
    : image.left - container.left;
  const end = vertical
    ? image.bottom - container.bottom
    : image.right - container.right;
  const distance = start < 0 ? start : end > 0 ? end : 0;
  if (distance)
    thumbnails.scrollBy(vertical ? {top: distance} : {left: distance});
}
