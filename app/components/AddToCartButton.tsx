import {useEffect, useId, useRef, useState} from 'react';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useCartCount} from './CartCountContext';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  onSuccess,
  redirectToCheckout,
}: {
  analytics?: unknown;
  children:
    | React.ReactNode
    | ((isPending: boolean, isAdded: boolean) => React.ReactNode);
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
  onSuccess?: () => void;
  redirectToCheckout?: boolean;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <CartSubmitButton
          analytics={analytics}
          disabled={disabled}
          fetcher={fetcher}
          lines={lines}
          onClick={onClick}
          onSuccess={onSuccess}
          redirectToCheckout={redirectToCheckout}
        >
          {children}
        </CartSubmitButton>
      )}
    </CartForm>
  );
}

function CartSubmitButton({
  analytics,
  children,
  disabled,
  fetcher,
  lines,
  onClick,
  onSuccess,
  redirectToCheckout,
}: {
  analytics?: unknown;
  children:
    | React.ReactNode
    | ((isPending: boolean, isAdded: boolean) => React.ReactNode);
  disabled?: boolean;
  fetcher: FetcherWithComponents<any>;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
  onSuccess?: () => void;
  redirectToCheckout?: boolean;
}) {
  const transactionId = useId();
  const wasPending = useRef(false);
  const addedTimer = useRef<number | undefined>(undefined);
  const [isAdded, setIsAdded] = useState(false);
  const {addPending} = useCartCount();
  const isPending = fetcher.state !== 'idle';

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
      return;
    }
    if (!wasPending.current) return;

    wasPending.current = false;
    const result = fetcher.data as
      | {cart?: CartApiQueryFragment; errors?: unknown[]}
      | undefined;
    const succeeded = Boolean(fetcher.data) && !result?.errors?.length;
    if (succeeded) {
      if (redirectToCheckout && result?.cart?.checkoutUrl) {
        window.location.assign(result.cart.checkoutUrl);
        return;
      }
      setIsAdded(true);
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
      addedTimer.current = window.setTimeout(() => setIsAdded(false), 2400);
      onSuccess?.();
    } else {
      setIsAdded(false);
    }
  }, [fetcher.data, isPending, onSuccess, redirectToCheckout]);

  useEffect(
    () => () => {
      if (addedTimer.current) window.clearTimeout(addedTimer.current);
    },
    [],
  );

  return (
    <>
      <input
        name="analytics"
        type="hidden"
        value={JSON.stringify(analytics)}
      />
      <input name="cartTransactionId" type="hidden" value={transactionId} />
      <button
        aria-busy={isPending}
        disabled={Boolean(disabled) || isPending}
        onClick={() => {
          setIsAdded(true);
          if (addedTimer.current) window.clearTimeout(addedTimer.current);
          addedTimer.current = window.setTimeout(
            () => setIsAdded(false),
            2400,
          );
          addPending(
            transactionId,
            lines,
          );
          onClick?.();
        }}
        type="submit"
      >
        {typeof children === 'function'
          ? children(isPending, isAdded)
          : children}
      </button>
    </>
  );
}

export function CartIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 7H6" />
      <circle cx="9.5" cy="19" r="1.25" />
      <circle cx="17.5" cy="19" r="1.25" />
    </svg>
  );
}
