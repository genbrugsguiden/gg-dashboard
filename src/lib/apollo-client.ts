import { ApolloClient, InMemoryCache, createHttpLink, from, CombinedGraphQLErrors } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getAccessToken, clearTokens } from './auth';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

const authLink = setContext((_, { headers }) => {
  const token = getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ error }) => {
  // Check for GraphQL errors (authentication issues)
  if (CombinedGraphQLErrors.is(error)) {
    for (const err of error.errors) {
      if (err.extensions?.code === 'UNAUTHENTICATED' || err.message === 'Unauthorized') {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }
    }
  }

  // Check for network errors with 401 status
  if (error && 'statusCode' in error && (error as { statusCode?: number }).statusCode === 401) {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
