import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router';

const DISCOUNT_CODE = 'SUMEET10';
const SUMEET_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Sumeet_logo_PNG.png?v=1789986865';

function copyWithFallback(value: string) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) throw new Error('Copy command was not successful');
}

export function HomeDiscountPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const copyFeedbackTimerRef = useRef<number>();

  useEffect(() => {
    const timer = window.setTimeout(() => setIsOpen(true), 5000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => window.clearTimeout(copyFeedbackTimerRef.current);
  }, []);

  const copyDiscountCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(DISCOUNT_CODE);
      } else {
        copyWithFallback(DISCOUNT_CODE);
      }
      setCopyState('copied');
    } catch {
      try {
        copyWithFallback(DISCOUNT_CODE);
        setCopyState('copied');
      } catch {
        setCopyState('error');
      }
    }

    window.clearTimeout(copyFeedbackTimerRef.current);
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
    }, 2400);
  };

  if (!isOpen) return null;

  return (
    <div className="home-discount-popup-layer">
      <button
        aria-label="Close welcome offer"
        className="home-discount-popup-backdrop"
        onClick={() => setIsOpen(false)}
        type="button"
      />
      <div
        aria-describedby="home-discount-popup-description"
        aria-labelledby="home-discount-popup-title"
        aria-modal="true"
        className="home-discount-popup"
        role="dialog"
      >
        <button
          aria-label="Close welcome offer"
          className="home-discount-popup-close"
          onClick={() => setIsOpen(false)}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="home-discount-popup-logo" aria-label="Sumeet Cookware">
          <img alt="Sumeet Cookware" src={SUMEET_LOGO_URL} />
        </div>

        <div className="home-discount-popup-content">
          <h2 id="home-discount-popup-title">
            Welcome to
            <br />
            Sumeet Cookware!
          </h2>
          <p id="home-discount-popup-description">
            Upgrade your kitchen with premium
            <br />
            cookware built for everyday cooking
          </p>

          <div className="home-discount-popup-art" aria-hidden="true">
            <div className="home-discount-popup-confetti home-discount-popup-confetti-left">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="home-discount-popup-gift">
              <div className="home-discount-popup-gift-bow">
                <i />
                <i />
                <b />
              </div>
              <div className="home-discount-popup-gift-lid" />
              <div className="home-discount-popup-gift-box">
                <span className="home-discount-popup-gift-ribbon-vertical" />
                <span className="home-discount-popup-gift-ribbon-horizontal" />
              </div>
            </div>
            <div className="home-discount-popup-confetti home-discount-popup-confetti-right">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="home-discount-popup-offer">
            <strong>Get 10% OFF</strong>
            <span>on your First Order</span>
            <button
              aria-label={`Copy discount code ${DISCOUNT_CODE}`}
              className="home-discount-popup-code"
              onClick={() => void copyDiscountCode()}
              type="button"
            >
              <span>Use code: </span>
              <strong>{DISCOUNT_CODE}</strong>
              <small>
                {copyState === 'copied'
                  ? 'Code copied!'
                  : copyState === 'error'
                    ? 'Tap to retry'
                    : 'Tap to copy'}
              </small>
            </button>
          </div>

          <Link
            className="home-discount-popup-cta"
            onClick={() => setIsOpen(false)}
            to={`/discount/${DISCOUNT_CODE}?redirect=/collections`}
          >
            Unlock My Discount
          </Link>
        </div>
      </div>
    </div>
  );
}
