const BENEFITS = [
  {
    label: '7 Days Replacement',
    icon: 'https://cdn.shopify.com/s/files/1/1022/8596/7677/files/Group.png?v=1792563405',
  },
  {
    label: 'Free Shipping',
    icon: 'https://cdn.shopify.com/s/files/1/1022/8596/7677/files/Group-1.png?v=1792563406',
  },
  {
    label: 'Cash on Delivery',
    icon: 'https://cdn.shopify.com/s/files/1/1022/8596/7677/files/Group-2.png?v=1792563404',
  },
  {
    label: 'One Year Warranty',
    icon: 'https://cdn.shopify.com/s/files/1/1022/8596/7677/files/warranty_1.png?v=1792563405',
  },
  {
    label: 'ISI Certified Premium Steel',
    icon: 'https://cdn.shopify.com/s/files/1/1022/8596/7677/files/100_1.png?v=1792563405',
  },
  {
    label: 'Induction Compatible',
    icon: 'https://cdn.shopify.com/s/files/1/1022/8596/7677/files/induction_1.png?v=1792563405',
  },
];

export function ProductBenefits({className = ''}: {className?: string}) {
  return (
    <section
      className={`product-benefits ${className}`.trim()}
      aria-label="Product benefits"
    >
      <div className="product-benefits-grid">
        <div className="product-benefits-group">
          {BENEFITS.slice(0, 3).map(({label, icon}) => (
            <div className="product-benefit" key={label}>
              <img alt="" aria-hidden="true" className="product-benefit-icon" src={icon} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="product-bulk-offer">
          <span>Up to</span> <strong>20% OFF</strong> <span>on bulk purchases</span>
        </div>
        <div className="product-benefits-group">
          {BENEFITS.slice(3).map(({label, icon}) => (
            <div className="product-benefit" key={label}>
              <img alt="" aria-hidden="true" className="product-benefit-icon" src={icon} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
