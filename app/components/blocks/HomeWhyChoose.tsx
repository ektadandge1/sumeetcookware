import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {FIGMA_ASSETS} from './homeAssets';

const MOBILE_WHY_CHOOSE_IMAGE =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Why_Sumeet.jpg?v=1790236922';

export function HomeWhyChoose() {
  return (
    <section className="home-why" aria-label="Why Choose Sumeet">
      <Link
        aria-label="Shop Sumeet stainless steel cookware"
        className="home-why-desktop"
        to="/collections/stainless-steel"
      >
        <FigmaImage
          alt="Why Choose Sumeet: premium steel, warranty, ISI certification, and food-grade material"
          src={FIGMA_ASSETS.middleBanner}
        />
      </Link>
      <Link
        aria-label="Shop Sumeet stainless steel cookware"
        className="home-why-mobile"
        to="/collections/stainless-steel"
      >
        <FigmaImage
          alt="Why Choose Sumeet: premium steel, warranty, ISI certification, and food-grade material"
          src={MOBILE_WHY_CHOOSE_IMAGE}
        />
      </Link>
    </section>
  );
}
