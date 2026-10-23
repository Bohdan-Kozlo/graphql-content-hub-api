/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "mutation RefreshSession {\n  refreshTokens {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Login($data: LoginInput!) {\n  login(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Signup($data: SignupInput!) {\n  signup(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}": typeof types.RefreshSessionDocument,
    "query PublicCatalog($first: Int!, $after: String, $search: String, $type: ContentType, $categoryId: String, $tagId: String, $authorId: String) {\n  publishedContents(\n    first: $first\n    after: $after\n    search: $search\n    type: $type\n    categoryId: $categoryId\n    tagId: $tagId\n    authorId: $authorId\n  ) {\n    items {\n      id\n      title\n      description\n      type\n      status\n      thumbnail\n      publishedAt\n      author {\n        id\n        username\n      }\n      category {\n        name\n      }\n    }\n    endCursor\n    hasMore\n  }\n}": typeof types.PublicCatalogDocument,
    "mutation UpdateProfile($data: UpdateOwnProfileInput!) {\n  updateProfile(data: $data) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}": typeof types.UpdateProfileDocument,
    "query DiscoveryFilters {\n  categories {\n    id\n    name\n    parent {\n      id\n    }\n  }\n  tags {\n    id\n    name\n  }\n}": typeof types.DiscoveryFiltersDocument,
    "query PublicContent($id: String!) {\n  content(id: $id) {\n    id\n    title\n    description\n    type\n    body\n    mediaUrl\n    thumbnail\n    status\n    publishedAt\n    author {\n      id\n      username\n      bio\n      avatarUrl\n    }\n    category {\n      id\n      name\n    }\n    tags {\n      id\n      name\n    }\n    source {\n      id\n      name\n      url\n    }\n  }\n}": typeof types.PublicContentDocument,
    "mutation RequestPasswordReset($email: String!) {\n  requestPasswordReset(email: $email)\n}\n\nmutation ResetPassword($token: String!, $password: String!) {\n  resetPassword(token: $token, password: $password)\n}": typeof types.RequestPasswordResetDocument,
    "query PublicProfile($id: String!) {\n  publicProfile(id: $id) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}": typeof types.PublicProfileDocument,
};
const documents: Documents = {
    "mutation RefreshSession {\n  refreshTokens {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Login($data: LoginInput!) {\n  login(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Signup($data: SignupInput!) {\n  signup(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}": types.RefreshSessionDocument,
    "query PublicCatalog($first: Int!, $after: String, $search: String, $type: ContentType, $categoryId: String, $tagId: String, $authorId: String) {\n  publishedContents(\n    first: $first\n    after: $after\n    search: $search\n    type: $type\n    categoryId: $categoryId\n    tagId: $tagId\n    authorId: $authorId\n  ) {\n    items {\n      id\n      title\n      description\n      type\n      status\n      thumbnail\n      publishedAt\n      author {\n        id\n        username\n      }\n      category {\n        name\n      }\n    }\n    endCursor\n    hasMore\n  }\n}": types.PublicCatalogDocument,
    "mutation UpdateProfile($data: UpdateOwnProfileInput!) {\n  updateProfile(data: $data) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}": types.UpdateProfileDocument,
    "query DiscoveryFilters {\n  categories {\n    id\n    name\n    parent {\n      id\n    }\n  }\n  tags {\n    id\n    name\n  }\n}": types.DiscoveryFiltersDocument,
    "query PublicContent($id: String!) {\n  content(id: $id) {\n    id\n    title\n    description\n    type\n    body\n    mediaUrl\n    thumbnail\n    status\n    publishedAt\n    author {\n      id\n      username\n      bio\n      avatarUrl\n    }\n    category {\n      id\n      name\n    }\n    tags {\n      id\n      name\n    }\n    source {\n      id\n      name\n      url\n    }\n  }\n}": types.PublicContentDocument,
    "mutation RequestPasswordReset($email: String!) {\n  requestPasswordReset(email: $email)\n}\n\nmutation ResetPassword($token: String!, $password: String!) {\n  resetPassword(token: $token, password: $password)\n}": types.RequestPasswordResetDocument,
    "query PublicProfile($id: String!) {\n  publicProfile(id: $id) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}": types.PublicProfileDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RefreshSession {\n  refreshTokens {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Login($data: LoginInput!) {\n  login(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Signup($data: SignupInput!) {\n  signup(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}"): (typeof documents)["mutation RefreshSession {\n  refreshTokens {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Login($data: LoginInput!) {\n  login(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Signup($data: SignupInput!) {\n  signup(data: $data) {\n    accessToken\n    account {\n      id\n      email\n      username\n      roles\n    }\n  }\n}\n\nmutation Logout {\n  logout\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query PublicCatalog($first: Int!, $after: String, $search: String, $type: ContentType, $categoryId: String, $tagId: String, $authorId: String) {\n  publishedContents(\n    first: $first\n    after: $after\n    search: $search\n    type: $type\n    categoryId: $categoryId\n    tagId: $tagId\n    authorId: $authorId\n  ) {\n    items {\n      id\n      title\n      description\n      type\n      status\n      thumbnail\n      publishedAt\n      author {\n        id\n        username\n      }\n      category {\n        name\n      }\n    }\n    endCursor\n    hasMore\n  }\n}"): (typeof documents)["query PublicCatalog($first: Int!, $after: String, $search: String, $type: ContentType, $categoryId: String, $tagId: String, $authorId: String) {\n  publishedContents(\n    first: $first\n    after: $after\n    search: $search\n    type: $type\n    categoryId: $categoryId\n    tagId: $tagId\n    authorId: $authorId\n  ) {\n    items {\n      id\n      title\n      description\n      type\n      status\n      thumbnail\n      publishedAt\n      author {\n        id\n        username\n      }\n      category {\n        name\n      }\n    }\n    endCursor\n    hasMore\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateProfile($data: UpdateOwnProfileInput!) {\n  updateProfile(data: $data) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}"): (typeof documents)["mutation UpdateProfile($data: UpdateOwnProfileInput!) {\n  updateProfile(data: $data) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query DiscoveryFilters {\n  categories {\n    id\n    name\n    parent {\n      id\n    }\n  }\n  tags {\n    id\n    name\n  }\n}"): (typeof documents)["query DiscoveryFilters {\n  categories {\n    id\n    name\n    parent {\n      id\n    }\n  }\n  tags {\n    id\n    name\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query PublicContent($id: String!) {\n  content(id: $id) {\n    id\n    title\n    description\n    type\n    body\n    mediaUrl\n    thumbnail\n    status\n    publishedAt\n    author {\n      id\n      username\n      bio\n      avatarUrl\n    }\n    category {\n      id\n      name\n    }\n    tags {\n      id\n      name\n    }\n    source {\n      id\n      name\n      url\n    }\n  }\n}"): (typeof documents)["query PublicContent($id: String!) {\n  content(id: $id) {\n    id\n    title\n    description\n    type\n    body\n    mediaUrl\n    thumbnail\n    status\n    publishedAt\n    author {\n      id\n      username\n      bio\n      avatarUrl\n    }\n    category {\n      id\n      name\n    }\n    tags {\n      id\n      name\n    }\n    source {\n      id\n      name\n      url\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RequestPasswordReset($email: String!) {\n  requestPasswordReset(email: $email)\n}\n\nmutation ResetPassword($token: String!, $password: String!) {\n  resetPassword(token: $token, password: $password)\n}"): (typeof documents)["mutation RequestPasswordReset($email: String!) {\n  requestPasswordReset(email: $email)\n}\n\nmutation ResetPassword($token: String!, $password: String!) {\n  resetPassword(token: $token, password: $password)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query PublicProfile($id: String!) {\n  publicProfile(id: $id) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}"): (typeof documents)["query PublicProfile($id: String!) {\n  publicProfile(id: $id) {\n    id\n    username\n    bio\n    avatarUrl\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;