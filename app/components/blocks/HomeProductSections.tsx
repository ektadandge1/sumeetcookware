import {Await} from 'react-router';
import {Suspense} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {HomeProductBand} from './HomeProductBand';

export function HomeProductSections({
  products,
  productRatings,
}: {
  products: Promise<RecommendedProductsQuery | null>;
  productRatings: Promise<
    Record<string, {average: number; count: number}>
  >;
}) {
  return (
    <Suspense
      fallback={
        <section className="home-section home-loading">
          Loading products…
        </section>
      }
    >
      <Await resolve={Promise.all([products, productRatings])}>
        {([response, ratings]) => (
          <HomeProductBand
            collectionUrl="/collections/best-deal-of-the-day"
            heading="Best Seller"
            isBestSeller
            products={response?.collection?.products.nodes ?? []}
            productRatings={ratings}
          />
        )}
      </Await>
    </Suspense>
  );
}
