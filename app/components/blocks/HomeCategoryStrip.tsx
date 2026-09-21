import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {categories} from './homeAssets';
import {SectionHeading} from './SectionHeading';

export function HomeCategoryStrip() {
  return (
    <section className="home-section home-category-section" aria-labelledby="categories-title">
      <SectionHeading id="categories-title" title="Popular Categories" />
      <div className="home-category-grid">
        {categories.map((category) => (
          <Link className="home-category-card" key={category.label} to="/collections">
            <div className="home-category-image">
              <FigmaImage alt={category.label} src={category.image} />
            </div>
            <span>{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
