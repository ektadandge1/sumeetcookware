import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {essentials} from './homeAssets';
import {SectionHeading} from './SectionHeading';

const mobileEssentials = [
  {
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_339.png?v=1790244605',
    label: 'Grill Cooking',
    to: '/collections/all',
  },
  {
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_340.png?v=1790246478',
    label: 'Deep Fry',
    to: '/collections/all',
  },
  {
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_341.png?v=1790244605',
    label: 'Gifting',
    to: '/collections/all',
  },
  {
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Frame_342.png?v=1790244604',
    label: 'Non-Stick Cooking',
    to: '/collections/all',
  },
] as const;

export function HomeEssentials() {
  return (
    <section
      className="home-section home-essentials"
      aria-labelledby="essentials-title"
    >
      <SectionHeading
        id="essentials-title"
        mobileTitle="Shop By Need"
        title="Daily Essentials"
      />
      <div className="home-essentials-grid home-essentials-grid-desktop">
        {essentials.map((item) => (
          <Link className="home-essential-card" key={item.label} prefetch="intent" to={item.to}>
            <FigmaImage alt={item.label} src={item.image} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="home-essentials-grid home-essentials-grid-mobile">
        {mobileEssentials.map((item) => (
          <Link className="home-essential-card" key={item.label} prefetch="intent" to={item.to}>
            <span>{item.label}</span>
            <FigmaImage alt="" src={item.image} />
          </Link>
        ))}
      </div>
    </section>
  );
}
