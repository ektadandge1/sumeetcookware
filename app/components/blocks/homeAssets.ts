export const FIGMA_ASSETS = {
  hero: 'https://www.figma.com/api/mcp/asset/8f059ef3-1317-4191-84f5-de4b50b69369.png',
  heroAlt: 'https://www.figma.com/api/mcp/asset/cab50cb7-ae43-482a-8d7e-9966e1a4eb3b.png',
  categoryOne: 'https://www.figma.com/api/mcp/asset/562acde9-beb8-40c9-ae44-15faffd2e9e5.png',
  categoryTwo: 'https://www.figma.com/api/mcp/asset/f6a98c03-190a-4834-905b-67610bcedeff.png',
  categoryThree: 'https://www.figma.com/api/mcp/asset/c96a1cdd-1ebe-4c73-9bd0-0dcb7a7d9950.png',
  categoryFour: 'https://www.figma.com/api/mcp/asset/3fb0e5d7-0f72-4492-85b8-ce51642d4204.png',
  categoryFive: 'https://www.figma.com/api/mcp/asset/1a968803-1bd7-4e1b-bd26-f6d511652525.png',
  offer: 'https://www.figma.com/api/mcp/asset/5c8d4886-4900-4918-a528-733a4369adde.png',
  middleBanner: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/middle_banner.jpg?v=1789964765',
  businessBackground: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Middle_banner_BG.jpg?v=1789964766',
  giftBanner: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Gift_Banner_1.jpg?v=1789965171',
  whyChoose: 'https://www.figma.com/api/mcp/asset/fe1f04c0-6d56-4e56-bb75-d4cfd0034e3f.png',
  gifting: 'https://www.figma.com/api/mcp/asset/8f18f9c9-f7ab-429b-8911-f7a95b1d7b0c.png',
  essentialOne: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/For_Cooking.jpg?v=1789971804',
  essentialTwo: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/For_Storage.jpg?v=1789971804',
  essentialThree: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/For_Serving.jpg?v=1789971804',
  essentialFour: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/for_kitchen.jpg?v=1789971804',
  recipeOne: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Rectangle_123_8208d3f8-89a7-4c0f-84a0-754377f22107.png?v=1789621673',
  recipeTwo: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Rectangle_121_60d08e74-8048-46c5-a5ae-ae5282478377.png?v=1789621673',
  recipeThree: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Rectangle_122_df844a95-4d5e-4d75-a599-e6da17ac5601.png?v=1789621673',
} as const;

export const categories = [
  {
    label: 'Kadhai',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Kadhai.jpg?v=1789710351',
  },
  {
    label: 'Water Bottle',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Container.jpg?v=1789710351',
  },
  {
    label: 'Dinner Set',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Dinner_set.jpg?v=1789710351',
  },
  {
    label: 'Storage',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Storage.jpg?v=1789710351',
  },
  {
    label: 'Fry Pan',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Pan.jpg?v=1789710351',
  },
];

export const essentials = [
  {label: 'For Cooking', image: FIGMA_ASSETS.essentialOne},
  {label: 'For Storage', image: FIGMA_ASSETS.essentialTwo},
  {label: 'For Serving', image: FIGMA_ASSETS.essentialThree},
  {label: 'For Kitchen', image: FIGMA_ASSETS.essentialFour},
];

export const gifts = [
  'Wedding Gift',
  'Diwali Gift',
  'Housewarming Gift',
  'Corporate Gift',
  'Festive Gifting',
  'Return Gift',
  'Gift for Her',
  'Gift for Him',
];
