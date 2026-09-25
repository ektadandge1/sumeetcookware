import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {categories} from './homeAssets';
import {SectionHeading} from './SectionHeading';

const mobileCategories = [
  categories[0],
  {
    label: 'Water Bottles',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/products/THERMOMED-1PC_1.jpg?v=1617107671',
    to: '/collections/water-bottle',
  },
  {
    label: 'Spoons',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/products/41kMXPgD30L_da9f595c-1013-43cf-bce1-a62122b222b2.jpg?v=1693647016',
    to: '/search?q=spoon',
  },
  {
    label: 'Non-stick Kadhai',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Pan.jpg?v=1789710351',
    to: '/collections/non-stick-kadhai',
  },
] as const;

export function HomeCategoryStrip() {
  return (
    <section
      className="home-section home-category-section"
      aria-labelledby="categories-title"
    >
      <SectionHeading id="categories-title" title="Popular Categories" />
      <div className="home-category-grid home-category-grid-desktop">
        {categories.map((category) => (
          <Link
            className="home-category-card"
            key={category.label}
            to={category.to}
          >
            <div className="home-category-image">
              <FigmaImage alt={category.label} src={category.image} />
            </div>
            <span>{category.label}</span>
          </Link>
        ))}
      </div>
      <div className="home-category-grid home-category-grid-mobile">
        {mobileCategories.map((category) => (
          <Link
            className="home-category-card"
            key={category.label}
            to={category.to}
          >
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
