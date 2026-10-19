import {Money} from '@shopify/hydrogen';
import {Suspense, useRef, useState} from 'react';
import {Await, Link, NavLink} from 'react-router';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {CartIcon} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {SearchFormPredictive} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {HeartIcon} from '~/components/WishlistButton';
import {useWishlist} from '~/components/WishlistContext';
import {useCartCount} from '~/components/CartCountContext';

const SUMEET_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Sumeet_logo_PNG.png?v=1789986865';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

const PLACEHOLDER_MENU_ROUTES: Record<string, string> = {
  Appachatty: '/collections/non-stick-appachatty',
  'Non-Stick Casserole': '/collections/non-stick-casserole',
  'Non-Stick Cookware': '/collections/non-stick-cookware',
  'Non-Stick Dosa Tawa': '/collections/non-stick-dosa-tawa',
  'Non-Stick Grill Pan': '/collections/non-stick-grill-pan',
  'Non-Stick Kadhai': '/collections/non-stick-kadhai',
  'Non-Stick Pizza Pan': '/collections/non-stick-pizza-pan',
  Tableware: '/collections/dinner-set',
  'Non-Stick': '/collections/non-stick-cookware',
  More: '/pages/about-us',
  Gifting: '/collections/all',
  Blogs: '/blogs/kitchen',
  'Contact Us': '/contact-us',
  'About Us': '/pages/about-us',
};

export function Header({
  cart,
  header,
  isLoggedIn,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;
  const logoUrl = SUMEET_LOGO_URL;

  return (
    <header className="header">
      <div className="header-main">
        <MobileMenuButton />
        <HeaderSearch />
        <NavLink
          className="header-brand"
          prefetch="intent"
          to="/"
          style={activeLinkStyle}
          end
        >
          {logoUrl ? (
            <img src={logoUrl} alt={shop.name} />
          ) : (
            <span className="header-brand-fallback">
              <strong>{shop.name}</strong>
              <small>Setting Trends Always...</small>
            </span>
          )}
        </NavLink>
        <HeaderCtas cart={cart} isLoggedIn={isLoggedIn} />
      </div>
      <div className="header-nav">
        <HeaderMenu
          menu={menu}
          viewport="desktop"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </div>
    </header>
  );
}

function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<(term: string) => void>(() => undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="header-search-container">
      <SearchFormPredictive className="header-search-form" inputRef={inputRef}>
        {({fetchResults, search}) => {
          searchRef.current = search;

          return (
            <>
              <label className="sr-only" htmlFor="header-search">
                Search products
              </label>
              <input
                id="header-search"
                name="q"
                onChange={(event) => {
                  setIsSearchOpen(true);
                  fetchResults(event);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search product"
                ref={inputRef}
                type="search"
              />
              <button
                aria-label="Search"
                onClick={() => {
                  setIsSearchOpen(true);
                  const term = inputRef.current?.value.trim();
                  if (term) searchRef.current(term);
                }}
                type="submit"
              >
                <SearchIcon />
              </button>
            </>
          );
        }}
      </SearchFormPredictive>
      <SearchResultsPredictive inputRef={inputRef}>
        {({items, total, term, state, closeSearch}) => {
          if (!isSearchOpen || !term.current) return null;

          return (
            <div
              className="header-search-suggestions"
              onMouseLeave={() => setIsSearchOpen(false)}
              role="listbox"
              tabIndex={-1}
            >
              {state === 'loading' ? (
                <p className="header-search-status">Searching...</p>
              ) : !total ? (
                <p className="header-search-status">
                  No results for <q>{term.current}</q>
                </p>
              ) : (
                <>
                  {items.queries.length ? (
                    <div className="header-search-suggestion-group">
                      <h3>Suggestions</h3>
                      <div className="header-search-query-list">
                        {items.queries.slice(0, 5).map((query) => (
                          <button
                            className="header-search-query"
                            key={query.text}
                            onClick={() => {
                              if (inputRef.current) {
                                inputRef.current.value = query.text;
                                inputRef.current.focus();
                              }
                              setIsSearchOpen(true);
                              searchRef.current(query.text);
                            }}
                            type="button"
                          >
                            {query.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {items.products.length ? (
                    <div className="header-search-suggestion-group">
                      <h3>Products</h3>
                      <div className="header-search-product-list">
                        {items.products.map((product) => {
                          const variant =
                            product.selectedOrFirstAvailableVariant;
                          return (
                            <Link
                              className="header-search-product"
                              key={product.id}
                              onClick={closeSearch}
                              prefetch="intent"
                              to={`/products/${product.handle}`}
                            >
                              {variant?.image ? (
                                <img
                                  alt={variant.image.altText || product.title}
                                  height="52"
                                  src={variant.image.url}
                                  width="52"
                                />
                              ) : (
                                <span className="header-search-product-placeholder" />
                              )}
                              <span className="header-search-product-copy">
                                <strong>{product.title}</strong>
                                {variant?.price ? (
                                  <Money data={variant.price} />
                                ) : null}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        }}
      </SearchResultsPredictive>
    </div>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();
  const menuItems = menu?.items ?? [];
  const localUrl = (url: string) => {
    const parsed = new URL(url, primaryDomainUrl);
    return parsed.hostname.endsWith('.myshopify.com') ||
      parsed.hostname === publicStoreDomain ||
      parsed.origin === new URL(primaryDomainUrl).origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : url;
  };
  const menuUrl = (item: {title: string; url?: string | null}) => {
    if (!item.url) return PLACEHOLDER_MENU_ROUTES[item.title];
    const parsed = new URL(item.url, primaryDomainUrl);
    const isPlaceholder =
      parsed.pathname === '/' && !parsed.search && !parsed.hash;

    return isPlaceholder && PLACEHOLDER_MENU_ROUTES[item.title]
      ? PLACEHOLDER_MENU_ROUTES[item.title]
      : localUrl(item.url);
  };

  return (
    <nav className={className} role="navigation">
      {menuItems.map((item) => {
        const url = menuUrl(item);
        if (!url) return null;

        const submenu = item.items.filter((child) => menuUrl(child));

        if (viewport === 'mobile' && submenu.length) {
          return (
            <details className="header-mobile-menu-group" key={item.id}>
              <summary>{item.title}</summary>
              <div className="header-mobile-submenu">
                {submenu.map((submenuItem) => (
                  <NavLink
                    key={submenuItem.title}
                    onClick={close}
                    prefetch="intent"
                    to={menuUrl(submenuItem)!}
                  >
                    {submenuItem.title}
                  </NavLink>
                ))}
              </div>
            </details>
          );
        }

        if (submenu.length) {
          return (
            <div className="header-menu-group" key={item.id}>
              <NavLink
                aria-haspopup="true"
                className="header-menu-item"
                end
                prefetch="intent"
                style={activeLinkStyle}
                to={url}
              >
                {item.title}
                {item.title === 'More' && (
                  <span className="header-menu-caret" aria-hidden="true" />
                )}
              </NavLink>
              <div className="header-submenu">
                {submenu.map((submenuItem) => (
                  <NavLink
                    key={submenuItem.title}
                    onClick={close}
                    prefetch="intent"
                    to={menuUrl(submenuItem)!}
                  >
                    {submenuItem.title}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        }

        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
            {item.title === 'More' && (
              <span className="header-menu-caret" aria-hidden="true" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function HeaderCtas({
  cart,
  isLoggedIn,
}: Pick<HeaderProps, 'cart' | 'isLoggedIn'>) {
  const {open} = useAside();

  return (
    <nav className="header-ctas" aria-label="Header actions">
      <button
        aria-label="Search"
        className="header-icon-button header-mobile-search-button"
        onClick={() => open('search')}
        type="button"
      >
        <SearchIcon />
      </button>
      <Suspense fallback={<AccountLink isLoggedIn={false} />}>
        <Await
          resolve={isLoggedIn}
          errorElement={<AccountLink isLoggedIn={false} />}
        >
          {(loggedIn) => <AccountLink isLoggedIn={loggedIn} />}
        </Await>
      </Suspense>
      <WishlistToggle />
      <Suspense fallback={<HeaderCartToggle cart={null} />}>
        <Await resolve={cart} errorElement={<HeaderCartToggle cart={null} />}>
          {(resolvedCart) => <HeaderCartToggle cart={resolvedCart} />}
        </Await>
      </Suspense>
    </nav>
  );
}

function HeaderCartToggle({cart}: {cart: CartApiQueryFragment | null}) {
  const {open} = useAside();
  const {cartPulse, totalQuantity: quantity} = useCartCount(
    cart?.totalQuantity ?? 0,
  );

  return (
    <button
      aria-label={`Cart, ${quantity} item${quantity === 1 ? '' : 's'}`}
      className="header-icon-button header-cart-button"
      onClick={() => open('cart')}
      type="button"
    >
      <CartIcon />
      <span className="header-action-label">Cart</span>
      {quantity > 0 ? (
        <span
          aria-live="polite"
          className="header-cart-count is-flashing"
          key={cartPulse}
        >
          {quantity}
        </span>
      ) : null}
    </button>
  );
}

function MobileMenuButton() {
  const {open, type} = useAside();

  return (
    <button
      aria-expanded={type === 'mobile'}
      aria-label="Open menu"
      className="header-mobile-menu-button"
      onClick={() => open('mobile')}
      type="button"
    >
      <MenuIcon />
    </button>
  );
}

function AccountLink({isLoggedIn}: {isLoggedIn: boolean}) {
  return (
    <NavLink
      aria-label={isLoggedIn ? 'Account' : 'Sign in'}
      className="header-icon-button header-account-link"
      prefetch="intent"
      style={activeLinkStyle}
      to={isLoggedIn ? '/account' : '/account/login'}
    >
      <UserIcon />
      <span className="header-action-label">
        {isLoggedIn ? 'Account' : 'Sign in'}
      </span>
    </NavLink>
  );
}

function WishlistToggle() {
  const {items} = useWishlist();

  return (
    <NavLink
      aria-label={`Wishlist, ${items.length} saved item${items.length === 1 ? '' : 's'}`}
      className="header-icon-button header-wishlist-link"
      prefetch="intent"
      style={activeLinkStyle}
      to="/wishlist"
    >
      <HeartIcon filled={items.length > 0} />
      <span className="header-action-label">Wishlist</span>
      {items.length > 0 ? (
        <span className="header-wishlist-count">{items.length}</span>
      ) : null}
    </NavLink>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <circle cx="12" cy="7.5" r="3.25" />
      <path d="M4.75 20c.65-3.35 3.3-5.25 7.25-5.25s6.6 1.9 7.25 5.25" />
    </svg>
  );
}

function activeLinkStyle({
  isActive,
  isPending,
}: {
  isActive: boolean;
  isPending: boolean;
}) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'var(--muted-foreground)' : undefined,
  };
}
