import {Await, data, redirect, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/ProductForm';
import {ProductItem} from '~/components/ProductItem';
import {HomeCustomerStories} from '~/components/blocks/HomeCustomerStories';
import {SectionHeading} from '~/components/blocks/SectionHeading';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {WishlistButton} from '~/components/WishlistButton';
import {ProductBenefits} from '~/components/ProductBenefits';
import {ProductReviews} from '~/components/ProductReviews';
import {ProductGallery} from '~/components/ProductGallery';
import {ProductAPlusContent} from '~/components/ProductAPlusContent';
import type {ProductReview} from '~/lib/judgeme.server';
import {loadProductReviews, submitProductReview} from '~/lib/judgeme.server';
import type {
  BoughtTogetherQuery,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {HomeProductBand} from '~/components/blocks/HomeProductBand';
import {HomeNewsletter} from '~/components/blocks/HomeNewsletter';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Hydrogen | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

export async function action({context, params, request}: Route.ActionArgs) {
  const formData = await request.formData();
  if (formData.get('intent') !== 'submit-review' || !params.handle) {
    return data({error: 'Invalid review request.'}, {status: 400});
  }

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const rating = Number(formData.get('rating'));
  if (
    !name ||
    !email ||
    !body ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return data({error: 'Please complete all review fields.'}, {status: 400});
  }

  const {product} = await context.storefront.query(PRODUCT_ID_QUERY, {
    variables: {handle: params.handle},
  });
  const externalId = Number(product?.id.split('/').pop());
  if (!product || !Number.isSafeInteger(externalId)) {
    return data({error: 'This product could not be found.'}, {status: 404});
  }

  try {
    await submitProductReview({
      body,
      email,
      env: context.env,
      name,
      productExternalId: externalId,
      rating,
    });
    return data({success: true});
  } catch (error) {
    console.error('Judge.me review submission failed', error);
    return data(
      {error: 'Your review could not be submitted. Please try again.'},
      {status: 502},
    );
  }
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const selectedOptions = getSelectedProductOptions(request);
  const [{product}, bestSelling] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions},
    }),
    storefront.query(BEST_SELLING_PRODUCTS_QUERY).catch(() => null),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
    bestSelling,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context, params}: Route.LoaderArgs) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  const productId = params.handle
    ? context.storefront
        .query(PRODUCT_ID_QUERY, {variables: {handle: params.handle}})
        .then(({product}) => product?.id ?? '')
        .catch(() => '')
    : Promise.resolve('');
  const externalId = productId.then((id) => id.split('/').pop() ?? '');

  return {
    reviews: externalId.then((id) =>
      params.handle && id
        ? loadProductReviews(context.env, params.handle, id)
        : [],
    ),
    boughtTogether: productId.then((id) =>
      id
        ? context.storefront
            .query(BOUGHT_TOGETHER_QUERY, {variables: {productId: id}})
            .catch(() => null)
        : null,
    ),
  };
}

export default function Product() {
  const {bestSelling, product, reviews, boughtTogether} =
    useLoaderData<typeof loader>();

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;
  const isBestseller = product.tags.some((tag: string) =>
    /best[ -]?seller/i.test(tag),
  );
  const discount = getDiscountPercentage(
    selectedVariant?.price.amount,
    selectedVariant?.compareAtPrice?.amount,
  );

  return (
    <div className="product">
      <div className="product-details">
        <div className="product-media">
          <h1 className="product-mobile-title">{title}</h1>
          {isBestseller ? (
            <span className="product-bestseller">Bestseller</span>
          ) : null}
          <WishlistButton
            className="product-page-wishlist"
            item={{
              id: product.id,
              handle: product.handle,
              title,
              imageAlt: title,
              imageUrl: selectedVariant?.image?.url,
              price: selectedVariant?.price.amount,
              currencyCode: selectedVariant?.price.currencyCode,
            }}
          />
          <ProductGallery
            images={getGalleryImages(product, selectedVariant)}
            selectedImage={selectedVariant?.image}
          />
        </div>
        <div className="product-main">
          <h1>{title}</h1>
          {product.description ? (
            <p className="product-intro">
              {getDescriptionIntro(product.description)}
            </p>
          ) : null}
          <Suspense fallback={<div className="product-rating-placeholder" />}>
            <Await
              resolve={reviews}
              errorElement={<div className="product-rating-placeholder" />}
            >
              {(productReviews) => (
                <ProductRatingSummary reviews={productReviews} />
              )}
            </Await>
          </Suspense>
          <div className="product-price-row">
            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />
            {discount ? (
              <span className="product-saving">Save {discount}%</span>
            ) : null}
          </div>
          <small className="product-shipping-note">
            Shipping calculated at checkout
          </small>
          <ProductForm
            productOptions={productOptions}
            reviews={reviews}
            selectedVariant={selectedVariant}
          />
          <ProductBenefits className="product-benefits-mobile" />
          <div className="product-information">
            <details>
              <summary>Product Description</summary>
              <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
            </details>
            <details>
              <summary>Product Details</summary>
              <dl>
                <div>
                  <dt>Brand</dt>
                  <dd>{product.vendor}</dd>
                </div>
                {product.productType ? (
                  <div>
                    <dt>Product type</dt>
                    <dd>{product.productType}</dd>
                  </div>
                ) : null}
                {selectedVariant?.sku ? (
                  <div>
                    <dt>SKU</dt>
                    <dd>{selectedVariant.sku}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Availability</dt>
                  <dd>
                    {selectedVariant?.availableForSale
                      ? 'In stock'
                      : 'Sold out'}
                  </dd>
                </div>
              </dl>
            </details>
            <details>
              <summary>Additional Details</summary>
              <p>
                Shipping charges and delivery estimates are calculated at
                checkout.
              </p>
              {product.tags.length ? (
                <p>Features: {product.tags.join(', ')}</p>
              ) : null}
              {product.itemHighlight?.value ? (
                <p>{product.itemHighlight.value}</p>
              ) : null}
            </details>
          </div>
        </div>
      </div>
      <ProductBenefits className="product-benefits-desktop" />
      <ProductAPlusContent
        key={selectedVariant?.id}
        productTitle={title}
        variant={selectedVariant}
      />
      <Suspense fallback={null}>
        <Await resolve={boughtTogether} errorElement={null}>
          {(recommendations) => (
            <ProductBoughtTogether
              currentHandle={product.handle}
              recommendations={recommendations}
            />
          )}
        </Await>
      </Suspense>
      <HomeProductBand
        collectionUrl="/collections/all"
        heading="Top Selling Products"
        isBestSeller
        products={
          (bestSelling?.products.nodes ?? []) as RecommendedProductsQuery['products']['nodes']
        }
      />
      <HomeCustomerStories mobileTitle="Videos" />
      <Suspense fallback={null}>
        <Await resolve={reviews} errorElement={null}>
          {(productReviews) => <ProductReviews reviews={productReviews} />}
        </Await>
      </Suspense>
      <div className="product-mobile-newsletter">
        <HomeNewsletter />
      </div>
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

function getGalleryImages(
  product: {
    images?: {
      nodes?: Array<{
        id?: string | null;
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
      }>;
    } | null;
  },
  selectedVariant?: {
    image?: {
      id?: string | null;
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
    variantGallery?: {
      references?: {
        nodes?: Array<{
          url?: string | null;
          image?: {
            id?: string | null;
            url: string;
            altText?: string | null;
            width?: number | null;
            height?: number | null;
          } | null;
        } | null> | null;
      } | null;
    } | null;
  } | null,
) {
  const seen = new Set<string>();
  const merged: Array<{
    id: string;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  }> = [];
  const push = (
    image?: {
      id?: string | null;
      url?: string | null;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null,
  ) => {
    if (!image?.url || seen.has(image.url)) return;
    seen.add(image.url);
    merged.push({
      altText: image.altText,
      height: image.height,
      id: image.id ?? image.url,
      url: image.url,
      width: image.width,
    });
  };

  selectedVariant?.variantGallery?.references?.nodes?.forEach((node) =>
    push(node?.image ?? (node?.url ? {url: node.url} : null)),
  );
  if (selectedVariant?.image) push(selectedVariant.image);
  product.images?.nodes?.forEach((image) => push(image));
  return merged;
}

function ProductBoughtTogether({
  currentHandle,
  recommendations,
}: {
  currentHandle: string;
  recommendations: BoughtTogetherQuery | null;
}) {
  const recommended = (recommendations?.recommended ?? []).filter(
    (item) => item?.handle !== currentHandle,
  );
  const products = recommended.slice(0, 8);
  if (!products.length) return null;

  return (
    <section
      className="product-bought-together"
      aria-labelledby="bought-together-title"
    >
      <SectionHeading
        id="bought-together-title"
        title="Commonly Bought Together"
      />
      <div className="product-bought-together-grid">
        {products.map((item) => (
          <ProductItem
            key={item.id}
            product={item as Parameters<typeof ProductItem>[0]['product']}
          />
        ))}
      </div>
    </section>
  );
}

function ProductRatingSummary({reviews}: {reviews: ProductReview[]}) {
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) /
      reviews.length
    : 0;

  return (
    <a className="product-rating-summary" href="#product-reviews-title">
      <span>{average.toFixed(1)} Rating</span>
      <span
        className="product-hero-stars"
        aria-label={`${average.toFixed(1)} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((position) => (
          <i
            className={
              position <= Math.round(average) ? 'is-filled' : undefined
            }
            key={position}
          >
            ★
          </i>
        ))}
      </span>
      <span>
        ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
      </span>
    </a>
  );
}

function getDescriptionIntro(description: string) {
  const firstLine = description.split(/\n|\.(?:\s|$)/)[0]?.trim() ?? '';
  return firstLine.length > 110 ? `${firstLine.slice(0, 107)}...` : firstLine;
}

function getDiscountPercentage(price?: string, compareAtPrice?: string) {
  const current = Number(price);
  const original = Number(compareAtPrice);
  if (!current || !original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

const BEST_SELLING_PRODUCTS_QUERY = `#graphql
  fragment ProductBandVariant on ProductVariant {
    availableForSale
    id
    title
    compareAtPrice {
      amount
      currencyCode
    }
    price {
      amount
      currencyCode
    }
    image {
      id
      url
      altText
      width
      height
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
  }
  query ProductBestSellingProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 24, sortKey: BEST_SELLING) {
      nodes {
        availableForSale
        id
        title
        handle
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        selectedOrFirstAvailableVariant(
          selectedOptions: []
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductBandVariant
        }
        variants(first: 50) {
          nodes {
            ...ProductBandVariant
          }
        }
        featuredImage {
          id
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;

const BOUGHT_TOGETHER_PRODUCT_FRAGMENT = `#graphql
  fragment BoughtTogetherProduct on Product {
    availableForSale
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      availableForSale
      id
      price {
        amount
        currencyCode
      }
    }
  }
` as const;

const BOUGHT_TOGETHER_QUERY = `#graphql
  query BoughtTogether(
    $country: CountryCode
    $language: LanguageCode
    $productId: ID!
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...BoughtTogetherProduct
    }
  }
  ${BOUGHT_TOGETHER_PRODUCT_FRAGMENT}
` as const;

const PRODUCT_ID_QUERY = `#graphql
  query ProductId($country: CountryCode, $handle: String!, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
    }
  }
` as const;

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
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
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    variantGallery: metafield(namespace: "custom", key: "variant_gallery") {
      ...ProductAPlusMetafield
    }
    variantAPlusImages: metafield(namespace: "custom", key: "aplus_image_urls") {
      ...ProductAPlusMetafield
    }
    variantPackage: metafield(namespace: "custom", key: "package") {
      ...ProductAPlusMetafield
    }
    variantCompliance: metafield(namespace: "custom", key: "compliance") {
      ...ProductAPlusMetafield
    }
    variantPhysicalDimensions: metafield(
      namespace: "custom"
      key: "physical_dimensions"
    ) {
      ...ProductAPlusMetafield
    }
    variantAmazonTaxCode: metafield(
      namespace: "custom"
      key: "amazon_tax_code"
    ) {
      ...ProductAPlusMetafield
    }
    variantSwatchImage: metafield(namespace: "custom", key: "swatch_image") {
      ...ProductAPlusMetafield
    }
  }
` as const;

const PRODUCT_A_PLUS_METAFIELD_FRAGMENT = `#graphql
  fragment ProductAPlusMetafield on Metafield {
    type
    value
    reference {
      ... on MediaImage {
        image {
          altText
          height
          url
          width
        }
      }
      ... on GenericFile {
        url
      }
    }
    references(first: 20) {
      nodes {
        ... on MediaImage {
          image {
            altText
            height
            url
            width
          }
        }
        ... on GenericFile {
          url
        }
      }
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    productType
    handle
    tags
    descriptionHtml
    description
    itemHighlight: metafield(namespace: "custom", key: "item_highlight") {
      ...ProductAPlusMetafield
    }
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
  ${PRODUCT_A_PLUS_METAFIELD_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
