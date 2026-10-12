import {Form, redirect} from 'react-router';
import type {Route} from './+types/[contact]';

const CAPTCHA_FIELDS = [
  'h-captcha-response',
  'g-recaptcha-response',
  'recaptcha-v3-token',
];

export function loader() {
  return null;
}

export default function ContactPage() {
  return (
    <div className="contact-page">
      <section className="contact-card">
        <h1>Contact Us</h1>
        <div className="contact-rule" />
        <div className="contact-layout">
          <div className="contact-form-column">
            <p className="contact-phone">Consumer Care No.:- +91 8976047019</p>
            <p className="contact-email">Email:- info@sumeetcookware.in</p>
            <Form method="post" className="contact-form">
              <label>
                <span className="visually-hidden">Your name</span>
                <input name="contact[name]" placeholder="Enter Your name" required />
                <ContactFieldIcon type="person" />
              </label>
              <label>
                <span className="visually-hidden">Your email</span>
                <input name="contact[email]" placeholder="Enter your mail id" type="email" required />
                <ContactFieldIcon type="email" />
              </label>
              <label>
                <span className="visually-hidden">Your phone number</span>
                <input name="contact[phone]" placeholder="Your phone number" type="tel" />
                <ContactFieldIcon type="phone" />
              </label>
              <label className="contact-message-field">
                <span className="visually-hidden">Comment</span>
                <textarea name="contact[body]" placeholder="Comment" rows={4} />
              </label>
              <input name="form_type" type="hidden" value="contact" />
              <input name="utf8" type="hidden" value="✓" />
              <button type="submit">SEND</button>
            </Form>
          </div>
          <div className="contact-address-panel">
            <div>
              <h2>Address:-</h2>
              <p>
                ABEE SMART COMMERCE INDIA PRIVATE LIMITED 7,Anupam Indus Estate No. 1, P.K.X Road
                <br />
                SBI Bank Lane Mulund West Mumbai, Maharashtra - 400080, India
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactFieldIcon({type}: {type: 'person' | 'email' | 'phone'}) {
  if (type === 'person') {
    return (
      <svg className="contact-field-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7" r="3" />
        <path d="M5 20v-2.2c0-3 2.7-5.3 7-5.3s7 2.3 7 5.3V20H5Z" />
      </svg>
    );
  }

  if (type === 'email') {
    return (
      <svg className="contact-field-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="1.5" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  return (
    <svg className="contact-field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.2 3.5 10 7.2 8.4 9.4c1.2 2.5 3.2 4.5 5.7 5.7l2.2-1.6 3.7 2.8c.4.3.6.8.4 1.3-.5 1.6-2 2.7-3.7 2.6C9.9 19.7 4.3 14.1 3.8 7.3c-.1-1.7 1-3.2 2.6-3.7.3-.1.6-.1.8-.1Z" />
    </svg>
  );
}

export async function action({context, request}: Route.ActionArgs) {
  const wantsJson = request.headers.get('Accept')?.includes('application/json');
  const formData = await request.formData();
  const wantsIframe = formData.get('response_mode') === 'iframe';
  const email = formData.get('contact[email]');

  const respond = (status: 'success' | 'error', responseStatus = 200) => {
    if (wantsIframe) {
      return new Response(
        `<!doctype html><html><body data-contact-status="${status}"></body></html>`,
        {
          headers: {'Content-Type': 'text/html; charset=utf-8'},
          status: responseStatus,
        },
      );
    }

    if (wantsJson) return Response.json({status}, {status: responseStatus});

    return redirect('/contact-us');
  };

  if (typeof email !== 'string' || !email.trim()) {
    return respond('error', 400);
  }

  const body = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    const isContactField = key.startsWith('contact[');
    const isShopifyField =
      key === 'form_type' || key === 'utf8' || key === 'form_key';
    if (
      typeof value === 'string' &&
      (isContactField || isShopifyField || CAPTCHA_FIELDS.includes(key))
    ) {
      body.append(key, value);
    }
  }

  const storeDomain =
    context.env.PUBLIC_STORE_DOMAIN || 'sumeetcookware.myshopify.com';
  const normalizedDomain = storeDomain.replace(/^https?:\/\//, '');

  try {
    const shopifyResponse = await fetch(`https://${normalizedDomain}/contact`, {
      method: 'POST',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Referer: `https://${normalizedDomain}/pages/contact-us`,
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
      },
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
    const location = shopifyResponse.headers.get('location') || '';
    const submitted =
      shopifyResponse.status >= 300 &&
      shopifyResponse.status < 400 &&
      location.includes('contact_posted=true');

    if (submitted) {
      return respond('success');
    }

    console.error('Shopify rejected the business enquiry', {
      status: shopifyResponse.status,
      url: shopifyResponse.url,
    });
  } catch (error) {
    console.error('Unable to submit the business enquiry', error);
  }

  return respond('error', 502);
}
