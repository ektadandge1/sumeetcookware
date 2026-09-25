import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {FIGMA_ASSETS} from './homeAssets';
import {SectionHeading} from './SectionHeading';

export function HomeRecipes() {
  const recipes = [
    {label: 'Biryani', image: FIGMA_ASSETS.recipeOne, to: '/blogs/kitchen'},
    {
      label: 'Breakfast',
      image: FIGMA_ASSETS.recipeTwo,
      to: '/blogs/kitchen/5-quickest-easiest-food-items-for-breakfast',
    },
    {
      label: 'Dal',
      image: FIGMA_ASSETS.recipeThree,
      to: '/blogs/kitchen/how-to-make-a-moong-dal-cheela-for-weight-loss',
    },
  ];
  return (
    <section
      className="home-section home-recipes"
      aria-labelledby="recipes-title"
    >
      <SectionHeading id="recipes-title" title="Recipe Inspiration" />
      <div className="home-recipe-grid">
        {recipes.map((recipe) => (
          <Link className="home-recipe-card" key={recipe.label} to={recipe.to}>
            <div className="home-recipe-image">
              <FigmaImage alt={recipe.label} src={recipe.image} />
            </div>
            <span>{recipe.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
