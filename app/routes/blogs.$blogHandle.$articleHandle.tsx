import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle.$articleHandle';
import {Image} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import journalStyles from '~/styles/journal.css?url';

export function links() {
  return [{rel: 'stylesheet', href: journalStyles}];
}

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {
      title: `${data?.article.seo?.title || data?.article.title || 'Article'} | Sumeet Cookware`,
    },
    ...(data?.article.seo?.description
      ? [{name: 'description', content: data.article.seo.description}]
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
async function loadCriticalData({context, request, params}: Route.LoaderArgs) {
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const article = blog.articleByHandle;

  return {article, blog: {handle: blog.handle, title: blog.title}};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Article() {
  const {article, blog} = useLoaderData<typeof loader>();
  const {title, image, contentHtml, author} = article;

  const publishedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(article.publishedAt));

  return (
    <div className="journal-article-page">
      <article className="journal-container">
        <nav className="journal-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/blogs/${blog.handle}`}>{blog.title}</Link>
        </nav>
        <header className="journal-article-header">
          <p className="journal-eyebrow">THE SUMEET JOURNAL</p>
          <h1>{title}</h1>
          <div className="journal-article-meta">
            <time dateTime={article.publishedAt}>{publishedDate}</time>
            {author?.name && <span>By {author.name}</span>}
          </div>
        </header>
        {image && (
          <Image
            className="journal-article-image"
            data={image}
            alt={image.altText || title}
            sizes="(min-width: 1240px) 1240px, 100vw"
            loading="eager"
          />
        )}
        <div
          dangerouslySetInnerHTML={{__html: contentHtml}}
          className="journal-article-body"
        />
        <footer className="journal-article-back">
          <Link className="journal-read-more" to={`/blogs/${blog.handle}`}>
            ← Back to {blog.title}
          </Link>
        </footer>
      </article>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      title
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
    }
  }
` as const;
