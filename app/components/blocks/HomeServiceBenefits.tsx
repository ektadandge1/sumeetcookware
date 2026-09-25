type Benefit = {
  label: string;
  image: string;
};

const benefits: Benefit[] = [
  {
    label: 'Free Shipping',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_350.png?v=1789707074',
  },
  {
    label: 'Cash on Delivery',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_351.png?v=1789707074',
  },
  {
    label: 'Secure Payment',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_352.png?v=1789707073',
  },
  {
    label: '7 Days Return',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_575_1.png?v=1789707074',
  },
];

export function HomeServiceBenefits() {
  return (
    <section className="home-service-benefits" aria-label="Shopping benefits">
      <div className="home-service-benefits-track">
        {[false, true].map((duplicate) => (
          <div
            aria-hidden={duplicate || undefined}
            className={`home-service-benefits-group${duplicate ? ' home-service-benefits-copy' : ''}`}
            key={duplicate ? 'copy' : 'primary'}
          >
            {benefits.map(({image, label}) => (
              <article className="home-service-benefit" key={label}>
                <span className="home-service-icon">
                  <img alt="" height="170" src={image} width="170" />
                </span>
                <span className="home-service-label">{label}</span>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
