import {Link, useLoaderData} from 'react-router';
import {Image, getPaginationVariables} from '@shopify/hydrogen';
import type {Route} from './+types/blogs.$blogHandle._index';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import journalStyles from '~/styles/journal.css?url';

export function links() {
  return [{rel: 'stylesheet', href: journalStyles}];
}

export const meta: Route.MetaFunction = ({data}) => [
  {
    title: `${data?.blog.seo?.title || data?.blog.title || 'Blog'} | Sumeet Cookware`,
  },
  ...(data?.blog.seo?.description
    ? [{name: 'description', content: data.blog.seo.description}]
    : []),
];

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {blog} = await context.storefront.query(JOURNAL_QUERY, {
    variables: {
      blogHandle: params.blogHandle,
      language: context.storefront.i18n.language,
      ...getPaginationVariables(request, {pageBy: 9}),
    },
    cache: context.storefront.CacheShort(),
  });

  if (!blog) throw new Response('Blog not found', {status: 404});
  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});
  return {blog};
}

export default function Blog() {
  const {blog} = useLoaderData<typeof loader>();

  return (
    <div className="journal-page">
      <div className="journal-container">
        <nav className="journal-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{blog.title}</span>
        </nav>
        <header className="journal-heading">
          <p className="journal-eyebrow">THE SUMEET JOURNAL</p>
          <h1>{blog.title}</h1>
          {blog.seo?.description && <p>{blog.seo.description}</p>}
        </header>

        {blog.articles.nodes.length ? (
          <PaginatedResourceSection
            connection={blog.articles}
            resourcesClassName="journal-grid"
            ariaLabel="Blog articles"
          >
            {({node: article, index}) => {
              const url = `/blogs/${blog.handle}/${article.handle}`;
              const featured = index === 0;
              return (
                <article
                  key={article.id}
                  className={`journal-card${featured ? ' journal-card-featured' : ''}`}
                >
                  {article.image && (
                    <Link
                      to={url}
                      className="journal-card-image"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <Image
                        data={article.image}
                        alt={article.image.altText || article.title}
                        sizes={
                          featured
                            ? '(min-width: 1024px) 60vw, 100vw'
                            : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
                        }
                        loading={featured ? 'eager' : 'lazy'}
                      />
                    </Link>
                  )}
                  <div className="journal-card-copy">
                    <p className="journal-card-meta">
                      {featured && (
                        <span className="journal-feature-label">
                          Latest story
                        </span>
                      )}
                      <time dateTime={article.publishedAt}>
                        {new Date(article.publishedAt).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'UTC',
                          },
                        )}
                      </time>
                    </p>
                    <h2>
                      <Link to={url}>{article.title}</Link>
                    </h2>
                    {(article.excerpt || article.content) && (
                      <p className="journal-excerpt">
                        {article.excerpt || article.content}
                      </p>
                    )}
                    <Link
                      className="journal-read-more"
                      to={url}
                      aria-label={`Read ${article.title}`}
                    >
                      Read story <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              );
            }}
          </PaginatedResourceSection>
        ) : (
          <div className="journal-empty">
            <h2>No stories published yet</h2>
            <p>Check back soon for the latest from Sumeet.</p>
            <Link className="journal-read-more" to="/collections/all">
              Explore cookware <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const JOURNAL_QUERY = `#graphql
  query Journal(
    $blogHandle: String!
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      handle
      title
      seo { title description }
      articles(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        sortKey: PUBLISHED_AT
        reverse: true
      ) {
        nodes {
          id
          handle
          title
          excerpt(truncateAt: 220)
          content(truncateAt: 220)
          publishedAt
          image { id altText url width height }
        }
        pageInfo { hasPreviousPage hasNextPage startCursor endCursor }
      }
    }
  }
` as const;
