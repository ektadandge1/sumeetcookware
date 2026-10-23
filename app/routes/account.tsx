import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import accountStyles from '~/styles/account.css?url';

export function links() {
  return [{rel: 'stylesheet', href: accountStyles}];
}

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  await customerAccount.handleAuthStatus();

  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer.firstName
    ? `Welcome back, ${customer.firstName}`
    : 'Welcome to your account';

  return (
    <div className="account">
      <div className="account-container">
        <header className="account-heading">
          <p className="account-eyebrow">MY SUMEET</p>
          <h1>{heading}</h1>
          <p>A little less admin. A little more time in the kitchen.</p>
        </header>
        <div className="account-layout">
          <AccountMenu />
          <div className="account-content">
            <Outlet context={{customer}} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  return (
    <nav className="account-menu" aria-label="Account navigation">
      <p className="account-menu-title">Your account</p>
      {[
        ['orders', 'My orders'],
        ['profile', 'Personal details'],
        ['addresses', 'Saved addresses'],
      ].map(([path, label]) => (
        <NavLink
          key={path}
          to={`/account/${path}`}
          className={({isActive}) =>
            `account-menu-link${isActive ? ' is-active' : ''}`
          }
        >
          <span>{label}</span>
          <span aria-hidden="true">→</span>
        </NavLink>
      ))}
      <Logout />
    </nav>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button type="submit">
        Sign out <span aria-hidden="true">↗</span>
      </button>
    </Form>
  );
}
