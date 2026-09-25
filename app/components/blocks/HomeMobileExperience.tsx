import {Link} from 'react-router';

const TRIPLY_IMAGE =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Kadhai.jpg?v=1789710351';

export function HomeMobileExperience() {
  return (
    <div className="home-mobile-experience">
      <section className="home-mobile-triply" aria-labelledby="triply-title">
        <p>Experience the</p>
        <h2 id="triply-title">TriPly</h2>
        <p className="home-mobile-triply-subtitle">Advantage</p>
        <div className="home-mobile-triply-media">
          <img
            alt="Sumeet Triply stainless steel cookware"
            src={TRIPLY_IMAGE}
          />
          <span className="is-left">18/8 Stainless Steel</span>
          <span className="is-right">Magnetic Steel Base</span>
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
