import {Link} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {SectionHeading} from './SectionHeading';

export function HomeCategoryStrip({
  collections,
}: {
  collections: RecommendedProductsQuery['collections']['nodes'];
}) {
  if (!collections.length) return null;

  return (
    <section
      className="home-section home-category-section"
      aria-labelledby="categories-title"
    >
      <SectionHeading id="categories-title" title="Shop Collections" />
      <div className="home-category-grid">
        {collections.map((collection) => (
          <Link
            className="home-category-card"
            key={collection.id}
            prefetch="intent"
            to={`/collections/${collection.handle}`}
          >
            {collection.image ? (
              <div className="home-category-image">
                <img
                  alt={collection.image.altText || collection.title}
                  src={collection.image.url}
                  width={collection.image.width ?? undefined}
                  height={collection.image.height ?? undefined}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : null}
            <span>{collection.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
