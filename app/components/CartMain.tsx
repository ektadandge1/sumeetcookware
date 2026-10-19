import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {CartLineItem, type CartLine} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';
import {
  useCartCount,
  type PendingCartLines,
} from './CartCountContext';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  const {latestCart, pendingLines, pendingRemovedLineIds} = useCartCount();

  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const confirmedCart = Array.isArray(latestCart?.lines?.nodes)
    ? latestCart
    : originalCart;
  const cart = applyPendingRemovals(
    applySharedPendingLines(
      useOptimisticCart(confirmedCart),
      confirmedCart,
      pendingLines,
    ),
    pendingRemovedLineIds,
  );

  const cartHasItems = (cart?.totalQuantity ?? 0) > 0;
  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''} ${
    cartHasItems ? 'has-items' : 'is-empty'
  }`;
  const childrenMap = getLineItemChildrenMap(cart?.lines?.nodes ?? []);

  return (
    <section
      className={className}
      aria-label={layout === 'page' ? 'Cart page' : 'Cart drawer'}
    >
      <CartEmpty hidden={cartHasItems} layout={layout} />
      <div className="cart-details">
        <p id="cart-lines" className="sr-only">
          Line items
        </p>
        <div className="cart-lines">
          <ul aria-labelledby="cart-lines">
            {(cart?.lines?.nodes ?? []).map((line) => {
              // we do not render non-parent lines at the root of the cart
              if (
                'parentRelationship' in line &&
                line.parentRelationship?.parent
              ) {
                return null;
              }
              return (
                <CartLineItem
                  key={line.id}
                  line={line}
                  layout={layout}
                  childrenMap={childrenMap}
                />
              );
            })}
          </ul>
        </div>
        {cartHasItems && <CartSummary cart={cart} layout={layout} />}
      </div>
    </section>
  );
}

function applyPendingRemovals(
  cart: ReturnType<typeof useOptimisticCart<CartApiQueryFragment | null>>,
  lineIds: string[],
) {
  if (!cart?.lines || !lineIds.length) return cart;

  const removedIds = new Set(lineIds);
  const optimisticCart = structuredClone(cart);
  optimisticCart.lines.nodes = optimisticCart.lines.nodes.filter(
    (line) => !removedIds.has(line.id),
  );
  optimisticCart.totalQuantity = optimisticCart.lines.nodes.reduce(
    (total, line) => total + line.quantity,
    0,
  );
  optimisticCart.isOptimistic = true;
  return optimisticCart;
}

function applySharedPendingLines(
  cart: ReturnType<typeof useOptimisticCart<CartApiQueryFragment | null>>,
  confirmedCart: CartApiQueryFragment | null,
  pendingLines: PendingCartLines,
) {
  if (!pendingLines.length) return cart;

  const optimisticCart = cart?.lines
    ? structuredClone(cart)
    : ({lines: {nodes: []}, totalQuantity: 0} as NonNullable<typeof cart>);
  const displayedLines = optimisticCart.lines.nodes as unknown as CartLine[];
  const quantitiesByVariant = new Map<string, number>();
  const variantsById = new Map(
    pendingLines
      .filter((line) => line.selectedVariant)
      .map((line) => [line.merchandiseId, line.selectedVariant!]),
  );

  for (const line of pendingLines) {
    quantitiesByVariant.set(
      line.merchandiseId,
      (quantitiesByVariant.get(line.merchandiseId) ?? 0) +
        (line.quantity ?? 1),
    );
  }

  for (const [variantId, pendingQuantity] of quantitiesByVariant) {
    const confirmedQuantity =
      confirmedCart?.lines?.nodes?.find(
        (line) => line.merchandise.id === variantId,
      )?.quantity ?? 0;
    const expectedQuantity = confirmedQuantity + pendingQuantity;
    const displayedLine = displayedLines.find(
      (line) => line.merchandise.id === variantId,
    );

    if (displayedLine) {
      if (displayedLine.quantity < expectedQuantity) {
        displayedLine.quantity = expectedQuantity;
        displayedLine.isOptimistic = true;
      }
      continue;
    }

    const selectedVariant = variantsById.get(variantId) as
      | CartLine['merchandise']
      | undefined;
    if (!selectedVariant) continue;
    const totalAmount = {
      ...selectedVariant.price,
      amount: (
        Number(selectedVariant.price.amount) * expectedQuantity
      ).toString(),
    };
    displayedLines.unshift(
      {
        cost: {
          amountPerQuantity: selectedVariant.price,
          subtotalAmount: totalAmount,
          totalAmount,
        },
        id: `optimistic-${variantId}`,
        isOptimistic: true,
        merchandise: selectedVariant,
        quantity: expectedQuantity,
      } as unknown as CartLine,
    );
  }

  optimisticCart.totalQuantity = displayedLines.reduce(
    (total, line) => total + line.quantity,
    0,
  );
  optimisticCart.isOptimistic = true;
  return optimisticCart;
}

function CartEmpty({
  hidden = false,
}: {
  hidden: boolean;
  layout?: CartMainProps['layout'];
}) {
  const {close} = useAside();
  return (
    <div
      aria-labelledby="empty-cart-title"
      className="cart-empty"
      hidden={hidden}
    >
      <span className="cart-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <path d="M6 8h5l4.2 21h20.2l4.6-15H12.2" />
          <circle cx="19" cy="38" r="2.5" />
          <circle cx="34" cy="38" r="2.5" />
        </svg>
      </span>
      <h4 id="empty-cart-title">Your cart is waiting</h4>
      <p className="cart-empty-message">
        Looks like you haven&rsquo;t added anything yet, let&rsquo;s get you
        started!
      </p>
      <Link
        className="cart-empty-link"
        to="/collections/all"
        onClick={close}
        prefetch="intent"
      >
        <span>Continue shopping</span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
