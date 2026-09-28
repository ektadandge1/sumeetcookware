import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';
import {BusinessEnquiryForm} from './HomeBusinessBuyers';
import {FIGMA_ASSETS} from './homeAssets';

const TRIPLY_BANNERS = [
  {
    alt: 'Triply kadhai showing its stainless steel, aluminum core, and magnetic steel layers',
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Slider_Banners_kadhai_1.png?v=1790316384',
  },
  {
    alt: 'Triply saucepan showing its stainless steel, aluminum core, and magnetic steel layers',
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Slider_Banners_Saucpan_2.png?v=1790316384',
  },
  {
    alt: 'Triply tope showing its stainless steel, aluminum core, and magnetic steel layers',
    src: 'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Slider_Banners_Tope_1.png?v=1790316384',
  },
] as const;

export function HomeMobileExperience() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = window.setInterval(() => {
      setCurrentBanner((banner) => (banner + 1) % TRIPLY_BANNERS.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="home-mobile-experience">
      <section className="home-mobile-triply" aria-labelledby="triply-title">
        <p>Experience the</p>
        <h2 id="triply-title">TriPly</h2>
        <p className="home-mobile-triply-subtitle">Advantage</p>
        <div className="home-mobile-triply-media">
          <div
            className="home-mobile-triply-track"
            style={{transform: `translateX(-${currentBanner * 100}%)`}}
          >
            {TRIPLY_BANNERS.map((banner, index) => (
              <div
                aria-hidden={index !== currentBanner}
                className="home-mobile-triply-slide"
                key={banner.src}
              >
                <img
                  alt={banner.alt}
                  decoding="async"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  src={banner.src}
                />
              </div>
            ))}
          </div>
        </div>
        <ul>
          <li>Even Heat</li>
          <li>Built to Last</li>
          <li>Faster Cooking</li>
          <li>All Cooktops</li>
        </ul>
      </section>

      <section
        className="home-mobile-assistant"
        aria-labelledby="assistant-title"
      >
        <h2 id="assistant-title">
          Meet <strong>Sumeet Kitchen</strong> Assistant
        </h2>
        <div className="home-mobile-assistant-card">
          <p>Find the right cookware, compare products, discover recipes</p>
          <Link to="/search">1. What are you looking for today?</Link>
          <Link to="/collections/all">2. What&rsquo;s your budget?</Link>
          <Link to="/collections/kitchen-utility">
            3. Which cooktop do you use?
          </Link>
          <Link to="/collections/gifts">4. What would you like to gift?</Link>
        </div>
      </section>
    </div>
  );
}

export function HomeMobileActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const giftDialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isGiftOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    giftDialogRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsGiftOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isGiftOpen]);

  return (
    <>
      <section
        className="home-mobile-actions"
        aria-label="Business and gifting"
      >
        <div className="home-mobile-action">
          <span className="home-mobile-action-arrow" aria-hidden="true">
            <svg viewBox="0 0 20 14" focusable="false">
              <path d="m2 2 8 8 8-8M2 8l8 8 8-8" />
            </svg>
          </span>
          <button type="button" onClick={() => setIsOpen(true)}>
            Bulk Inquiry
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M8 3h8M9 2h6v3H9zM6 4h12a2 2 0 0 1 2 2v15H4V6a2 2 0 0 1 2-2Z" />
              <path d="M8 10h8M8 14h8M8 18h5" />
            </svg>
          </button>
        </div>
        <div className="home-mobile-action">
          <span className="home-mobile-action-arrow" aria-hidden="true">
            <svg viewBox="0 0 20 14" focusable="false">
              <path d="m2 2 8 8 8-8M2 8l8 8 8-8" />
            </svg>
          </span>
          <button type="button" onClick={() => setIsGiftOpen(true)}>
            Order Gifts
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M3 9h18v12H3zM2 6h20v3H2zM12 6v15M12 6H7.5a2.5 2.5 0 1 1 2.4-3.2L12 6Zm0 0h4.5a2.5 2.5 0 1 0-2.4-3.2L12 6Z" />
            </svg>
          </button>
        </div>
      </section>

      {isOpen ? (
        <div
          className="home-mobile-enquiry-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="mobile-enquiry-title"
            aria-modal="true"
            className="home-mobile-enquiry-sheet"
            role="dialog"
            style={{
              backgroundImage: `url("${FIGMA_ASSETS.businessBackground}")`,
            }}
          >
            <button
              aria-label="Close bulk inquiry form"
              className="home-mobile-enquiry-close"
              onClick={() => setIsOpen(false)}
              ref={closeButtonRef}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
            <header className="home-mobile-enquiry-header">
              <h2 id="mobile-enquiry-title">Request A Quote</h2>
              <p>
                Fill In The Details To Get An Exclusive
                <br />
                Discount On Your Bulk Order!
              </p>
            </header>
            <BusinessEnquiryForm
              idPrefix="MobileBusinessEnquiry"
              useCustomSelects
            />
          </section>
        </div>
      ) : null}

      {isGiftOpen ? (
        <div
          className="home-mobile-enquiry-backdrop home-mobile-gift-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsGiftOpen(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="mobile-gift-title"
            aria-modal="true"
            className="home-mobile-gift-dialog"
            ref={giftDialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <header>
              <h2 id="mobile-gift-title">
                Gifts That Make Every
                <br />
                Meal Memorable
              </h2>
              <p>
                Thoughtfully curated cookware gifts for weddings,
                housewarmings, festivals, birthdays, and corporate gifting
              </p>
            </header>
            <img
              alt="Cookware gifts wrapped for a special occasion"
              src={FIGMA_ASSETS.giftBanner}
            />
            <Link
              className="home-mobile-gift-shop"
              onClick={() => setIsGiftOpen(false)}
              to="/collections/gifts"
            >
              Shop Gifts
            </Link>
          </section>
        </div>
      ) : null}
    </>
  );
}
