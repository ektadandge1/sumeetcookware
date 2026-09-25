import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {MockShopNotice} from '~/components/MockShopNotice';
import {HomeHero} from '~/components/blocks/HomeHero';
import {HomeServiceBenefits} from '~/components/blocks/HomeServiceBenefits';
import {HomeCategoryStrip} from '~/components/blocks/HomeCategoryStrip';
import {HomeProductSections} from '~/components/blocks/HomeProductSections';
import {HomeOfferBanner} from '~/components/blocks/HomeOfferBanner';
import {HomeWhyChoose} from '~/components/blocks/HomeWhyChoose';
import {HomeBusinessBuyers} from '~/components/blocks/HomeBusinessBuyers';
import {HomeGifting} from '~/components/blocks/HomeGifting';
import {HomeEssentials} from '~/components/blocks/HomeEssentials';
import {HomeCustomerStories} from '~/components/blocks/HomeCustomerStories';
import {HomeReviews} from '~/components/blocks/HomeReviews';
import type {HomeReview} from '~/components/blocks/HomeReviews';
import {HomeCustomerBanner} from '~/components/blocks/HomeCustomerBanner';
import {HomeRecipes} from '~/components/blocks/HomeRecipes';
import {HomeDiscountPopup} from '~/components/HomeDiscountPopup';
import {
  HomeInstagram,
  type InstagramPost,
} from '~/components/blocks/HomeInstagram';
import {
  HomeMobileActions,
  HomeMobileExperience,
} from '~/components/blocks/HomeMobileExperience';

export const meta: Route.MetaFunction = () => [{title: 'Sumeet Cookware'}];

export async function loader(args: Route.LoaderArgs) {
  const allReviews = await loadJudgeMeReviews(args.context.env);
  const instagramPosts = await loadInstagramPosts(args.context.env);

  return {
    ...loadDeferredData(args),
    isShopLinked: Boolean(args.context.env.PUBLIC_STORE_DOMAIN),
    productRatings: getProductRatings(allReviews),
    reviews: allReviews.slice(0, 9),
    instagramPosts,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
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
      {data.isShopLinked ? null : <MockShopNotice />}
      <HomeHero />
      <HomeMobileExperience />
      <HomeServiceBenefits />
      <HomeCategoryStrip />
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
      <HomeCustomerStories />
      <HomeReviews reviews={data.reviews} />
      <HomeCustomerBanner />
      <HomeRecipes />
      <HomeInstagram posts={data.instagramPosts} />
      <HomeDiscountPopup />
    </div>
  );
}

type InstagramApiMedia = {
  caption?: string;
  id?: string;
  media_type?: 'CAROUSEL_ALBUM' | 'IMAGE' | 'VIDEO';
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
};

async function loadInstagramPosts(env: Env): Promise<InstagramPost[]> {
  const accountId = env.INSTAGRAM_ACCOUNT_ID;
  const accessToken = env.INSTAGRAM_ACCESS_TOKEN;

  if (!accountId || !accessToken) return [];

  const url = new URL(`https://graph.facebook.com/v22.0/${accountId}/media`);
  url.searchParams.set(
    'fields',
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
  );
  url.searchParams.set('limit', '8');
  url.searchParams.set('access_token', accessToken);

  try {
    const response = await fetch(url, {signal: AbortSignal.timeout(4000)});
    if (!response.ok) {
      console.error('Instagram Graph API request failed', response.status);
      return [];
    }

    const data = (await response.json()) as {data?: InstagramApiMedia[]};
    return (data.data ?? [])
      .filter(
        (post) =>
          typeof post.id === 'string' &&
          typeof post.permalink === 'string' &&
          (typeof post.media_url === 'string' ||
            typeof post.thumbnail_url === 'string'),
      )
      .map((post) => ({
        caption: post.caption?.trim(),
        id: post.id as string,
        mediaType: post.media_type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        mediaUrl: (post.media_url || post.thumbnail_url) as string,
        permalink: post.permalink as string,
        thumbnailUrl: post.thumbnail_url,
      }));
  } catch (error) {
    console.error('Instagram Graph API request failed', error);
    return [];
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

async function loadJudgeMeReviews(env: Env): Promise<HomeReview[]> {
  const token = env.JUDGE_ME_PRIVATE_API_TOKEN;
  const shopDomain = env.PUBLIC_STORE_DOMAIN;

  if (!token || !shopDomain) return [];

  const url = new URL('https://api.judge.me/api/v1/reviews');
  url.searchParams.set('api_token', token);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('shop_domain', shopDomain);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.error('Judge.me reviews request failed', response.status);
      return [];
    }

    const data = (await response.json()) as {reviews?: JudgeMeApiReview[]};

    return (data.reviews ?? [])
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
  } catch (error) {
    console.error('Judge.me reviews request failed', error);
    return [];
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
  fragment RecommendedProduct on Product {
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
      availableForSale
      id
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
      title
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
    products(first: 12, sortKey: BEST_SELLING) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
