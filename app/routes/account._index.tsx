import {redirect} from 'react-router';
import type {Route} from './+types/account._index';

export async function loader({context}: Route.LoaderArgs) {
  if (!(await context.customerAccount.isLoggedIn())) {
    return redirect('/account/login');
  }

  return redirect('/account/orders');
}
