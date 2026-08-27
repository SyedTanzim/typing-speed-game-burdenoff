import { GraphQLClient } from "graphql-request";

const ENDPOINT = import.meta.env.VITE_API_URL ?? "http://localhost:4000/graphql";

export function getClient(token?: string | null) {
  return new GraphQLClient(ENDPOINT, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}