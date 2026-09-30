import {
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {FIGMA_ASSETS} from './homeAssets';

const QUANTITIES = ['10 - 49', '50 - 99', '100 - 249', '250 - 499', '500+'];

const STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export function HomeBusinessBuyers() {
  const [showSuccess, setShowSuccess] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSuccess) successRef.current?.focus();
  }, [showSuccess]);

  return (
    <section
      id="business-enquiry"
      className="home-business"
      aria-labelledby="business-title"
      style={{
        backgroundImage: `url("${FIGMA_ASSETS.businessBackground}")`,
      }}
    >
      <div className="home-business-inner">
        <div className="home-business-copy">
          <h2 id="business-title">For Business Buyers</h2>
          <p>
            Fill In The Details To Get An Exclusive Discount
            <br />
            On Your Bulk Order!
          </p>
          <small>When GST Benefits</small>
          {showSuccess ? (
            <BusinessEnquirySuccess messageRef={successRef} />
          ) : null}
        </div>

        <div className="home-business-form-panel">
          <span className="home-business-form-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" focusable="false">
              <path d="M13 5h17l8 8v25a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z" />
              <path d="M29 5v9h9M16 21h14M16 28h14M16 35h9" />
              <path d="M4 17v22a5 5 0 0 0 5 5h20" />
            </svg>
          </span>

          <BusinessEnquiryForm
            onSubmitStart={() => setShowSuccess(false)}
            onSubmitSuccess={() => setShowSuccess(true)}
          />
        </div>
      </div>
    </section>
  );
}

export function BusinessEnquiryForm({
  idPrefix = 'BusinessEnquiry',
  onSubmitStart,
  onSubmitSuccess,
  useCustomSelects = false,
}: {
  idPrefix?: string;
  onSubmitStart?: () => void;
  onSubmitSuccess?: () => void;
  useCustomSelects?: boolean;
}) {
  const [status, setStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const submissionTarget = `${useId().replace(/:/g, '')}-contact-response`;
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (status !== 'submitting') return;

    const timeout = window.setTimeout(() => setStatus('error'), 45000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const handleSubmit = () => {
    hasSubmitted.current = true;
    setStatus('submitting');
    onSubmitStart?.();
  };

  const handleResponse = (iframe: HTMLIFrameElement) => {
    if (!hasSubmitted.current) return;

    let isShopifyResponse = false;
    let responseStatus: string | undefined;
    try {
      const responseDocument = iframe.contentDocument;
      isShopifyResponse = !responseDocument;
      responseStatus = responseDocument?.body.dataset.contactStatus;
    } catch {
      isShopifyResponse = true;
    }

    if (isShopifyResponse || responseStatus === 'success') {
      hasSubmitted.current = false;
      setStatus('success');
      onSubmitSuccess?.();
    } else if (responseStatus === 'error') {
      hasSubmitted.current = false;
      setStatus('error');
    }
  };

  return (
    <form
      acceptCharset="UTF-8"
      action="https://sumeetcookware.in/contact"
      className="home-business-form"
      data-shopify-captcha="true"
      id={`${idPrefix}Form`}
      method="post"
      onSubmit={handleSubmit}
      suppressHydrationWarning
      target={submissionTarget}
    >
      <input name="form_type" type="hidden" value="contact" />
      <input name="utf8" type="hidden" value="✓" />
      <input
        name="contact[Inquiry type]"
        type="hidden"
        value="Business bulk enquiry"
      />

      <label htmlFor={`${idPrefix}Company`}>
        Company Name
        <input
          autoComplete="organization"
          id={`${idPrefix}Company`}
          name="contact[Company name]"
          placeholder="Enter your company name"
          required
        />
      </label>

      <label htmlFor={`${idPrefix}Name`}>
        Your Name
        <input
          autoComplete="name"
          id={`${idPrefix}Name`}
          name="contact[Name]"
          placeholder="Enter your name"
          required
        />
      </label>

      <label htmlFor={`${idPrefix}Email`}>
        Business Email
        <input
          autoComplete="email"
          id={`${idPrefix}Email`}
          name="contact[email]"
          placeholder="name@company.com"
          required
          type="email"
        />
      </label>

      <div className="home-business-form-row">
        <label htmlFor={`${idPrefix}Phone`}>
          Phone Number
          <input
            autoComplete="tel"
            id={`${idPrefix}Phone`}
            inputMode="tel"
            name="contact[Phone number]"
            placeholder="+91 0000000000"
            required
            type="tel"
          />
        </label>

        <label
          htmlFor={`${idPrefix}Quantity${useCustomSelects ? 'Trigger' : ''}`}
        >
          Select Quantity
          {useCustomSelects ? (
            <MobileFormSelect
              id={`${idPrefix}Quantity`}
              name="contact[Quantity]"
              options={QUANTITIES}
              placeholder="Select"
            />
          ) : (
            <select
              defaultValue=""
              id={`${idPrefix}Quantity`}
              name="contact[Quantity]"
              required
            >
              <option disabled value="">
                Select
              </option>
              {QUANTITIES.map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      <label htmlFor={`${idPrefix}State${useCustomSelects ? 'Trigger' : ''}`}>
        State
        {useCustomSelects ? (
          <MobileFormSelect
            direction="up"
            id={`${idPrefix}State`}
            name="contact[State]"
            options={STATES}
            placeholder="Select State"
          />
        ) : (
          <select
            autoComplete="address-level1"
            defaultValue=""
            id={`${idPrefix}State`}
            name="contact[State]"
            required
          >
            <option disabled value="">
              Select State
            </option>
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        )}
      </label>

      <label htmlFor={`${idPrefix}Body`}>
        Tell Us Your Specific Requirement
        <textarea
          id={`${idPrefix}Body`}
          name="contact[body]"
          required
          rows={5}
        />
      </label>

      {status === 'success' && !onSubmitSuccess ? (
        <BusinessEnquirySuccess compact />
      ) : null}
      {status === 'error' ? (
        <div className="home-business-form-message is-error" role="alert">
          <span aria-hidden="true">!</span>
          <p>
            <strong>Submission could not be completed</strong>
            <small>Please try again in a moment.</small>
          </p>
        </div>
      ) : null}
      <button aria-busy={status === 'submitting'} type="submit">
        {status === 'submitting' ? 'Submitting...' : 'Submit'}{' '}
        <span aria-hidden="true">→</span>
      </button>
      <iframe
        hidden
        name={submissionTarget}
        onLoad={(event) => handleResponse(event.currentTarget)}
        title="Business enquiry submission response"
      />
    </form>
  );
}

function BusinessEnquirySuccess({
  compact = false,
  messageRef,
}: {
  compact?: boolean;
  messageRef?: RefObject<HTMLDivElement>;
}) {
  return (
    <div
      aria-live="polite"
      className={`home-business-success${compact ? ' is-compact' : ''}`}
      ref={messageRef}
      tabIndex={-1}
    >
      <span aria-hidden="true">✓</span>
      <strong>Details submitted successfully</strong>
      <p>
        Thank you for sharing your business enquiry. Our team will review your
        details and connect with you soon.
      </p>
    </div>
  );
}

function MobileFormSelect({
  direction = 'down',
  id,
  name,
  options,
  placeholder,
}: {
  direction?: 'down' | 'up';
  id: string;
  name: string;
  options: readonly string[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const listId = `${useId().replace(/:/g, '')}-options`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <span
      className={`home-mobile-form-select is-${direction}`}
      ref={rootRef}
    >
      <select
        aria-hidden="true"
        className="home-mobile-form-select-native"
        id={id}
        name={name}
        onChange={(event) => setValue(event.currentTarget.value)}
        onInvalid={(event) => {
          event.preventDefault();
          setIsOpen(true);
          buttonRef.current?.focus();
        }}
        required
        tabIndex={-1}
        value={value}
      >
        <option disabled value="">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="home-mobile-form-select-trigger"
        id={`${id}Trigger`}
        onClick={() => setIsOpen((open) => !open)}
        ref={buttonRef}
        type="button"
      >
        <span>{value || placeholder}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen ? (
        <span
          aria-label={placeholder}
          className="home-mobile-form-select-menu"
          id={listId}
          role="listbox"
        >
          {options.map((option) => (
            <button
              aria-selected={value === option}
              className={value === option ? 'is-selected' : undefined}
              key={option}
              onClick={() => {
                setValue(option);
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              role="option"
              type="button"
            >
              {option}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
