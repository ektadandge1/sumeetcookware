import {Link} from 'react-router';
import {useRef, type PointerEvent, type WheelEvent} from 'react';
import {FigmaImage} from './FigmaImage';
import {categories} from './homeAssets';
import {SectionHeading} from './SectionHeading';

export function HomeCategoryStrip() {
  const desktopGridRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{scrollLeft: number; x: number} | null>(null);
  const suppressCategoryClick = useRef(false);
  const scrollCategories = (direction: -1 | 1) => {
    const grid = desktopGridRef.current;
    if (!grid) return;

    grid.scrollBy({
      behavior: 'smooth',
      left: direction * grid.clientWidth * 0.8,
    });
  };
  const scrollCategoriesWithWheel = (event: WheelEvent<HTMLDivElement>) => {
    const grid = event.currentTarget;
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    const maxScroll = grid.scrollWidth - grid.clientWidth;

    if (
      !delta ||
      (delta < 0 && grid.scrollLeft <= 0) ||
      (delta > 0 && grid.scrollLeft >= maxScroll)
    ) {
      return;
    }

    event.preventDefault();
    grid.scrollLeft += delta;
  };
  const startCategoryDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    dragStart.current = {
      scrollLeft: event.currentTarget.scrollLeft,
      x: event.clientX,
    };
    suppressCategoryClick.current = false;
  };
  const moveCategoryDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;

    const distance = event.clientX - dragStart.current.x;
    if (Math.abs(distance) >= 6) {
      suppressCategoryClick.current = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    event.currentTarget.scrollLeft = dragStart.current.scrollLeft - distance;
  };
  const finishCategoryDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section
      className="home-section home-category-section"
      aria-labelledby="categories-title"
    >
      <SectionHeading id="categories-title" title="Popular Categories" />
      <div className="home-category-carousel">
        <button
          aria-label="Show previous categories"
          className="home-category-arrow is-previous"
          onClick={() => scrollCategories(-1)}
          type="button"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div
          className="home-category-grid home-category-grid-desktop"
          onClickCapture={(event) => {
            if (!suppressCategoryClick.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressCategoryClick.current = false;
          }}
          onDragStart={(event) => event.preventDefault()}
          onLostPointerCapture={finishCategoryDrag}
          onPointerCancel={finishCategoryDrag}
          onPointerDown={startCategoryDrag}
          onPointerMove={moveCategoryDrag}
          onPointerUp={finishCategoryDrag}
          onWheel={scrollCategoriesWithWheel}
          ref={desktopGridRef}
        >
          {categories.map((category) => (
            <Link
              className="home-category-card"
              key={category.label}
              prefetch="intent"
              to={category.to}
            >
              <div className="home-category-image">
                <FigmaImage alt={category.label} src={category.image} />
              </div>
              <span>{category.label}</span>
            </Link>
          ))}
        </div>
        <button
          aria-label="Show next categories"
          className="home-category-arrow is-next"
          onClick={() => scrollCategories(1)}
          type="button"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div className="home-category-grid home-category-grid-mobile">
        {categories.map((category) => (
          <Link
            className="home-category-card"
            key={category.label}
            prefetch="intent"
            to={category.to}
          >
            <div className="home-category-image">
              <FigmaImage alt={category.label} src={category.image} />
            </div>
            <span>{category.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
