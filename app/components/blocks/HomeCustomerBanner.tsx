const CUSTOMER_BANNER_URL =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Middle_Happ_Customer_banner.jpg?v=1789986357';

export function HomeCustomerBanner() {
  return (
    <section
      className="home-customer-banner"
      aria-label="Sumeet customer highlights"
    >
      <img
        alt="500000 happy customers, 30 years of market experience, and 4.5 out of 5 average customer rating"
        height={360}
        src={CUSTOMER_BANNER_URL}
        width={1519}
      />
    </section>
  );
}
