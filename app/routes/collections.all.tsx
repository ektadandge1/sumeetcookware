import type {Route} from './+types/collections.all';
import {Form, Link, useLoaderData} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {categories as shopCategories} from '~/components/blocks/homeAssets';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Shop All Cookware | Sumeet Cookware'},
    {
      name: 'description',
      content:
        'Explore cookware, serveware, storage, and kitchen essentials from Sumeet Cookware.',
    },
  ];
};

const SORT_OPTIONS = {
  featured: {reverse: false, sortKey: 'BEST_SELLING'},
  'newest-first': {reverse: true, sortKey: 'CREATED_AT'},
  'price-low-high': {reverse: false, sortKey: 'PRICE'},
  'price-high-low': {reverse: true, sortKey: 'PRICE'},
  'title-a-z': {reverse: false, sortKey: 'TITLE'},
} as const;

export async function loader(args: Route.LoaderArgs) {
  return loadCriticalData(args);
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });
  const selectedSort = new URL(request.url).searchParams.get('sort');
  const sort =
    selectedSort && selectedSort in SORT_OPTIONS ? selectedSort : 'featured';
  const sortOption = SORT_OPTIONS[sort as keyof typeof SORT_OPTIONS];

  const {products} = await storefront.query(CATALOG_QUERY, {
    variables: {
      ...paginationVariables,
      reverse: sortOption.reverse,
      sortKey: sortOption.sortKey,
    },
  });
  return {
    products,
    sort,
  };
}

export default function Collection() {
  const {products, sort} = useLoaderData<typeof loader>();
  const featuredProduct = products.nodes[0];

  return (
    <div className="all-products-page">
      <nav className="all-products-breadcrumb" aria-label="Breadcrumb">
        <Link prefetch="intent" to="/">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <strong>Shop all</strong>
      </nav>

      <section className="all-products-hero">
        <div className="all-products-hero-copy">
          <p className="all-products-eyebrow">Made for everyday cooking</p>
          <h1>Cookware that belongs in every kitchen</h1>
          <p>
            Discover dependable cookware, smart storage, and tableware made for
            the way India cooks and serves.
          </p>
          <a href="#all-products-catalog">Explore the collection</a>
        </div>
        <div className="all-products-hero-art" aria-hidden="true">
          <span className="all-products-hero-orbit" />
          {featuredProduct?.featuredImage ? (
            <Image
              alt=""
              data={featuredProduct.featuredImage}
              loading="eager"
              sizes="(min-width: 64em) 38vw, 80vw"
            />
          ) : null}
          <span className="all-products-hero-stamp">
            <strong>Since 1962</strong>
            <small>Trusted quality</small>
          </span>
        </div>
      </section>

      <section
        className="all-products-categories"
        aria-labelledby="shop-by-category"
      >
        <div>
          <p className="all-products-eyebrow">Find your essential</p>
          <h2 id="shop-by-category">Shop by category</h2>
        </div>
        <nav aria-label="Product categories">
          <Link className="is-active" to="/collections/all">
            All products
          </Link>
          {shopCategories.map((category) => (
            <Link key={category.to} prefetch="intent" to={category.to}>
              {category.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="all-products-catalog" id="all-products-catalog">
        <header className="all-products-toolbar">
          <div>
            <p className="all-products-eyebrow">The complete range</p>
            <h2>All products</h2>
            <p>{products.nodes.length} products shown</p>
          </div>
          <Form className="all-products-sort" method="get">
            <label htmlFor="all-products-sort">Sort by</label>
            <div>
              <select
                defaultValue={sort}
                id="all-products-sort"
                name="sort"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                <option value="featured">Best selling</option>
                <option value="newest-first">Newest first</option>
                <option value="price-low-high">Price: low to high</option>
                <option value="price-high-low">Price: high to low</option>
                <option value="title-a-z">Name: A to Z</option>
              </select>
              <SortIcon />
            </div>
          </Form>
        </header>

        {!products.nodes.length ? (
          <div className="all-products-empty">
            <h2>More essentials are on the way</h2>
            <p>Please check back soon for new cookware and kitchenware.</p>
          </div>
        ) : (
          <div className="all-products-pagination">
            <PaginatedResourceSection<CollectionItemFragment>
              ariaLabel="All products"
              connection={products}
              resourcesClassName="all-products-grid"
            >
              {({node: product, index}) => (
                <ProductItem
                  appearance="collection"
                  key={product.id}
                  product={product}
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              )}
            </PaginatedResourceSection>
          </div>
        )}
      </section>

      <section
        className="all-products-assurances"
        aria-label="Shopping assurances"
      >
        <article>
          <ShieldIcon />
          <div>
            <h2>Built to last</h2>
            <p>Dependable materials for everyday use.</p>
          </div>
        </article>
        <article>
          <TruckIcon />
          <div>
            <h2>Pan-India delivery</h2>
            <p>Securely packed and delivered to your door.</p>
          </div>
        </article>
        <article>
          <SupportIcon />
          <div>
            <h2>Here to help</h2>
            <p>Support before and after your purchase.</p>
          </div>
        </article>
      </section>
    </div>
  );
}

function SortIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 5v14M4 8l3-3 3 3M17 19V5M14 16l3 3 3-3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 13v-2a8 8 0 0 1 16 0v2" />
      <path d="M4 12h3v7H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 1-2ZM20 12h-3v7h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-1-2ZM17 19c-1 2-3 2-5 2" />
    </svg>
  );
}

const COLLECTION_ITEM_FRAGMENT = `#graphql
  fragment MoneyCollectionItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment CollectionItem on Product {
    id
    handle
    title
    tags
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyCollectionItem
      }
      maxVariantPrice {
        ...MoneyCollectionItem
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      availableForSale
      id
      image {
        id
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      product {
        title
        handle
      }
      selectedOptions {
        name
        value
      }
      title
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $reverse: Boolean!
    $sortKey: ProductSortKeys!
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
      reverse: $reverse
      sortKey: $sortKey
    ) {
      nodes {
        ...CollectionItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;
