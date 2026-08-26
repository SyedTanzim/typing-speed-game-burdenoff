import { GraphQLClient } from "graphql-request";

const ENDPOINT = "http://localhost:4000/graphql";

export function getClient(token?: string | null) {
  return new GraphQLClient(ENDPOINT, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}