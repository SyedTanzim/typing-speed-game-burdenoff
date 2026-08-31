import { GraphQLClient } from "graphql-request";

export const API_ENDPOINT =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/graphql";

/**
 * Creates a GraphQL client for the configured API. Passing a JWT adds the
 * bearer header required by authenticated backend resolvers.
 */
export function getClient(token?: string | null) {
  return new GraphQLClient(API_ENDPOINT, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
