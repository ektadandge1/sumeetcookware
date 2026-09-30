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

    return redirect('/#business-enquiry');
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
