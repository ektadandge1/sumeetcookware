import {Link} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer(_props: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-main">
        <section
          className="footer-contact"
          aria-labelledby="footer-contact-title"
        >
          <h2 id="footer-contact-title">Quick Contact</h2>

          <address className="footer-address">
            <span>Manufacture Address:-</span>
            <span>ABEE SMART COMMERCE INDIA PRIVATE LIMITED,</span>
            <span>7,Anupam Indus Estate No. 1, P.K.X Road, SBI</span>
            <span>Bank Lane Mulund West, Mumbai, Maharashtra -</span>
            <span>400080, India</span>
          </address>

          <a className="footer-contact-link" href="tel:+918976047019">
            Consumer Care No.:-
            <strong>+91 8976047019</strong>
          </a>

          <a
            className="footer-contact-link footer-email"
            href="mailto:info@sumeetcookware.in"
          >
            Email
            <strong>info@sumeetcookware.in</strong>
          </a>

          <nav className="footer-social" aria-label="Social media">
            <a
              aria-label="Facebook"
              href="https://www.facebook.com/SumeetCookware"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="16" />
                <path d="M18.4 10.3h2.2V6.5c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.5v3.1H8.5v4.3h3.6V30a14 14 0 0 0 4.4 0V19.2h3.7l.6-4.3h-4.3v-2.7c0-1.2.3-1.9 1.9-1.9Z" />
              </svg>
            </a>
            <a
              aria-label="Instagram"
              href="https://www.instagram.com/sumeetcookware/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" viewBox="0 0 32 32">
                <rect width="32" height="32" rx="7" />
                <rect x="7.5" y="7.5" width="17" height="17" rx="5" />
                <circle cx="16" cy="16" r="4.2" />
                <circle cx="22" cy="10" r="1.1" />
              </svg>
            </a>
            <a
              aria-label="YouTube"
              href="https://www.youtube.com/@SumeetCookware"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg aria-hidden="true" viewBox="0 0 38 28">
                <rect width="38" height="28" rx="7" />
                <path d="m15 8 11 6-11 6V8Z" />
              </svg>
            </a>
          </nav>

          <p className="footer-amazon">We are also available on Amazon</p>
          <a
            aria-label="Available on Amazon"
            className="footer-amazon-link"
            href="https://www.amazon.in"
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              alt="Amazon"
              height={58}
              src="https://cdn.shopify.com/s/files/1/0358/3511/7703/files/Amazon_Logo.jpg?v=1789986863"
              width={156}
            />
          </a>
        </section>

        <nav className="footer-links" aria-labelledby="footer-links-title">
          <h2 id="footer-links-title">Know More</h2>
          <Link to="/search">Search</Link>
          <Link to="/">Home</Link>
          <Link to="/pages/about-us">About Us</Link>
          <Link to="/pages/contact-us">Contact Us</Link>
          <Link to="/blogs/kitchen">Blogs</Link>
          <a href="https://wa.me/918976047019">Chat on whatsapp</a>
          <Link to="/pages/register-affiliate-account">Affiliate Register</Link>
          <Link to="/pages">Page</Link>
          <Link to="/pages/faq-about-cookware">FAQ About</Link>
          <Link to="/collections/all">Cookware</Link>
          <Link to="/pages/collab">Influencer Collab</Link>
        </nav>

        <div className="footer-policies-column">
          <nav
            className="footer-policies"
            aria-labelledby="footer-policies-title"
          >
            <h2 id="footer-policies-title">My Policies</h2>
            <Link to="/policies/privacy-policy">Privacy Policy</Link>
            <Link to="/policies/refund-policy">Refund Policy</Link>
            <Link to="/policies/shipping-policy">Shipping Policy</Link>
            <Link to="/policies/terms-of-service">Terms of Service</Link>
            <Link to="/pages/warranty-registration">Warranty</Link>
            <Link to="/pages/warranty-registration">Registration</Link>
          </nav>

          <section
            className="footer-newsletter"
            aria-labelledby="footer-newsletter-title"
          >
            <h2 id="footer-newsletter-title">Join Sumeet Kitchen</h2>
            <form action="/pages/contact-us">
              <label className="sr-only" htmlFor="footer-email-input">
                Email address
              </label>
              <input
                id="footer-email-input"
                name="email"
                placeholder="enter your mail id"
                type="email"
              />
              <button type="submit">Subscribe</button>
            </form>
          </section>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{new Date().getFullYear()}, Sumeet Cookware</p>
        <p>
          Developed By{' '}
          <a href="https://bmconsulting.in/">BM Consulting pvt. ltd</a>
        </p>
      </div>
    </footer>
  );
}
