import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useFetchers} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

export type PendingCartLines = Array<OptimisticCartLineInput>;

type CartCountContextValue = {
  addPending: (id: string, lines: PendingCartLines) => void;
  cartPulse: number;
  confirmedQuantity: number | null;
  latestCart: CartApiQueryFragment | null;
  pendingLines: PendingCartLines;
  pendingRemovedLineIds: string[];
  pendingRemovedQuantity: number;
  pendingQuantity: number;
  settlePending: (
    id: string,
    totalQuantity?: number,
    cart?: CartApiQueryFragment,
  ) => void;
};

const CartCountContext = createContext<CartCountContextValue | null>(null);

export function CartCountProvider({children}: {children: ReactNode}) {
  const fetchers = useFetchers();
  const processedResponses = useRef(new WeakSet<object>());
  const [confirmedQuantity, setConfirmedQuantity] = useState<number | null>(
    null,
  );
  const [cartPulse, setCartPulse] = useState(0);
  const [latestCart, setLatestCart] = useState<CartApiQueryFragment | null>(
    null,
  );
  const [pending, setPending] = useState<Record<string, PendingCartLines>>({});
  const pendingLines = Object.values(pending).flat();
  const fetcherRemovedLineIds = fetchers.flatMap((fetcher) => {
    if (!fetcher.formData) return [];
    try {
      const {action, inputs} = CartForm.getFormInput(fetcher.formData);
      return action === CartForm.ACTIONS.LinesRemove
        ? (inputs.lineIds as string[])
        : [];
    } catch {
      return [];
    }
  });
  const pendingRemovedLineIds = Array.from(
    new Set(fetcherRemovedLineIds),
  );
  const pendingRemovedQuantity = 0;
  const pendingQuantity = pendingLines.reduce(
    (total, line) => total + (line.quantity ?? 1),
    0,
  );

  const addPending = useCallback((id: string, lines: PendingCartLines) => {
    setPending((current) => ({...current, [id]: lines}));
  }, []);
  const settlePending = useCallback(
    (id: string, totalQuantity?: number, cart?: CartApiQueryFragment) => {
      if (typeof totalQuantity === 'number') {
        setConfirmedQuantity(totalQuantity);
        if (id !== 'initial-cart') setCartPulse((pulse) => pulse + 1);
      }
      if (cart) setLatestCart(cart);
      setPending((current) => {
        if (!(id in current)) return current;
        const next = {...current};
        delete next[id];
        return next;
      });
    },
    [],
  );
  useEffect(() => {
    for (const fetcher of fetchers) {
      if (!fetcher.formData) continue;

      const data = fetcher.data as
        {cart?: CartApiQueryFragment; errors?: unknown[]} | undefined;
      const transactionId = fetcher.formData.get('cartTransactionId');
      const cart = data?.cart;
      // Skip while the request is still in flight; process once data arrives
      // in either the loading or idle state so no response is missed.
      if (fetcher.state === 'submitting' || !data) {
        continue;
      }
      if (!cart || data.errors?.length) {
        // Roll back optimistic lines when the cart action failed.
        settlePending(
          typeof transactionId === 'string'
            ? transactionId
            : `fetcher-${fetcher.key}`,
        );
        continue;
      }
      // A discount/gift-card update can change totals without changing lines.
      // Deduplicate the response object, not a signature of line quantities.
      if (processedResponses.current.has(data)) continue;
      processedResponses.current.add(data);

      settlePending(
        typeof transactionId === 'string'
          ? transactionId
          : `fetcher-${fetcher.key}`,
        cart.totalQuantity,
        cart,
      );
    }
  }, [fetchers, settlePending]);
  const value = useMemo(
    () => ({
      addPending,
      cartPulse,
      confirmedQuantity,
      latestCart,
      pendingLines,
      pendingRemovedLineIds,
      pendingRemovedQuantity,
      pendingQuantity,
      settlePending,
    }),
    [
      addPending,
      cartPulse,
      confirmedQuantity,
      latestCart,
      pendingLines,
      pendingRemovedLineIds,
      pendingRemovedQuantity,
      pendingQuantity,
      settlePending,
    ],
  );

  return (
    <CartCountContext.Provider value={value}>
      {children}
    </CartCountContext.Provider>
  );
}

export function useCartCount(confirmedQuantity?: number) {
  const context = useContext(CartCountContext);
  if (!context) {
    throw new Error('useCartCount must be used within a CartCountProvider');
  }
  const {settlePending} = context;

  useEffect(() => {
    if (typeof confirmedQuantity === 'number') {
      settlePending('initial-cart', confirmedQuantity);
    }
  }, [confirmedQuantity, settlePending]);

  const latestCartHasNodes = Array.isArray(
    context.latestCart?.lines?.nodes,
  );
  const settledQuantity = context.latestCart
    ? latestCartHasNodes
      ? context.latestCart.totalQuantity
      : (confirmedQuantity ?? 0)
    : (context.confirmedQuantity ?? confirmedQuantity ?? 0);

  return {
    ...context,
    totalQuantity: Math.max(
      0,
      settledQuantity + context.pendingQuantity -
        context.pendingRemovedQuantity,
    ),
  };
}
