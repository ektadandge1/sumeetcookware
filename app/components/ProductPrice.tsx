import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  return (
    <div aria-label="Price" className="product-price" role="group">
      <div className="product-price-standard">
        {compareAtPrice ? (
          <div className="product-price-on-sale">
            {price ? <Money data={price} /> : null}
            <s>
              <Money data={compareAtPrice} />
            </s>
          </div>
        ) : price ? (
          <Money data={price} />
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
      {price ? (
        <div className="product-price-mobile">
          <span>RS. {formatPrice(price.amount)}</span>
          {compareAtPrice ? (
            <s>RS. {formatPrice(compareAtPrice.amount)}</s>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function formatPrice(amount: string) {
  return new Intl.NumberFormat('en-IN', {maximumFractionDigits: 0}).format(
    Number(amount),
  );
}
