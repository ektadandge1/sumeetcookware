const BENEFITS = [
  {label: '7 Days Replacement', icon: ReplacementIcon},
  {label: 'Free Shipping', icon: ShippingIcon},
  {label: 'Cash on Delivery', icon: CashIcon},
  {label: 'One Year Warranty', icon: WarrantyIcon},
  {label: 'ISI Certified Premium Steel', icon: CertificationIcon},
  {label: 'Induction Compatible', icon: InductionIcon},
];

export function ProductBenefits() {
  return (
    <section className="product-benefits" aria-label="Product benefits">
      <div className="product-benefits-grid">
        {BENEFITS.map(({label, icon: Icon}) => (
          <div className="product-benefit" key={label}>
            <Icon />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const iconProps = {
  'aria-hidden': true,
  className: 'product-benefit-icon',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.7,
  viewBox: '0 0 56 48',
};

function ReplacementIcon() {
  return (
    <svg {...iconProps}>
      <rect x="12" y="4" width="32" height="38" rx="9" />
      <path d="M20 21a9 9 0 0 1 15 6v7" />
      <path d="m20 21 5-5m-5 5 6 2" />
    </svg>
  );
}

function ShippingIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 12h34v26H16" />
      <path d="M40 22h6l5 7v9H40" />
      <path d="M6 32H3v6h5" />
      <circle cx="13" cy="39" r="4" />
      <circle cx="43" cy="39" r="4" />
      <text
        x="23"
        y="27"
        fill="currentColor"
        fontFamily="var(--font-body-family)"
        fontSize="10"
        stroke="none"
        textAnchor="middle"
      >
        FREE
      </text>
    </svg>
  );
}

function CashIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="28" cy="24" r="18" />
      <path d="M21 15h14M21 20h14M23 15c6 0 9 2 9 5s-3 5-9 5h-2l11 10" />
    </svg>
  );
}

function WarrantyIcon() {
  return (
    <svg {...iconProps}>
      <path d="m28 4 6 4 8 1 1 8 4 6-4 6-1 8-8 1-6 4-6-4-8-1-1-8-4-6 4-6 1-8 8-1 6-4Z" />
      <path d="M28 11c4 3 8 3 11 4v8c0 6-4 10-11 13-7-3-11-7-11-13v-8c3-1 7-1 11-4Z" />
      <path d="m22 23 4 4 8-9" />
      <path d="m40 37 5 7 1-5 5-1-6-6" />
    </svg>
  );
}

function CertificationIcon() {
  return (
    <svg {...iconProps}>
      <text
        x="28"
        y="25"
        fill="currentColor"
        fontFamily="var(--font-display-family)"
        fontSize="18"
        fontWeight="700"
        stroke="none"
        textAnchor="middle"
      >
        100%
      </text>
      <path d="M9 36c12-5 26-5 38 0" strokeWidth="2" />
    </svg>
  );
}

function InductionIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="28" cy="22" r="18" />
      <circle cx="28" cy="22" r="14" />
      <path d="M19 12c-5 6-5 14 0 20M25 12c-5 6-5 14 0 20M31 12c5 6 5 14 0 20M37 12c5 6 5 14 0 20M20 44h16" />
    </svg>
  );
}
