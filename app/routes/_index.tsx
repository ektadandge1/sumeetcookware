import {Await, useLoaderData} from 'react-router';
import {Suspense} from 'react';
import type {Route} from './+types/_index';
import {HomeHero} from '~/components/blocks/HomeHero';
import {HomeServiceBenefits} from '~/components/blocks/HomeServiceBenefits';
import {HomeCategoryStrip} from '~/components/blocks/HomeCategoryStrip';
import {HomeProductSections} from '~/components/blocks/HomeProductSections';
import {HomeOfferBanner} from '~/components/blocks/HomeOfferBanner';
import {HomeWhyChoose} from '~/components/blocks/HomeWhyChoose';
import {HomeBusinessBuyers} from '~/components/blocks/HomeBusinessBuyers';
import {HomeGifting} from '~/components/blocks/HomeGifting';
import {HomeEssentials} from '~/components/blocks/HomeEssentials';
import {HomeReviews} from '~/components/blocks/HomeReviews';
import type {HomeReview} from '~/components/blocks/HomeReviews';
import {HomeCustomerBanner} from '~/components/blocks/HomeCustomerBanner';
import {HomeRecipes} from '~/components/blocks/HomeRecipes';
import {HomeDiscountPopup} from '~/components/HomeDiscountPopup';
import {HomeNewsletter} from '~/components/blocks/HomeNewsletter';
import {
  HomeInstagram,
  type InstagramPost,
} from '~/components/blocks/HomeInstagram';
import {
  HomeMobileActions,
  HomeMobileExperience,
} from '~/components/blocks/HomeMobileExperience';

export const meta: Route.MetaFunction = () => [{title: 'Sumeet Cookware'}];

export function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const allReviews = loadJudgeMeReviews(
    args.context.env,
    args.context.waitUntil,
  );

  return {
    ...deferredData,
    productRatings: allReviews.then(getProductRatings),
    reviews: allReviews,
    instagramPosts: loadInstagramPosts(args.context.env),
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {
      cache: context.storefront.CacheShort(),
    })
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {recommendedProducts};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="home">
      <HomeHero />
      <HomeMobileExperience />
      <HomeServiceBenefits />
      <Suspense fallback={null}>
        <HomeCategoryStrip />
      </Suspense>
      <HomeProductSections
        productRatings={data.productRatings}
        products={data.recommendedProducts}
      />
      <HomeOfferBanner />
      <HomeWhyChoose />
      <HomeMobileActions />
      <HomeBusinessBuyers />
      <HomeGifting />
      <HomeEssentials />
      <Suspense fallback={null}>
        <Await resolve={data.instagramPosts} errorElement={null}>
          {(posts) => <HomeInstagram posts={posts} />}
        </Await>
      </Suspense>
      <Suspense fallback={null}>
        <Await resolve={data.reviews} errorElement={null}>
          {(reviews) => <HomeReviews reviews={reviews} />}
        </Await>
      </Suspense>
      <HomeCustomerBanner />
      <HomeRecipes />
      <HomeNewsletter />
      <HomeDiscountPopup />
    </div>
  );
}

type InstafeedMedia = {
  caption?: {text?: string};
  id?: string;
  type?: 'image' | 'video';
  link?: string;
  alt_text?: string;
  images?: {standard_resolution?: {url?: string}};
  videos?: {standard_resolution?: {url?: string}};
};

async function loadInstagramPosts(env: Env): Promise<InstagramPost[]> {
  const apiKey = env.INSTAFEED_API_KEY;
  const account = env.PUBLIC_STORE_DOMAIN;

  if (!account || !apiKey) return [];

  const cacheKey = `instafeed-${account}-v1`;
  const cachedPosts = await readHomepageCache<InstagramPost[]>(cacheKey);
  if (cachedPosts) return cachedPosts;

  const url = new URL('https://instafeed.nfcube.com/feed/v6');
  url.searchParams.set('account', account);
  url.searchParams.set('limit', '10');
  url.searchParams.set('fu', '0');
  url.searchParams.set('fid', '0');

  try {
    const response = await fetch(url, {
      headers: {'X-API-Key': apiKey},
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error('Instafeed request failed', response.status);
      return [];
    }

    const data = (await response.json()) as {
      meta?: {code?: number};
      data?: InstafeedMedia[];
    };
    // Instafeed can report loading/error states in its JSON envelope with HTTP 200.
    // Don't cache those states as an empty feed for the next 15 minutes.
    if (data.meta?.code !== 200 || !Array.isArray(data.data)) {
      console.warn('Instafeed not ready', data.meta?.code);
      return [];
    }

    const posts = data.data.flatMap((post): InstagramPost[] => {
      const image = post.images?.standard_resolution?.url;
      const video = post.videos?.standard_resolution?.url;
      if (
        typeof post.id !== 'string' ||
        typeof image !== 'string' ||
        !isInstagramMediaUrl(image) ||
        typeof post.link !== 'string' ||
        !isInstagramPermalink(post.link)
      )
        return [];

      const isVideo = post.type === 'video';
      return [
        {
          altText:
            typeof post.alt_text === 'string'
              ? post.alt_text.trim()
              : undefined,
          caption:
            typeof post.caption?.text === 'string'
              ? post.caption.text.trim()
              : undefined,
          id: post.id,
          mediaType: isVideo ? 'VIDEO' : 'IMAGE',
          mediaUrl:
            isVideo && typeof video === 'string' && isInstagramMediaUrl(video)
              ? video
              : image,
          permalink: post.link,
          thumbnailUrl: image,
        },
      ];
    });
    if (posts.length) await writeHomepageCache(cacheKey, posts);
    return posts;
  } catch (error) {
    console.error(
      'Instafeed request failed',
      error instanceof Error ? error.name : 'Unknown error',
    );
    return [];
  }
}

function isInstagramMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      ['cdninstagram.com', 'fbcdn.net', 'nfcube.com'].some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}

function isInstagramPermalink(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'instagram.com' || url.hostname === 'www.instagram.com')
    );
  } catch {
    return false;
  }
}

type JudgeMeApiReview = {
  body?: string;
  curated?: string;
  hidden?: boolean;
  id?: number;
  published?: boolean;
  product?: {
    external_id?: number | string;
    handle?: string;
    id?: number | string;
  };
  product_external_id?: number | string;
  product_handle?: string;
  product_id?: number | string;
  rating?: number;
  reviewer?: {name?: string};
};

async function loadJudgeMeReviews(
  env: Env,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<HomeReview[]> {
  const token = env.JUDGE_ME_PRIVATE_API_TOKEN;
  const shopDomain = env.PUBLIC_STORE_DOMAIN;

  if (!token || !shopDomain) return [];

  const cacheKey = `reviews-${shopDomain}-v1`;
  const cachedReviews = await readHomepageCache<HomeReview[]>(cacheKey);
  if (cachedReviews) return cachedReviews;

  try {
    const perPage = 100;
    const firstPage = await loadJudgeMeReviewPage({
      page: 1,
      perPage,
      shopDomain,
      token,
    });
    const initialReviews = normalizeJudgeMeReviews(firstPage);
    await writeHomepageCache(cacheKey, initialReviews);

    if (firstPage.length === perPage) {
      const refresh = loadRemainingJudgeMeReviews({
        cacheKey,
        firstPage,
        perPage,
        shopDomain,
        token,
      }).catch((error) => {
        console.error('Judge.me background refresh failed', error);
      });
      if (waitUntil) waitUntil(refresh);
    }

    return initialReviews;
  } catch (error) {
    console.error('Judge.me reviews request failed', error);
    return [];
  }
}

async function loadRemainingJudgeMeReviews({
  cacheKey,
  firstPage,
  perPage,
  shopDomain,
  token,
}: {
  cacheKey: string;
  firstPage: JudgeMeApiReview[];
  perPage: number;
  shopDomain: string;
  token: string;
}) {
  const reviews = [...firstPage];

  for (let page = 2; page <= 20; page += 1) {
    const pageReviews = await loadJudgeMeReviewPage({
      page,
      perPage,
      shopDomain,
      token,
    });
    reviews.push(...pageReviews);
    if (pageReviews.length < perPage) break;
  }

  await writeHomepageCache(cacheKey, normalizeJudgeMeReviews(reviews));
}

function normalizeJudgeMeReviews(reviews: JudgeMeApiReview[]) {
  return reviews
    .filter(
      (review) =>
        review.curated === 'ok' &&
        review.published === true &&
        review.hidden !== true &&
        typeof review.id === 'number' &&
        typeof review.body === 'string' &&
        typeof review.rating === 'number',
    )
    .map((review) => ({
      body: review.body?.trim() ?? '',
      id: review.id ?? 0,
      name: review.reviewer?.name?.trim() || 'Verified customer',
      productHandle:
        review.product_handle?.trim() ?? review.product?.handle?.trim(),
      productExternalId:
        review.product_external_id?.toString() ??
        review.product_id?.toString() ??
        review.product?.external_id?.toString() ??
        review.product?.id?.toString(),
      rating: Math.min(5, Math.max(1, Math.round(review.rating ?? 1))),
    }));
}

async function loadJudgeMeReviewPage({
  page,
  perPage,
  shopDomain,
  token,
}: {
  page: number;
  perPage: number;
  shopDomain: string;
  token: string;
}) {
  const url = new URL('https://api.judge.me/api/v1/reviews');
  url.searchParams.set('api_token', token);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('shop_domain', shopDomain);

  const response = await fetch(url, {signal: AbortSignal.timeout(3500)});
  if (!response.ok) {
    throw new Error(`Judge.me reviews request failed: ${response.status}`);
  }

  const data = (await response.json()) as {reviews?: JudgeMeApiReview[]};
  return data.reviews ?? [];
}

async function readHomepageCache<T>(key: string): Promise<T | null> {
  try {
    const cache = await caches.open('hydrogen');
    const response = await cache.match(`https://homepage-cache.local/${key}`);
    return response ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

async function writeHomepageCache(key: string, value: unknown) {
  try {
    const cache = await caches.open('hydrogen');
    await cache.put(
      `https://homepage-cache.local/${key}`,
      new Response(JSON.stringify(value), {
        headers: {
          'Cache-Control': 'public, max-age=900',
          'Content-Type': 'application/json',
        },
      }),
    );
  } catch {
    // Data still renders normally when the runtime cache is unavailable.
  }
}

function getProductRatings(reviews: HomeReview[]) {
  return reviews.reduce<Record<string, {average: number; count: number}>>(
    (ratings, review) => {
      const productId = review.productHandle ?? review.productExternalId;
      if (!productId) return ratings;

      const current = ratings[productId];
      const count = (current?.count ?? 0) + 1;
      ratings[productId] = {
        average:
          ((current?.average ?? 0) * (count - 1) + review.rating) / count,
        count,
      };
      return ratings;
    },
    {},
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedVariant on ProductVariant {
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
  fragment RecommendedProduct on Product {
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
      ...RecommendedVariant
    }
    variants(first: 50) {
      nodes {
        ...RecommendedVariant
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
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 24, sortKey: BEST_SELLING) {
      nodes {
        ...RecommendedProduct
      }
    }
    collections(first: 12) {
      nodes {
        id
        title
        handle
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;
