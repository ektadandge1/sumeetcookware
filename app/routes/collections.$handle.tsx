import {
  Await,
  Link,
  redirect,
  useLoaderData,
  useRouteLoaderData,
} from 'react-router';
import {Suspense} from 'react';
import type {Route} from './+types/collections.$handle';
import type {RootLoader} from '~/root';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {CollectionDesktopCatalog} from '~/components/CollectionDesktopCatalog';
import {CollectionMobileCatalog} from '~/components/CollectionMobileCatalog';
import {getMenuItemUrl} from '~/components/Header';
import {categories as defaultCollectionImages} from '~/components/blocks/homeAssets';
import {loadProductRatingMap} from '~/lib/judgeme.server';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `${data?.collection.title ?? 'Collection'} | Sumeet Cookware`},
    ...(data?.collection.description
      ? [{name: 'description', content: data.collection.description}]
      : []),
  ];
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

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, ...paginationVariables},
    cache: storefront.CacheNone(),
  });

  if (!collection) {
    const fallback =
      FALLBACK_COLLECTIONS[handle as keyof typeof FALLBACK_COLLECTIONS];
    if (!fallback) {
      throw new Response(`Collection ${handle} not found`, {status: 404});
    }

    const {products} = await storefront.query(FALLBACK_COLLECTION_QUERY, {
      variables: {
        query: `(${fallback.query}) AND available_for_sale:true`,
        ...paginationVariables,
      },
      cache: storefront.CacheNone(),
    });
    const image =
      products.nodes[0]?.featuredImage ??
      getDefaultCollectionImage(handle, fallback.title) ??
      null;

    return {
      collection: {
        description: '',
        handle,
        id: `gid://shopify/Collection/fallback-${handle}`,
        image,
        products,
        title: fallback.title,
      },
    };
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection: {
      ...collection,
      image:
        collection.image ??
        collection.products.nodes[0]?.featuredImage ??
        getDefaultCollectionImage(collection.handle, collection.title) ??
        null,
    },
  };
}

function getDefaultCollectionImage(handle: string, title: string) {
  const category = defaultCollectionImages.find(
    ({to}) => to === `/collections/${handle}`,
  );

  return category ? {altText: title, url: category.image} : null;
}

const FALLBACK_COLLECTIONS = {
  dabba: {query: 'storage', title: 'Storage'},
  'dinner-set': {query: 'dinner set', title: 'Dinner Set'},
  'dinner-ware-fork-and-spoon': {
    query: 'fork spoon',
    title: 'Fork and Spoon',
  },
  'dinner-ware-wati': {query: 'wati', title: 'Wati'},
  'fry-pan': {query: 'fry pan', title: 'Fry Pan'},
  grater: {query: 'grater', title: 'Grater'},
  handi: {query: 'handi', title: 'Handi'},
  kadhai: {query: 'kadhai', title: 'Kadhai'},
  'kitchen-utility': {query: 'cookware', title: 'Kitchen Cookware'},
  'lunch-container': {query: 'lunch box', title: 'Lunch Box'},
  mug: {query: 'mug', title: 'Stainless Steel Mug'},
  'non-stick-appachatty': {query: 'appachatty', title: 'Appachatty'},
  'non-stick-appam-patra': {
    query: 'appam patra',
    title: 'Non-Stick Appam Patra',
  },
  'non-stick-casserole': {query: 'casserole', title: 'Non-Stick Casserole'},
  'non-stick-cookware': {query: 'non stick', title: 'Non-Stick Cookware'},
  'non-stick-dosa-tawa': {query: 'dosa tawa', title: 'Non-Stick Dosa Tawa'},
  'non-stick-fry-pan': {query: 'fry pan', title: 'Fry Pan'},
  'non-stick-grill-pan': {query: 'grill pan', title: 'Non-Stick Grill Pan'},
  'non-stick-kadhai': {query: 'non stick kadhai', title: 'Non-Stick Kadhai'},
  'non-stick-pizza-pan': {query: 'pizza pan', title: 'Non-Stick Pizza Pan'},
  'oil-dispenser': {query: 'oil dispenser', title: 'Ghee And Oil Pots'},
  plates: {query: 'plate', title: 'Plates'},
  'sauce-pan': {query: 'saucepan', title: 'Saucepan'},
  tasra: {query: 'tasra', title: 'Tasra'},
  tope: {query: 'tope', title: 'Tope'},
  tumbler: {query: 'tumbler', title: 'Tumbler'},
  'water-bottle': {query: 'water bottle', title: 'Water Bottle'},
} as const;

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
  const rootData = useRouteLoaderData<RootLoader>('root');
  const primaryDomainUrl = rootData?.header.shop.primaryDomain.url;
  const publicStoreDomain = rootData?.publicStoreDomain;
  const currentPath = `/collections/${collection.handle}`;
  const activeMenu = rootData?.header.menu?.items.find((item) =>
    [item, ...item.items].some((menuItem) => {
      if (!primaryDomainUrl || !publicStoreDomain) return false;
      const url = getMenuItemUrl(menuItem, primaryDomainUrl, publicStoreDomain);
      return url
        ? new URL(url, primaryDomainUrl).pathname === currentPath
        : false;
    }),
  );
  const subcollections =
    activeMenu?.items.flatMap((item) => {
      if (!primaryDomainUrl || !publicStoreDomain) return [];
      const url = getMenuItemUrl(item, primaryDomainUrl, publicStoreDomain);
      if (
        !url ||
        !new URL(url, primaryDomainUrl).pathname.startsWith('/collections/')
      ) {
        return [];
      }
      return [{title: item.title, to: url}];
    }) ?? [];

  return (
    <div className="collection collection-page">
      <div className="collection-desktop">
        <CollectionSubcategoryNav
          currentPath={currentPath}
          items={subcollections}
          title={activeMenu?.title}
        />
        <nav className="collection-breadcrumb" aria-label="Breadcrumb">
          <Link prefetch="intent" to="/">
            Home
          </Link>
          <span>/</span>
          <Link prefetch="intent" to="/collections">
            Collections
          </Link>
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
        </section>
        {collection.description.trim() && (
          <p className="collection-summary">{collection.description}</p>
        )}
        {!collection.products.nodes.length ? (
          <p>No in-stock products in this collection right now.</p>
        ) : null}
        <CollectionDesktopCatalog
          key={collection.id}
          products={collection.products.nodes}
        />
      </div>

      <div className="collection-mobile-default">
        <CollectionSubcategoryNav
          currentPath={currentPath}
          items={subcollections}
          title={activeMenu?.title}
        />
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

function CollectionSubcategoryNav({
  currentPath,
  items,
  title,
}: {
  currentPath: string;
  items: Array<{title: string; to: string}>;
  title?: string;
}) {
  if (!items.length) return null;

  return (
    <div className="collection-family-nav">
      <p className="collection-eyebrow">{title}</p>
      <nav
        className="collection-subcategories"
        aria-label={`${title} collections`}
      >
        {items.map((item) => (
          <Link
            className={
              new URL(item.to, 'https://sumeetcookware.com').pathname ===
              currentPath
                ? 'is-active'
                : undefined
            }
            key={item.to}
            prefetch="intent"
            to={item.to}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}

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
    options {
      name
      optionValues {
        name
      }
    }
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
        after: $endCursor,
        filters: [{available: true}]
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

const FALLBACK_COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query FallbackCollection(
    $query: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor,
      query: $query
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
` as const;
