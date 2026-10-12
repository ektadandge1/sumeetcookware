import {Await, Link, redirect, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {CollectionDesktopCatalog} from '~/components/CollectionDesktopCatalog';
import {CollectionMobileCatalog} from '~/components/CollectionMobileCatalog';
import {loadProductRatingMap} from '~/lib/judgeme.server';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

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
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
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
  const {collection, ratings} = useLoaderData<typeof loader>();

  return (
    <div className="collection collection-page">
      <div className="collection-desktop">
        <p className="collection-eyebrow">Kitchen Cookware Subcategories</p>
        <nav
          className="collection-subcategories"
          aria-label="Kitchen cookware subcategories"
        >
          {SUBCATEGORIES.map((subcategory) => (
            <Link
              className={
                collection.handle === subcategory.handle
                  ? 'is-active'
                  : undefined
              }
              key={subcategory.handle}
              to={`/collections/${subcategory.handle}`}
            >
              {subcategory.title}
            </Link>
          ))}
        </nav>
        <nav className="collection-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/collections/kitchen-cookwares">Kitchen Cookware</Link>
          <span>/</span>
          <strong>{collection.title}</strong>
        </nav>
        <section className="collection-hero">
          {collection.image ? (
            <img
              alt={collection.image.altText || collection.title}
              src={collection.image.url}
            />
          ) : null}
          <h1>{collection.title}</h1>
          <div className="collection-offer">
            <strong>Flat 5% OFF</strong>
            <span>Use Code - FESTIVE5</span>
          </div>
        </section>
        <CollectionDesktopCatalog
          description={collection.description}
          products={collection.products.nodes}
          title={collection.title}
        />
      </div>

      <div className="collection-mobile-default">
        <Suspense
          fallback={
            <CollectionMobileCatalog collection={collection} ratings={{}} />
          }
        >
          <Await
            resolve={ratings}
            errorElement={
              <CollectionMobileCatalog collection={collection} ratings={{}} />
            }
          >
            {(productRatings) => (
              <CollectionMobileCatalog
                collection={collection}
                ratings={productRatings}
              />
            )}
          </Await>
        </Suspense>
      </div>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

const SUBCATEGORIES = [
  {handle: 'kadhai', title: 'Kadhai'},
  {handle: 'non-stick-appachatty', title: 'Appachatty'},
  {handle: 'non-stick-appam-patra', title: 'Appam Patra'},
  {handle: 'handi', title: 'Handi'},
  {handle: 'sauce-pan', title: 'SaucePan'},
  {handle: 'grater', title: 'Grater'},
] as const;

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    tags
    productType
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
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
      compareAtPrice {
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

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
        altText
        width
        height
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
