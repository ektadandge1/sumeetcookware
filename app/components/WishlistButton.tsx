import type {WishlistItem} from '~/components/WishlistContext';
import {useWishlist} from '~/components/WishlistContext';

export function WishlistButton({
  className = '',
  item,
}: {
  className?: string;
  item: WishlistItem;
}) {
  const {isWishlisted, toggle} = useWishlist();
  const saved = isWishlisted(item.id);

  return (
    <button
      aria-label={saved ? `Remove ${item.title} from wishlist` : `Add ${item.title} to wishlist`}
      aria-pressed={saved}
      className={`wishlist-button${saved ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(item);
      }}
      type="button"
    >
      <HeartIcon filled={saved} />
      <span className="sr-only">{saved ? 'Saved to wishlist' : 'Add to wishlist'}</span>
    </button>
  );
}

export function HeartIcon({filled = false}: {filled?: boolean}) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M20.84 8.61c0 5.05-8.84 10.39-8.84 10.39S3.16 13.66 3.16 8.61A4.61 4.61 0 0 1 12 6.34a4.61 4.61 0 0 1 8.84 2.27Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}
