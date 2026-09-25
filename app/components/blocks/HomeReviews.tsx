import {useEffect, useState} from 'react';
import {SectionHeading} from './SectionHeading';

export type HomeReview = {
  body: string;
  id: number;
  name: string;
  productExternalId?: string;
  productHandle?: string;
  rating: number;
};

export function HomeReviews({reviews}: {reviews: HomeReview[]}) {
  const [cardsPerSlide, setCardsPerSlide] = useState(3);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMobilePeek, setShowMobilePeek] = useState(false);
  const slides = chunkReviews(reviews, cardsPerSlide);
  const slideOffset = showMobilePeek
    ? `calc(-${currentSlide * (200 / 3)}% - ${currentSlide * 0.75}rem)`
    : `-${currentSlide * 100}%`;

  useEffect(() => {
    const tabletQuery = window.matchMedia('(max-width: 64em)');
    const mobileQuery = window.matchMedia('(max-width: 48em)');
    const updateLayout = () => {
      setCardsPerSlide(tabletQuery.matches ? 1 : 3);
      setShowMobilePeek(mobileQuery.matches);
    };

    updateLayout();
    tabletQuery.addEventListener('change', updateLayout);
    mobileQuery.addEventListener('change', updateLayout);
    return () => {
      tabletQuery.removeEventListener('change', updateLayout);
      mobileQuery.removeEventListener('change', updateLayout);
    };
  }, []);

  useEffect(() => {
    setCurrentSlide((slide) => Math.min(slide, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    if (
      isPaused ||
      slides.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <section
      className="home-section home-reviews"
      aria-labelledby="reviews-title"
    >
      <SectionHeading
        id="reviews-title"
        mobileTitle="Testimonials"
        title="Reviews"
      />
      {reviews.length ? (
        <div
          className="home-review-carousel"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsPaused(false);
            }
          }}
          onFocus={() => setIsPaused(true)}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="home-review-track"
            style={{transform: `translateX(${slideOffset})`}}
          >
            {slides.map((slide) => (
              <div className="home-review-grid" key={slide[0]?.id}>
                {slide.map((review) => (
                  <article className="home-review-card" key={review.id}>
                    <div className="home-review-author">
                      <span className="home-avatar" aria-hidden="true" />
                      <strong>{review.name}</strong>
                      <span
                        className="home-stars"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        {STAR_POSITIONS.map((index) => (
                          <i
                            aria-hidden="true"
                            className={
                              index < review.rating ? 'is-filled' : undefined
                            }
                            key={`star-${index}`}
                          >
                            ★
                          </i>
                        ))}
                      </span>
                    </div>
                    <p>{review.body}</p>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="home-empty">Customer reviews will appear here soon.</p>
      )}
      {slides.length > 1 ? (
        <div className="home-review-dots">
          {slides.map((slide, index) => (
            <button
              aria-label={`Show review slide ${index + 1}`}
              aria-pressed={index === currentSlide}
              className={index === currentSlide ? 'is-active' : undefined}
              key={slide[0]?.id}
              onClick={() => setCurrentSlide(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function chunkReviews(reviews: HomeReview[], size: number) {
  return Array.from({length: Math.ceil(reviews.length / size)}, (_, index) =>
    reviews.slice(index * size, (index + 1) * size),
  );
}

const STAR_POSITIONS = [0, 1, 2, 3, 4] as const;
