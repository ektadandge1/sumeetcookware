import {Link} from 'react-router';
import type {Route} from './+types/blogs.$blogHandle._index';

const FEATURE_IMAGE =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/middle_banner.jpg?v=1789964765';

const BLOG_STORIES = [
  {
    handle: 'from-breakfast-to-dinner-easy-indian-recipes-using-everyday-cookware',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Rectangle_123_8208d3f8-89a7-4c0f-84a0-754377f22107.png?v=1789621673',
  },
  {
    handle: '5-quickest-easiest-food-items-for-breakfast',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Rectangle_121_60d08e74-8048-46c5-a5ae-ae5282478377.png?v=1789621673',
  },
  {
    handle: 'how-to-choose-the-right-cookware-for-your-kitchen',
    image:
      'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Rectangle_122_df844a95-4d5e-4d75-a599-e6da17ac5601.png?v=1789621673',
  },
] as const;

const STORY_TITLE =
  'From Breakfast to Dinner: Easy Indian Recipes Using Everyday Cookware';
const STORY_COPY =
  "Some days begin with a quick breakfast, move into a rushed lunch, and end with everyone gathering around the dinner table. Through it all, the kitchen keeps working. The good news? Everyday Indian cooking doesn't need complicated recipes or a cupboard full of specialized utensils. With a few dependable cookware essentials, you can prepare comforting meals from morning to night.";

export const meta: Route.MetaFunction = () => [{title: 'Sumeet Cookware | Blogs'}];

export function loader() {
  return null;
}

export default function Blog() {
  return (
    <div className="editorial-blog-page">
      <h1>Blogs</h1>
      <section className="editorial-blog-feature">
        <h2>
          From Grandma&apos;s Kitchen to Today&apos;s Kitchen:
          <br />
          What Has Really Changed?
        </h2>
        <div className="editorial-blog-feature-media">
          <img
            src={FEATURE_IMAGE}
            alt="From Grandma's Kitchen to Today's Kitchen"
          />
        </div>
        <div className="editorial-blog-intro">
          <p>
            There was a time when the kitchen seemed to have its own rhythm.
            Spices were measured by instinct, recipes were remembered rather
            than written down, and the sound of something sizzling in a hot pan
            could bring everyone to the dining table. Grandmothers rarely needed
            a recipe book to know how much turmeric belonged in the dal or when
            the tadka was ready.
          </p>
          <p>
            Today, kitchens look different. Appliances have changed, cooking
            routines are faster, and cookware has evolved with modern
            lifestyles. Yet, surprisingly, many of the things that matter most
            about cooking have stayed the same.
            <br />
            So, what really changed between grandma&apos;s kitchen and ours?
          </p>
        </div>
        <div className="editorial-blog-list">
          {BLOG_STORIES.map((story) => (
            <article className="editorial-blog-card" key={story.handle}>
              <Link
                className="editorial-blog-card-image"
                to={`/blogs/kitchen/${story.handle}`}
              >
                <img src={story.image} alt={STORY_TITLE} loading="lazy" />
              </Link>
              <div className="editorial-blog-card-copy">
                <h3>{STORY_TITLE}</h3>
                <p>{STORY_COPY}</p>
                <Link
                  className="editorial-blog-more"
                  to={`/blogs/kitchen/${story.handle}`}
                >
                  See More
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
