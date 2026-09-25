const HERO_VIDEO_URL =
  'https://cdn.shopify.com/videos/c/o/v/3a51a52c0ccb4a02a933d7221c9f7c86.mp4';

export function HomeHero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <h1 className="sr-only" id="home-hero-title">
        Sumeet Cookware
      </h1>
      <Link
        aria-label="Shop the latest Sumeet offers"
        className="home-hero-media"
        to="/collections/best-offer"
      >
        <video
          aria-label="Sumeet cookware hero video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          src={HERO_VIDEO_URL}
        />
      </Link>
      <div className="home-hero-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </section>
  );
}
import {Link} from 'react-router';
