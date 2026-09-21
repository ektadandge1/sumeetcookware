import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {MockShopNotice} from '~/components/MockShopNotice';
import {HomeHero} from '~/components/blocks/HomeHero';
import {HomeServiceBenefits} from '~/components/blocks/HomeServiceBenefits';
import {HomeCategoryStrip} from '~/components/blocks/HomeCategoryStrip';
import {HomeProductSections} from '~/components/blocks/HomeProductSections';
import {HomeOfferBanner} from '~/components/blocks/HomeOfferBanner';
import {HomeWhyChoose} from '~/components/blocks/HomeWhyChoose';
import {HomeBusinessBuyers} from '~/components/blocks/HomeBusinessBuyers';
import {HomeGifting} from '~/components/blocks/HomeGifting';
import {HomeEssentials} from '~/components/blocks/HomeEssentials';
import {HomeCustomerStories} from '~/components/blocks/HomeCustomerStories';
import {HomeReviews} from '~/components/blocks/HomeReviews';
import {HomeCustomerBanner} from '~/components/blocks/HomeCustomerBanner';
import {HomeRecipes} from '~/components/blocks/HomeRecipes';
import {HomeDiscountPopup} from '~/components/HomeDiscountPopup';

export const meta: Route.MetaFunction = () => [{title: 'Sumeet Cookware'}];

export async function loader(args: Route.LoaderArgs) {
  return {
    ...loadDeferredData(args),
    isShopLinked: Boolean(args.context.env.PUBLIC_STORE_DOMAIN),
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {recommendedProducts};
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="home">
      {data.isShopLinked ? null : <MockShopNotice />}
      <HomeHero />
      <HomeServiceBenefits />
      <HomeCategoryStrip />
      <HomeProductSections products={data.recommendedProducts} />
      <HomeOfferBanner />
      <HomeWhyChoose />
      <HomeBusinessBuyers />
      <HomeGifting />
      <HomeEssentials />
      <HomeCustomerStories />
      <HomeReviews />
      <HomeCustomerBanner />
      <HomeRecipes />
      <HomeDiscountPopup />
    </div>
  );
}

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      availableForSale
      id
      compareAtPrice {
        amount
        currencyCode
      }
      price {
        amount
        currencyCode
      }
      image {
        id
        url
        altText
        width
        height
      }
      product {
        title
        handle
      }
      selectedOptions {
        name
        value
      }
      title
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: BEST_SELLING) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
