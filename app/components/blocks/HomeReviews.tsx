import {SectionHeading} from './SectionHeading';

export function HomeReviews() {
  return (
    <section
      className="home-section home-reviews"
      aria-labelledby="reviews-title"
    >
      <SectionHeading id="reviews-title" title="Reviews" />
      <div className="home-review-grid">
        {[0, 1, 2].map((index) => (
          <article className="home-review-card" key={index}>
            <div className="home-review-author">
              <span className="home-avatar" aria-hidden="true" />
              <strong>Rohit Chavan</strong>
              <span className="home-stars" aria-label="4 out of 5 stars">
                ★★★★<i>★</i>
              </span>
            </div>
            <p>
              Lorem Ipsum is simply dummy text of the printing and typesetting
              industry. Lorem Ipsum has been the industry&apos;s standard dummy
              text ever since 1966, when designers at Letraset and James Mosley,
              the librarian at St Bride Printing Library in London, took a 1914
              Cicero translation and scrambled it to make dummy text for
              Letraset&apos;s Body Type sheets.
            </p>
          </article>
        ))}
      </div>
      <div className="home-review-dots" aria-hidden="true">
        <i className="is-active" />
        <i />
        <i />
      </div>
    </section>
  );
}
