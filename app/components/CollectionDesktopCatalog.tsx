import {useEffect, useRef, useState} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {Maybe, MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {AddToCartButton} from './AddToCartButton';

type CollectionProduct = CollectionItemFragment & {
  options?: Array<{
    name: string;
    optionValues: Array<{name: string}>;
  }>;
  productType?: string;
  tags?: string[];
  selectedOrFirstAvailableVariant?:
    | (NonNullable<
        CollectionItemFragment['selectedOrFirstAvailableVariant']
      > & {
        compareAtPrice?: Maybe<MoneyV2>;
      })
    | null;
};

const MATERIALS = ['Stainless Steel', 'Cast Iron'] as const;

export function CollectionDesktopCatalog({
  products,
}: {
  products: CollectionProduct[];
}) {
  const availableSizes = Array.from(
    new Map(
      products
        .flatMap((product) => getProductSizes(product))
        .map((size) => [size.toLowerCase(), size]),
    ).values(),
  ).sort((first, second) =>
    first.localeCompare(second, undefined, {numeric: true}),
  );
  const priceFloor = Math.floor(
    Math.min(
      ...products.map((product) =>
        Number(product.priceRange.minVariantPrice.amount),
      ),
    ),
  );
  const priceCeiling = Math.ceil(
    Math.max(
      ...products.map((product) =>
        Number(product.priceRange.maxVariantPrice.amount),
      ),
    ),
  );
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    ...MATERIALS,
  ]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minimumPrice, setMinimumPrice] = useState(String(priceFloor));
  const [maximumPrice, setMaximumPrice] = useState(String(priceCeiling));
  const [sort, setSort] = useState('price-ascending');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const activeMinimumPrice =
    minimumPrice === '' ? priceFloor : Number(minimumPrice);
  const activeMaximumPrice =
    maximumPrice === '' ? priceCeiling : Number(maximumPrice);
  const visibleProducts = products
    .filter((product) => {
      const materialMatches =
        !selectedMaterials.length ||
        selectedMaterials.length === MATERIALS.length ||
        selectedMaterials.some((material) => {
          const searchable = [
            product.title,
            product.productType,
            ...(product.tags ?? []),
            ...(product.options?.flatMap((option) =>
              option.optionValues.map((value) => value.name),
            ) ?? []),
          ]
            .join(' ')
            .toLowerCase();
          return searchable.includes(material.toLowerCase());
        });
      const sizeMatches =
        !selectedSizes.length ||
        selectedSizes.some((size) =>
          getProductSizes(product).some(
            (productSize) => productSize.toLowerCase() === size.toLowerCase(),
          ),
        );
      const productPrice = Number(product.priceRange.minVariantPrice.amount);
      const priceMatches =
        productPrice >= activeMinimumPrice &&
        productPrice <= activeMaximumPrice;

      return materialMatches && sizeMatches && priceMatches;
    })
    .sort((first, second) => {
      if (sort === 'title-ascending') {
        return first.title.localeCompare(second.title);
      }
      if (sort === 'title-descending') {
        return second.title.localeCompare(first.title);
      }
      const firstPrice = Number(first.priceRange.minVariantPrice.amount);
      const secondPrice = Number(second.priceRange.minVariantPrice.amount);
      return sort === 'price-descending'
        ? secondPrice - firstPrice
        : firstPrice - secondPrice;
    });

  const toggleMaterial = (material: string) => {
    setSelectedMaterials((current) =>
      current.includes(material)
        ? current.filter((item) => item !== material)
        : [...current, material],
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size],
    );
  };

  const clearFilters = () => {
    setSelectedMaterials([...MATERIALS]);
    setSelectedSizes([]);
    setMinimumPrice(String(priceFloor));
    setMaximumPrice(String(priceCeiling));
  };

  useEffect(() => {
    const filterPanel = filterPanelRef.current;
    const productGrid = productGridRef.current;
    if (!filterPanel || !productGrid) return;

    const returnToPageAtProductBoundary = (event: WheelEvent) => {
      const isAtTop = productGrid.scrollTop <= 0;
      const isAtBottom =
        productGrid.scrollTop + productGrid.clientHeight >=
        productGrid.scrollHeight - 1;
      if (
        (event.deltaY >= 0 || !isAtTop) &&
        (event.deltaY <= 0 || !isAtBottom)
      ) {
        return false;
      }

      event.preventDefault();
      window.scrollBy({top: event.deltaY});
      return true;
    };

    const forwardWheelToProducts = (event: WheelEvent) => {
      const sizeOptions = (event.target as HTMLElement).closest<HTMLElement>(
        '.collection-size-options',
      );
      if (sizeOptions) {
        const canScrollUp = sizeOptions.scrollTop > 0;
        const canScrollDown =
          sizeOptions.scrollTop + sizeOptions.clientHeight <
          sizeOptions.scrollHeight;
        if (
          (event.deltaY < 0 && canScrollUp) ||
          (event.deltaY > 0 && canScrollDown)
        ) {
          return;
        }
      }

      if (returnToPageAtProductBoundary(event)) return;
      if (productGrid.scrollHeight <= productGrid.clientHeight) return;

      event.preventDefault();
      productGrid.scrollTop += event.deltaY;
    };

    const leaveProductScrollerAtBoundary = (event: WheelEvent) => {
      returnToPageAtProductBoundary(event);
    };

    filterPanel.addEventListener('wheel', forwardWheelToProducts, {
      passive: false,
    });
    productGrid.addEventListener('wheel', leaveProductScrollerAtBoundary, {
      passive: false,
    });
    return () => {
      filterPanel.removeEventListener('wheel', forwardWheelToProducts);
      productGrid.removeEventListener('wheel', leaveProductScrollerAtBoundary);
    };
  }, [visibleProducts.length]);

  return (
    <div className="collection-catalog">
      <div className="collection-toolbar">
        <span>{visibleProducts.length} Products</span>
        <span className="collection-toolbar-divider" aria-hidden="true" />
        <div>
          <label>
            <SortIcon />
            <span className="visually-hidden">Sort products</span>
            <select
              onChange={(event) => setSort(event.target.value)}
              value={sort}
            >
              <option value="price-ascending">Price low to high</option>
              <option value="price-descending">Price high to low</option>
              <option value="title-ascending">Name A to Z</option>
              <option value="title-descending">Name Z to A</option>
            </select>
          </label>
          <div className="collection-view-toggle" aria-label="Product view">
            <button
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              type="button"
            >
              <ListIcon />
            </button>
            <button
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              type="button"
            >
              <GridIcon />
            </button>
          </div>
        </div>
      </div>

      <div className="collection-catalog-layout">
        <div className="collection-filter-panel" ref={filterPanelRef}>
          <div className="collection-filter-box">
            <h2>Filters</h2>
            <details open>
              <summary>Product Material</summary>
              {MATERIALS.map((material) => (
                <label key={material}>
                  <span>{material}</span>
                  <input
                    checked={selectedMaterials.includes(material)}
                    onChange={() => toggleMaterial(material)}
                    type="checkbox"
                  />
                </label>
              ))}
            </details>
            <details className="collection-size-filter">
              <summary>Size</summary>
              {availableSizes.length ? (
                <div className="collection-size-options">
                  {availableSizes.map((size) => (
                    <label key={size}>
                      <span>{size}</span>
                      <input
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                        type="checkbox"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p>No size options available.</p>
              )}
            </details>
            <details>
              <summary>Price</summary>
              <div className="collection-price-filter">
                <label>
                  <span>Minimum</span>
                  <span>
                    ₹
                    <input
                      aria-label="Minimum price"
                      max={maximumPrice || priceCeiling}
                      min={priceFloor}
                      onChange={(event) => setMinimumPrice(event.target.value)}
                      type="number"
                      value={minimumPrice}
                    />
                  </span>
                </label>
                <label>
                  <span>Maximum</span>
                  <span>
                    ₹
                    <input
                      aria-label="Maximum price"
                      max={priceCeiling}
                      min={minimumPrice || priceFloor}
                      onChange={(event) => setMaximumPrice(event.target.value)}
                      type="number"
                      value={maximumPrice}
                    />
                  </span>
                </label>
              </div>
            </details>
          </div>
        </div>

        {visibleProducts.length ? (
          <div
            className={`collection-product-grid is-${view}`}
            ref={productGridRef}
          >
            {visibleProducts.map((product, index) => (
              <CollectionProductCard
                key={product.id}
                loading={index < 6 ? 'eager' : 'lazy'}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="collection-filter-empty">
            <p>No products match these filters.</p>
            <button onClick={clearFilters} type="button">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getProductSizes(product: CollectionProduct) {
  return (
    product.options
      ?.filter((option) => /size|capacity/i.test(option.name))
      .flatMap((option) =>
        option.optionValues.map((value) => value.name.trim()),
      ) ?? []
  );
}

function CollectionProductCard({
  loading,
  product,
}: {
  loading: 'eager' | 'lazy';
  product: CollectionProduct;
}) {
  const variant = product.selectedOrFirstAvailableVariant;
  const isBestseller = product.tags?.some((tag) =>
    /best[ -]?seller/i.test(tag),
  );

  return (
    <article className="collection-product-card">
      <Link
        className="collection-product-media"
        prefetch="intent"
        to={`/products/${product.handle}`}
      >
        {isBestseller ? <span>Bestseller</span> : null}
        {product.featuredImage ? (
          <Image
            alt={product.featuredImage.altText || product.title}
            data={product.featuredImage}
            loading={loading}
            sizes="(min-width: 64em) 24vw, 50vw"
          />
        ) : null}
      </Link>
      <div className="collection-product-copy">
        <Link prefetch="intent" to={`/products/${product.handle}`}>
          {product.title}
        </Link>
        <div className="collection-product-price">
          <Money data={variant?.price ?? product.priceRange.minVariantPrice} />
          {variant?.compareAtPrice ? (
            <s>
              <Money data={variant.compareAtPrice} />
            </s>
          ) : null}
        </div>
        {variant ? (
          <AddToCartButton
            disabled={!variant.availableForSale}
            lines={[
              {
                merchandiseId: variant.id,
                quantity: 1,
                selectedVariant: variant,
              },
            ]}
          >
            {(isPending, isAdded) =>
              isPending
                ? 'Adding...'
                : isAdded
                  ? 'Added to cart'
                  : variant.availableForSale
                    ? 'Add to cart'
                    : 'Sold out'
            }
          </AddToCartButton>
        ) : null}
      </div>
    </article>
  );
}

function SortIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
