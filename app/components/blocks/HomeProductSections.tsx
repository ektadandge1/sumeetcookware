import {Await} from 'react-router';
import {Suspense, useEffect, useState} from 'react';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {HomeProductBand} from './HomeProductBand';

export function HomeProductSections({
  products,
  productRatings,
}: {
  products: Promise<RecommendedProductsQuery | null>;
  productRatings: Promise<Record<string, {average: number; count: number}>>;
}) {
  const [ratings, setRatings] = useState<
    Record<string, {average: number; count: number}>
  >({});

  useEffect(() => {
    let active = true;
    // Ratings must not hold back product cards or their navigation links.
    setRatings({});
    void productRatings.then(
      (result) => {
        if (active) setRatings(result);
      },
      () => {
        if (active) setRatings({});
      },
    );
    return () => {
      active = false;
    };
  }, [productRatings]);

  return (
    <Suspense
      fallback={
        <section className="home-section home-loading">
          Loading products…
        </section>
      }
    >
      <Await
        resolve={products}
        errorElement={null}
      >
        {(response) => (
          <HomeProductBand
            collectionUrl="/collections/all"
            heading="Best Seller"
            isBestSeller
            products={response?.products.nodes ?? []}
            productRatings={ratings}
          />
        )}
      </Await>
    </Suspense>
  );
}
