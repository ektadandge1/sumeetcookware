import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import type {action} from '~/routes/cart';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const summaryId = useId();
  const discountCodeInputId = useId();
  const giftCardHeadingId = useId();
  const giftCardInputId = useId();

  return (
    <div aria-labelledby={summaryId} className={className}>
      <h4 id={summaryId}>Order summary</h4>
      <dl role="group" className="cart-subtotal">
        <dt>Subtotal</dt>
        <dd>
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart?.cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      <CartSavings cart={cart} />
      <CartDiscounts
        discountCodes={cart?.discountCodes}
        discountCodeInputId={discountCodeInputId}
      />
      <CartGiftCard
        giftCardCodes={cart?.appliedGiftCards}
        giftCardHeadingId={giftCardHeadingId}
        giftCardInputId={giftCardInputId}
      />
      <dl role="group" className="cart-total">
        <dt>Total</dt>
        <dd>
          {cart?.cost?.totalAmount?.amount ? (
            <Money data={cart.cost.totalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="cart-checkout-actions">
      <a className="cart-checkout-button" href={checkoutUrl} target="_self">
        Secure checkout
      </a>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
  discountCodeInputId,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
  discountCodeInputId: string;
}) {
  const fetcherKey = useId();
  const fetcher = useFetcher<typeof action>({key: fetcherKey});
  const pending = fetcher.state !== 'idle';
  const codes = discountCodes ?? [];
  const applicableCodes = codes
    .filter(({applicable}) => applicable)
    .map(({code}) => code);
  const errors = fetcher.data?.errors ?? [];
  const feedbackId = `${discountCodeInputId}-feedback`;

  return (
    <section className="cart-promo-section" aria-label="Discounts">
      <h5>Discount code</h5>
      {codes.length > 0 && (
        <ul className="cart-discount-codes" aria-label="Entered discount codes">
          {codes.map(({code, applicable}) => (
            <li key={code}>
              <CartForm
                route="/cart"
                fetcherKey={fetcherKey}
                action={CartForm.ACTIONS.DiscountCodesUpdate}
                inputs={{
                  discountCodes: codes
                    .filter((item) => item.code !== code)
                    .map((item) => item.code),
                }}
              >
                <div className="cart-discount">
                  <span>
                    <code>{code}</code> —{' '}
                    {applicable ? 'Applied' : 'Not applicable to this cart'}
                  </span>
                  <button
                    type="submit"
                    disabled={pending}
                    aria-label={`Remove discount ${code}`}
                  >
                    Remove
                  </button>
                </div>
              </CartForm>
            </li>
          ))}
        </ul>
      )}
      <CartForm
        route="/cart"
        fetcherKey={fetcherKey}
        action={CartForm.ACTIONS.DiscountCodesUpdate}
        inputs={{discountCodes: applicableCodes}}
      >
        <div className="cart-code-form">
          <label htmlFor={discountCodeInputId}>Discount code</label>
          <input
            id={discountCodeInputId}
            type="text"
            name="discountCode"
            placeholder="Enter your code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            required
            disabled={pending}
            aria-describedby={feedbackId}
          />
          <button
            type="submit"
            disabled={pending}
            aria-label="Apply discount code"
          >
            {pending ? 'Updating…' : 'Apply'}
          </button>
        </div>
      </CartForm>
      <div
        id={feedbackId}
        className="cart-discount-feedback"
        role="status"
        aria-live="polite"
      >
        {errors.length > 0 ? (
          <p>{errors.map((error) => error.message).join(' ')}</p>
        ) : codes.some(({applicable}) => !applicable) ? (
          <p>
            This code may be invalid, expired, or require different items, a
            minimum spend, or customer eligibility.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CartSavings({cart}: Pick<CartSummaryProps, 'cart'>) {
  const allocations = [
    ...(cart?.discountAllocations ?? []),
    ...(cart?.lines?.nodes ?? []).flatMap(
      (line) => line.discountAllocations ?? [],
    ),
  ];
  if (!allocations.length) return null;
  const savings = new Map<
    string,
    {label: string; money: (typeof allocations)[number]['discountedAmount']}
  >();
  for (const allocation of allocations) {
    const label =
      'code' in allocation
        ? allocation.code
        : 'title' in allocation
          ? allocation.title
          : 'Discount';
    const key = `${label}:${allocation.discountedAmount.currencyCode}`;
    const previous = savings.get(key);
    savings.set(key, {
      label,
      money: {
        ...allocation.discountedAmount,
        amount: (
          Number(previous?.money.amount ?? 0) +
          Number(allocation.discountedAmount.amount)
        ).toString(),
      },
    });
  }

  return (
    <dl className="cart-savings" aria-label="Applied savings">
      {Array.from(savings, ([key, {label, money}]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>
            −<Money data={money} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CartGiftCard({
  giftCardCodes,
  giftCardHeadingId,
  giftCardInputId,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
  giftCardHeadingId: string;
  giftCardInputId: string;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousCardIdsRef = useRef<string[]>([]);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});
  const [removedCardIndex, setRemovedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current !== null) {
        giftCardCodeInput.current.value = '';
      }
    }
  }, [giftCardAddFetcher.data]);

  useEffect(() => {
    const currentCardIds = giftCardCodes?.map((card) => card.id) || [];

    if (removedCardIndex !== null && giftCardCodes) {
      const focusTargetIndex = Math.min(
        removedCardIndex,
        giftCardCodes.length - 1,
      );
      const focusTargetCard = giftCardCodes[focusTargetIndex];
      const focusButton = focusTargetCard
        ? removeButtonRefs.current.get(focusTargetCard.id)
        : null;

      if (focusButton) {
        focusButton.focus();
      } else if (giftCardCodeInput.current) {
        giftCardCodeInput.current.focus();
      }

      setRemovedCardIndex(null);
    }

    previousCardIdsRef.current = currentCardIds;
  }, [giftCardCodes, removedCardIndex]);

  const handleRemoveClick = (cardId: string) => {
    const index = previousCardIdsRef.current.indexOf(cardId);
    if (index !== -1) {
      setRemovedCardIndex(index);
    }
  };

  return (
    <section className="cart-promo-section" aria-label="Gift cards">
      <h5>Gift card</h5>
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl>
          <dt id={giftCardHeadingId}>Applied Gift Card(s)</dt>
          {giftCardCodes.map((giftCard) => (
            <dd key={giftCard.id} className="cart-discount">
              <RemoveGiftCardForm
                giftCardId={giftCard.id}
                lastCharacters={giftCard.lastCharacters}
                onRemoveClick={() => handleRemoveClick(giftCard.id)}
                buttonRef={(el: HTMLButtonElement | null) => {
                  if (el) {
                    removeButtonRefs.current.set(giftCard.id, el);
                  } else {
                    removeButtonRefs.current.delete(giftCard.id);
                  }
                }}
              >
                <code>***{giftCard.lastCharacters}</code>
                &nbsp;
                <Money data={giftCard.amountUsed} />
              </RemoveGiftCardForm>
            </dd>
          ))}
        </dl>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="cart-code-form">
          <label htmlFor={giftCardInputId}>Gift card code</label>
          <input
            id={giftCardInputId}
            type="text"
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
          />
          &nbsp;
          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            aria-label="Apply gift card code"
          >
            Apply
          </button>
        </div>
      </AddGiftCardForm>
    </section>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesAdd}
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  lastCharacters,
  children,
  onRemoveClick,
  buttonRef,
}: {
  giftCardId: string;
  lastCharacters: string;
  children: React.ReactNode;
  onRemoveClick?: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
      &nbsp;
      <button
        type="submit"
        aria-label={`Remove gift card ending in ${lastCharacters}`}
        onClick={onRemoveClick}
        ref={buttonRef}
      >
        Remove
      </button>
    </CartForm>
  );
}
