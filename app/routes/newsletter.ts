import type {Route} from './+types/newsletter';

const ADMIN_API_VERSION = '2026-07';

const CUSTOMER_SET_MUTATION = `
  mutation NewsletterCustomerSet(
    $identifier: CustomerSetIdentifiers
    $input: CustomerSetInput!
  ) {
    customerSet(identifier: $identifier, input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_CONSENT_MUTATION = `
  mutation NewsletterCustomerConsentUpdate(
    $input: CustomerEmailMarketingConsentUpdateInput!
  ) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type UserError = {
  field?: string[] | null;
  message: string;
};

type AdminResponse<T> = {
  data?: T;
  errors?: Array<{message: string}>;
};

export async function action({context, request}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('contact[email]');

  if (typeof email !== 'string' || !email.trim()) {
    return Response.json({status: 'error'}, {status: 400});
  }

  const normalizedEmail = email.trim().toLowerCase();
  const storeDomain =
    context.env.PUBLIC_STORE_DOMAIN || 'sumeetcookware.myshopify.com';
  const adminToken = context.env.PRIVATE_STOREFRONT_API_TOKEN;
  const normalizedDomain = storeDomain.replace(/^https?:\/\//, '');

  if (!adminToken) {
    console.error('Newsletter subscription is missing the Admin API token');
    return Response.json({status: 'error'}, {status: 500});
  }

  try {
    const customerSet = await adminGraphql<{
      customerSet: {customer: {id: string} | null; userErrors: UserError[]};
    }>(
      normalizedDomain,
      adminToken,
      CUSTOMER_SET_MUTATION,
      {
        identifier: {email: normalizedEmail},
        input: {email: normalizedEmail},
      },
      'customerSet',
    );
    const customerId = customerSet.customerSet.customer?.id;

    if (!customerId) {
      throw new Error('Shopify did not return a customer ID');
    }

    await adminGraphql(
      normalizedDomain,
      adminToken,
      UPDATE_CONSENT_MUTATION,
      {
        input: {
          customerId,
          emailMarketingConsent: {
            marketingState: 'SUBSCRIBED',
            marketingOptInLevel: 'SINGLE_OPT_IN',
          },
        },
      },
      'customerEmailMarketingConsentUpdate',
    );

    return Response.json({status: 'success'});
  } catch (error) {
    console.error('Unable to submit the newsletter subscription', error);
    return Response.json({status: 'error'}, {status: 502});
  }
}

async function adminGraphql<T>(
  domain: string,
  token: string,
  query: string,
  variables: Record<string, unknown>,
  operation?: string,
) {
  const response = await fetch(
    `https://${domain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
      signal: AbortSignal.timeout(8000),
    },
  );
  const payload = (await response.json()) as AdminResponse<
    T & Record<string, {userErrors?: UserError[]}>
  >;

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors?.map((error) => error.message).join(', ') ||
        `Shopify Admin API returned ${response.status}`,
    );
  }

  if (!payload.data) {
    throw new Error('Shopify Admin API returned no data');
  }

  if (operation) {
    const userErrors = payload.data[operation]?.userErrors || [];
    if (userErrors.length) {
      throw new Error(userErrors.map((error) => error.message).join(', '));
    }
  }

  return payload.data;
}
