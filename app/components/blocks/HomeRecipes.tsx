import {Link} from 'react-router';
import {FigmaImage} from './FigmaImage';
import {FIGMA_ASSETS} from './homeAssets';
import {SectionHeading} from './SectionHeading';

export function HomeRecipes() {
  const recipes = [
    {label: 'Biryani', image: FIGMA_ASSETS.recipeOne},
    {label: 'Breakfast', image: FIGMA_ASSETS.recipeTwo},
    {label: 'Dal', image: FIGMA_ASSETS.recipeThree},
  ];
  return (
    <section className="home-section home-recipes" aria-labelledby="recipes-title">
      <SectionHeading id="recipes-title" title="Recipe Inspiration" />
      <div className="home-recipe-grid">
        {recipes.map((recipe) => (
          <Link className="home-recipe-card" key={recipe.label} to="/blogs/journal">
            <FigmaImage alt={recipe.label} src={recipe.image} />
            <span>{recipe.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
