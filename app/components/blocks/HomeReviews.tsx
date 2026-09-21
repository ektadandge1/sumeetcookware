import {SectionHeading} from './SectionHeading';

export function HomeReviews() {
  return (
    <section className="home-section home-reviews" aria-labelledby="reviews-title">
      <SectionHeading id="reviews-title" title="Reviews" />
      <div className="home-review-grid">
        {['Rohit Chavan', 'Priya Shah', 'Anita Mehta'].map((name) => (
          <article className="home-review-card" key={name}>
            <div className="home-review-author">
              <span className="home-avatar">{name.charAt(0)}</span>
              <strong>{name}</strong>
              <span className="home-stars">★★★★★</span>
            </div>
            <p>Beautiful finish, even cooking, and exactly the quality I wanted for my kitchen.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
