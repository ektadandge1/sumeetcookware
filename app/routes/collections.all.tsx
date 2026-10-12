import type {Route} from './+types/collections.all';
import {Await, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import {getPaginationVariables, Image, Money} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductItem} from '~/components/ProductItem';
import type {CollectionItemFragment} from 'storefrontapi.generated';
import {AllCollectionsMobile} from '~/components/AllCollectionsMobile';
import {loadProductRatingMap} from '~/lib/judgeme.server';

export const meta: Route.MetaFunction = () => {
  return [{title: `Hydrogen | Products`}];
};

const MOBILE_COLLECTION_HANDLES = [
  'kadhai',
  'non-stick-appachatty',
  'non-stick-appam-patra',
  'handi',
  'sauce-pan',
  'grater',
  'spice-box',
  'lunch-container',
  'mug',
  'oil-dispenser',
  'tope',
  'water-bottle',
  'dinner-set',
  'non-stick-cookware',
] as const;

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const [{products, collections}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables, collectionFirst: 50},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);
  return {
    collections: collections.nodes.filter((collection: {handle: string}) =>
      MOBILE_COLLECTION_HANDLES.includes(collection.handle),
    ),
    products,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {ratings: loadProductRatingMap(context.env)};
}

export default function Collection() {
  const {collections, products, ratings} = useLoaderData<typeof loader>();

  return (
    <div className="collection">
      <div className="all-collections-desktop">
        <h1>Products</h1>
        <PaginatedResourceSection<CollectionItemFragment>
          connection={products}
          resourcesClassName="products-grid"
        >
          {({node: product, index}) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          )}
        </PaginatedResourceSection>
      </div>
      <div className="all-collections-mobile-wrap">
        <Suspense
          fallback={
            <AllCollectionsMobile collections={collections} ratings={{}} />
          }
        >
          <Await
            resolve={ratings}
            errorElement={
              <AllCollectionsMobile collections={collections} ratings={{}} />
            }
          >
            {(productRatings) => (
              <AllCollectionsMobile
                collections={collections}
                ratings={productRatings}
              />
            )}
          </Await>
        </Suspense>
      </div>
    </div>
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
    $collectionFirst: Int!
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
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
    collections(first: $collectionFirst) {
      nodes {
        handle
        title
        products(first: 4) {
          nodes {
            ...CollectionItem
          }
        }
      }
    }
  }
  ${COLLECTION_ITEM_FRAGMENT}
` as const;
