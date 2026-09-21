import {FigmaImage} from './FigmaImage';
import {FIGMA_ASSETS} from './homeAssets';
import {SectionHeading} from './SectionHeading';

export function HomeCustomerStories() {
  const stories = [FIGMA_ASSETS.hero, FIGMA_ASSETS.heroAlt, FIGMA_ASSETS.whyChoose, FIGMA_ASSETS.gifting];
  return (
    <section className="home-stories" aria-labelledby="stories-title">
      <SectionHeading id="stories-title" title="Our Happy Customers" />
      <div className="home-story-grid">
        {stories.map((image, index) => (
          <div className="home-story-card" key={image}>
            <FigmaImage alt={`Customer story ${index + 1}`} src={image} />
            <span className="home-play">▶</span>
          </div>
        ))}
      </div>
    </section>
  );
}
