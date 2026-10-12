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
  removePending: (lines: Array<{id: string; quantity: number}>) => void;
  settlePending: (
    id: string,
    totalQuantity?: number,
    cart?: CartApiQueryFragment,
  ) => void;
};

const CartCountContext = createContext<CartCountContextValue | null>(null);

export function CartCountProvider({children}: {children: ReactNode}) {
  const fetchers = useFetchers();
  const processedResponses = useRef(new Set<string>());
  const [confirmedQuantity, setConfirmedQuantity] = useState<number | null>(
    null,
  );
  const [cartPulse, setCartPulse] = useState(0);
  const [latestCart, setLatestCart] = useState<CartApiQueryFragment | null>(
    null,
  );
  const [pending, setPending] = useState<Record<string, PendingCartLines>>({});
  const [explicitRemovedLines, setExplicitRemovedLines] = useState<
    Record<string, number>
  >({});
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
    new Set([...Object.keys(explicitRemovedLines), ...fetcherRemovedLineIds]),
  );
  const pendingRemovedQuantity = Object.values(explicitRemovedLines).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const pendingQuantity = pendingLines.reduce(
    (total, line) => total + (line.quantity ?? 1),
    0,
  );

  const addPending = useCallback((id: string, lines: PendingCartLines) => {
    setPending((current) => ({...current, [id]: lines}));
  }, []);
  const removePending = useCallback(
    (lines: Array<{id: string; quantity: number}>) => {
      setExplicitRemovedLines((current) => ({
        ...current,
        ...Object.fromEntries(lines.map((line) => [line.id, line.quantity])),
      }));
    },
    [],
  );
  const settlePending = useCallback(
    (
      id: string,
      totalQuantity?: number,
      cart?: CartApiQueryFragment,
    ) => {
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
        | {cart?: CartApiQueryFragment; errors?: unknown[]}
        | undefined;
      const transactionId = fetcher.formData.get('cartTransactionId');
      let action: string | undefined;
      let removedLineIds: string[] = [];
      try {
        const formInput = CartForm.getFormInput(fetcher.formData);
        action = formInput.action;
        if (action === CartForm.ACTIONS.LinesRemove) {
          removedLineIds = formInput.inputs.lineIds as string[];
        }
      } catch {
        // Ignore malformed or unrelated submissions.
      }
      const cart = data?.cart;
      if (fetcher.state !== 'loading' || !cart || data?.errors?.length) {
        continue;
      }
      const lineSignature = cart?.lines?.nodes
        .map((line) => `${line.id}:${line.quantity}`)
        .join('|');
      const signature = `${fetcher.key}:${cart?.id ?? 'error'}:${cart?.totalQuantity ?? 'none'}:${lineSignature ?? ''}`;

      if (processedResponses.current.has(signature)) continue;
      processedResponses.current.add(signature);

      settlePending(
        typeof transactionId === 'string'
          ? transactionId
          : `fetcher-${fetcher.key}`,
        cart.totalQuantity,
        cart,
      );
      if (action === CartForm.ACTIONS.LinesRemove) {
        setExplicitRemovedLines((current) => {
          const next = {...current};
          for (const lineId of removedLineIds) delete next[lineId];
          return next;
        });
      }
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
      removePending,
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
      removePending,
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

  return {
    ...context,
    totalQuantity: Math.max(
      0,
      (context.confirmedQuantity ?? confirmedQuantity ?? 0) +
        context.pendingQuantity -
        context.pendingRemovedQuantity,
    ),
  };
}
