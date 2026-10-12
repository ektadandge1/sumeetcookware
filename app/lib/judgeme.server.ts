export type ProductReview = {
  body: string;
  createdAt?: string;
  id: number;
  name: string;
  rating: number;
};

export type ProductRatingMap = Record<
  string,
  {average: number; count: number}
>;

type JudgeMeApiReview = {
  body?: string;
  created_at?: string;
  curated?: string;
  hidden?: boolean;
  id?: number;
  product?: {
    external_id?: number | string;
    handle?: string;
    id?: number | string;
  };
  product_external_id?: number | string;
  product_handle?: string;
  product_id?: number | string;
  published?: boolean;
  rating?: number;
  reviewer?: {name?: string};
};

export async function loadProductReviews(
  env: Env,
  productHandle: string,
  productExternalId: string,
): Promise<ProductReview[]> {
  const token = env.JUDGE_ME_PRIVATE_API_TOKEN;
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  if (!token || !shopDomain) return [];

  const cacheKey = `https://product-reviews.local/${shopDomain}/${productHandle}`;
  const cached = await readCache<ProductReview[]>(cacheKey);
  if (cached) return cached;

  try {
    const matchingReviews: JudgeMeApiReview[] = [];
    const perPage = 100;

    for (let page = 1; page <= 20; page += 1) {
      const reviews = await loadReviewPage({
        page,
        perPage,
        shopDomain,
        token,
      });
      matchingReviews.push(
        ...reviews.filter((review) =>
          belongsToProduct(review, productHandle, productExternalId),
        ),
      );
      if (reviews.length < perPage) break;
    }

    const normalized = matchingReviews
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
        createdAt: review.created_at,
        id: review.id ?? 0,
        name: review.reviewer?.name?.trim() || 'Verified customer',
        rating: Math.min(5, Math.max(1, Math.round(review.rating ?? 1))),
      }));

    await writeCache(cacheKey, normalized);
    return normalized;
  } catch (error) {
    console.error('Judge.me product reviews request failed', error);
    return [];
  }
}

export async function loadProductRatingMap(env: Env): Promise<ProductRatingMap> {
  const token = env.JUDGE_ME_PRIVATE_API_TOKEN;
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  if (!token || !shopDomain) return {};

  const cacheKey = `https://product-reviews.local/${shopDomain}/ratings`;
  const cached = await readCache<ProductRatingMap>(cacheKey);
  if (cached) return cached;

  try {
    const ratings: ProductRatingMap = {};
    const perPage = 100;
    for (let page = 1; page <= 20; page += 1) {
      const reviews = await loadReviewPage({
        page,
        perPage,
        shopDomain,
        token,
      });
      for (const review of reviews) {
        if (
          review.curated !== 'ok' ||
          review.published !== true ||
          review.hidden === true ||
          typeof review.rating !== 'number'
        ) {
          continue;
        }
        const keys = [
          review.product_handle,
          review.product?.handle,
          review.product_external_id?.toString(),
          review.product?.external_id?.toString(),
        ].filter((key): key is string => Boolean(key));
        for (const key of new Set(keys)) {
          const current = ratings[key];
          const count = (current?.count ?? 0) + 1;
          ratings[key] = {
            average:
              ((current?.average ?? 0) * (count - 1) + review.rating) / count,
            count,
          };
        }
      }
      if (reviews.length < perPage) break;
    }
    await writeCache(cacheKey, ratings);
    return ratings;
  } catch (error) {
    console.error('Judge.me rating request failed', error);
    return {};
  }
}

export async function submitProductReview({
  body,
  email,
  env,
  name,
  productExternalId,
  rating,
  title,
}: {
  body: string;
  email: string;
  env: Env;
  name: string;
  productExternalId: number;
  rating: number;
  title?: string;
}) {
  const shopDomain = env.PUBLIC_STORE_DOMAIN;
  if (!shopDomain) throw new Error('Store domain is not configured');

  const response = await fetch('https://api.judge.me/api/v1/reviews', {
    body: JSON.stringify({
      body,
      email,
      id: productExternalId,
      name,
      platform: 'shopify',
      rating,
      shop_domain: shopDomain,
      title,
    }),
    headers: {'Content-Type': 'application/json'},
    method: 'POST',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Judge.me review submission failed: ${response.status}`);
  }
}

function belongsToProduct(
  review: JudgeMeApiReview,
  handle: string,
  externalId: string,
) {
  const reviewHandle = review.product_handle ?? review.product?.handle;
  const reviewExternalId =
    review.product_external_id ??
    review.product_id ??
    review.product?.external_id ??
    review.product?.id;

  return (
    reviewHandle === handle || reviewExternalId?.toString() === externalId
  );
}

async function loadReviewPage({
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
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('shop_domain', shopDomain);

  const response = await fetch(url, {
    headers: {'X-Api-Token': token},
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Judge.me reviews request failed: ${response.status}`);
  }

  const data = (await response.json()) as {reviews?: JudgeMeApiReview[]};
  return data.reviews ?? [];
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const cache = await caches.open('hydrogen');
    const response = await cache.match(key);
    return response ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: unknown) {
  try {
    const cache = await caches.open('hydrogen');
    await cache.put(
      key,
      new Response(JSON.stringify(value), {
        headers: {
          'Cache-Control': 'public, max-age=900',
          'Content-Type': 'application/json',
        },
      }),
    );
  } catch {
    // Reviews still render when the runtime cache is unavailable.
  }
}
