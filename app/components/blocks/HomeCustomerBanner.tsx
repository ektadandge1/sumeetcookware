import {Link} from 'react-router';

const CUSTOMER_BANNER_URL =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Middle_Happ_Customer_banner.jpg?v=1789986357';
const MOBILE_CUSTOMER_BANNER_URL =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Happy_Customers_Banner_1.jpg?v=1790245016';

export function HomeCustomerBanner() {
  return (
    <section
      className="home-customer-banner"
      aria-label="Sumeet customer highlights"
    >
      <Link aria-label="Shop all Sumeet cookware" to="/collections/all">
        <picture>
          <source
            media="(max-width: 48em)"
            srcSet={MOBILE_CUSTOMER_BANNER_URL}
          />
          <img
            alt="500000 happy customers, 30 years of market experience, and 4 out of 5 Amazon and Flipkart rating"
            height={360}
            src={CUSTOMER_BANNER_URL}
            width={1519}
          />
        </picture>
      </Link>
    </section>
  );
}
