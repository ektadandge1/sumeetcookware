import {useFetcher, type FormProps, type Fetcher} from 'react-router';
import React, {useRef, useEffect} from 'react';
import type {PredictiveSearchReturn} from '~/lib/search';

type SearchFormPredictiveChildren = (args: {
  fetchResults: (event: React.ChangeEvent<HTMLInputElement>) => void;
  goToSearch: () => void;
  search: (term: string) => void;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  fetcher: Fetcher<PredictiveSearchReturn>;
}) => React.ReactNode;

type SearchFormPredictiveProps = Omit<FormProps, 'children'> & {
  inputRef?: React.MutableRefObject<HTMLInputElement | null>;
  children: SearchFormPredictiveChildren | null;
};

export const SEARCH_ENDPOINT = '/search';

/**
 *  Search form component that sends search requests to the `/search` route
 **/
export function SearchFormPredictive({
  children,
  className = 'predictive-search-form',
  inputRef: externalInputRef,
  ...props
}: SearchFormPredictiveProps) {
  const fetcher = useFetcher<PredictiveSearchReturn>({key: 'search'});
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = externalInputRef ?? internalInputRef;

  /** Navigate to the full search page when the form is submitted. */
  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    goToSearch();
  }

  /** Keep search interactions in predictive results instead of opening a page. */
  function goToSearch() {
    return;
  }

  /** Fetch search results based on the input value */
  function search(term: string) {
    void fetcher.submit(
      {q: term || '', limit: 10, predictive: true},
      {method: 'GET', action: SEARCH_ENDPOINT},
    );
  }

  function fetchResults(event: React.ChangeEvent<HTMLInputElement>) {
    search(event.target.value);
  }

  // ensure the passed input has a type of search, because SearchResults
  // will select the element based on the input
  useEffect(() => {
    inputRef?.current?.setAttribute('type', 'search');
  }, [inputRef]);

  if (typeof children !== 'function') {
    return null;
  }

  return (
    <fetcher.Form {...props} className={className} onSubmit={submitSearch}>
      {children({inputRef, fetcher, fetchResults, goToSearch, search})}
    </fetcher.Form>
  );
}
