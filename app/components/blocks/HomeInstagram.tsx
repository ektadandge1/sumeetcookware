export type InstagramPost = {
  caption?: string;
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  permalink: string;
  thumbnailUrl?: string;
};

export function HomeInstagram({posts}: {posts: InstagramPost[]}) {
  if (!posts.length) return null;

  return (
    <section
      className="home-section home-instagram"
      aria-labelledby="instagram-title"
    >
      <div className="home-section-heading">
        <div className="home-section-heading-left">
          <p className="home-eyebrow">Follow along</p>
          <h2 id="instagram-title">@sumeetcookware</h2>
        </div>
        <a
          className="home-instagram-follow"
          href="https://www.instagram.com/sumeetcookware/"
          rel="noopener noreferrer"
          target="_blank"
        >
          Follow us
        </a>
      </div>
      <div className="home-instagram-grid">
        {posts.map((post) => (
          <a
            aria-label={post.caption || 'View Sumeet Cookware on Instagram'}
            className="home-instagram-card"
            href={post.permalink}
            key={post.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            {post.mediaType === 'VIDEO' ? (
              <video
                aria-label={post.caption || 'Sumeet Cookware on Instagram'}
                muted
                playsInline
                poster={post.thumbnailUrl}
                preload="metadata"
                src={post.mediaUrl}
              />
            ) : (
              <img
                alt={post.caption || 'Sumeet Cookware on Instagram'}
                loading="lazy"
                src={post.mediaUrl}
              />
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
