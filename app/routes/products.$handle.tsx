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
import type {ProductReview} from '~/lib/judgeme.server';
import {loadProductReviews, submitProductReview} from '~/lib/judgeme.server';
import type {BoughtTogetherQuery, ProductQuery} from 'storefrontapi.generated';
import {getFallbackProduct} from '~/lib/catalogFallback';

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
  const fallbackProduct = createFallbackProduct(handle, selectedOptions);
  const result = await storefront
    .query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions},
    })
    .catch(() => ({product: fallbackProduct}));
  const product = result.product ?? fallbackProduct;

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  if (
    !String(product.id).startsWith('gid://shopify/Product/local-') &&
    !product.aplusImageUrls &&
    !product.aPlusImageUrls &&
    !product.aPlusImageUrlsAlt &&
    !product.aPlusImages &&
    !product.aPlusContent &&
    !product.aPlusBanners &&
    !product.aplusContent &&
    !product.enhancedContent &&
    !product.productBanners &&
    !product.specifications
  ) {
    console.warn(
      `[a-plus] no A+ metafields returned for handle "${handle}". Check Admin > Settings > Custom data > definition namespace.key and enable Storefront access.`,
    );
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
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
      id && !id.startsWith('gid://shopify/Product/local-')
        ? context.storefront
            .query(BOUGHT_TOGETHER_QUERY, {variables: {productId: id}})
            .catch(() => null)
        : null,
    ),
  };
}

export default function Product() {
  const {product, reviews, boughtTogether} = useLoaderData<typeof loader>();

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
  }).map((option) => ({
    ...option,
    optionValues: option.optionValues.map((value) =>
      product.id.startsWith('gid://shopify/Product/local-')
        ? {...value, available: true, exists: true}
        : value,
    ),
  }));

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
        descriptionHtml={descriptionHtml}
        fields={[
          product.aplusImageUrls,
          product.aPlusImageUrls,
          product.aPlusImageUrlsAlt,
          product.aPlusImages,
          product.aPlusContent,
          product.aPlusBanners,
          product.aplusContent,
          product.enhancedContent,
          product.productBanners,
          product.specifications,
        ]}
        productTitle={title}
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
      <HomeCustomerStories />
      <Suspense fallback={null}>
        <Await resolve={reviews} errorElement={null}>
          {(productReviews) => <ProductReviews reviews={productReviews} />}
        </Await>
      </Suspense>
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

type APlusMediaNode = {
  image?: {
    altText?: string | null;
    height?: number | null;
    url: string;
    width?: number | null;
  } | null;
  url?: string | null;
};

type APlusMetafield =
  | {
      reference?: APlusMediaNode | null;
      references?: {nodes: APlusMediaNode[]} | null;
      value: string;
    }
  | null
  | undefined;

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
  const fallback = (recommendations?.fallback?.nodes ?? []).filter(
    (item) => item?.handle !== currentHandle,
  );
  const products = (recommended.length ? recommended : fallback).slice(0, 8);
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

function ProductAPlusContent({
  descriptionHtml,
  fields,
  productTitle,
}: {
  descriptionHtml: string;
  fields: APlusMetafield[];
  productTitle: string;
}) {
  const assets = new Map<string, APlusMediaNode['image']>();

  for (const field of fields) {
    if (!field) continue;
    addAPlusMedia(assets, field.reference);
    field.references?.nodes.forEach((node) => addAPlusMedia(assets, node));
    collectImageUrls(field.value).forEach((url) => assets.set(url, {url}));
  }

  collectHtmlImageUrls(descriptionHtml).forEach((url) =>
    assets.set(url, {url}),
  );

  if (!assets.size) return null;

  return (
    <section className="product-a-plus" aria-label={`${productTitle} features`}>
      {[...assets.entries()].map(([url, image], index) => (
        <img
          alt={image?.altText || `${productTitle} feature ${index + 1}`}
          height={image?.height ?? undefined}
          key={url}
          loading="lazy"
          src={url}
          width={image?.width ?? undefined}
        />
      ))}
    </section>
  );
}

function addAPlusMedia(
  assets: Map<string, APlusMediaNode['image']>,
  media?: APlusMediaNode | null,
) {
  const url = media?.image?.url ?? media?.url;
  if (url) assets.set(url, media?.image ?? {url});
}

function collectHtmlImageUrls(html: string) {
  return [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(
    (match) => match[1],
  );
}

function collectImageUrls(value: string) {
  const urls = new Set<string>();

  const visit = (item: unknown) => {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      // JSON arrays from "A+ image URLs" contain raw https URLs – accept them
      // even when the CDN URL has no image extension.
      if (/^https?:\/\/\S+$/i.test(trimmed)) {
        urls.add(trimmed);
      }
      collectHtmlImageUrls(item).forEach((url) => urls.add(url));
      return;
    }
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (item && typeof item === 'object') {
      Object.values(item).forEach(visit);
    }
  };

  try {
    visit(JSON.parse(value));
  } catch {
    visit(value);
  }

  return urls;
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

function createFallbackProduct(
  handle: string,
  requestedOptions: {name: string; value: string}[],
): NonNullable<ProductQuery['product']> {
  const product = getFallbackProduct(handle);
  const image = {...product.featuredImage, __typename: 'Image' as const};
  const {name: optionName, values: optionValues} = getFallbackVariantOption(
    product.productType,
  );
  const variants = optionValues.map((value, index) => {
    const price = Math.round(
      Number(product.selectedOrFirstAvailableVariant.price.amount) *
        (1 + index * 0.12),
    );

    return {
      ...product.selectedOrFirstAvailableVariant,
      compareAtPrice: {
        amount: String(Math.round(price * 1.2)),
        currencyCode: 'INR' as const,
      },
      id: `${product.selectedOrFirstAvailableVariant.id}-${index + 1}`,
      image,
      price: {amount: String(price), currencyCode: 'INR' as const},
      product: {handle: product.handle, title: product.title},
      selectedOptions: [{name: optionName, value}],
      sku: `SUMEET-${handle.toUpperCase().slice(0, 12)}-${index + 1}`,
      title: value,
      unitPrice: null,
    };
  });
  const requestedValue = requestedOptions.find(
    (option) => option.name.toLowerCase() === optionName.toLowerCase(),
  )?.value;
  const variant =
    variants.find((item) => item.title === requestedValue) ?? variants[0];
  const description = `${product.title} is designed for reliable everyday cooking, combining Sumeet quality with durable materials and practical performance.`;

  return {
    adjacentVariants: variants.filter((item) => item.id !== variant.id),
    description,
    descriptionHtml: `<p>${description}</p>`,
    encodedVariantAvailability: '',
    encodedVariantExistence: '',
    handle: product.handle,
    id: product.id,
    images: {nodes: [image]},
    options: [
      {
        name: optionName,
        optionValues: variants.map((item) => ({
          firstSelectableVariant: item,
          name: item.title,
          swatch: null,
        })),
      },
    ],
    productType: product.productType,
    selectedOrFirstAvailableVariant: variant,
    seo: {description, title: product.title},
    tags: product.tags,
    title: product.title,
    vendor: 'Sumeet Cookware',
  } as unknown as NonNullable<ProductQuery['product']>;
}

function getFallbackVariantOption(productType: string) {
  if (/bottle/i.test(productType)) {
    return {name: 'Capacity', values: ['500 ml', '750 ml', '1 L']};
  }

  if (/dinner/i.test(productType)) {
    return {name: 'Set Size', values: ['24 Pieces', '36 Pieces', '50 Pieces']};
  }

  if (/storage|container/i.test(productType)) {
    return {name: 'Pack Size', values: ['Set of 3', 'Set of 5', 'Set of 7']};
  }

  return {name: 'Size', values: ['20 cm', '22 cm', '24 cm', '26 cm']};
}

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
    fallback: products(first: 8) {
      nodes {
        ...BoughtTogetherProduct
      }
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
    aplusImageUrls: metafield(namespace: "custom", key: "aplus_image_urls") {
      ...ProductAPlusMetafield
    }
    aPlusImageUrls: metafield(namespace: "custom", key: "a_image_urls") {
      ...ProductAPlusMetafield
    }
    aPlusImageUrlsAlt: metafield(
      namespace: "custom"
      key: "a_plus_image_urls"
    ) {
      ...ProductAPlusMetafield
    }
    aPlusImages: metafield(namespace: "custom", key: "a_plus_images") {
      ...ProductAPlusMetafield
    }
    aPlusContent: metafield(namespace: "custom", key: "a_plus_content") {
      ...ProductAPlusMetafield
    }
    aPlusBanners: metafield(namespace: "custom", key: "a_plus_banners") {
      ...ProductAPlusMetafield
    }
    aplusContent: metafield(namespace: "custom", key: "aplus_content") {
      ...ProductAPlusMetafield
    }
    enhancedContent: metafield(namespace: "custom", key: "enhanced_content") {
      ...ProductAPlusMetafield
    }
    productBanners: metafield(namespace: "custom", key: "product_banners") {
      ...ProductAPlusMetafield
    }
    specifications: metafield(namespace: "custom", key: "specifications") {
      ...ProductAPlusMetafield
    }
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
