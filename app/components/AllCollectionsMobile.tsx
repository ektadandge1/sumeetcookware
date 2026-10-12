import {Link} from 'react-router';
import type {ProductRatingMap} from '~/lib/judgeme.server';
import {
  MobileProductCard,
  type MobileCollectionProduct,
} from './CollectionMobileCatalog';

type MobileCollection = {
  handle: string;
  title: string;
  products: {nodes: MobileCollectionProduct[]};
};

export function AllCollectionsMobile({
  collections,
  ratings,
}: {
  collections: MobileCollection[];
  ratings: ProductRatingMap;
}) {
  const visibleCollections = collections.filter(
    (collection) => collection.products.nodes.length,
  );

  return (
    <div className="all-collections-mobile">
      <h1>Products</h1>
      {visibleCollections.map((collection) => (
        <section className="all-collections-mobile-section" key={collection.handle}>
          <header>
            <h2>{collection.title}</h2>
            <Link to={`/collections/${collection.handle}`}>View all</Link>
          </header>
          <div className="all-collections-mobile-row">
            {collection.products.nodes.slice(0, 4).map((product) => (
              <MobileProductCard
                key={product.id}
                product={product}
                rating={ratings[product.handle]}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
