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

export const GET_EVAL_RUNS = gql`
  query EvalRuns($filter: EvalRunsFilterInput) {
    evalRuns(filter: $filter) {
      id
      status
      stationId
      organizationId
      model
      promptVersion
      createdAt
      completedAt
      totalGoldenRequests
      totalGoldenItems
      totalPredictedItems
      matchedItems
      fractionCorrect
      itemRecall
      itemPrecision
      fractionAccuracy
    }
  }
`;

export const GET_EVAL_RUN = gql`
  query EvalRun($id: ID!) {
    evalRun(id: $id) {
      id
      status
      stationId
      organizationId
      model
      promptVersion
      createdAt
      completedAt
      durationMs
      totalGoldenRequests
      totalGoldenItems
      totalPredictedItems
      matchedItems
      fractionCorrect
      itemRecall
      itemPrecision
      fractionAccuracy
      items {
        id
        goldenRequestId
        sourceRequestId
        stationId
        imageKey
        model
        tokenQty
        durationMs
        totalGoldenItems
        totalPredictedItems
        matchedItems
        fractionCorrect
        itemRecall
        itemPrecision
        fractionAccuracy
        predictions {
          id
          name
          fractionId
          matchType
          fractionCorrect
          matchedGoldenItemId
        }
        truths {
          id
          name
          aliases
          fractionId
          goldenItemId
        }
      }
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
          goldenStatus
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
      goldenStatus
      curatedAt
      aiResponseText
      aiModel
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

export const GET_GOLDEN_BY_SOURCE = gql`
  query GetGoldenBySource($data: GoldenRequestBySourceInput!) {
    goldenRequestBySource(data: $data) {
      id
      status
      sourceRequestId
      items {
        id
        name
        aliases
        fractionId
        masterItemId
        fraction {
          id
          name
          category {
            id
            name
            color
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
