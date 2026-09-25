import {Link} from 'react-router';
import {useAside} from './Aside';

export function MobileBottomNav() {
  const {open} = useAside();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile shortcuts">
      <Link aria-label="Home" to="/">
        <HomeIcon />
      </Link>
      <button aria-label="Open cart" onClick={() => open('cart')} type="button">
        <CartIcon />
      </button>
      <Link aria-label="Shop all categories" to="/collections/all">
        <GridIcon />
      </Link>
      <Link aria-label="Best sellers" to="/collections/best-deal-of-the-day">
        <SortIcon />
      </Link>
      <button
        aria-label="Open menu"
        onClick={() => open('mobile')}
        type="button"
      >
        <FilterIcon />
      </button>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 4h2l2 11h11l2-8H6M9 20h.01M17 20h.01" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M8 3v18m0 0-4-4m4 4 4-4M16 21V3m0 0-4 4m4-4 4 4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 4h18l-7 8v7l-4 2v-9Z" />
    </svg>
  );
}
