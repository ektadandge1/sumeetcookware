import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {essentials} from './homeAssets';
import {SectionHeading} from './SectionHeading';

export function HomeEssentials() {
  return (
    <section
      className="home-section home-essentials"
      aria-labelledby="essentials-title"
    >
      <SectionHeading id="essentials-title" title="Daily Essentials" />
      <div className="home-essentials-grid">
        {essentials.map((item) => (
          <Link className="home-essential-card" key={item.label} to="/collections">
            <FigmaImage alt={item.label} src={item.image} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
