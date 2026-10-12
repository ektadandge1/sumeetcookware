import type {Route} from './+types/[shopify-captcha.js]';

export async function loader({context}: Route.LoaderArgs) {
  const storeDomain =
    context.env.PUBLIC_STORE_DOMAIN || 'sumeetcookware.myshopify.com';
  let response: Response;

  try {
    response = await fetch(
      `https://${storeDomain.replace(/^https?:\/\//, '')}/pages/contact-us`,
      {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; SumeetCookwareStorefront/1.0)',
        },
      },
    );
  } catch (error) {
    console.warn('Shopify captcha unavailable; serving an empty local script.', error);
    return new Response('', {
      headers: {'Content-Type': 'text/javascript; charset=utf-8'},
    });
  }

  if (!response.ok) {
    throw new Response(
      `Unable to load Shopify form protection (${response.status})`,
      {status: 502},
    );
  }

  const html = await response.text();
  const bootstrap = html.match(
    /<script id="captcha-bootstrap">([\s\S]*?)<\/script>/,
  )?.[1];

  if (!bootstrap) {
    throw new Response('Shopify form protection was unavailable', {
      status: 502,
    });
  }

  return new Response(bootstrap, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Type': 'text/javascript; charset=utf-8',
    },
  });
}
