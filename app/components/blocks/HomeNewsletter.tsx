import {useFetcher} from 'react-router';

type NewsletterResponse = {
  status: 'success' | 'error';
};

export function HomeNewsletter() {
  const fetcher = useFetcher<NewsletterResponse>();
  const isSubmitting = fetcher.state !== 'idle';
  const responseStatus = fetcher.data?.status;

  return (
    <section
      aria-labelledby="home-newsletter-title"
      className="home-newsletter"
    >
      <h2 id="home-newsletter-title">Join Sumeet Kitchen</h2>
      <fetcher.Form action="/newsletter" method="post">
        <label className="sr-only" htmlFor="home-newsletter-email">
          Enter your mail id
        </label>
        <input
          id="home-newsletter-email"
          name="contact[email]"
          placeholder="enter your mail id"
          required
          type="email"
        />
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </button>
      </fetcher.Form>
      {responseStatus ? (
        <p
          aria-live="polite"
          className={`home-newsletter-status is-${responseStatus}`}
        >
          {responseStatus === 'success'
            ? 'Thanks for subscribing!'
            : 'We could not subscribe you. Please try again.'}
        </p>
      ) : null}
    </section>
  );
}
