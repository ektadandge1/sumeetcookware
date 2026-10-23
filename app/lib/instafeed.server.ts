import type {InstagramPost} from '~/components/blocks/HomeInstagram';

type InstafeedMedia = {
  caption?: {text?: string};
  id?: string;
  type?: 'image' | 'video';
  link?: string;
  alt_text?: string;
  images?: {standard_resolution?: {url?: string}};
  videos?: {standard_resolution?: {url?: string}};
};

export async function loadInstagramPosts(
  env: Env,
  handle?: string,
): Promise<InstagramPost[]> {
  if (!env.PUBLIC_STORE_DOMAIN || !env.INSTAFEED_API_KEY) return [];

  if (handle) {
    const posts = await loadFeed(env, handle);
    if (posts.length) return posts;
  }
  return loadFeed(env);
}

async function loadFeed(env: Env, handle?: string): Promise<InstagramPost[]> {
  const cacheKey = new URL('https://instafeed-cache.local/feed-v1');
  cacheKey.searchParams.set('account', env.PUBLIC_STORE_DOMAIN);
  if (handle) cacheKey.searchParams.set('handle', handle);

  try {
    const cache = await caches.open('hydrogen');
    const cached = await cache.match(cacheKey.toString());
    if (cached) return (await cached.json()) as InstagramPost[];
  } catch {
    // The feed can still render when the runtime cache is unavailable.
  }

  const url = new URL('https://instafeed.nfcube.com/feed/v6');
  url.searchParams.set('account', env.PUBLIC_STORE_DOMAIN);
  url.searchParams.set('limit', '10');
  url.searchParams.set('fu', '0');
  url.searchParams.set('fid', '0');
  if (handle) url.searchParams.set('handle', handle);

  try {
    const response = await fetch(url, {
      headers: {'X-API-Key': env.INSTAFEED_API_KEY!},
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
    // Loading and empty product feeds must not hide the main feed for 15 minutes.
    if (data.meta?.code !== 200 || !Array.isArray(data.data)) return [];

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
          mediaType: post.type === 'video' ? 'VIDEO' : 'IMAGE',
          mediaUrl:
            post.type === 'video' &&
            typeof video === 'string' &&
            isInstagramMediaUrl(video)
              ? video
              : image,
          permalink: post.link,
          thumbnailUrl: image,
        },
      ];
    });

    if (posts.length) {
      try {
        const cache = await caches.open('hydrogen');
        await cache.put(
          cacheKey.toString(),
          new Response(JSON.stringify(posts), {
            headers: {
              'Cache-Control': 'public, max-age=900',
              'Content-Type': 'application/json',
            },
          }),
        );
      } catch {
        // Don't drop a valid feed if the cache write fails.
      }
    }
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
