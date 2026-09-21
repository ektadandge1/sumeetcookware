import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';

const WISHLIST_STORAGE_KEY = 'sumeet-wishlist';

export type WishlistItem = {
  id: string;
  handle: string;
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  price?: string;
  currencyCode?: CurrencyCode;
};

type WishlistContextValue = {
  items: WishlistItem[];
  isWishlisted: (id: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({children}: {children: ReactNode}) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedItems = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedItems) {
        const parsedItems: unknown = JSON.parse(savedItems);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems.filter(isWishlistItem));
        }
      }
    } catch {
      // Ignore unavailable or malformed browser storage and start empty.
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Wishlist still works for the current session if storage is unavailable.
    }
  }, [isHydrated, items]);

  const isWishlisted = (id: string) => items.some((item) => item.id === id);

  const toggle = (item: WishlistItem) => {
    setItems((currentItems) =>
      currentItems.some((currentItem) => currentItem.id === item.id)
        ? currentItems.filter((currentItem) => currentItem.id !== item.id)
        : [...currentItems, item],
    );
  };

  const remove = (id: string) => {
    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== id),
    );
  };

  return (
    <WishlistContext.Provider value={{items, isWishlisted, remove, toggle}}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const wishlist = useContext(WishlistContext);
  if (!wishlist) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return wishlist;
}

function isWishlistItem(value: unknown): value is WishlistItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<WishlistItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.handle === 'string' &&
    typeof item.title === 'string'
  );
}
