import { gql } from '@apollo/client/core';

export const LOGIN = gql`
  mutation Login($data: LoginInput!) {
    login(data: $data) {
      accessToken
      refreshToken
      user {
        id
        email
        firstname
        lastname
        role
      }
    }
  }
`;

export const CURATE_REQUEST = gql`
  mutation CurateRequest($data: CurateRequestInput!) {
    curateRequest(data: $data) {
      id
      isCurated
      curatedAt
      curatedBy {
        id
        email
      }
    }
  }
`;

export const MARK_REQUEST_CURATED = gql`
  mutation MarkRequestCurated($requestId: String!) {
    markRequestCurated(requestId: $requestId) {
      id
      isCurated
      curatedAt
    }
  }
`;

export const ADD_REQUESTED_ITEM = gql`
  mutation AddRequestedItem($data: AddRequestedItemInput!) {
    addRequestedItem(data: $data) {
      id
      detectedName
      confidence
      isCurated
    }
  }
`;

export const DELETE_REQUESTED_ITEM = gql`
  mutation DeleteRequestedItem($id: ID!) {
    deleteRequestedItem(id: $id)
  }
`;

export const CREATE_GOLDEN_FROM_REQUEST = gql`
  mutation CreateGoldenFromRequest($data: CreateGoldenFromRequestInput!) {
    createGoldenFromRequest(data: $data) {
      id
      title
      notes
      isActive
      status
      stationId
      organizationId
      sourceRequestId
      items {
        id
        name
        aliases
        isActive
        fractionId
      }
    }
  }
`;

export const PUBLISH_GOLDEN_FROM_REQUEST = gql`
  mutation PublishGoldenFromRequest($data: PublishGoldenFromRequestInput!) {
    publishGoldenFromRequest(data: $data) {
      id
      title
      notes
      isActive
      status
      stationId
      organizationId
      sourceRequestId
      items {
        id
        name
        aliases
        isActive
        fractionId
      }
    }
  }
`;
