import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {FIGMA_ASSETS, gifts} from './homeAssets';
import {SectionHeading} from './SectionHeading';

export function HomeGifting() {
  const leftGifts = gifts.slice(0, 4);
  const rightGifts = gifts.slice(4);

  return (
    <section
      className="home-section home-gifting"
      aria-labelledby="gifting-title"
    >
      <span className="home-gifting-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <path d="M6 20h36v9H6zM10 29h28v15H10zM24 20v24" />
          <path d="M24 20H13.5a5.5 5.5 0 1 1 5.2-7.3L24 20Zm0 0h10.5a5.5 5.5 0 1 0-5.2-7.3L24 20Z" />
        </svg>
      </span>
      <SectionHeading
        id="gifting-title"
        title="Perfect gift for every occasion"
      />
      <p className="home-section-intro">
        Thoughtfully curated cookware gifts for weddings, housewarmings,
        festivals, birthdays, and corporate gifting.
      </p>
      <div className="home-gifting-grid">
        <nav
          className="home-gifting-links home-gifting-links-left"
          aria-label="Gift occasions"
        >
          {leftGifts.map((gift) => (
            <Link className="home-outline-button" key={gift} to="/collections">
              {gift}
            </Link>
          ))}
        </nav>
        <FigmaImage
          alt="Sumeet cookware gift"
          className="home-gifting-image"
          src={FIGMA_ASSETS.giftBanner}
        />
        <nav
          className="home-gifting-links home-gifting-links-right"
          aria-label="More gift occasions"
        >
          {rightGifts.map((gift) => (
            <Link className="home-outline-button" key={gift} to="/collections">
              {gift}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
