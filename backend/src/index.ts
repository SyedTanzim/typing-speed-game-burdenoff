import { createYoga } from "graphql-yoga";
import { schema } from "./schema";
import { createContext } from "./context";

const yoga = createYoga({
  schema,
  context: ({ request }) => createContext(request),
  graphqlEndpoint: "/graphql",
});

const server = Bun.serve({
  port: 4000,
  fetch: yoga.fetch,
});

console.log(`GraphQL server running at http://localhost:4000/graphql`);