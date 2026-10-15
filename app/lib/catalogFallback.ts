const CDN_ROOT = 'https://cdn.shopify.com/s/files/1/0358/3511/7703';

export interface CatalogImage {
  altText: string;
  height: number;
  id: string;
  url: string;
  width: number;
}

export interface CatalogProduct {
  featuredImage: CatalogImage;
  handle: string;
  id: string;
  priceRange: {
    maxVariantPrice: CatalogMoney;
    minVariantPrice: CatalogMoney;
  };
  productType: string;
  selectedOrFirstAvailableVariant: CatalogVariant;
  tags: string[];
  title: string;
}

interface CatalogMoney {
  amount: string;
  currencyCode: 'INR';
}

interface CatalogVariant {
  availableForSale: boolean;
  compareAtPrice: CatalogMoney;
  id: string;
  image: CatalogImage;
  price: CatalogMoney;
  product: {handle: string; title: string};
  selectedOptions: Array<{name: string; value: string}>;
  title: string;
}

export interface CatalogCollection {
  description: string;
  handle: string;
  id: string;
  image: CatalogImage;
  products: {nodes: CatalogProduct[]};
  title: string;
}

const productSeeds = [
  {
    handle: 'classic-stainless-steel-kadhai',
    title: 'Classic Stainless Steel Kadhai',
    type: 'Kadhai',
    image: `${CDN_ROOT}/files/Kadhai.jpg?v=1789710351`,
    price: 1299,
  },
  {
    handle: 'stainless-steel-storage-container',
    title: 'Stainless Steel Storage Container',
    type: 'Storage & Container',
    image: `${CDN_ROOT}/files/Container.jpg?v=1789710351`,
    price: 899,
  },
  {
    handle: 'premium-stainless-steel-dinner-set',
    title: 'Premium Stainless Steel Dinner Set',
    type: 'Dinner Set',
    image: `${CDN_ROOT}/files/Dinner_set.jpg?v=1789710351`,
    price: 2499,
  },
  {
    handle: 'airtight-kitchen-storage-set',
    title: 'Airtight Kitchen Storage Set',
    type: 'Storage',
    image: `${CDN_ROOT}/files/Storage.jpg?v=1789710351`,
    price: 1499,
  },
  {
    handle: 'non-stick-fry-pan',
    title: 'Non-Stick Fry Pan',
    type: 'Non-Stick Cookware',
    image: `${CDN_ROOT}/files/Pan.jpg?v=1789710351`,
    price: 1099,
  },
  {
    handle: 'thermomed-insulated-water-bottle',
    title: 'Thermomed Insulated Water Bottle',
    type: 'Water Bottle',
    image: `${CDN_ROOT}/products/THERMOMED-1PC_1.jpg?v=1617107671`,
    price: 699,
  },
  {
    handle: 'hard-anodised-cookware-set',
    title: 'Hard Anodised Cookware Set',
    type: 'Cookware Set',
    image: `${CDN_ROOT}/products/41kMXPgD30L_da9f595c-1013-43cf-bce1-a62122b222b2.jpg?v=1693647016`,
    price: 1899,
  },
  {
    handle: 'stainless-steel-sauce-pan',
    title: 'Stainless Steel Sauce Pan',
    type: 'Sauce Pan',
    image: `${CDN_ROOT}/files/Pan.jpg?v=1789710351`,
    price: 999,
  },
] as const;

export const fallbackProducts: CatalogProduct[] = productSeeds.map(
  ({handle, image, price, title, type}, index) => {
    const productImage: CatalogImage = {
      altText: title,
      height: 800,
      id: `local-image-${index + 1}`,
      url: image,
      width: 800,
    };
    const currentPrice: CatalogMoney = {
      amount: String(price),
      currencyCode: 'INR',
    };
    const compareAtPrice: CatalogMoney = {
      amount: String(Math.round(price * 1.2)),
      currencyCode: 'INR',
    };

    return {
      featuredImage: productImage,
      handle,
      id: `gid://shopify/Product/local-${index + 1}`,
      priceRange: {
        maxVariantPrice: currentPrice,
        minVariantPrice: currentPrice,
      },
      productType: type,
      selectedOrFirstAvailableVariant: {
        availableForSale: true,
        compareAtPrice,
        id: `gid://shopify/ProductVariant/local-${index + 1}`,
        image: productImage,
        price: currentPrice,
        product: {handle, title},
        selectedOptions: [{name: 'Title', value: 'Default Title'}],
        title: 'Default Title',
      },
      tags: index < 3 ? ['Bestseller', type] : [type],
      title,
    };
  },
);

const collectionSeeds = [
  ['kadhai', 'Kadhai', 'Kadhai.jpg?v=1789710351', [0, 6]],
  ['storage', 'Storage & Container', 'Storage.jpg?v=1789710351', [1, 3]],
  ['dinner-set', 'Dinner Set', 'Dinner_set.jpg?v=1789710351', [2]],
  ['non-stick-cookware', 'Non-Stick Cookware', 'Pan.jpg?v=1789710351', [4]],
  ['water-bottle', 'Water Bottle', 'Container.jpg?v=1789710351', [5]],
  ['sauce-pan', 'Sauce Pan', 'Pan.jpg?v=1789710351', [7]],
] as const;

export const fallbackCollections: CatalogCollection[] = collectionSeeds.map(
  ([handle, title, image, productIndexes], index) => ({
    description: `Explore Sumeet ${title}, designed for dependable everyday cooking with lasting quality and performance.`,
    handle,
    id: `gid://shopify/Collection/local-${index + 1}`,
    image: {
      altText: title,
      height: 800,
      id: `local-collection-image-${index + 1}`,
      url: `${CDN_ROOT}/files/${image}`,
      width: 1200,
    },
    products: {nodes: productIndexes.map((productIndex) => fallbackProducts[productIndex])},
    title,
  }),
);

export function getFallbackCollection(handle: string): CatalogCollection {
  const collection = fallbackCollections.find((item) => item.handle === handle);
  if (collection) return collection;

  const title = handle
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');

  return {
    description: `Explore Sumeet ${title} products for your kitchen.`,
    handle,
    id: `gid://shopify/Collection/local-${handle}`,
    image: fallbackCollections[0].image,
    products: {nodes: fallbackProducts},
    title,
  };
}

export function getFallbackProduct(handle: string): CatalogProduct {
  const product = fallbackProducts.find((item) => item.handle === handle);
  if (product) return product;

  const title = handle
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
  const base = fallbackProducts[0];

  return {
    ...base,
    handle,
    id: `gid://shopify/Product/local-${handle}`,
    selectedOrFirstAvailableVariant: {
      ...base.selectedOrFirstAvailableVariant,
      id: `gid://shopify/ProductVariant/local-${handle}`,
      product: {handle, title},
    },
    title,
  };
}

export function fallbackConnection<T>(nodes: T[]) {
  return {
    nodes,
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}
