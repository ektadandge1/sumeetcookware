import {useEffect, useState} from 'react';
import {Link} from 'react-router';

const TRIPLY_BANNERS = [
  {
    alt: 'Triply kadhai showing its stainless steel, aluminum core, and magnetic steel layers',
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Slider_Banners_kadhai_1.png?v=1790316384',
  },
  {
    alt: 'Triply saucepan showing its stainless steel, aluminum core, and magnetic steel layers',
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Slider_Banners_Saucpan_2.png?v=1790316384',
  },
  {
    alt: 'Triply tope showing its stainless steel, aluminum core, and magnetic steel layers',
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Slider_Banners_Tope_1.png?v=1790316384',
  },
] as const;

export function HomeMobileExperience() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = window.setInterval(() => {
      setCurrentBanner((banner) => (banner + 1) % TRIPLY_BANNERS.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="home-mobile-experience">
      <section className="home-mobile-triply" aria-labelledby="triply-title">
        <p>Experience the</p>
        <h2 id="triply-title">TriPly</h2>
        <p className="home-mobile-triply-subtitle">Advantage</p>
        <div className="home-mobile-triply-media">
          <div
            className="home-mobile-triply-track"
            style={{transform: `translateX(-${currentBanner * 100}%)`}}
          >
            {TRIPLY_BANNERS.map((banner, index) => (
              <div
                aria-hidden={index !== currentBanner}
                className="home-mobile-triply-slide"
                key={banner.src}
              >
                <img
                  alt={banner.alt}
                  decoding="async"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  src={banner.src}
                />
              </div>
            ))}
          </div>
        </div>
        <ul>
          <li>Even Heat</li>
          <li>Built to Last</li>
          <li>Faster Cooking</li>
          <li>All Cooktops</li>
        </ul>
      </section>

      <section
        className="home-mobile-assistant"
        aria-labelledby="assistant-title"
      >
        <h2 id="assistant-title">
          Meet <strong>Sumeet Kitchen</strong> Assistant
        </h2>
        <div className="home-mobile-assistant-card">
          <p>Find the right cookware, compare products, discover recipes</p>
          <Link to="/search">1. What are you looking for today?</Link>
          <Link to="/collections/all">2. What&rsquo;s your budget?</Link>
          <Link to="/collections/kitchen-utility">
            3. Which cooktop do you use?
          </Link>
          <Link to="/collections/gifts">4. What would you like to gift?</Link>
        </div>
      </section>
    </div>
  );
}

export function HomeMobileActions() {
  return (
    <section className="home-mobile-actions" aria-label="Business and gifting">
      <a href="https://sumeetcookware.in/contact">Bulk Inquiry</a>
      <Link to="/collections/gifts">Order Gifts</Link>
    </section>
  );
}
