import {redirect} from 'react-router';
import type {Route} from './+types/[contact]';

const CAPTCHA_FIELDS = [
  'h-captcha-response',
  'g-recaptcha-response',
  'recaptcha-v3-token',
];

export function loader() {
  return redirect('/#business-enquiry');
}

export async function action({context, request}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('contact[email]');
  const hasCaptcha = CAPTCHA_FIELDS.some((field) =>
    Boolean(formData.get(field)),
  );

  if (typeof email !== 'string' || !email.trim() || !hasCaptcha) {
    return redirect('/?business_enquiry=verification_error#business-enquiry-status', {
      status: 303,
    });
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
      redirect: 'follow',
    });
    const responseHtml = await shopifyResponse.text();
    const submitted =
      shopifyResponse.ok &&
      (shopifyResponse.url.includes('contact_posted=true') ||
        /Thanks for contacting us|form-status[^>]*success/i.test(responseHtml));

    if (submitted) {
      return redirect('/?business_enquiry=success#business-enquiry-status', {
        status: 303,
      });
    }

    console.error('Shopify rejected the business enquiry', {
      status: shopifyResponse.status,
      url: shopifyResponse.url,
    });
  } catch (error) {
    console.error('Unable to submit the business enquiry', error);
  }

  return redirect('/?business_enquiry=error#business-enquiry-status', {status: 303});
}
