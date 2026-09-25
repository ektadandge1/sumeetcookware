import {Link} from 'react-router';

const OFFER_BANNERS = [
  {
    alt: 'Flat 5% off on any order with code FESTIVE5',
    height: 880,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Offer_Banner_3.jpg?v=1789729968',
    to: '/collections/summer-sale',
    width: 560,
  },
  {
    alt: '10% off on a minimum purchase of Rs 5,000',
    height: 440,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Offer_Banner_4.jpg?v=1789729969',
    to: '/collections/best-offer',
    width: 880,
  },
  {
    alt: 'Grab deal on any order with code FESTIVE5',
    height: 880,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Offer_Banner_2.jpg?v=1789729968',
    to: '/collections/summer-sale',
    width: 560,
  },
] as const;

const MOBILE_OFFER_BANNERS = [
  {
    alt: 'Flat 5% off on any order with code FESTIVE5',
    height: 484,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/offer_Banner_01.png?v=1790234455',
    to: '/collections/summer-sale',
    width: 317,
  },
  {
    alt: 'Flat 7% off on orders of Rs 3,000',
    height: 222,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/offer_Banner_04.png?v=1790234454',
    to: '/collections/best-offer',
    width: 317,
  },
  {
    alt: '10% off on a minimum purchase of Rs 5,000',
    height: 222,
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/offer_Banner_03.png?v=1790234454',
    to: '/collections/best-offer',
    width: 317,
  },
] as const;

export function HomeOfferBanner() {
  return (
    <section
      className="home-offer"
      id="current-offers"
      aria-label="Current offers"
    >
      <h2 className="home-mobile-section-title">Grab Deals</h2>
      <div className="home-offer-desktop">
        {OFFER_BANNERS.map((banner) => (
          <Link
            aria-label={`${banner.alt}. Shop now`}
            className="home-offer-banner"
            key={banner.src}
            prefetch="intent"
            to={banner.to}
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
      </div>
      <div className="home-offer-mobile">
        {MOBILE_OFFER_BANNERS.map((banner) => (
          <Link
            aria-label={`${banner.alt}. Shop now`}
            className="home-offer-banner"
            key={banner.src}
            prefetch="intent"
            to={banner.to}
          >
            <img
              alt={banner.alt}
              decoding="async"
              height={banner.height}
              loading="eager"
              src={banner.src}
              width={banner.width}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
