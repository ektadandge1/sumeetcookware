import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}: {
  analytics?: unknown;
  children: React.ReactNode | ((isPending: boolean) => React.ReactNode);
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<any>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            aria-busy={fetcher.state !== 'idle'}
            type="submit"
            onClick={onClick}
            disabled={Boolean(disabled) || fetcher.state !== 'idle'}
          >
            {typeof children === 'function'
              ? children(fetcher.state !== 'idle')
              : children}
          </button>
        </>
      )}
    </CartForm>
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
