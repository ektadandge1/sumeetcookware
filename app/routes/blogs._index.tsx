import {redirect} from 'react-router';
import type {Route} from './+types/blogs._index';

export const meta: Route.MetaFunction = () => [
  {title: 'Sumeet Cookware | Blogs'},
];

export function loader() {
  throw redirect('/blogs/kitchen');
}

export default function BlogsIndex() {
  return null;
}
