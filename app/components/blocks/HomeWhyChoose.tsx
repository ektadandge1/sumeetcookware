import {FigmaImage} from './FigmaImage';
import {FIGMA_ASSETS} from './homeAssets';

export function HomeWhyChoose() {
  return (
    <section className="home-why" aria-label="Why Choose Sumeet">
      <FigmaImage
        alt="Why Choose Sumeet: premium steel, warranty, ISI certification, and food-grade material"
        src={FIGMA_ASSETS.middleBanner}
      />
    </section>
  );
}
