// GraphQL types from backend schema

export type Role = 'ADMIN' | 'USER';
export type RequestStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type FractionSource = 'AI_SUGGESTED' | 'KNOWN';
export type MasterItemAction = 'NONE' | 'CREATE_NEW' | 'LINK_EXISTING';
export type GoldenRequestStatus = 'DRAFT' | 'PUBLISHED';

export interface User {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Auth {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Token {
  accessToken: string;
  refreshToken: string;
}

export interface FractionCategoryModel {
  id: string;
  key: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface FractionModel {
  id: number;
  name: string;
  desc?: string;
  pictogramKey: string;
  category?: FractionCategoryModel;
  createdAt: string;
  updatedAt: string;
}

export interface StationFractionModel {
  stationId: string;
  fractionId: number;
  sortOrder: number;
  fraction: FractionModel;
  createdAt: string;
}

export interface MasterItemModel {
  id: string;
  name: string;
  desc?: string;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StationModel {
  id: string;
  name?: string;
  organizationId: string;
  fractions?: StationFractionModel[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestedItemFractionModel {
  requestedItemId: string;
  stationId: string;
  fractionId: number;
  confidence?: number;
  reasoning?: string;
  source: FractionSource;
  stationFraction: StationFractionModel;
  createdAt: string;
}

export interface RequestedItemModel {
  id: string;
  requestId: string;
  detectedName: string;
  confidence?: number;
  itemId?: string;
  item?: MasterItemModel;
  userFractionId?: number;
  isCurated: boolean;
  suggestedFractions?: RequestedItemFractionModel[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestModel {
  id: string;
  userId: string;
  stationId: string;
  station?: StationModel;
  imageKey: string;
  imageURL: string;
  status: RequestStatus;
  isCurated: boolean;
  goldenStatus?: GoldenRequestStatus;
  curatedAt?: string;
  curatedById?: string;
  curatedBy?: User;
  tokenQty?: number;
  aiResponseText?: string;
  aiModel?: string;
  requestedItems?: RequestedItemModel[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestModelEdge {
  cursor: string;
  node: RequestModel;
}

export interface PageInfo {
  startCursor?: string;
  endCursor?: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedRequests {
  edges?: RequestModelEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

export interface AliasConflict {
  alias: string;
  existingItemName: string;
}

export interface AliasSuggestionsModel {
  suggestions: string[];
  conflicts: AliasConflict[];
}

export interface GoldenRequestedItemModel {
  id: string;
  goldenRequestId: string;
  name: string;
  aliases: string[];
  notes?: string;
  isActive: boolean;
  fractionId: number;
  fraction?: FractionModel;
  createdAt: string;
  updatedAt: string;
}

export interface GoldenRequestModel {
  id: string;
  title?: string;
  notes?: string;
  isActive: boolean;
  status: GoldenRequestStatus;
  organizationId?: string;
  stationId?: string;
  sourceRequestId?: string;
  createdById?: string;
  items: GoldenRequestedItemModel[];
  createdAt: string;
  updatedAt: string;
}

// Input types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RequestsFilterInput {
  stationId?: string;
  isCurated?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export interface CuratedItemInput {
  requestedItemId: string;
  correctedFractionId: number;
  masterItemAction: MasterItemAction;
  masterItemId?: string;
  newMasterItemName?: string;
  aliases?: string[];
}

export interface CurateRequestInput {
  requestId: string;
  curatedItems: CuratedItemInput[];
}

export interface AddRequestedItemInput {
  requestId: string;
  detectedName: string;
}

export interface GoldenItemAliasesInput {
  requestedItemId: string;
  aliases: string[];
}

export interface CreateGoldenFromRequestInput {
  requestId: string;
  title?: string;
  notes?: string;
  itemAliases?: GoldenItemAliasesInput[];
}

export interface PublishGoldenFromRequestInput {
  requestId: string;
  title?: string;
  notes?: string;
}
