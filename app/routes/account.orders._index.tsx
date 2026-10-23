import {Link, Form, useLoaderData, useNavigation} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'My orders | Sumeet'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="orders">
      <header className="orders-heading">
        <h2>My orders</h2>
        <p>Find your orders and keep track of every kitchen upgrade.</p>
      </header>
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="account-orders" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection
          connection={orders}
          resourcesClassName="order-list"
        >
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="orders-empty">
      <div className="orders-empty-icon" aria-hidden="true">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m9 15 15-8 15 8v19l-15 8-15-8V15Z" />
          <path d="m9 15 15 8 15-8M24 23v19M17 11l15 8v8" />
        </svg>
      </div>
      <p className="account-eyebrow">
        {hasFilters ? 'LET’S TRY AGAIN' : 'GOOD THINGS START HERE'}
      </p>
      <h3>
        {hasFilters ? 'No matching orders' : 'Your kitchen story starts here'}
      </h3>
      <p>
        {hasFilters
          ? 'We couldn’t find an order with those details. Check the numbers or clear your filters.'
          : 'You haven’t placed an order yet. Discover cookware made for everyday meals and memorable moments.'}
      </p>
      <Link
        className="account-button"
        to={hasFilters ? '/account/orders' : '/collections/all'}
      >
        {hasFilters ? 'Clear filters' : 'Explore cookware'}{' '}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <Form
      method="get"
      action="/account/orders"
      key={`${currentFilters.name || ''}:${currentFilters.confirmationNumber || ''}`}
      className="order-search-form"
      aria-label="Search orders"
    >
      <fieldset className="order-search-fieldset">
        <legend className="order-search-legend">Find an order</legend>

        <div className="order-search-inputs">
          <label>
            Order number
            <input
              type="search"
              name={ORDER_FILTER_FIELDS.NAME}
              placeholder="e.g. 1001"
              aria-label="Order number"
              defaultValue={currentFilters.name || ''}
              className="order-search-input"
            />
          </label>
          <label>
            Confirmation number
            <input
              type="search"
              name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
              placeholder="From your confirmation email"
              aria-label="Confirmation number"
              defaultValue={currentFilters.confirmationNumber || ''}
              className="order-search-input"
            />
          </label>
        </div>

        <div className="order-search-buttons">
          <button
            className="account-button"
            type="submit"
            disabled={isSearching}
          >
            {isSearching ? 'Searching…' : 'Search orders'}
          </button>
          {hasFilters && (
            <Link className="order-clear-link" to="/account/orders">
              Clear filters
            </Link>
          )}
        </div>
      </fieldset>
    </Form>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  const orderUrl = `/account/orders/${btoa(order.id)}`;
  const formatStatus = (value: string) =>
    value.toLowerCase().replaceAll('_', ' ');
  return (
    <article className="order-card">
      <div className="order-card-heading">
        <div>
          <Link className="order-number" to={orderUrl}>
            Order #{order.number}
          </Link>
          <p>
            <time dateTime={order.processedAt}>
              {new Date(order.processedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          </p>
        </div>
        <Money data={order.totalPrice} />
      </div>
      <div className="order-statuses">
        {order.financialStatus && (
          <span className="order-status">
            {formatStatus(order.financialStatus)}
          </span>
        )}
        {fulfillmentStatus && (
          <span className="order-status">
            {formatStatus(fulfillmentStatus)}
          </span>
        )}
      </div>
      <div className="order-card-footer">
        {order.confirmationNumber && (
          <p>Confirmation: {order.confirmationNumber}</p>
        )}
        <Link to={orderUrl} aria-label={`View order ${order.number}`}>
          View order <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
