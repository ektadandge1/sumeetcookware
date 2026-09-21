import {CartForm, Money} from '@shopify/hydrogen';
import {Suspense, useRef, useState} from 'react';
import {Await, Link, NavLink, useFetchers} from 'react-router';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {CartIcon} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {SearchFormPredictive} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {HeartIcon} from '~/components/WishlistButton';
import {useWishlist} from '~/components/WishlistContext';

const SUMEET_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Sumeet_logo_PNG.png?v=1789986865';

interface HeaderProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

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
  const activeMenu = menu?.items?.length ? menu : FALLBACK_HEADER_MENU;
  const menuItems =
    viewport === 'mobile' ? FALLBACK_HEADER_MENU.items : activeMenu.items;

  return (
    <nav className={className} role="navigation">
      {menuItems.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
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
        <Await resolve={cart}>
          {(resolvedCart) => <HeaderCartToggle cart={resolvedCart} />}
        </Await>
      </Suspense>
    </nav>
  );
}

function HeaderCartToggle({cart}: {cart: CartApiQueryFragment | null}) {
  const {open} = useAside();
  const fetchers = useFetchers();
  const confirmedQuantity = cart?.totalQuantity ?? 0;
  let pendingQuantity = 0;
  let mutationQuantity = confirmedQuantity;

  for (const fetcher of fetchers) {
    if (!fetcher.formData) continue;

    try {
      const {action, inputs} = CartForm.getFormInput(fetcher.formData);
      if (action !== CartForm.ACTIONS.LinesAdd) continue;

      const returnedQuantity = (
        fetcher.data as {cart?: {totalQuantity?: unknown}} | undefined
      )?.cart?.totalQuantity;

      if (typeof returnedQuantity === 'number') {
        mutationQuantity = Math.max(mutationQuantity, returnedQuantity);
      } else {
        pendingQuantity += inputs.lines.reduce(
          (total, line) => total + (line.quantity ?? 1),
          0,
        );
      }
    } catch {
      // Ignore unrelated or malformed fetcher submissions.
    }
  }

  const quantity = mutationQuantity + pendingQuantity;

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
        <span aria-live="polite" className="header-cart-count">
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

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Kitchen Cookwares',
      type: 'HTTP',
      url: '/collections/kitchen-cookware',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Storage & Container',
      type: 'HTTP',
      url: '/collections/storage-container',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Tableware',
      type: 'HTTP',
      url: '/collections/tableware',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'Non-Stick',
      type: 'PAGE',
      url: '/collections/non-stick',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609632800',
      resourceId: null,
      tags: [],
      title: 'Warranty Registration',
      type: 'PAGE',
      url: '/pages/warranty-registration',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609666568',
      resourceId: null,
      tags: [],
      title: 'Bulk enquiry',
      type: 'PAGE',
      url: '/pages/bulk-enquiry',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609700336',
      resourceId: null,
      tags: [],
      title: 'Gifting',
      type: 'HTTP',
      url: '/pages/gifting',
      items: [],
    },
    {
      id: 'fallback-menu-blogs',
      resourceId: null,
      tags: [],
      title: 'Blogs',
      type: 'HTTP',
      url: '/blogs',
      items: [],
    },
    {
      id: 'fallback-menu-contact',
      resourceId: null,
      tags: [],
      title: 'Contact Us',
      type: 'HTTP',
      url: '/pages/contact-us',
      items: [],
    },
    {
      id: 'fallback-menu-about',
      resourceId: null,
      tags: [],
      title: 'About Us',
      type: 'HTTP',
      url: '/pages/about-us',
      items: [],
    },
  ],
};

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
