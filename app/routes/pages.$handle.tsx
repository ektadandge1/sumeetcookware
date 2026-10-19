import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/pages.$handle';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Hydrogen | ${data?.page.title ?? ''}`}];
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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Error('Missing page handle');
  }

  if (params.handle === 'contact-us') {
    throw redirect('/contact-us');
  }

  const [{page}] = await Promise.all([
    context.storefront.query(PAGE_QUERY, {
      variables: {
        handle: params.handle,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!page) {
    if (params.handle === 'about-us') {
      return {
        page: {
          body: '',
          handle: 'about-us',
          id: 'local-about-us',
          seo: null,
          title: 'About Us',
        },
      };
    }
    throw new Response('Not Found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.handle, data: page});

  return {
    page,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Page() {
  const {page} = useLoaderData<typeof loader>();

  if (page.handle === 'about-us') {
    const image = page.body.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    const aboutText = `SUMEET COOKWARE has come long way. During all this year we have worked very hard to fulfill your needs with of best quality and performance of products. We have wide range of products like HARD ANODISED COOKWARE, NONSTICK COOKWARE, and HARD ANODISED PRESSURE COOKER, ALUMINIUM PRESSURE COOKER (White) which are manufactured considering needs and requirements of consumers.
Our mind is always conscious about changing needs and difficulties of consumer. We are committed to provide best quality at reasonable price. That's why our products are great saver of money, time and power. We strictly believe in quality, our product go through various types of quality check. We are equipped with latest technology and intelligent brains to produce superior quality products.`;

    return (
      <div className="about-us-page">
        <section className="about-us-intro">
          <h1>About Us</h1>
          <div className="about-us-rule" />
          <div className="about-us-intro-grid">
            {image ? (
              <img src={image} alt="Sumeet Cookware products" />
            ) : (
              <div className="about-us-image-placeholder" />
            )}
            <p>{aboutText}</p>
          </div>
        </section>
        <section className="about-us-values">
          <div>
            <h2>Our Strength</h2>
            <p>{aboutText}</p>
          </div>
          <div className="about-us-divider" />
          <div>
            <h2>Our Management</h2>
            <p>{aboutText}</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header>
        <h1>{page.title}</h1>
      </header>
      <main dangerouslySetInnerHTML={{__html: page.body}} />
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query Page(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      handle
      id
      title
      body
      seo {
        description
        title
      }
    }
  }
` as const;
