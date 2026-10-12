import {useState} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {Maybe, MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {AddToCartButton} from './AddToCartButton';

type CollectionProduct = ProductItemFragment & {
  productType?: string;
  tags?: string[];
  selectedOrFirstAvailableVariant?:
    | (NonNullable<ProductItemFragment['selectedOrFirstAvailableVariant']> & {
        compareAtPrice?: Maybe<MoneyV2>;
      })
    | null;
};

const MATERIALS = ['Stainless Steel', 'Cast Iron'] as const;

export function CollectionDesktopCatalog({
  description,
  products,
  title,
}: {
  description: string;
  products: CollectionProduct[];
  title: string;
}) {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [sort, setSort] = useState('price-ascending');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const visibleProducts = products
    .filter((product) => {
      if (!selectedMaterials.length) return true;
      const searchable = [
        product.title,
        product.productType,
        ...(product.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return selectedMaterials.some((material) =>
        searchable.includes(material.toLowerCase()),
      );
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

  return (
    <div className="collection-catalog">
      <div className="collection-toolbar">
        <span>{visibleProducts.length} Products</span>
        <div>
          <label>
            <SortIcon />
            <span className="visually-hidden">Sort products</span>
            <select onChange={(event) => setSort(event.target.value)} value={sort}>
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
        <div className="collection-filter-panel">
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
            <details>
              <summary>Size</summary>
              <p>Choose a product to see available sizes.</p>
            </details>
            <details>
              <summary>Price</summary>
              <p>Use the price sorting control above.</p>
            </details>
          </div>
          <div className="collection-about">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        <div className={`collection-product-grid is-${view}`}>
          {visibleProducts.map((product, index) => (
            <CollectionProductCard
              key={product.id}
              loading={index < 6 ? 'eager' : 'lazy'}
              product={product}
            />
          ))}
        </div>
      </div>
    </div>
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
      <Link className="collection-product-media" to={`/products/${product.handle}`}>
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
        <Link to={`/products/${product.handle}`}>{product.title}</Link>
        <div className="collection-product-price">
          <Money data={variant?.price ?? product.priceRange.minVariantPrice} />
          {variant?.compareAtPrice ? (
            <s><Money data={variant.compareAtPrice} /></s>
          ) : null}
        </div>
        {variant ? (
          <AddToCartButton
            disabled={!variant.availableForSale}
            lines={[{merchandiseId: variant.id, quantity: 1, selectedVariant: variant}]}
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
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4" /></svg>;
}

function ListIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>;
}

function GridIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}
