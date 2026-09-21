import {Link} from 'react-router';

const OFFER_BANNERS = [
  {
    alt: 'Flat 5% off on any order with code FESTIVE5',
    height: 880,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Offer_Banner_3.jpg?v=1789729968',
    width: 560,
  },
  {
    alt: '10% off on a minimum purchase of Rs 5,000',
    height: 440,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Offer_Banner_4.jpg?v=1789729969',
    width: 880,
  },
  {
    alt: 'Grab deal on any order with code FESTIVE5',
    height: 880,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Offer_Banner_2.jpg?v=1789729968',
    width: 560,
  },
] as const;

export function HomeOfferBanner() {
  return (
    <section
      className="home-offer"
      id="current-offers"
      aria-label="Current offers"
    >
      {OFFER_BANNERS.map((banner) => (
        <Link
          aria-label={`${banner.alt}. Shop now`}
          className="home-offer-banner"
          key={banner.src}
          prefetch="intent"
          to="/collections"
        >
          <img
            alt={banner.alt}
            decoding="async"
            height={banner.height}
            loading="lazy"
            src={banner.src}
            width={banner.width}
          />
        </Link>
      ))}
    </section>
  );
}
