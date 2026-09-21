import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/wishlist';
import {Money} from '@shopify/hydrogen';
import {useWishlist} from '~/components/WishlistContext';

export const meta: Route.MetaFunction = () => [{title: 'Wishlist | Sumeet Cookware'}];

export async function loader() {
  return null;
}

export default function WishlistPage() {
  useLoaderData<typeof loader>();
  const {items, remove} = useWishlist();

  return (
    <div className="wishlist-page">
      <div className="wishlist-page-heading">
        <p className="home-eyebrow">Saved for later</p>
        <h1>My Wishlist</h1>
        <p>{items.length ? `${items.length} item${items.length === 1 ? '' : 's'} saved` : 'Your wishlist is waiting for something special.'}</p>
      </div>

      {items.length ? (
        <div className="wishlist-grid">
          {items.map((item) => (
            <article className="wishlist-card" key={item.id}>
              <Link prefetch="intent" to={`/products/${item.handle}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.imageAlt || item.title} />
                ) : (
                  <div className="wishlist-card-placeholder" aria-hidden="true" />
                )}
                <h2>{item.title}</h2>
                {item.price && item.currencyCode ? (
                  <Money
                    data={{amount: item.price, currencyCode: item.currencyCode}}
                  />
                ) : null}
              </Link>
              <button
                className="wishlist-remove"
                onClick={() => remove(item.id)}
                type="button"
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="wishlist-empty">
          <span className="wishlist-empty-heart" aria-hidden="true">♡</span>
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any product to keep it here.</p>
          <Link className="home-button" to="/collections">Explore cookware</Link>
        </div>
      )}
    </div>
  );
}
