import { gql } from '@apollo/client/core';

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      firstname
      lastname
      role
      createdAt
      updatedAt
    }
  }
`;

export const GET_REQUESTS = gql`
  query GetRequests($filter: RequestsFilterInput) {
    requests(filter: $filter) {
      edges {
        cursor
        node {
          id
          imageURL
          status
          isCurated
          curatedAt
          createdAt
          requestedItems {
            id
            detectedName
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_REQUEST = gql`
  query GetRequest($id: String!) {
    request(id: $id) {
      id
      imageURL
      status
      isCurated
      curatedAt
      stationId
      station {
        id
        organizationId
        fractions {
          stationId
          fractionId
          sortOrder
          fraction {
            id
            name
            pictogramKey
            category {
              id
              name
              color
            }
          }
        }
      }
      curatedBy {
        id
        email
        firstname
        lastname
      }
      createdAt
      requestedItems {
        id
        detectedName
        confidence
        itemId
        isCurated
        item {
          id
          name
          aliases
        }
        userFractionId
        suggestedFractions {
          fractionId
          confidence
          source
          stationFraction {
            stationId
            fractionId
            sortOrder
            fraction {
              id
              name
              pictogramKey
              category {
                id
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

export const SUGGEST_ALIASES = gql`
  query SuggestAliases($itemName: String!, $organizationId: String!) {
    suggestAliases(itemName: $itemName, organizationId: $organizationId) {
      suggestions
      conflicts {
        alias
        existingItemName
      }
    }
  }
`;

export const GET_MASTER_ITEMS = gql`
  query GetMasterItems($organizationId: String!, $query: String) {
    masterItems(organizationId: $organizationId, query: $query) {
      id
      name
      aliases
    }
  }
`;
