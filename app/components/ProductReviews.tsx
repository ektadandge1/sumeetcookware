import {useMemo, useState} from 'react';
import {useFetcher} from 'react-router';
import type {ProductReview} from '~/lib/judgeme.server';

const STAR_POSITIONS = [1, 2, 3, 4, 5] as const;
const INITIAL_REVIEW_COUNT = 3;

export function ProductReviews({reviews}: {reviews: ProductReview[]}) {
  const fetcher = useFetcher<{error?: string; success?: boolean}>();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(INITIAL_REVIEW_COUNT);
  const [showForm, setShowForm] = useState(false);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = normalizedQuery
      ? reviews.filter(
          (review) =>
            review.body.toLowerCase().includes(normalizedQuery) ||
            review.name.toLowerCase().includes(normalizedQuery),
        )
      : [...reviews];

    return result.sort((first, second) => {
      if (sort === 'highest') return second.rating - first.rating;
      if (sort === 'lowest') return first.rating - second.rating;
      const firstDate = first.createdAt ? Date.parse(first.createdAt) : first.id;
      const secondDate = second.createdAt
        ? Date.parse(second.createdAt)
        : second.id;
      return sort === 'oldest'
        ? firstDate - secondDate
        : secondDate - firstDate;
    });
  }, [query, reviews, sort]);

  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) /
      reviews.length
    : 0;
  const ratingCounts = STAR_POSITIONS.map(
    (rating) => reviews.filter((review) => review.rating === rating).length,
  );
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <section className="product-reviews" aria-labelledby="product-reviews-title">
      <div className="product-reviews-summary">
        <ReviewBubbleIcon />
        <h2>Customer<br />Reviews</h2>
        <strong>{average.toFixed(1)}</strong>
        <div className="product-review-summary-line">
          <Stars rating={Math.round(average)} />
          <span>{reviews.length} Reviews</span>
        </div>
        <div className="product-review-breakdown">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingCounts[rating - 1];
            return (
              <div key={rating}>
                <span>{rating}</span>
                <i>
                  <b
                    style={{
                      width: `${reviews.length ? (count / reviews.length) * 100 : 0}%`,
                    }}
                  />
                </i>
                <small>{count}</small>
              </div>
            );
          })}
        </div>
      </div>

      <div className="product-reviews-content">
        <h2 id="product-reviews-title">Reviews ({reviews.length})</h2>
        <div className="product-reviews-toolbar">
          <label className="product-review-search">
            <SearchIcon />
            <span className="visually-hidden">Search reviews</span>
            <input
              disabled={!reviews.length}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(INITIAL_REVIEW_COUNT);
              }}
              placeholder="Search for review"
              type="search"
              value={query}
            />
          </label>
          <select
            aria-label="Sort reviews"
            disabled={!reviews.length}
            onChange={(event) => setSort(event.target.value)}
            value={sort}
          >
            <option value="newest">Sort by date</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest rating</option>
            <option value="lowest">Lowest rating</option>
          </select>
          <button type="button" onClick={() => setShowForm((value) => !value)}>
            Write A Review
          </button>
        </div>

        {showForm ? (
          <fetcher.Form className="product-review-form" method="post">
            <input name="intent" type="hidden" value="submit-review" />
            <label>
              Your name
              <input name="name" required type="text" />
            </label>
            <label>
              Email
              <input name="email" required type="email" />
            </label>
            <label>
              Rating
              <select defaultValue="5" name="rating">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>{rating} stars</option>
                ))}
              </select>
            </label>
            <label className="product-review-form-body">
              Review
              <textarea name="body" required rows={4} />
            </label>
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            {fetcher.data?.success ? (
              <p role="status">Thank you. Your review was submitted for approval.</p>
            ) : null}
            {fetcher.data?.error ? (
              <p className="product-review-form-error" role="alert">{fetcher.data.error}</p>
            ) : null}
          </fetcher.Form>
        ) : null}

        <div className="product-review-list">
          {filteredReviews.slice(0, visibleCount).map((review) => (
            <article className="product-review-card" key={review.id}>
              <span className="product-review-avatar" aria-hidden="true">
                {getInitials(review.name)}
              </span>
              <div>
                <header>
                  <strong>{review.name}</strong>
                  <Stars rating={review.rating} />
                </header>
                <p>{review.body}</p>
              </div>
            </article>
          ))}
          {!filteredReviews.length ? (
            <div className="product-review-empty">
              <strong>
                {reviews.length ? 'No matching reviews' : 'No reviews yet'}
              </strong>
              <p>
                {reviews.length
                  ? 'Try a different search term.'
                  : 'Be the first to share your experience with this product.'}
              </p>
              {!reviews.length ? (
                <button type="button" onClick={() => setShowForm(true)}>
                  Write The First Review
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {visibleCount < filteredReviews.length ? (
          <button
            className="product-reviews-load"
            onClick={() => setVisibleCount((count) => count + 3)}
            type="button"
          >
            Load More <span aria-hidden="true">⌄</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function Stars({rating}: {rating: number}) {
  return (
    <span className="product-review-stars" aria-label={`${rating} out of 5 stars`}>
      {STAR_POSITIONS.map((position) => (
        <i className={position <= rating ? 'is-filled' : undefined} key={position}>★</i>
      ))}
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function SearchIcon() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
}

function ReviewBubbleIcon() {
  return (
    <svg aria-hidden="true" className="product-review-bubble" fill="none" viewBox="0 0 80 70">
      <path d="M13 9h54a7 7 0 0 1 7 7v31a7 7 0 0 1-7 7H46L36 66l2-12H13a7 7 0 0 1-7-7V16a7 7 0 0 1 7-7Z" />
      <path d="m40 17 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" fill="currentColor" />
    </svg>
  );
}
