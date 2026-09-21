import {Await} from 'react-router';
import {Suspense} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {HomeProductBand} from './HomeProductBand';

export function HomeProductSections({products}: {products: Promise<RecommendedProductsQuery | null>}) {
  return (
    <Suspense fallback={<section className="home-section home-loading">Loading products…</section>}>
      <Await resolve={products}>
        {(response) => (
          <HomeProductBand
            collectionUrl="/collections/best-selling"
            heading="Best Seller"
            isBestSeller
            products={response?.products.nodes ?? []}
          />
        )}
      </Await>
    </Suspense>
  );
}
